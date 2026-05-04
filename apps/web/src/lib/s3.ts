import { S3Client } from "@aws-sdk/client-s3";

/**
 * S3 client configured for MinIO (running in docker on the VPS).
 *
 * In dev: hits http://localhost:9000 directly.
 * In prod: same — MinIO is a sibling docker service, accessed via internal
 * network. Public access to uploaded screenshots goes through the app via
 * presigned URLs, never directly to MinIO from the internet.
 */
export const s3 = new S3Client({
  region: process.env.S3_REGION ?? "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
});

export const S3_BUCKET = process.env.S3_BUCKET!;

if (!S3_BUCKET) {
  throw new Error("S3_BUCKET env var is required");
}
