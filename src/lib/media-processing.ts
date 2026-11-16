import { createHash } from "node:crypto";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import decodeHeic from "heic-decode";
import sharp from "sharp";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { s3 } from "@/lib/storage";

const displaySize = 1600;
const thumbnailSize = 640;

// As sharp names them. Anything else is refused, even when sent under a photo's name.
const acceptedFormats = new Set(["jpeg", "png", "webp", "gif", "heif"]);

// Brands of an ISO file (HEIF family) that use HEVC, the codec of iPhone photos.
const heicBrands = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "hevm",
  "hevs",
]);

function isHeic(file: Buffer) {
  if (file.toString("latin1", 4, 8) !== "ftyp") return false;
  const boxEnd = Math.min(file.readUInt32BE(0), file.length);
  for (let offset = 8; offset + 4 <= boxEnd; offset += 4) {
    if (heicBrands.has(file.toString("latin1", offset, offset + 4))) {
      return true;
    }
  }
  return false;
}

/** The picture, upright, with its real dimensions. */
async function openImage(original: Buffer) {
  if (isHeic(original)) {
    // The stock sharp doesn't read HEVC. The decoder already applies the rotation.
    const { width, height, data } = await decodeHeic({ buffer: original });
    const raw = { width, height, channels: 4 } as const;
    return { image: sharp(data, { raw }), width, height };
  }

  const image = sharp(original, { failOn: "error" });
  const { format, autoOrient } = await image.metadata();
  if (!acceptedFormats.has(format)) {
    throw new Error(`Unsupported image format: ${format}`);
  }
  // The rotation lives in the EXIF, which the new versions won't have.
  return { image: image.rotate(), ...autoOrient };
}

function resizeToWebp(
  image: ReturnType<typeof sharp>,
  size: number,
  quality: number,
) {
  return image
    .resize({
      width: size,
      height: size,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer();
}

/** Without keepMetadata, sharp writes no EXIF: location and camera data stay in the original. */
async function createVersions(original: Buffer) {
  const { image, width, height } = await openImage(original);
  const display = await resizeToWebp(image, displaySize, 82);
  // From the display version, so the notebook decodes the full photo only once.
  const thumbnail = await resizeToWebp(sharp(display), thumbnailSize, 72);
  return { width, height, display, thumbnail };
}

/** An event's cover, made like a photo's display version: upright, in WebP and without EXIF. */
export async function createCoverImage(original: Buffer) {
  const { image } = await openImage(original);
  return resizeToWebp(image, displaySize, 82);
}

async function readOriginal(key: string) {
  const object = await s3.send(
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
  );
  if (!object.Body) throw new Error(`Empty object: ${key}`);
  return Buffer.from(await object.Body.transformToByteArray());
}

function saveVersion(key: string, body: Buffer) {
  return s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: "image/webp",
    }),
  );
}

export function markMediaFailed(mediaId: string) {
  return db.media.update({
    where: { id: mediaId },
    data: { status: "FAILED" },
  });
}

/** Creates the versions guests see. The original is only read, never changed. */
export async function processMedia(mediaId: string) {
  const media = await db.media.findUnique({
    where: { id: mediaId },
    include: { event: { select: { moderationMode: true } } },
  });
  if (media?.status !== "PROCESSING") return;

  const original = await readOriginal(media.originalKey);

  let versions: Awaited<ReturnType<typeof createVersions>>;
  try {
    versions = await createVersions(original);
  } catch (error) {
    // Not a picture we can read: trying again would end the same way.
    console.error(`Could not read media ${mediaId}`, error);
    await markMediaFailed(mediaId);
    return;
  }

  const displayKey = `events/${media.eventId}/display/${media.id}.webp`;
  const thumbnailKey = `events/${media.eventId}/thumbnails/${media.id}.webp`;
  await saveVersion(displayKey, versions.display);
  await saveVersion(thumbnailKey, versions.thumbnail);

  await db.media.update({
    where: { id: mediaId },
    data: {
      displayKey,
      thumbnailKey,
      width: versions.width,
      height: versions.height,
      sha256: createHash("sha256").update(original).digest("hex"),
      status:
        media.event.moderationMode === "APPROVE_FIRST"
          ? "PENDING_APPROVAL"
          : "PUBLISHED",
    },
  });
}
