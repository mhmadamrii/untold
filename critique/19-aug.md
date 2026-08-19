# UI Critique — Untold Landing Page (`/`)

**Verdict:** Visual system (palette, imagery, sharp-corner cards, spacing) is genuinely well-executed, but it's undermined by a broken mobile header that clips an interactive control off-screen, a sitewide CSS bug that silently swaps every heading from the intended serif to the UI sans-serif, and a dead button on the public page.
**Scores:** Accessibility 4/10 · Aesthetics 5/10 · UX 4/10
**Reviewed at:** 375×812 (mobile, actual rendered viewport 454×577 due to OS/DPR resize offset — verified via `window.innerWidth`) · 768×1024 (tablet, exact) · ~1440×900 (desktop, rendered 1382×657) · live at `http://localhost:3001/`, logged in as "testing"

## Blockers

- **Mobile header overflows horizontally and clips the user-menu button off-screen** — `header > div` (`apps/web/src/components/header.tsx`)
  - **What:** At 454px viewport width, `document.body.scrollWidth` = 489px vs `window.innerWidth` = 454px — a confirmed 35px horizontal overflow. The header's flex row (`flex items-center justify-between`, `flex-wrap: nowrap`) has zero responsive breakpoint: `Home`/`My Stories`/`Discover`/`Shared` nav links and the "testing" user-menu button all render inline at every viewport width. The user button's bounding box is `x:427, w:62` → right edge at 489px, exactly matching the overflow — it's the direct cause. Visually the logo and "Home" link render pressed flush together with no gap (screenshot confirms).
  - **Why it matters:** On an actual phone there's no visible way to reach account settings/sign-out — the control exists past the right edge of the screen and the page doesn't offer horizontal scroll affordance (nor should it need one on a vertically-scrolling page). Reachable by keyboard Tab only; unreachable by touch/mouse without knowing to scroll sideways.
  - **Fix:** Add a mobile nav breakpoint — collapse `Home / My Stories / Discover / Shared` into a hamburger/sheet menu below `sm` (or at minimum `md`), matching the pattern Tailwind already uses elsewhere in this codebase (e.g. `sm:grid-cols-2 lg:grid-cols-3` in the stories grid). Keep only the wordmark, theme toggle, and user avatar visible inline on mobile.

## Major

- **Every heading sitewide silently renders in the wrong typeface** — `packages/ui/src/styles/globals.css:78-81` + `:122-129`
  - **What:** `@theme inline { --font-heading: var(--font-lora), ui-serif, serif; ... }` is declared inside a Tailwind v4 `@theme inline` block. Tailwind's `inline` mode substitutes theme values directly into its own generated utilities — it does **not** emit `--font-heading` as a real, queryable CSS custom property on `:root`. Confirmed: `getComputedStyle(document.documentElement).getPropertyValue('--font-heading')` returns `""` (empty). The hand-written `@utility cn-font-heading { font-family: var(--font-heading); }` (line 122) therefore resolves to nothing and falls through to the inherited body font. Measured on the live h1: `font-family: "Plus Jakarta Sans", ... sans-serif` — not Lora. The Lora font faces are registered (`document.fonts` lists 12 Lora weights) and unused.
  - **Why it matters:** Section 25/26 of this project's own spec calls typography "an important part of the identity" and explicitly warns against defaulting to the UI sans everywhere. Right now every `h1`/`h2` on the site — including "Everyone has a story. Not everyone knows how to tell it." — renders in the same geometric sans as the nav and body copy. The entire editorial/literary visual identity this app is built around is currently absent from every heading.
  - **Fix:** Move `--font-heading` and `--font-reading` out of the `@theme inline` block into the plain `:root` block (or a separate non-inline `@theme` block) so they exist as real custom properties the hand-written `cn-font-heading`/`cn-font-reading` utilities can consume via `var()`. Simplest one-line fix: in `:root` add `--font-heading: var(--font-lora), ui-serif, serif; --font-reading: var(--font-lora), ui-serif, serif;` alongside the color tokens, leaving the `@theme inline` copies for Tailwind's own utility generation.

- **"Continue it" button does nothing when clicked** — bottom continuation demo section, `<button type="button">Continue it</button>`
  - **What:** Clicked at desktop viewport; no navigation, no toast, no DOM change, no console output — confirmed via before/after screenshot comparison. Unlike the notes→chapter demo above it (which is labeled "Illustrative example — not a real Untold story."), this section carries no such disclaimer, so a visitor has no way to know it's decorative.
  - **Why it matters:** It's styled identically to real primary actions elsewhere on the page (`Start your story`), so users will expect it to do something. A silent no-op reads as broken, not intentional.
  - **Fix:** Either wire it to the real "Continue Story" flow (`/login` or a demo route), or add the same "Illustrative example" caption used on the notes demo directly under it.

