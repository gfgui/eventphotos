import { removeEventCover, saveEventCover } from "@/lib/event-cover";
import { coverUrl } from "@/lib/events";
import { findHostEvent } from "@/lib/host-events";
import { getCurrentHost } from "@/lib/host-session";

type Context = RouteContext<"/api/admin/events/[id]/cover">;

const statusOf = { type: 415, size: 413, unreadable: 422 } as const;

/** The event behind the URL, if it belongs to the host signed in. */
async function findEvent(context: Context) {
  const host = await getCurrentHost();
  if (!host) return new Response(null, { status: 401 });

  const { id } = await context.params;
  const event = await findHostEvent(host.id, id);
  return event ?? new Response(null, { status: 404 });
}

/**
 * Replaces the cover. Unlike the guests' photos, the file passes through the app: it is a single
 * image, sent by the hosts and turned right away into the version guests see.
 */
export async function POST(request: Request, context: Context) {
  const event = await findEvent(context);
  if (event instanceof Response) return event;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return new Response(null, { status: 400 });

  const result = await saveEventCover(event, file);
  if ("error" in result) {
    return Response.json(result, { status: statusOf[result.error] });
  }
  return Response.json({
    coverUrl: coverUrl({ slug: event.slug, coverKey: result.coverKey }),
  });
}

export async function DELETE(_request: Request, context: Context) {
  const event = await findEvent(context);
  if (event instanceof Response) return event;

  await removeEventCover(event);
  return new Response(null, { status: 204 });
}
