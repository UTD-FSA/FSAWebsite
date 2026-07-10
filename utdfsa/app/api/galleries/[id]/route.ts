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
import { uploadToS3 } from '@/utils/s3'
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

  const { error } = await admin
    .from('galleries')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[galleries] delete error:', error)
    return fail('Failed to delete gallery', 500)
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

  if (coverFile && coverFile.size > 0) {
    if (coverFile.size > MAX_COVER_BYTES) {
      return fail('Image must be under 20MB.', 400)
    }
    if (!ALLOWED_IMAGE_TYPES.includes(coverFile.type)) {
      return fail('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are accepted.', 400)
    }
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

  return NextResponse.json({ gallery })
}
