import { GetObjectCommand } from "@aws-sdk/client-s3";
import type { MediaStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { slugify } from "@/lib/slug";
import { s3 } from "@/lib/storage";

/** The worker has read these, so their originals are known to be real photos. */
export const processedStatuses = [
  "PUBLISHED",
  "PENDING_APPROVAL",
  "HIDDEN",
] as const satisfies MediaStatus[];

const fileExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/avif": "avif",
};

const isProcessed = (status: MediaStatus) =>
  (processedStatuses as readonly MediaStatus[]).includes(status);

export type HostPhoto = {
  id: string;
  /** Null while the worker hasn't created the versions yet. */
  thumbnailUrl: string | null;
  displayUrl: string | null;
  originalUrl: string | null;
  /** Shown as guests see it. The original and the ZIP have no filter. */
  filter: string | null;
  authorName: string;
  sizeBytes: number;
  status: MediaStatus;
};

/** Everything guests have sent to an event, newest first. */
export async function listHostPhotos(eventId: string): Promise<HostPhoto[]> {
  const media = await db.media.findMany({
    where: {
      eventId,
      status: { in: [...processedStatuses, "PROCESSING"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      sizeBytes: true,
      thumbnailKey: true,
      displayKey: true,
      filter: true,
      guest: { select: { name: true } },
    },
  });

  const url = (id: string, variant: string) =>
    `/api/admin/media/${id}/${variant}`;

  return media.map((item) => ({
    id: item.id,
    thumbnailUrl: item.thumbnailKey ? url(item.id, "thumbnail") : null,
    displayUrl: item.displayKey ? url(item.id, "display") : null,
    originalUrl: isProcessed(item.status) ? url(item.id, "original") : null,
    filter: item.filter,
    authorName: item.guest.name,
    sizeBytes: item.sizeBytes,
    status: item.status,
  }));
}

/** A photo of one of this host's events, if there is one with this id. */
export function findHostMedia(hostId: string, id: string) {
  return db.media.findFirst({
    where: {
      id,
      status: { in: [...processedStatuses, "PROCESSING"] },
      event: { hosts: { some: { hostId } } },
    },
    select: {
      id: true,
      status: true,
      mimeType: true,
      originalKey: true,
      displayKey: true,
      thumbnailKey: true,
      guest: { select: { name: true } },
    },
  });
}

/** Only ASCII, so it fits a Content-Disposition header as it is. */
export function originalFileName(
  guestName: string,
  mediaId: string,
  mimeType: string,
) {
  const author = slugify(guestName);
  const suffix = mediaId.slice(-8);
  return `${author ? `${author}-` : ""}${suffix}.${fileExtensions[mimeType] ?? "bin"}`;
}

/**
 * Turns a name typed by a guest or a host into one folder of a path. Works on any system: no
 * separators, nothing Windows would refuse or silently change, and never a way to climb out.
 */
function pathSegment(name: string) {
  const cleaned = name
    .normalize("NFC")
    .replace(/[<>:"/\\|?*\p{Cc}]/gu, " ")
    .replace(/\s+/g, " ")
    .replace(/^[. ]+|[. ]+$/g, "")
    .slice(0, 80)
    .trim();
  if (!cleaned) return "_";
  return /^(con|prn|aux|nul|com\d|lpt\d)$/i.test(cleaned)
    ? `_${cleaned}`
    : cleaned;
}

export type ArchiveFile = {
  /** Path inside the ZIP: role / guest / number. */
  name: string;
  size: number;
  key: string;
  lastModified: Date;
};

/** What goes in the export, in folders by role and by guest. */
export async function listArchiveFiles(eventId: string) {
  const media = await db.media.findMany({
    where: { eventId, status: { in: processedStatuses } },
    orderBy: { createdAt: "asc" },
    select: {
      guestId: true,
      originalKey: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
      guest: { select: { name: true, role: { select: { name: true } } } },
    },
  });

  const folders = new Map<string, { path: string; files: number }>();
  // Lower case because Windows and macOS treat "ANA" and "ana" as the same folder.
  const takenPaths = new Set<string>();

  return media.map((item): ArchiveFile => {
    let folder = folders.get(item.guestId);
    if (!folder) {
      const base = `${pathSegment(item.guest.role.name)}/${pathSegment(item.guest.name)}`;
      let path = base;
      // Guests can have the same name.
      for (let number = 2; takenPaths.has(path.toLowerCase()); number++) {
        path = `${base} (${number})`;
      }
      takenPaths.add(path.toLowerCase());
      folder = { path, files: 0 };
      folders.set(item.guestId, folder);
    }

    folder.files += 1;
    const number = String(folder.files).padStart(3, "0");
    return {
      name: `${folder.path}/${number}.${fileExtensions[item.mimeType] ?? "bin"}`,
      size: item.sizeBytes,
      key: item.originalKey,
      lastModified: item.createdAt,
    };
  });
}

/** Opens one original at a time, as the ZIP is read, so memory use stays flat. */
export async function* readArchiveFiles(
  files: ArchiveFile[],
  signal: AbortSignal,
) {
  for (const { name, size, key, lastModified } of files) {
    const { Body } = await s3.send(
      new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
      { abortSignal: signal },
    );
    if (!Body) throw new Error(`Empty object: ${key}`);
    yield { name, size, lastModified, input: Body.transformToWebStream() };
  }
}
