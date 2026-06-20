# Gallery Archive Edit Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an edit modal to the Gallery Management officer page that lets officers update any archive's fields (including cover photo and published state) and delete it — no type-to-confirm required.

**Architecture:** Add a `PATCH /api/galleries/[id]` route that accepts the same multipart shape as POST (cover optional). In `OfficerGalleryClient`, add edit state and a modal that pre-fills from the selected gallery, surfaces all editable fields + a `is_published` pill toggle, and puts a Delete button in the footer.

**Tech Stack:** Next.js App Router, TypeScript, Supabase (admin client), AWS S3 via `uploadToS3`, `browser-image-compression`, Tailwind CSS.

## Global Constraints

- Dark design system: background `#070707` / `#141414`, accent `#9747FF`, text `#e8e8e8` / `#8c8c8c`
- All modals use the existing `Modal` component from `@/components/Modal` with `size="md"`
- Modal inner shell: `bg-[#141414] border border-white/10 rounded-[20px] shadow-[0_32px_72px_-16px_rgba(0,0,0,0.8)]` + `style={{ animation: 'modalIn 0.18s ease-out' }}`
- Cover previews use `FileReader` + `data:` URL (CSP blocks `blob:`)
- Google Photos URL must be from `photos.google.com` or `photos.app.goo.gl`
- `semester` must be one of: `Fall`, `Spring`, `Summer` (or empty/null)
- `year` must be integer 2000–2050 (or empty/null)
- No new npm packages

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/api/galleries/[id]/route.ts` | Modify | Add `PATCH` handler alongside existing `DELETE` |
| `app/(pages)/officer/gallery/OfficerGalleryClient.tsx` | Modify | Add edit state, `openEdit`/`closeEdit`/`handleEditSubmit`/`handleEditDelete`/`handleEditFileChange`, Edit button on rows, edit modal JSX |

---

## Task 1: PATCH /api/galleries/[id] route

**Files:**
- Modify: `app/api/galleries/[id]/route.ts`

**Interfaces:**
- Produces: `PATCH /api/galleries/[id]` — multipart body, returns `{ gallery: Gallery }` on 200 or `{ error: string }` on 4xx/5xx

- [ ] **Step 1: Add the PATCH handler to the route file**

Open `app/api/galleries/[id]/route.ts`. The file currently only has a `DELETE` export. The constants `ALLOWED_IMAGE_TYPES` and `ALLOWED_GOOGLE_PHOTOS_HOSTS` from `app/api/galleries/route.ts` need to be duplicated here (they are not exported). Add the full handler below the existing imports/DELETE:

```typescript
// ── route.ts ─────────────────────────────────────────────
// DELETE /api/galleries/[id] — hard-delete a gallery by id
// PATCH  /api/galleries/[id] — update gallery fields (officer/admin only)
//
// data:  galleries, members (role check)
// notes: restricted to officer and admin roles.
//        cover photo is optional on PATCH — omitting it keeps the existing one.
import { createUserClient, createAdminClient } from '@/utils/supabase/server'
import { uploadToS3 } from '@/utils/s3'
import { NextResponse } from 'next/server'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_GOOGLE_PHOTOS_HOSTS = ['photos.google.com', 'photos.app.goo.gl']

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createUserClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: member } = await admin
    .from('members')
    .select('role')
    .eq('email', user.email!)
    .single()

  if (!member || (member.role !== 'officer' && member.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await admin
    .from('galleries')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[galleries] delete error:', error)
    return NextResponse.json({ error: 'Failed to delete gallery' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createUserClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: member } = await admin
    .from('members')
    .select('role')
    .eq('email', user.email!)
    .single()

  if (!member || (member.role !== 'officer' && member.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await req.formData()
  const title = (formData.get('title') as string | null)?.trim()
  const google_photos_url = (formData.get('google_photos_url') as string | null)?.trim() || null
  const description = (formData.get('description') as string | null)?.trim() || null
  const semester = (formData.get('semester') as string | null)?.trim() || null
  const yearRaw = (formData.get('year') as string | null)?.trim()
  const year = yearRaw ? Number(yearRaw) : null
  const isPublishedRaw = formData.get('is_published') as string | null
  const coverFile = formData.get('cover') as File | null

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }
  if (title.length > 200) {
    return NextResponse.json({ error: 'Title must be 200 characters or fewer' }, { status: 400 })
  }
  if (description && description.length > 1000) {
    return NextResponse.json({ error: 'Description must be 1000 characters or fewer' }, { status: 400 })
  }
  if (semester !== null && !['Fall', 'Spring', 'Summer'].includes(semester)) {
    return NextResponse.json({ error: 'Semester must be Fall, Spring, or Summer' }, { status: 400 })
  }
  if (year !== null && (!Number.isInteger(year) || year < 2000 || year > 2050)) {
    return NextResponse.json({ error: 'Year must be between 2000 and 2050' }, { status: 400 })
  }
  if (google_photos_url !== null) {
    let parsedUrl: URL
    try {
      parsedUrl = new URL(google_photos_url)
    } catch {
      return NextResponse.json({ error: 'Invalid Google Photos URL' }, { status: 400 })
    }
    if (
      parsedUrl.protocol !== 'https:' ||
      !ALLOWED_GOOGLE_PHOTOS_HOSTS.includes(parsedUrl.hostname)
    ) {
      return NextResponse.json(
        { error: 'Google Photos URL must be from photos.google.com or photos.app.goo.gl' },
        { status: 400 }
      )
    }
  }

  const updates: Record<string, unknown> = {
    title,
    google_photos_url,
    description,
    semester: semester || null,
    year: yearRaw ? year : null,
    ...(isPublishedRaw !== null ? { is_published: isPublishedRaw === 'true' } : {}),
  }

  if (coverFile && coverFile.size > 0) {
    if (coverFile.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 20MB.' }, { status: 400 })
    }
    if (!ALLOWED_IMAGE_TYPES.includes(coverFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WEBP, and GIF images are accepted.' },
        { status: 400 }
      )
    }
    const ext = coverFile.name.split('.').pop() ?? 'jpg'
    const key = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await coverFile.arrayBuffer())
    let publicUrl: string
    try {
      publicUrl = await uploadToS3(key, buffer, coverFile.type)
    } catch (err) {
      console.error('[galleries] S3 upload error:', err)
      return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
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
    return NextResponse.json({ error: 'Failed to update gallery' }, { status: 500 })
  }

  return NextResponse.json({ gallery })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd utdfsa && npx tsc --noEmit
```

Expected: no errors in `app/api/galleries/[id]/route.ts`.

- [ ] **Step 3: Manual smoke test — PATCH without cover**

Start the dev server (`npm run dev`). In the browser DevTools console, run:

```js
const fd = new FormData()
fd.append('title', 'Test Edit')
fd.append('google_photos_url', 'https://photos.google.com/test')
fd.append('description', 'edited desc')
fd.append('semester', 'Fall')
fd.append('year', '2025')
fd.append('is_published', 'false')
const r = await fetch('/api/galleries/<a-real-gallery-id>', { method: 'PATCH', body: fd })
console.log(r.status, await r.json())
```

Expected: `200 { gallery: { title: 'Test Edit', is_published: false, ... } }`

- [ ] **Step 4: Commit**

```bash
git add app/api/galleries/[id]/route.ts
git commit -m "feat: add PATCH /api/galleries/[id] for archive editing"
```

---

## Task 2: Edit modal in OfficerGalleryClient

**Files:**
- Modify: `app/(pages)/officer/gallery/OfficerGalleryClient.tsx`

**Interfaces:**
- Consumes: `PATCH /api/galleries/[id]` (from Task 1) — multipart body, returns `{ gallery }`
- Consumes: `DELETE /api/galleries/[id]` — existing endpoint

- [ ] **Step 1: Add edit state, refs, types, and helpers**

In `OfficerGalleryClient.tsx`, add the following directly after the existing state declarations (after `const fileInputRef = useRef...`). First add the interface and initial value above the component, then add state/refs/handlers inside the component:

Add above `export default function OfficerGalleryClient`:

```typescript
interface EditForm {
  title: string
  google_photos_url: string
  description: string
  semester: string
  year: string
  is_published: boolean
}

const EMPTY_EDIT_FORM: EditForm = {
  title: '',
  google_photos_url: '',
  description: '',
  semester: '',
  year: '',
  is_published: true,
}
```

Inside the component body, after the existing `const fileInputRef = useRef<HTMLInputElement>(null)` line:

```typescript
// edit modal state
const [editingGallery, setEditingGallery] = useState<Gallery | null>(null)
const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT_FORM)
const [editCoverFile, setEditCoverFile] = useState<File | null>(null)
const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null)
const [editSubmitting, setEditSubmitting] = useState(false)
const [editError, setEditError] = useState<string | null>(null)
const [editDeleting, setEditDeleting] = useState(false)
const editFileInputRef = useRef<HTMLInputElement>(null)
```

Also add the `useState` import already includes all needed hooks — no import changes needed since `useState` and `useRef` are already imported.

- [ ] **Step 2: Add openEdit, closeEdit, handleEditFileChange, handleEditSubmit, handleEditDelete**

Add the following functions inside the component body, after the `closeModal` function:

```typescript
function openEdit(gallery: Gallery) {
  setEditingGallery(gallery)
  setEditForm({
    title: gallery.title,
    google_photos_url: gallery.google_photos_url ?? '',
    description: gallery.description ?? '',
    semester: gallery.semester ?? '',
    year: gallery.year != null ? String(gallery.year) : '',
    is_published: gallery.is_published,
  })
  setEditCoverFile(null)
  setEditCoverPreview(null)
  setEditError(null)
  setEditDeleting(false)
  setEditSubmitting(false)
}

function closeEdit() {
  setEditingGallery(null)
  setEditCoverFile(null)
  setEditCoverPreview(null)
  setEditError(null)
}

function handleEditFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0] ?? null
  if (!file) {
    setEditCoverFile(null)
    setEditCoverPreview(null)
    return
  }
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    setEditError('Please upload a JPEG, PNG, WEBP, or GIF image.')
    return
  }
  if (file.size > 20 * 1024 * 1024) {
    setEditError('Image must be under 20MB.')
    return
  }
  setEditCoverFile(file)
  setEditError(null)
  const reader = new FileReader()
  reader.onload = (ev) => setEditCoverPreview(ev.target?.result as string)
  reader.readAsDataURL(file)
}

