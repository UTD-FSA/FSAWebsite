// ── lib.js ──────────────────────────────────────────────────
// shared safety helpers for the k6 scripts in this directory. factored out so
// the prod-domain guard (security-relevant) lives in exactly one place instead
// of being copy-pasted into every script that hits a staging deployment.

// never let a mistyped env var point a script at production. k6's js runtime
// has no global URL constructor, so match the host directly off the string.
export function assertNotProd(url) {
  if (/^https?:\/\/([^/]*\.)?utdfsa\.org(\/|$)/i.test(url)) {
    throw new Error(`target url (${url}) looks like production — refusing to run`)
  }
}

// Vercel Deployment Protection blocks anonymous requests to preview urls.
// "Protection Bypass for Automation" (Project Settings -> Deployment Protection)
// issues this secret; passing it as a header skips the SSO wall for this request only.
export function bypassHeaders() {
  const bypass = __ENV.VERCEL_PROTECTION_BYPASS
  return bypass ? { 'x-vercel-protection-bypass': bypass } : {}
}
