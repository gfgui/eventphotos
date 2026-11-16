import { GetObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getCurrentGuest } from "@/lib/guest-session";
import { s3 } from "@/lib/storage";

const notFound = () => new Response(null, { status: 404 });

/**
 * Serves a photo to the guests of its event. Only the versions without EXIF metadata are
 * reachable here: the original stays with the hosts.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/media/[id]/[variant]">,
) {
  const { id, variant } = await context.params;
  if (!z.uuid().safeParse(id).success) return notFound();

  const media = await db.media.findFirst({
    where: { id, status: { in: ["PUBLISHED", "PENDING_APPROVAL"] } },
    select: {
      eventId: true,
      guestId: true,
      status: true,
      displayKey: true,
      thumbnailKey: true,
    },
  });
  if (!media) return notFound();

  const keys: Record<string, string | null> = {
    display: media.displayKey,
    thumbnail: media.thumbnailKey,
  };
  const key = keys[variant];
  if (!key) return notFound();

  const guest = await getCurrentGuest(media.eventId);
  if (!guest) return new Response(null, { status: 401 });
  // While it waits for the hosts, a photo is only visible to its author.
  if (media.status !== "PUBLISHED" && media.guestId !== guest.id) {
    return notFound();
  }

  const object = await s3.send(
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
  );
  if (!object.Body) return notFound();

  return new Response(object.Body.transformToWebStream(), {
    headers: {
      "Content-Type": object.ContentType ?? "application/octet-stream",
      // A version never changes after it is created, but it is only for guests.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
