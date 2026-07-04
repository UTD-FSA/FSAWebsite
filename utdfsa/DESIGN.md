---
name: UTD FSA
description: The Filipino Student Association at UT Dallas — community, culture, and Goodphil competition
colors:
  banig-green: "#75ba78"
  parol-gold: "#d2a465"
  jeepney-blue: "#b5caff"
  officer-violet: "#9747FF"
  bg-deep: "#070707"
  bg-base: "#0e0e0e"
  bg-card: "#141414"
  bg-raised: "#1a1a1a"
  bg-section: "#1f1f1f"
  bg-input: "#262626"
  text-primary: "#ffffff"
  text-secondary: "#cfcfcf"
  text-muted: "#8c8c8c"
  text-dim: "#7a7a7a"
  text-faint: "#787878"
  border-subtle: "rgba(255,255,255,0.08)"
  border-soft: "rgba(255,255,255,0.12)"
  border-visible: "rgba(255,255,255,0.16)"
typography:
  display:
    fontFamily: "Unbounded, sans-serif"
    fontSize: "clamp(2.25rem, calc(1rem + 5vw), 6rem)"
    fontWeight: 900
    lineHeight: 0.96
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Unbounded, sans-serif"
    fontSize: "clamp(2.3rem, calc(1.5rem + 2.8vw), 3.375rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.12em"
  mono:
    fontFamily: "Geist Mono, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  script:
    fontFamily: "Noto Sans Tagalog, Noto Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.05em"
rounded:
  none: "0px"
  sm: "2px"
  default: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
  4xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.banig-green}"
    textColor: "{colors.bg-base}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.banig-green}"
    textColor: "{colors.bg-base}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  card-surface:
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.2xl}"
    padding: "16px"
  card-pricing:
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.2xl}"
    padding: "16px"
  input-default:
    backgroundColor: "{colors.bg-input}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "8px 12px"
---

# Design System: UTD FSA

## 1. Overview

**Creative North Star: "The Night Market"**

UTD FSA's site is a dark space lit from within — deep near-black surfaces (#070707 → #1f1f1f) stepped like the layers of a night market after sundown, with warm banig-green and parol-gold accents doing the work of string lights over a gathering. This is a student cultural organization, not a startup: the personality is warm, proud, and communal, blended with bold, energetic, youthful competitive spirit (Goodphil, parties, dance teams). Family language ("pamilya," "kuya/ate," "ading") should feel real in the interface, not decorative — warmth comes from tone and pacing, not just copy.

The system explicitly rejects generic corporate SaaS: no gradient text, no hero-metric stat cards, no uppercase tracked eyebrows on every section, no identical icon-grid card walls. It also rejects reading like a stiff university department page — nothing bureaucratic or institutional.

**Key Characteristics:**
- Deep, stepped dark surfaces — never flat black, never a single background color doing all the work
- One accent (Banig Green) carries almost all interactive/CTA weight; gold and blue are rare, deliberate seconds
- Bold Unbounded display type for identity moments, clean Geist for everything readable
- Baybayin script motifs as a structural design material, not an afterthought
- Energy shifts by section: warmer/quieter on storytelling (About, Mission), bolder/faster on competition and social sections (Goodphil, events)

## 2. Colors

Dark and stepped, lit by one warm-green accent; gold and blue are rare seconds, not a rainbow.

