import { randomUUID } from "node:crypto";
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListPartsCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { filterSchema, uploadSources } from "@/lib/filters";
import { getCurrentGuest } from "@/lib/guest-session";
import { enqueueMediaProcessing } from "@/lib/media-worker";
import { browserS3, s3 } from "@/lib/storage";
import { allowedPhotoTypes, maxPhotoBytes } from "@/lib/upload-limits";

// Uppy cuts files in parts of 5 MiB, the smallest S3 accepts.
const maxParts = Math.ceil(maxPhotoBytes / (5 * 1024 * 1024));
const urlLifetimeSeconds = 15 * 60;

/** An S3 request Uppy wants to send, as it describes it. */
export const signRequestSchema = z.object({
  method: z.enum(["POST", "PUT", "GET", "DELETE"]),
  key: z.string().min(1).max(512),
  uploadId: z.string().min(1).max(1024).optional(),
  partNumber: z.number().int().min(1).max(maxParts).optional(),
  // Only when starting an upload.
  file: z
    .object({
      type: z.string().max(100),
      size: z.number().int().positive(),
      // Chosen by the guest before sending, and only ever applied on display.
      filter: filterSchema.optional(),
      source: z.enum(uploadSources).optional(),
    })
    .optional(),
});
type SignRequest = z.infer<typeof signRequestSchema>;

type Uploader = { eventId: string; guestId: string };

/** Whoever can send photos to this event right now: its guests, while it is open. */
export async function getUploader(slug: string): Promise<Uploader | null> {
  const event = await db.event.findUnique({ where: { slug } });
  if (event?.status !== "OPEN") return null;

  const guest = await getCurrentGuest(event.id);
  return guest && { eventId: event.id, guestId: guest.id };
}

function findUpload({ eventId, guestId }: Uploader, key: string) {
  return db.media.findFirst({ where: { originalKey: key, eventId, guestId } });
}

async function startUpload(
  { eventId, guestId }: Uploader,
  file: NonNullable<SignRequest["file"]>,
) {
  if (!allowedPhotoTypes.includes(file.type) || file.size > maxPhotoBytes) {
    return null;
  }

  const key = `events/${eventId}/originals/${randomUUID()}`;
  const url = await getSignedUrl(
    browserS3,
    new CreateMultipartUploadCommand({ Bucket: env.S3_BUCKET, Key: key }),
    { expiresIn: urlLifetimeSeconds },
  );
  const media = await db.media.create({
    data: {
      eventId,
      guestId,
      source: file.source ?? "GALLERY",
      filter: file.filter && file.filter !== "none" ? file.filter : null,
      originalKey: key,
      mimeType: file.type,
      sizeBytes: file.size,
    },
    select: { id: true },
  });

  return { url, key, mediaId: media.id };
}

/**
 * Signs one step of a multipart upload for the browser, which then talks to the storage directly.
 * Returns null for anything that is not a step of this guest's own upload in progress.
 */
export async function signUploadRequest(
  uploader: Uploader,
  { method, key, uploadId, partNumber, file }: SignRequest,
) {
  if (method === "POST" && !uploadId) {
    return file ? startUpload(uploader, file) : null;
  }

  const media = await findUpload(uploader, key);
  if (media?.status !== "UPLOADING" || !uploadId) return null;

  const target = {
    Bucket: env.S3_BUCKET,
    Key: media.originalKey,
    UploadId: uploadId,
  };
  const options = { expiresIn: urlLifetimeSeconds };

  if (method === "PUT" && partNumber) {
    const part = new UploadPartCommand({ ...target, PartNumber: partNumber });
    return { url: await getSignedUrl(browserS3, part, options) };
  }
  if (method === "GET") {
    const parts = new ListPartsCommand(target);
    return { url: await getSignedUrl(browserS3, parts, options) };
  }
  if (method === "POST") {
    const complete = new CompleteMultipartUploadCommand(target);
    return { url: await getSignedUrl(browserS3, complete, options) };
  }
  if (method === "DELETE") {
    const abort = new AbortMultipartUploadCommand(target);
    const url = await getSignedUrl(browserS3, abort, options);
    await db.media.delete({ where: { id: media.id } });
    return { url };
  }
  return null;
}

async function storedSize(key: string) {
  try {
    const head = await s3.send(
      new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
    );
    return head.ContentLength ?? 0;
  } catch (error) {
    if (error instanceof Error && error.name === "NotFound") return null;
    throw error;
  }
}

/**
 * Called by the browser once the storage has the whole file. Checks what actually arrived, since
 * a presigned URL can't limit it, and sends the photo to be processed. Safe to call twice.
 */
export async function confirmUpload(
  uploader: Uploader,
  key: string,
): Promise<"confirmed" | "not-found" | "too-large"> {
  const media = await findUpload(uploader, key);
  if (!media) return "not-found";
  if (media.status !== "UPLOADING") return "confirmed";

  const size = await storedSize(media.originalKey);
  if (size === null) return "not-found";

  if (size > maxPhotoBytes) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: media.originalKey,
      }),
    );
    await db.media.update({
      where: { id: media.id },
      data: { status: "FAILED" },
    });
    return "too-large";
  }

  const { count } = await db.media.updateMany({
    where: { id: media.id, status: "UPLOADING" },
    data: { status: "PROCESSING", sizeBytes: size },
  });
  if (count === 1) await enqueueMediaProcessing(media.id);
  return "confirmed";
}
