// ── route.ts ─────────────────────────────────────────────
// POST /api/officer/events/[id]/cover — upload or replace an event cover photo
//
// data:  events (cover_photo_url field)
// deps:  s3 (cover photo upload)
// notes: key is unique per upload (timestamp+random suffix), not deterministic per event id —
//        next/image caches a given url for 31 days (see next.config.ts minimumCacheTTL), so
//        overwriting the same key would leave the old photo showing after a re-upload. the
//        previous object is deleted once the new url is saved to the row. officer/admin only
import { requireOfficer } from '@/lib/auth'
import { uploadToS3, deleteFromS3, s3KeyFromUrl } from '@/utils/s3'
import { imageMagicBytesMatch } from '@/utils/validate-image'
import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { fail } from '@/lib/api-response'
import { z } from 'zod'

// accepted mime types for event cover photos
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: RouteContext) {
  const ctx = await requireOfficer()
  if (!ctx) return fail('Forbidden', 403)

  const { id } = await params

  // validate before this id ever reaches an S3 key — a non-uuid id (e.g. containing
  // '/' or '..') could otherwise pollute the covers/events/ key namespace
  if (!z.string().uuid().safeParse(id).success) {
    return fail('Invalid event id.', 400)
  }

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
  // timestamp + random suffix makes each upload's url unique — see header note on why
  const key = `covers/events/${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  if (!imageMagicBytesMatch(file.type, buffer)) {
    console.warn('[security] magic-bytes mismatch on cover upload', { route: `/api/officer/events/${id}/cover`, declaredType: file.type, ts: new Date().toISOString() })
    return fail('File content does not match declared image type.', 400)
  }

  // fetched before upload so the old object can be cleaned up once the new one is saved
  const { data: existing } = await ctx.admin
    .from('events')
    .select('cover_photo_url')
    .eq('id', id)
    .maybeSingle()
  const oldCoverUrl = existing?.cover_photo_url ?? null

  let publicUrl: string
  try {
    publicUrl = await uploadToS3(key, buffer, file.type)
  } catch (err) {
    console.error('[events/[id]/cover] S3 upload error:', err)
    return fail('Upload failed. Please try again.', 500)
  }

  const { data: updated, error: dbError } = await ctx.admin
    .from('events')
    .update({ cover_photo_url: publicUrl })
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (dbError) {
    console.error('[events/[id]/cover] db update error:', dbError)
    return fail('Failed to save cover photo.', 500)
  }

  if (!updated) {
    // event doesn't exist — clean up the orphaned upload instead of leaving a public,
    // unreferenced object behind (a bare .update() with no matching row succeeds with
    // 0 rows affected and no error, so this has to be checked explicitly)
    await deleteFromS3(key).catch(err => console.error('[events/[id]/cover] orphan cleanup error:', err))
    return fail('Event not found.', 404)
  }

  // clean up the previous cover object now that the row points at the new one —
  // best-effort, matching the orphan cleanup above (see utils/s3.ts deleteFromS3 note)
  const oldKey = s3KeyFromUrl(oldCoverUrl)
  if (oldKey && oldKey !== key) {
    await deleteFromS3(oldKey).catch(err => console.error('[events/[id]/cover] old cover cleanup error:', err))
  }

  // bust the cached public events listing (see lib/data/events.ts)
  revalidateTag('events', { expire: 0 })

  return NextResponse.json({ url: publicUrl })
}
