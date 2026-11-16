import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { createCoverImage } from "@/lib/media-processing";
import { s3 } from "@/lib/storage";
import { allowedPhotoTypes, maxPhotoBytes } from "@/lib/upload-limits";

/** Keys of dict.admin.cover.errors. */
export type CoverError = "type" | "size" | "unreadable";

type CoveredEvent = { id: string; coverKey: string | null };

async function deleteCover(key: string) {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  } catch (error) {
    // The event already points elsewhere: a file left behind harms nobody.
    console.error(`Could not delete the cover ${key}`, error);
  }
}

/**
 * Replaces the event's cover. Unlike the guests' photos, only the version guests see is kept:
 * the cover belongs to the event's page, not to its photos, so it isn't part of the ZIP.
 */
export async function saveEventCover(
  event: CoveredEvent,
  file: File,
): Promise<{ coverKey: string } | { error: CoverError }> {
  if (!allowedPhotoTypes.includes(file.type)) return { error: "type" };
  if (file.size > maxPhotoBytes) return { error: "size" };

  let cover: Buffer;
  try {
    cover = await createCoverImage(Buffer.from(await file.arrayBuffer()));
  } catch {
    return { error: "unreadable" };
  }

  const coverKey = `events/${event.id}/cover/${randomUUID()}.webp`;
  await s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: coverKey,
      Body: cover,
      ContentType: "image/webp",
    }),
  );
  await db.event.update({ where: { id: event.id }, data: { coverKey } });
  if (event.coverKey) await deleteCover(event.coverKey);
  return { coverKey };
}

export async function removeEventCover(event: CoveredEvent) {
  if (!event.coverKey) return;
  await db.event.update({ where: { id: event.id }, data: { coverKey: null } });
  await deleteCover(event.coverKey);
}