async function handleEditSubmit(e: { preventDefault(): void }) {
  e.preventDefault()
  if (!editingGallery) return
  setEditSubmitting(true)
  setEditError(null)

  let fileToUpload: File | null = editCoverFile
  if (editCoverFile && editCoverFile.size > 1 * 1024 * 1024) {
    try {
      const compressed = await imageCompression(editCoverFile, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      })
      fileToUpload = new File([compressed], editCoverFile.name, { type: editCoverFile.type })
    } catch (err) {
      console.error('[gallery edit] compression failed, using original:', err)
    }
  }

  const body = new FormData()
  body.append('title', editForm.title)
  body.append('google_photos_url', editForm.google_photos_url)
  body.append('description', editForm.description)
  body.append('semester', editForm.semester)
  body.append('year', editForm.year)
  body.append('is_published', String(editForm.is_published))
  if (fileToUpload) body.append('cover', fileToUpload)

  const res = await fetch(`/api/galleries/${editingGallery.id}`, { method: 'PATCH', body })
  const data = await res.json()

  if (!res.ok) {
    setEditError(data.error ?? 'Something went wrong')
    setEditSubmitting(false)
    return
  }

  closeEdit()
  setEditSubmitting(false)
  router.refresh()
}

async function handleEditDelete() {
  if (!editingGallery) return
  if (!confirm(`Delete "${editingGallery.title}"? This cannot be undone.`)) return
  setEditDeleting(true)
  const res = await fetch(`/api/galleries/${editingGallery.id}`, { method: 'DELETE' })
  setEditDeleting(false)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    setEditError(data.error ?? 'Failed to delete archive.')
    return
  }
  closeEdit()
  router.refresh()
}
```

- [ ] **Step 3: Add the Edit button to each gallery row**

In the gallery list, find the `{/* actions */}` div inside `galleries.map`. It currently contains "View Album" link and "Delete" button. Add an "Edit" button between them:

Replace:
```tsx
{/* actions */}
<div className="flex items-center gap-3 sm:flex-shrink-0">
  {/* only renders when the gallery has a linked album URL — do not remove this condition */}
  {gallery.google_photos_url && (
    // route: gallery.google_photos_url — opens the Google Photos album in a new tab — do not change this path
    <a
      href={gallery.google_photos_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-[13px] text-[#5fa8e8] font-semibold hover:text-[#8ec5f5] transition-colors min-h-[44px]"
    >
      View Album
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
      </svg>
    </a>
  )}
  <button
    onClick={() => handleDelete(gallery.id, gallery.title)}
    disabled={deletingId === gallery.id}
    className="min-h-[44px] flex items-center text-[13px] font-semibold text-[#6e6e6e] hover:text-[#ef6f6f] disabled:opacity-50 transition-colors"
  >
    {/* only shows "Deleting…" while this specific gallery's delete call is in flight — do not remove this condition */}
    {deletingId === gallery.id ? 'Deleting…' : 'Delete'}
  </button>
</div>
```

With:
```tsx
{/* actions */}
<div className="flex items-center gap-3 sm:flex-shrink-0">
  {gallery.google_photos_url && (
    <a
      href={gallery.google_photos_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-[13px] text-[#5fa8e8] font-semibold hover:text-[#8ec5f5] transition-colors min-h-[44px]"
    >
      View Album
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
      </svg>
    </a>
  )}
  <button
    onClick={() => openEdit(gallery)}
    className="min-h-[44px] flex items-center text-[13px] font-semibold text-[#5fa8e8] hover:text-[#8ec5f5] transition-colors"
  >
    Edit
  </button>
  <button
    onClick={() => handleDelete(gallery.id, gallery.title)}
    disabled={deletingId === gallery.id}
    className="min-h-[44px] flex items-center text-[13px] font-semibold text-[#6e6e6e] hover:text-[#ef6f6f] disabled:opacity-50 transition-colors"
  >
    {deletingId === gallery.id ? 'Deleting…' : 'Delete'}
  </button>
</div>
```

- [ ] **Step 4: Add the edit modal JSX**

After the closing `)}` of the existing create modal (`{modalOpen && ( ... )}`), add the edit modal:

```tsx
{editingGallery && (
  <Modal onClose={closeEdit} size="md">
    <div
      className="bg-[#141414] border border-white/10 rounded-[20px] shadow-[0_32px_72px_-16px_rgba(0,0,0,0.8)] w-full"
      style={{ animation: 'modalIn 0.18s ease-out' }}
    >
      <div className="px-4 sm:px-7 pt-4 sm:pt-7 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <span className="w-[7px] h-[7px] rounded-full bg-[#9747FF]" />
            <h2 className="font-display font-bold text-[17px] text-white tracking-[-0.01em]">Edit Archive</h2>
          </div>
          <button
            type="button"
            onClick={closeEdit}
            className="w-8 h-8 rounded-full bg-white/6 hover:bg-white/12 flex items-center justify-center text-[#8c8c8c] hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {editError && (
          <p className="text-[13px] text-[#ef6f6f] bg-[rgba(239,111,111,0.08)] border border-[rgba(239,111,111,0.25)] rounded-xl px-4 py-3 mb-5">
            {editError}
          </p>
        )}
      </div>

      <form onSubmit={handleEditSubmit} className="px-4 sm:px-7 pb-4 sm:pb-7 flex flex-col gap-5">

        {/* Archive Name */}
        <div>
          <label className={labelCls}>Archive Name <span className="text-[#ef6f6f]">*</span></label>
          <input
            type="text"
            required
            value={editForm.title}
            onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
            className={inputCls}
            placeholder="e.g. Spring Formal 2025"
          />
        </div>

        {/* Cover Photo */}
        <div>
          <label className={labelCls}>Cover Photo</label>
          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <div
                onClick={() => editFileInputRef.current?.click()}
                className="w-full aspect-[1/1] rounded-xl overflow-hidden cursor-pointer mb-2"
              >
                <img
                  src={editCoverPreview ?? editingGallery.cover_photo_url}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
              </div>
              {editCoverPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setEditCoverFile(null)
                    setEditCoverPreview(null)
                    if (editFileInputRef.current) editFileInputRef.current.value = ''
                  }}
                  className="text-[12px] text-[#6e6e6e] hover:text-[#ef6f6f] font-medium transition-colors"
                >
                  Remove new photo
                </button>
              )}
            </div>
            <div className="flex-shrink-0">
              <div
                className="w-[72px] aspect-[1/1] rounded-[13px] border border-white/10 bg-[#141414] flex flex-col items-center justify-center gap-1.5"
                style={{ backgroundImage: 'repeating-linear-gradient(135deg,transparent 0 11px,rgba(255,255,255,0.025) 11px 12px)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={1.4}>
                  <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.7"/>
                  <path d="M21 15l-5-5L4 21"/>
                </svg>
                <span className="font-mono text-[8px] tracking-[0.1em] text-white/30">1:1</span>
              </div>
              <p className="text-[10px] text-[#6e6e6e] font-medium mt-1.5 text-center max-w-[72px]">as shown in archives</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => editFileInputRef.current?.click()}
            className="text-[12px] font-semibold px-3.5 py-1.5 rounded-lg border border-white/16 text-[#cfcfcf] hover:border-white/30 hover:text-white transition-colors mt-2"
          >
            {editCoverPreview ? 'Change Cover' : 'Replace Cover'}
          </button>
          <input
            ref={editFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleEditFileChange}
            className="hidden"
          />
        </div>

        {/* Album Link */}
        <div>
          <label className={labelCls}>Album Link</label>
          <input
            type="url"
            value={editForm.google_photos_url}
            onChange={e => setEditForm(f => ({ ...f, google_photos_url: e.target.value }))}
            className={inputCls}
            placeholder="https://photos.google.com/..."
          />
        </div>

        {/* Semester / Year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Semester</label>
            <select
              value={editForm.semester}
              onChange={e => setEditForm(f => ({ ...f, semester: e.target.value }))}
              className={selectCls}
            >
              <option value="">—</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Fall">Fall</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Year</label>
            <input
              type="number"
              min="2000"
              max="2100"
              value={editForm.year}
              onChange={e => setEditForm(f => ({ ...f, year: e.target.value }))}
              className={inputCls}
              placeholder="2025"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            value={editForm.description}
            onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            className={`${inputCls} resize-none`}
            placeholder="Optional description…"
          />
        </div>

        {/* Published toggle */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/7">
          <div>
            <div className="text-sm font-semibold text-[#e8e8e8]">Published</div>
            <div className="text-[12.5px] text-[#7e7e7e] font-medium mt-0.5">Show this archive on the public Gallery page</div>
          </div>
          <label className="relative cursor-pointer select-none flex-shrink-0">
            <input
              type="checkbox"
              checked={editForm.is_published}
              onChange={e => setEditForm(f => ({ ...f, is_published: e.target.checked }))}
              className="sr-only"
            />
            <div className={`w-[46px] h-[27px] rounded-full relative transition-colors duration-150 ${editForm.is_published ? 'bg-[#9747FF]' : 'bg-white/12'}`}>
              <span className={`absolute top-[3px] w-[21px] h-[21px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.4)] transition-all duration-150 ${editForm.is_published ? 'left-[22px]' : 'left-[3px]'}`} />
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between pt-5 border-t border-white/7 gap-3">
          <button
            type="button"
            disabled={editDeleting}
            onClick={handleEditDelete}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-[11px] bg-transparent border border-[rgba(239,111,111,0.4)] text-[#ef6f6f] text-sm font-bold cursor-pointer hover:bg-[rgba(239,111,111,0.1)] disabled:opacity-50 transition-colors"
          >
            {editDeleting ? 'Deleting…' : 'Delete Archive'}
          </button>
          <div className="flex gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={closeEdit}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-transparent border border-white/16 text-[#cfcfcf] text-sm font-semibold hover:border-white/32 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl border-none bg-[#9747FF] hover:bg-[#a85eff] disabled:opacity-50 text-white font-bold text-sm transition-colors"
            >
              {editSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  </Modal>
)}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd utdfsa && npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 6: Manual end-to-end test**

Navigate to `/officer/gallery` in the dev server. Test the following scenarios:

1. **Edit text fields only**: Click "Edit" on any archive → modal opens pre-filled → change title/description/year/semester/album link → Save Changes → modal closes → row reflects updated values.
2. **Toggle is_published off**: Open edit → flip Published toggle off → Save → archive disappears from public `/gallery` page (visible to officer page since it fetches all rows).
3. **Replace cover**: Open edit → click "Replace Cover" → select a new image → preview updates → Save → row thumbnail updates.
4. **Delete from edit modal**: Open edit → click "Delete Archive" → confirm prompt → modal closes → row is removed.
5. **Cancel**: Open edit → change some fields → Cancel → nothing changes.
6. **Error state**: Temporarily enter an invalid URL (e.g. `http://example.com`) in Album Link → Save → error banner appears inside modal.

- [ ] **Step 7: Commit**

```bash
git add app/(pages)/officer/gallery/OfficerGalleryClient.tsx
git commit -m "feat: add edit modal to gallery management page"
```
