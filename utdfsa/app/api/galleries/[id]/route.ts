// ── route.ts ─────────────────────────────────────────────
// DELETE /api/galleries/[id] — hard-delete a gallery by id
// PATCH  /api/galleries/[id] — update gallery fields (officer/admin only)
//
// data:  galleries, members (role check)
// notes: restricted to officer and admin roles. PATCH fully overwrites title,
//        description, semester, and year on every request — only the cover
//        photo is optional (omitting it keeps the existing one).
import { requireOfficer } from '@/lib/auth'
import { updateGallerySchema } from '@/lib/schemas'
import { uploadToS3, deleteFromS3, s3KeyFromUrl } from '@/utils/s3'
import { imageMagicBytesMatch } from '@/utils/validate-image'
import { NextResponse } from 'next/server'
import { fail, failValidation } from '@/lib/api-response'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MIME_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
const MAX_COVER_BYTES = 20 * 1024 * 1024

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const ctx = await requireOfficer()
  if (!ctx) return fail('Forbidden', 403)
  const { admin } = ctx

  // fetch the cover url before deleting the row — needed to clean up the S3 object after
  const { data: existing } = await admin
    .from('galleries')
    .select('cover_photo_url')
    .eq('id', id)
    .maybeSingle()

  const { error } = await admin
    .from('galleries')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[galleries] delete error:', error)
    return fail('Failed to delete gallery', 500)
  }

  // best-effort — db row is already gone (source of truth); an orphaned object here
  // is a cleanup miss, not worth failing an already-successful delete over
  const key = s3KeyFromUrl(existing?.cover_photo_url)
  if (key) {
    await deleteFromS3(key).catch(err => console.error('[galleries] S3 cleanup error:', err))
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const ctx = await requireOfficer()
  if (!ctx) return fail('Forbidden', 403)
  const { admin } = ctx

  // reject before reading body if Content-Length already exceeds limit — mirrors the
  // check on the sibling POST /api/galleries and the officer event-cover route
  const contentLength = Number(req.headers.get('content-length') ?? 0)
  if (contentLength > MAX_COVER_BYTES + 65536) {
    return fail('Request too large.', 413)
  }

  const formData = await req.formData()
  const coverFile = formData.get('cover') as File | null

  const parsed = updateGallerySchema.safeParse({
    title: formData.get('title'),
    google_photos_url: formData.get('google_photos_url'),
    description: formData.get('description'),
    semester: formData.get('semester'),
    year: formData.get('year'),
    is_published: formData.get('is_published'),
  })

  if (!parsed.success) {
    return failValidation(parsed.error)
  }

  const { title, google_photos_url, description, semester, year, is_published } = parsed.data

  const updates: Record<string, unknown> = {
    title,
    google_photos_url,
    description,
    semester,
    year,
    ...(is_published != null ? { is_published: is_published === 'true' } : {}),
  }

  // fetch the existing cover url before any upload — needed to clean up the
  // replaced object after a successful update, only relevant when replacing it
  let oldCoverUrl: string | null = null

  if (coverFile && coverFile.size > 0) {
    if (coverFile.size > MAX_COVER_BYTES) {
      return fail('Image must be under 20MB.', 400)
    }
    if (!ALLOWED_IMAGE_TYPES.includes(coverFile.type)) {
      return fail('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are accepted.', 400)
    }

    const { data: existing } = await admin
      .from('galleries')
      .select('cover_photo_url')
      .eq('id', id)
      .maybeSingle()
    oldCoverUrl = existing?.cover_photo_url ?? null

    const ext = MIME_EXT[coverFile.type] ?? 'jpg'
    const key = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await coverFile.arrayBuffer())

    if (!imageMagicBytesMatch(coverFile.type, buffer)) {
      console.warn('[security] magic-bytes mismatch on cover upload', { route: `/api/galleries/${id}`, declaredType: coverFile.type, ts: new Date().toISOString() })
      return fail('File content does not match declared image type.', 400)
    }

    let publicUrl: string
    try {
      publicUrl = await uploadToS3(key, buffer, coverFile.type)
    } catch (err) {
      console.error('[galleries] S3 upload error:', err)
      return fail('Upload failed. Please try again.', 500)
    }
    updates.cover_photo_url = publicUrl
  }

  const { data: gallery, error: updateError } = await admin
    .from('galleries')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    console.error('[galleries] update error:', updateError)
    return fail('Failed to update gallery', 500)
  }

  // best-effort cleanup of the replaced cover — only after the db confirms the new url,
  // and only when it actually changed (title/description-only edits leave oldCoverUrl unset)
  if (oldCoverUrl && oldCoverUrl !== gallery.cover_photo_url) {
    const oldKey = s3KeyFromUrl(oldCoverUrl)
    if (oldKey) {
      await deleteFromS3(oldKey).catch(err => console.error('[galleries] old cover cleanup error:', err))
    }
  }

  return NextResponse.json({ gallery })
}
