// ── lib/constants.ts ──────────────────────────────────────
// shared constants used across the codebase
//
// notes: update COVER_PHOTO_ASPECT_RATIO if card layout changes —
//        the cropper will enforce the new ratio on all future uploads

// ── cover photo constraints ───────────────────────────────

// controls the crop ratio enforced on all cover photo uploads
export const COVER_PHOTO_ASPECT_RATIO = 16 / 9

// minimum output dimensions in pixels for acceptable quality
export const COVER_PHOTO_MIN_WIDTH = 800
export const COVER_PHOTO_MIN_HEIGHT = 450
