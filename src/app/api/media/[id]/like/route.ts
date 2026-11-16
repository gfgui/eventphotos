import { z } from "zod";
import { setLike } from "@/lib/likes";

type Context = RouteContext<"/api/media/[id]/like">;

const statusOf = { "not-found": 404, unauthorized: 401, closed: 409 } as const;

async function respond(context: Context, liked: boolean) {
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) {
    return new Response(null, { status: 404 });
  }

  const result = await setLike(id, liked);
  if ("error" in result) {
    return new Response(null, { status: statusOf[result.error] });
  }
  return Response.json(result);
}

// A route, and not a Server Action, so that the load test can like photos too.

/** Likes the photo. Sending it again changes nothing. */
export function PUT(_request: Request, context: Context) {
  return respond(context, true);
}

/** Takes the like back. Sending it again changes nothing. */
export function DELETE(_request: Request, context: Context) {
  return respond(context, false);
}
