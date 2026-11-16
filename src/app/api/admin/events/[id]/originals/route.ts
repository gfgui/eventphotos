import { downloadZip } from "client-zip";
import { z } from "zod";
import { db } from "@/lib/db";
import { listArchiveFiles, readArchiveFiles } from "@/lib/host-media";
import { getCurrentHost } from "@/lib/host-session";

const notFound = () => new Response(null, { status: 404 });

/** Downloads every original of an event as a ZIP, assembled while it is being sent. */
export async function GET(
  request: Request,
  context: RouteContext<"/api/admin/events/[id]/originals">,
) {
  const host = await getCurrentHost();
  if (!host) return new Response(null, { status: 401 });

  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) return notFound();

  const event = await db.event.findFirst({
    where: { id, hosts: { some: { hostId: host.id } } },
    select: { id: true, slug: true },
  });
  if (!event) return notFound();

  const files = await listArchiveFiles(event.id);
  if (files.length === 0) return notFound();

  // The sizes are known, so the browser can show the progress and notice a broken download.
  const zip = downloadZip(readArchiveFiles(files, request.signal), {
    metadata: files.map(({ name, size }) => ({ name, size })),
  });
  zip.headers.set(
    "Content-Disposition",
    `attachment; filename="${event.slug}.zip"`,
  );
  zip.headers.set("Cache-Control", "no-store");
  return zip;
}
