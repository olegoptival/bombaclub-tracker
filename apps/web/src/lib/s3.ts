import { S3Client } from "@aws-sdk/client-s3";

/**
 * S3 client for MinIO. Constructed lazily so that build-time code paths
 * (which import this file without env vars set) don't crash.
 */

declare global {
  // eslint-disable-next-line no-var
  var __webS3: S3Client | undefined;
}

export function getS3(): S3Client {
  if (globalThis.__webS3) return globalThis.__webS3;
  const client = new S3Client({
    region: process.env.S3_REGION ?? "us-east-1",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? "",
      secretAccessKey: process.env.S3_SECRET_KEY ?? "",
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  });
  if (process.env.NODE_ENV !== "production") globalThis.__webS3 = client;
  return client;
}

export function getS3Bucket(): string {
  const b = process.env.S3_BUCKET;
  if (!b) throw new Error("S3_BUCKET env var is required at runtime");
  return b;
}
