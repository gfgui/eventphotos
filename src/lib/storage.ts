import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

// Same client for Garage (local mode) and Amazon S3 (cloud mode); only the variables change.
export const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
  // Without timeouts, a stalled storage server would hang requests indefinitely.
  requestHandler: { connectionTimeout: 5_000, requestTimeout: 30_000 },
});