- **Nav link touch targets are 20px tall — below the 24px WCAG 2.2 minimum** — `header nav a` (Home, Discover, Shared)
  - **What:** Measured bounding boxes: `Home` 40.8×**19.99**px, `Discover` 58.6×**19.99**px, `Shared` 47.8×**19.99**px.
  - **Why it matters:** Fails WCAG 2.2's 24×24px minimum target size outright (this is separate from the overflow Blocker above — even once the header is fixed, these links are still too short to comfortably tap).
  - **Fix:** Add vertical padding (e.g. `py-2`) to each nav `<a>` so the hit area reaches at least 24px, ideally 44px on touch breakpoints.

- **Public landing page surfaces unmoderated, profane user content to anonymous visitors** — "Stories people are reading" section
  - **What:** One of three publicly-featured story cards has the title "What the fuck?" with excerpt "In the quiet joy of a Sunday morning, a child's game reveals how simple pleasures can hold unexpected questions about the world." This renders on `/` for every visitor, logged in or not.
  - **Why it matters:** This is the marketing landing page — the first thing a prospective user sees. An unfiltered profane title next to "Everyone has a story" undercuts the calm/literary positioning the whole spec (Section 22-24) is built around, and there's no visible curation/moderation step before a story is surfaced here.
  - **Fix:** Either curate this section server-side (editorial pick / staff-selected flag) rather than "most recent public," or apply basic content filtering before a story qualifies for the homepage feed.

## Minor

- **"Untitled story" card has a large dead whitespace gap** — `apps/web/src/app/(public)/page.tsx`, `<PopularStories />` grid
  - **What:** This card has a title only (no description). Because it sits in a CSS Grid row (`grid ... sm:grid-cols-2 lg:grid-cols-3`) next to the taller "Dragon Ball" card, the grid's default `align-items: stretch` forces it to match that row's height, and `flex flex-col justify-between` inside it spreads the empty space into a ~150px blank gap between the title and the footer meta row.
  - **Fix:** Give description-less cards a fallback line (e.g. "No description yet.") in muted text so the space is filled with something, not dead air — this also softens the bare "Untitled story" fallback title itself.
- **Theme toggle and user-avatar buttons are 32×32px** — between the 24px floor and the 44px comfortable target. Fine for mouse, tight for touch thumbs. Bump to 40-44px on mobile.
- **`My Stories` nav link wraps to two lines** in the cramped mobile header (visible in the mobile zoom capture) — a symptom of the same header-overflow Blocker; will resolve once that's fixed, but flagging separately in case the hamburger fix still leaves this link somewhere cramped.

## Nits

- Resize/viewport testing on this environment required compensating for a consistent ~45-125px OS-chrome offset between requested and actual `window.innerWidth` — not a product bug, just a note for reproducing these measurements.
- Focus ring on tabbed elements uses the browser's default `auto` outline (thin, ring color derived from `--ring`) — functional and visible, but a custom, slightly heavier focus ring would match the deliberate hairline-border aesthetic used elsewhere (`ring-1 ring-border`) more closely.

## What's working

- Heading hierarchy is clean: single `h1`, sequential `h2`s, no skipped levels. Landmarks (`header`, `nav`, `main`, `footer`) all present.
- Measured contrast passes comfortably where checked: eyebrow "A writing companion" (`#AF4803` on `#FCFAF4`) = 5.36:1; muted body copy = 6.31:1. Both clear the 4.5:1 AA floor.
- The hairline-border card system (`ring-1 ring-border`, `gap-px bg-border` grid technique) and sharp corners are applied consistently and read as intentional, not templated — a real point of taste in an otherwise generic-SaaS-prone space.

## Visual references

**Story card cover placeholder — for description-less cards** — recommend: Gemini / Nano Banana

```
Small spot illustration, hand-drawn pencil/ink sketch style matching an existing hero illustration of a writer at a desk with sketched scenery dissolving from a pen.
Subject: a single open blank book with a faint, unfinished pencil line trailing off the page — suggesting "story not yet written," not an error.
Style: loose ink/pencil line art, warm sepia linework, no color fill beyond the line strokes.
Palette: linework in warm ink-brown (#3D2B1F), background transparent (PNG, no fill) so it sits on the app's card background (#FCFAF4) or muted surface (#F1EAE0).
Dimensions: 480x270px (16:9), transparent background.
Avoid: text, watermark, drop shadow, color fill, photographic rendering, background pattern.
```

## Fix order

1. Fix the mobile header overflow (Blocker) — collapse nav into a hamburger below `sm`/`md`. This single fix also resolves the "My Stories" text-wrap Minor.
2. Fix `--font-heading`/`--font-reading` custom property scoping in `globals.css` (Major) — one-line CSS move, restores the entire heading typeface sitewide.
3. Wire up or caption the dead "Continue it" button (Major).
4. Bump nav-link vertical padding to hit the 24px touch-target floor (Major).
5. Add editorial curation/filtering to the public "Stories people are reading" feed (Major).
6. Fill the empty-description card gap with fallback copy (Minor).
