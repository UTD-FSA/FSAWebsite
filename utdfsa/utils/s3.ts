// ── utils/s3.ts ───────────────────────────────────────────
// s3 upload helper — wraps the aws sdk PutObjectCommand and
// returns the public url of the uploaded object.
//
// deps:  @aws-sdk/client-s3
// notes: bucket must be configured for public read access;
//        credentials are loaded from environment variables server-side only

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

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

// ── delete helper ─────────────────────────────────────────

// best-effort cleanup — callers should catch/log, not fail their own request on error
// (the db row is always the source of truth; an orphaned object is a cleanup miss)
export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    }),
  )
}

// extracts the object key back out of a url previously returned by uploadToS3;
// returns null (never throws) if the url doesn't match this bucket's host —
// defensive against a stored url that predates a bucket/region change
export function s3KeyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const prefix = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/`
  if (!url.startsWith(prefix)) return null
  return url.slice(prefix.length)
}
