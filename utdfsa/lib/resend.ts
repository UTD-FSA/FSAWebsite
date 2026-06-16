// ── lib/resend.ts ─────────────────────────────────────────
// singleton resend client — import { resend } from '@/lib/resend' for sending transactional emails
//
// deps:  resend (npm)
// notes: RESEND_API_KEY is a server-only env var;
//        all send calls must happen in server components or api routes

import { Resend } from 'resend'

// ── exported client ───────────────────────────────────────

// RESEND_API_KEY is a server-only secret — never reference this module in client components
export const resend = new Resend(process.env.RESEND_API_KEY!)
