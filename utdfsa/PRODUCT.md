# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

UTD students (primarily Filipino-American, but explicitly open to all) browsing the FSA site to learn about the org, find events, join a pamilya (family group), or become a member. Context is casual, mobile-heavy browsing between classes or on social media referral — not a focused work session. The job to be done: "is this org for me, and how do I get involved right now."

A second audience uses the same codebase for a different job: officers (`officer`/`admin` role) running events, applications, gallery uploads, QR check-in scanning, and Goodphil scoring from the admin area.

## Product Purpose

The public face of UTD's Filipino Student Association — recruitment, event awareness, and cultural storytelling for a student cultural/community organization. Success looks like: a visitor understands what FSA and Goodphil are, feels invited in, and takes one concrete action (join a pamilya, register for an event, become a member).

## Positioning

A full org-operations platform, not a brochure site: paid membership (Stripe), pamilya family-group matching, Goodphil competitive scoring, and an officer admin area (events, applications, gallery, QR ticket scanning) all run through the same system. Most comparable student-org sites are static pages or a Linktree — this one runs the org's actual operations, which a neighboring org site couldn't truthfully claim without rebuilding the same infrastructure.

## Operating Context

- Paid membership and paid event registration via Stripe (`lib/stripe.ts`, webhook-verified).
- In-person event check-in via QR ticket scanning (officer-facing, `attend_qr_token`).
- Member portal: profile, attendance history, orders.
- Officer admin: event management, applications, gallery uploads, Goodphil scoring.
- Guest/anonymous checkout is supported by design for paid event tickets.

## Capabilities and Constraints

- Three-layer auth: middleware session refresh + route gating, in-route/in-page guards, and a single shared `isMembershipActive()` predicate (status + unexpired) that every access gate must use.
- `PUBLIC_EVENT_COLUMNS` allowlist deliberately excludes the check-in secret from public-facing event queries.
- No test suite currently configured (no test runner, no `*.test.*`/`*.spec.*` files).

## Brand Commitments

Name: UTD FSA (Filipino Student Association at UT Dallas).

Warm, proud, and communal, blended with bold, energetic, and youthful. Family language ("pamilya," "kuya/ate," "ading") drives real warmth — this isn't corporate community-speak. Cultural pride (Baybayin script motifs, Filipino heritage) sits alongside high-energy college-org spirit (Goodphil competition, parties, dance teams). Voice is casual and inviting, never institutional.

Anti-references: generic corporate SaaS (gradient text, hero-metric stat cards, uppercase tracked eyebrows, identical icon-grid card walls), and stiff university department pages — this is a student-run cultural org, not bureaucratic .edu content.

## Evidence on Hand

Officer photos are not yet available — officer board cards currently render placeholder initials/silhouettes (`app/(pages)/about/AboutClient.tsx`), not real photography. Do not fabricate testimonials, press, or case studies; none are on hand.

## Product Principles

- Family over feature — "pamilya" language and warmth should show up in tone and pacing, not just copy.
- Energy matches the moment — quieter/warmer on storytelling sections (About, Mission), bolder/faster on competitive/social sections (Goodphil, events, parties).
- Mobile-first attention span — most visitors are scrolling casually; hook fast, one clear action per section.
- Practice what you preach — the site itself should feel like an invitation into a community, not a brochure about one.

## Accessibility & Inclusion

Standard WCAG AA: contrast ratios (4.5:1 body text, 3:1 large text), keyboard navigation, and full reduced-motion support for all scroll-triggered/entrance animations already in use across the site.
