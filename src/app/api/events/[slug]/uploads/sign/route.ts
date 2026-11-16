import {
  getUploader,
  signRequestSchema,
  signUploadRequest,
} from "@/lib/uploads";

/** Presigns one S3 request of an upload. The file itself never passes through the app. */
export async function POST(
  request: Request,
  context: RouteContext<"/api/events/[slug]/uploads/sign">,
) {
  const { slug } = await context.params;
  const uploader = await getUploader(slug);
  if (!uploader) return new Response(null, { status: 401 });

  const body = signRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!body.success) return new Response(null, { status: 400 });

  const signed = await signUploadRequest(uploader, body.data);
  if (!signed) return new Response(null, { status: 400 });

  return Response.json(signed);
}
