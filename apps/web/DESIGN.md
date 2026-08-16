---
name: Untold
description: Everyone has a story. Not everyone knows how to tell it.
colors:
  paper: "oklch(0.985 0.008 85)"
  ink: "oklch(0.22 0.02 55)"
  terracotta: "oklch(0.53 0.15 45)"
  terracotta-foreground: "oklch(0.99 0.01 85)"
  secondary: "oklch(0.94 0.012 70)"
  muted-foreground: "oklch(0.48 0.02 60)"
  border: "oklch(0.87 0.016 65)"
  destructive: "oklch(0.55 0.2 25)"
  ink-dark: "oklch(0.18 0.012 55)"
  paper-dark: "oklch(0.95 0.008 80)"
  terracotta-dark: "oklch(0.68 0.14 45)"
typography:
  heading:
    fontFamily: "Fraunces, ui-serif, serif"
    style: "italic"
    fontWeight: 500
  reading:
    fontFamily: "Lora, ui-serif, serif"
    lineHeight: 1.7
  ui:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
rounded:
  none: "0px"
  base: "0.2rem"
components:
  button-primary:
    backgroundColor: "{colors.terracotta}"
    textColor: "{colors.terracotta-foreground}"
    rounded: "{rounded.none}"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
---

## Overview

Untold is a literary/editorial writing product, not a SaaS dashboard. The visual language borrows from digital magazines and physical books: warm paper-and-ink palette, one committed accent, hairline rules instead of shadow-cards, sharp corners instead of bubbly rounding. First surface built to this world: the public landing page (`src/app/(public)/page.tsx`).

## Colors

Restrained strategy: warm neutral paper/ink base + one accent (terracotta), used sparingly for primary actions, links-as-emphasis, and small accent marks (e.g. the `A/B/C` direction letters). No blue, no purple, no gradients. Dark mode swaps paper→warm charcoal ink, ink→warm off-white, and lightens/desaturates the accent slightly for contrast comfort in long writing sessions — same hue family throughout, never a different accent per theme.

## Typography

Three distinct faces, each with one job — never used interchangeably:

- **Heading (`cn-font-heading` utility, `Fraunces`)** — italic, used for all display headings and short editorial moments ("Chapter One", "To be continued…"). Carries the brand's literary voice.
- **Reading (`cn-font-reading` utility, `Lora`)** — long-form prose passages only (chapter excerpts, story content). Never used for UI chrome.
- **UI (`font-sans`, `Plus Jakarta Sans`)** — everything else: nav, buttons, body copy, labels. Quiet, gets out of the way.

Never fall back to a system/default sans as the display voice — Fraunces and Lora are self-hosted via `next/font/google` in the root layout, not loaded from a CDN.

## Layout

Editorial, generous whitespace, asymmetric two-column grids (roughly 0.85fr / 1.15fr) rather than centered single-column marketing blocks. Section rhythm: `py-20 md:py-28`, separated by 1px hairline dividers (`bg-border`), never by cards or shadows. Content container: `max-w-6xl mx-auto px-6`.

## Shapes

Sharp corners throughout (`--radius: 0.2rem`, and primitives like `Button`/`Card`/`Badge` hardcode `rounded-none`). No pill buttons, no bubbly rounded rectangles — this is a deliberate departure from the generic shadcn/SaaS default and must be preserved when adding new components.

## Components

- **Card / bordered panels**: `ring-1 ring-border` (hairline), never `box-shadow`. Background `bg-card` (same lightness as page background in light mode — separation comes from the ring, not a shade shift).
- **Button primary**: `bg-primary` (terracotta) + `text-primary-foreground`, sharp corners, no glow/gradient.
- **Button-as-link**: when rendering a `Button` polymorphically onto `next/link` via the `render` prop, always pass `nativeButton={false}` — Base UI's `Button` defaults to native-button semantics and warns/breaks a11y otherwise.
- **Direction/choice lists**: rendered as a divided list (`divide-y`) with a small italic accent-colored letter, not a grid of identical icon+heading+text cards.

## Do's and Don'ts

- Do author illustrative example content (e.g. the "notes → chapter" demo) at full fidelity, clearly labeled as illustrative — never a real testimonial or fabricated user story (no evidence exists yet per `PRODUCT.md`).
- Do keep the accent to a single hue family across light/dark.
- Don't add a second display face, a kicker/eyebrow label above headings, same-size icon-grid cards, gradients, glassmorphism, or generic rounded-everything — these are explicitly banned by the project's design direction (see repo `CLAUDE.md` §23).
- Don't invent commercial/pricing claims — monetization is explicitly undecided in `PRODUCT.md`.
