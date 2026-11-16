import { GetObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { coverVersion } from "@/lib/events";
import { s3 } from "@/lib/storage";

const notFound = () => new Response(null, { status: 404 });

/**
 * Serves the event's cover. It is public, like the rest of the welcome screen, which guests see
 * before they join. Only the version made by the app is stored, so it has no EXIF.
 */
export async function GET(
  request: Request,
  context: RouteContext<"/api/events/[slug]/cover">,
) {
  const { slug } = await context.params;
  const event = await db.event.findUnique({
    where: { slug },
    select: { coverKey: true },
  });
  if (!event?.coverKey) return notFound();

  const object = await s3.send(
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: event.coverKey }),
    { abortSignal: request.signal },
  );
  if (!object.Body) return notFound();

  // Each cover has its own address, so the current one can be cached for good.
  const version = new URL(request.url).searchParams.get("v");
  const isCurrent = version === coverVersion(event.coverKey);

  return new Response(object.Body.transformToWebStream(), {
    headers: {
      "Content-Type": object.ContentType ?? "image/webp",
      "Cache-Control": isCurrent
        ? "public, max-age=31536000, immutable"
        : "no-cache",
    },
  });
}
