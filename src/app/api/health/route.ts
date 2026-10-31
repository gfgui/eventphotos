import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { s3 } from "@/lib/storage";

async function check(name: string, probe: () => Promise<unknown>) {
  try {
    await probe();
    return "ok";
  } catch (error) {
    console.error(`Health check failed: ${name}`, error);
    return "error";
  }
}

export async function GET() {
  // Always run at request time, never prerendered at build.
  await connection();

  const [database, storage] = await Promise.all([
    check("database", () => db.$queryRaw`SELECT 1`),
    check("storage", () =>
      s3.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET })),
    ),
  ]);
  const healthy = database === "ok" && storage === "ok";

  return Response.json({ database, storage }, { status: healthy ? 200 : 503 });
}