### Primary
- **Banig Green** (#75ba78): the org's primary accent — used for CTAs, active navigation states, success indicators, and subtle visual emphasis throughout the site. Named for the woven Filipino sleeping mat, it reflects warmth and community rather than a generic "success green." It should carry nearly all interactive emphasis, while decorative Baybayin elements remain white.

### Secondary
- **Parol Gold** (#d2a465): a secondary accent reserved for celebratory moments, featured highlights, and select UI details such as early-bird pricing. Named for the iconic Filipino Christmas lantern, it should be used sparingly alongside Banig Green to reflect UTD's green-and-gold school colors without competing for attention.

### Tertiary
- **Jeepney Blue** (#b5caff): sign-in / auth-adjacent links only. Named for the iconic Filipino jeepney — a distinct, cool counterpoint that never competes with the green.

### Neutral
- **Void** (#070707): deepest background, reserved for the officer-only area.
- **Night Base** (#0e0e0e): the default page background.
- **Card Black** (#141414): card and panel surfaces sitting above the base.
- **Raised Black** (#1a1a1a): hover/raised states one step above cards.
- **Section Charcoal** (#1f1f1f): alternating section backgrounds for rhythm down a long scroll.
- **Input Graphite** (#262626): form field backgrounds, one step lighter again — fields should read as clearly interactive.
- **Text White** (#ffffff), **Text Secondary** (#cfcfcf), **Text Muted** (#8c8c8c), **Text Dim** (#7a7a7a), **Text Faint** (#787878): a five-step text ramp: use White for headlines and primary copy, step down for supporting/meta text, never go below Faint (4.8:1 contrast — the accessibility floor) for anything readable.

### Named Rules
**The One Light Rule.** Banig Green is the only color that gets to say "click me." Gold and blue are accents for specific rare meanings (celebration, auth) — never substitutes for the primary CTA color.

## 3. Typography

**Display Font:** Unbounded (with sans-serif fallback)
**Body Font:** Geist (with Arial, sans-serif fallback)
**Label/Mono Font:** Geist Mono (with monospace fallback); Noto Sans Tagalog for the Baybayin script motif

**Character:** Unbounded is geometric and heavyweight — used only at identity moments (hero titles, section headers) where the brand needs to shout a little. Geist is quiet and highly legible underneath it, carrying all the reading weight. The pairing is a deliberate contrast: loud display, calm body.

### Hierarchy
- **Display** (900, `clamp(2.25rem, 1rem + 5vw, 6rem)`, 0.96 line-height): hero titles ("PAMILYAS", "MISSION STATEMENT"). One per page, max.
- **Headline** (700, `clamp(2.3rem, 1.5rem + 2.8vw, 3.375rem)`, 1.08 line-height): section titles ("WHAT IS A PAMILYA?", "UPCOMING EVENTS").
- **Title** (600, 28px, 1.2 line-height): card/subsection titles.
- **Body** (400, 16px, 1.5 line-height, 65–75ch max): all prose. Never drop below Text Faint (#787878) for body copy.
- **Label** (600, 12px, 0.12em tracking, uppercase): small-caps section labels, form labels.
- **Script** (400, 16px, Noto Sans Tagalog): the Baybayin motif — always rendered in white and paired with subtle rule lines on either side. It serves as a structural cultural element rather than a source of color, allowing Banig Green and Parol Gold to remain the site's accent colors.

### Named Rules
**The Shout-Once Rule.** Unbounded Black (900) is reserved for one hero moment per page. Everywhere else, drop to 700 or 600 — a page where everything shouts, shouts at nothing.

## 4. Elevation

Layered tone plus soft shadow, not shadow-forward. Depth reads primarily from the stepped near-black surface stack (Void → Night Base → Card Black → Raised Black → Section Charcoal); soft black shadows are reserved for genuinely floating elements (cards, modals, overlays) rather than applied to every panel.

### Shadow Vocabulary
- **Raised** (`0 4px 12px -2px rgba(0,0,0,0.35)`): hover-lifted elements, subtle raised state.
- **Card** (`0 12px 32px -8px rgba(0,0,0,0.65)`): standard card elevation.
- **Overlay** (`0 24px 56px -12px rgba(0,0,0,0.75)`): dropdowns, popovers, the photo carousel.
- **Modal** (`0 32px 72px -16px rgba(0,0,0,0.85)`): modals and dialogs — the deepest shadow in the system.

### Named Rules
**The Stack-First Rule.** Reach for the next tone step before reaching for a shadow. Shadow is for things that float above the stack, not a substitute for tonal depth.

## 5. Components

Confident and unfussy — solid pill CTAs, clean cards with quiet borders, nothing fragile or overly ornamented. Matches the bold/energetic half of the brand personality without losing warmth.

### Buttons
- **Shape:** fully rounded corners on the interactive scale (12px / `rounded.xl`)
- **Primary:** solid Banig Green (#75ba78) fill, near-black (#0e0e0e) text, 12px/24px padding — the only solid-fill button in the system
- **Ghost:** transparent fill, 1px border at Border Visible (rgba(255,255,255,0.16)), white text — secondary actions, pagination, modal dismiss
- **Sign-in:** text-only Jeepney Blue link, no fill or border — reserved for auth entry points
- **Destructive:** text-only red-400, no fill or border — logout, delete confirmations only

### Cards / Containers
- **Corner Style:** 16px (`rounded.2xl`) for standard cards, 24px (`rounded.3xl`) for large modals/panels
- **Background:** Card Black (#141414) as the default card surface, Section Charcoal (#1f1f1f) for alternating page sections
- **Shadow Strategy:** Card elevation shadow by default; Pricing variant adds a 1.5px Banig Green border on top of the same shadow to signal "this is the one that matters"
- **Border:** 1px Border Subtle (rgba(255,255,255,0.08)) on most cards; steps up to Border Soft/Visible for interactive or emphasized cards
- **Internal Padding:** 16-24px depending on card density

### Inputs / Fields
- **Style:** Input Graphite (#262626) fill, no border at rest, 12px radius
- **Focus:** border shifts to Jeepney Blue at full opacity — the one moment blue appears outside auth
- **Error:** border shifts to red at 60% opacity, helper text in matching red below the field

### Navigation
- Dark Night Base background, white text links, Banig Green for the active/current-page state. Desktop: horizontal link row plus a Goodphil dropdown and avatar. Mobile: logo plus hamburger, same dark background, no visual weight change on scroll until the hide-on-scroll behavior kicks in.

### Badge (Signature Component)
Event-type and status pills across the events system: a small color dot plus label, background tinted to ~13% opacity of the type's color, border at ~34% opacity, text at full opacity. Each event type (Party, General Meeting, GP Event, Risk Management, Other) gets its own hue; Early Bird uses Parol Gold, Past uses neutral gray, Pass/Fail use Banig Green/red. The dot-plus-tint pattern is reused for every status signal in the system — don't invent a second pattern for the same job.

## 6. Do's and Don'ts

### Do:
- **Do** use Banig Green (#75ba78) as the only solid-fill CTA color — it should read as "the" action color across the whole site.
- **Do** step through the tonal surface stack (#070707 → #0e0e0e → #141414 → #1a1a1a → #1f1f1f) for layering before reaching for a shadow.
- **Do** pair the Baybayin script motif with subtle rule lines and keep it white for consistency. Use Banig Green and Parol Gold as the site's primary accent colors elsewhere.
- **Do** shift energy by section — warmer and slower on About/Mission storytelling, bolder and faster on Goodphil/events/parties.
- **Do** keep body text at Text Faint (#787878) or brighter; that's the accessibility floor (4.8:1), not a target.

### Don't:
- **Don't** use gradient text, hero-metric stat cards, uppercase tracked eyebrows on every section, or identical icon-grid card walls — generic corporate SaaS, explicitly rejected in PRODUCT.md.
- **Don't** make this read like a stiff university department page — no bureaucratic, institutional tone in copy or layout.
- **Don't** introduce a second solid-fill button color. Gold and blue are rare seconds (celebration, auth) — never CTA competitors to Banig Green.
- **Don't** use more than one Unbounded Black (900) display moment per page — that's shouting at nothing.
- **Don't** use `border-left`/`border-right` as a colored accent stripe on cards or list items — full borders, background tints, or leading icons instead.
