import { GetObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { env } from "@/lib/env";
import { findHostMedia, originalFileName } from "@/lib/host-media";
import { getCurrentHost } from "@/lib/host-session";
import { s3 } from "@/lib/storage";

const notFound = () => new Response(null, { status: 404 });

/** Serves the photos of an event to its hosts, who alone can download the original. */
export async function GET(
  request: Request,
  context: RouteContext<"/api/admin/media/[id]/[variant]">,
) {
  const host = await getCurrentHost();
  if (!host) return new Response(null, { status: 401 });

  const { id, variant } = await context.params;
  if (!z.uuid().safeParse(id).success) return notFound();

  const media = await findHostMedia(host.id, id);
  if (!media) return notFound();

  const isOriginal = variant === "original";
  // Until the worker has read it, an upload may not even be an image.
  if (isOriginal && media.status === "PROCESSING") return notFound();

  const keys: Record<string, string | null> = {
    original: media.originalKey,
    display: media.displayKey,
    thumbnail: media.thumbnailKey,
  };
  const key = keys[variant];
  if (!key) return notFound();

  const object = await s3.send(
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
    { abortSignal: request.signal },
  );
  if (!object.Body) return notFound();
  const body = object.Body.transformToWebStream();

  if (!isOriginal) {
    return new Response(body, {
      headers: {
        "Content-Type": object.ContentType ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  const fileName = originalFileName(media.guest.name, media.id, media.mimeType);
  return new Response(body, {
    headers: {
      "Content-Type": media.mimeType,
      "Content-Length": String(object.ContentLength),
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}
