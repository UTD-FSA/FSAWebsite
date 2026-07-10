// ── route.ts ─────────────────────────────────────────────
// GET  /api/galleries — list published galleries (public)
// POST /api/galleries — create a gallery with a cover photo (officer/admin only)
//
// data:  galleries, members (role check)
// deps:  s3 (cover photo upload)
// notes: cover image is uploaded to S3 before the db row is written;
//        google photos url is validated against an allowlist of trusted hosts
import { createUserClient } from '@/utils/supabase/server'
import { requireOfficer } from '@/lib/auth'
import { createGallerySchema } from '@/lib/schemas'
import { uploadToS3 } from '@/utils/s3'
import { imageMagicBytesMatch } from '@/utils/validate-image'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fail, failValidation } from '@/lib/api-response'

// accepted mime types for the cover photo upload
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
// derive extension from MIME type — never trust the user-supplied filename extension
const MIME_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }

// ── GET ───────────────────────────────────────────────────
// public endpoint — use user client so RLS policies apply
export async function GET() {
  const supabase = await createUserClient()

  // respects rls — only returns published galleries visible to everyone
  // explicit columns: excludes created_by (officer uuid) from the public response
  const { data: galleries, error } = await supabase
    .from('galleries')
    .select('id, title, cover_photo_url, google_photos_url, description, semester, year, is_published, created_at')
    .eq('is_published', true)
    .order('year', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[galleries] fetch error:', error)
    return fail('Failed to load galleries', 500)
  }

  return NextResponse.json(galleries ?? [], {
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
  })
}

// ── POST ──────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // ── auth check ───────────────────────────────────────────
  const ctx = await requireOfficer()
  if (!ctx) return fail('Forbidden', 403)
  const { admin, member } = ctx

  // reject before reading body if Content-Length already exceeds limit
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > 20 * 1024 * 1024 + 65536) { // 20MB + form field overhead
    return fail('Request too large.', 413)
  }

  const formData = await request.formData()
  const coverFile = formData.get('cover') as File | null

  const parsed = createGallerySchema.safeParse({
    title: formData.get('title'),
    google_photos_url: formData.get('google_photos_url'),
    description: formData.get('description'),
    semester: formData.get('semester'),
    year: formData.get('year'),
  })

  if (!parsed.success) {
    return failValidation(parsed.error)
  }

  const { title, google_photos_url, description, semester, year } = parsed.data

  if (!coverFile || coverFile.size === 0) {
    return fail('Cover photo is required', 400)
  }

  if (coverFile.size > 20 * 1024 * 1024) {
    return fail('Image must be under 20MB.', 400)
  }

  // validate cover file type against allowlist
  if (!ALLOWED_IMAGE_TYPES.includes(coverFile.type)) {
    return fail('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are accepted.', 400)
  }

  // derive extension from MIME type — never trust the user-supplied filename
  const ext = MIME_EXT[coverFile.type] ?? 'jpg'
  // timestamp + random suffix prevents key collisions across concurrent uploads
  const key = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await coverFile.arrayBuffer())

  if (!imageMagicBytesMatch(coverFile.type, buffer)) {
    console.warn('[security] magic-bytes mismatch on cover upload', { route: '/api/galleries', declaredType: coverFile.type, ts: new Date().toISOString() })
    return fail('File content does not match declared image type.', 400)
  }

  // upload cover image to s3; returns the public cdn url
  let publicUrl: string
  try {
    publicUrl = await uploadToS3(key, buffer, coverFile.type)
  } catch (err) {
    console.error('[galleries] S3 upload error:', err)
    return fail('Upload failed. Please try again.', 500)
  }

  // ── db insert ────────────────────────────────────────────
  // bypass rls — officer action; inserts into galleries
  const { data: gallery, error: insertError } = await admin
    .from('galleries')
    .insert({
      title,
      cover_photo_url: publicUrl,
      google_photos_url,
      description,
      semester,
      year,
      created_by: member.id,
      is_published: true,
    })
    .select()
    .single()

  if (insertError) {
    console.error('[galleries] insert error:', insertError)
    return fail('Failed to create gallery', 500)
  }

  return NextResponse.json({ gallery }, { status: 201 })
}
