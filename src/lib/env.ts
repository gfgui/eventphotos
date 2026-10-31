import { z } from "zod";

const envSchema = z.object({
  DEPLOY_MODE: z.enum(["local", "cloud"]),
  PUBLIC_URL: z.url(),
  DATABASE_URL: z.url(),
  // Empty on Amazon S3, where the SDK derives the endpoint from the region.
  S3_ENDPOINT: z.preprocess((value) => value || undefined, z.url().optional()),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  // Garage only serves path-style URLs (endpoint/bucket/key).
  S3_FORCE_PATH_STYLE: z.stringbool().default(false),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables:\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;
