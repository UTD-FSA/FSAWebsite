// ── lib/email/escape.ts ───────────────────────────────────
// shared html-escape helper for email templates.
//
// notes: escapes the five HTML-special characters so user-controlled values
//        (member names, application answers, etc.) cannot inject tags or
//        attributes into an outbound email body. every template that
//        interpolates a user-controlled string into html MUST route it
//        through this function first.

export function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
