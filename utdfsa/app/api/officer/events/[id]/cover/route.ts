// ── route.ts ─────────────────────────────────────────────
// POST /api/officer/events/[id]/cover — upload or replace an event cover photo
//
// data:  events (cover_photo_url field)
// deps:  s3 (cover photo upload)
// notes: key is deterministic per event id (overwriting on re-upload);
//        officer/admin only
import { requireOfficer } from '@/lib/auth'
import { uploadToS3 } from '@/utils/s3'
import { imageMagicBytesMatch } from '@/utils/validate-image'
import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { fail } from '@/lib/api-response'

// accepted mime types for event cover photos
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: RouteContext) {
  const ctx = await requireOfficer()
  if (!ctx) return fail('Forbidden', 403)

  const { id } = await params

  // reject before reading body if Content-Length already exceeds limit
  const contentLength = Number(req.headers.get('content-length') ?? 0)
  if (contentLength > MAX_SIZE_BYTES + 65536) {
    return fail('Request too large.', 413)
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return fail('Invalid form data.', 400)
  }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) {
    return fail('No file provided.', 400)
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return fail('Invalid file type. Only JPEG, PNG, and WebP images are accepted.', 400)
  }

  if (file.size > MAX_SIZE_BYTES) {
    return fail('File too large. Maximum size is 20 MB.', 400)
  }

  // derive extension from mime type for a consistent key
  const extMap: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
  const ext = extMap[file.type] ?? 'jpg'
  const key = `covers/events/${id}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  if (!imageMagicBytesMatch(file.type, buffer)) {
    console.warn('[security] magic-bytes mismatch on cover upload', { route: `/api/officer/events/${id}/cover`, declaredType: file.type, ts: new Date().toISOString() })
    return fail('File content does not match declared image type.', 400)
  }

  let publicUrl: string
  try {
    publicUrl = await uploadToS3(key, buffer, file.type)
  } catch (err) {
    console.error('[events/[id]/cover] S3 upload error:', err)
    return fail('Upload failed. Please try again.', 500)
  }

  const { error: dbError } = await ctx.admin
    .from('events')
    .update({ cover_photo_url: publicUrl })
    .eq('id', id)

  if (dbError) {
    console.error('[events/[id]/cover] db update error:', dbError)
    return fail('Failed to save cover photo.', 500)
  }

  // bust the cached public events listing (see lib/data/events.ts)
  revalidateTag('events', { expire: 0 })

  return NextResponse.json({ url: publicUrl })
}
