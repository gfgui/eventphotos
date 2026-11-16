import { z } from "zod";
import { confirmUpload, getUploader } from "@/lib/uploads";

const bodySchema = z.object({ key: z.string().min(1).max(512) });

const statusOf = { confirmed: 202, "not-found": 404, "too-large": 413 };

export async function POST(
  request: Request,
  context: RouteContext<"/api/events/[slug]/uploads/complete">,
) {
  const { slug } = await context.params;
  const uploader = await getUploader(slug);
  if (!uploader) return new Response(null, { status: 401 });

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return new Response(null, { status: 400 });

  const result = await confirmUpload(uploader, body.data.key);
  return new Response(null, { status: statusOf[result] });
}
