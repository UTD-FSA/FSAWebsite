// ── utils/s3.ts ───────────────────────────────────────────
// s3 upload helper — wraps the aws sdk PutObjectCommand and
// returns the public url of the uploaded object.
//
// deps:  @aws-sdk/client-s3
// notes: bucket must be configured for public read access;
//        credentials are loaded from environment variables server-side only

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// ── s3 client ─────────────────────────────────────────────

// all credentials are server-only env vars — never imported in client components
const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// ── upload helper ─────────────────────────────────────────

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  // uploads the file to the configured s3 bucket; throws on failure
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )

  // constructs the standard path-style public url for the uploaded object
  return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
}
