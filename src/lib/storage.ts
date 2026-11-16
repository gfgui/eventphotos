import {
  PutBucketCorsCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

const config: S3ClientConfig = {
  region: env.S3_REGION,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
  // By default the SDK adds checksums, which in a presigned URL would never match the bytes
  // the browser sends later.
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
};

// Same client for Garage (local mode) and Amazon S3 (cloud mode); only the variables change.
export const s3 = new S3Client({
  ...config,
  endpoint: env.S3_ENDPOINT,
  // Without timeouts, a stalled storage server would hang requests indefinitely.
  requestHandler: { connectionTimeout: 5_000, requestTimeout: 30_000 },
});

/** In local mode Garage runs next to the app, so phones reach it at the app's address. */
function browserEndpoint() {
  if (env.DEPLOY_MODE !== "local" || !env.S3_ENDPOINT) return env.S3_ENDPOINT;
  const endpoint = new URL(env.S3_ENDPOINT);
  endpoint.hostname = new URL(env.PUBLIC_URL).hostname;
  return endpoint.origin;
}

/** Only signs URLs for browsers: the host is part of the signature, so it must be theirs. */
export const browserS3 = new S3Client({
  ...config,
  endpoint: browserEndpoint(),
});

/** Lets the app's pages call the storage directly. In the cloud, the bucket is set up outside. */
export async function allowBrowserUploads() {
  if (env.DEPLOY_MODE !== "local") return;

  await s3.send(
    new PutBucketCorsCommand({
      Bucket: env.S3_BUCKET,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: [new URL(env.PUBLIC_URL).origin],
            AllowedMethods: ["GET", "PUT", "POST", "DELETE"],
            AllowedHeaders: ["*"],
            // Uppy reads the ETag of each uploaded part to complete the upload.
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );
}
