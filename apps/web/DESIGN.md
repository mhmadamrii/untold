---
name: Untold
description: Everyone has a story. Not everyone knows how to tell it.
colors:
  bg: "#f3f2f2"
  surface: "#eae9e9"
  text: "#201f1d"
  accent: "#b68235"
  divider: "color-mix(in srgb, #201f1d 16%, transparent)"
  destructive: "#9c4a3c"
  bg-dark: "#1c1a17"
  surface-dark: "#262219"
  text-dark: "#f8f4f4"
  accent-dark: "#e1ad66"
typography:
  heading:
    fontFamily: "Cormorant Garamond, ui-serif, serif"
    style: "normal"
    fontWeight: 600
  reading:
    fontFamily: "Lora, ui-serif, serif"
    lineHeight: 1.7
  ui:
    fontFamily: "Lora, ui-serif, serif"
rounded:
  sm: "2px"
  base: "4px"
  lg: "7px"
components:
  button-primary:
    backgroundColor: "transparent"
    borderColor: "{colors.accent}"
    textColor: "{colors.accent}"
    rounded: "{rounded.base}"
  button-secondary:
    backgroundColor: "transparent"
    borderColor: "{colors.divider}"
    textColor: "{colors.text}"
    rounded: "{rounded.base}"
---

## Overview

Untold is a literary/editorial writing product, not a SaaS dashboard. This is
the **Classical** system, ported from the Claude Design hi-fi exploration
("Untold Hi-Fi Classical") — it replaces an earlier terracotta/sans build.
Editorial, book-like: a warm near-white ground, one committed gold accent
applied as stroke rather than fill, hairline dividers instead of
shadow-cards, soft 4px corners instead of sharp or bubbly ones. Source of
truth for the tokens is `packages/ui/src/styles/globals.css`; this file
documents how to use them, not the values themselves.

## Colors

A light ground (`--background` `#f3f2f2`) with `--foreground` `#201f1d` and a
single accent `--primary` `#b68235` (a warm gold/terracotta). No blue, no
purple, no gradients. Color is drawn as borders, underlines and small marks —
never as a filled block. Cards and buttons stay unfilled; the accent shows up
as an outline (primary buttons), a text color (links, the `A/B/C` direction
letters, kickers), or a very light tint (`bg-primary/10`) for hover and
selected states. Dark mode swaps the ground for a warm near-black
(`#1c1a17`, a shade below the darkest neutral) and brightens the accent to
`#e1ad66` for contrast comfort — same hue family throughout, never a
different accent per theme.

## Typography

Two faces:

- **Heading (`cn-font-heading` utility, `Cormorant Garamond`, semibold —
  never bold)** — page titles, section headings, card titles, nav brand,
  and button labels. The bigger the text, the lighter it should read;
  reserve semibold for interface-scale headings, not display sizes.
- **Body / UI (`font-sans`, which resolves to `Lora`)** — everything else:
  nav links, paragraphs, labels, buttons' surrounding chrome, long-form
  story content (`cn-font-reading`, also Lora, `line-height: 1.7`). There is
  no third UI sans-serif face in this system — Plus Jakarta Sans has been
  removed. Never fall back to a system sans as the display voice.

Self-hosted via `next/font/google` in the root layout (`Cormorant_Garamond`
+ `Lora`), never loaded from a CDN.

## Layout

Editorial, generous whitespace. The whole spacing scale runs 1.15× Tailwind's
default (`--spacing: 0.2875rem` in `@theme inline`), so every existing
`gap-*`/`p-*`/`m-*` utility already reads a little airier without being
rewritten by hand. Section rhythm and hairline dividers (`border-border`,
1px) still separate major blocks — never shadows or filled cards.

## Shapes

Soft 4px corners (`--radius-md`) on buttons, inputs, and cards;
2px (`--radius-sm`) on small nested elements (badges, checkboxes, menu
items); 7px (`--radius-lg`) on dialogs and popovers that sit above the page.
This is a deliberate move away from the previous sharp-corner
(`rounded-none`) direction — Classical is softer, closer to a printed card
than a spreadsheet.

## Components

- **Card / bordered panels**: `border border-border`, background matches the
  page (`bg-card` = `--background`) — separation comes from the border, not
  a shade shift or a shadow.
- **Button primary** (`variant="default"`): an accent-colored outline on a
  transparent background (`border-primary text-primary`), never a filled
  gold button — filling primary actions with solid accent is explicitly
  banned by the source system (see "Don't" below).
- **Button secondary/outline**: a neutral hairline border
  (`border-border`), transparent background, subtle foreground-tint hover.
- **Button ghost**: text-only accent color, no border, light accent-tint
  hover — used for low-emphasis actions ("Regenerate", "Dismiss").
- **Button-as-link**: when rendering a `Button` polymorphically onto
  `next/link` via the `render` prop, always pass `nativeButton={false}`.
- **Direction/choice lists**: a divided list or a row of bordered cards with
  a large `cn-font-heading` accent-colored letter (A/B/C), never a grid of
  identical icon+heading cards.
- **Framed illustration ("plate")**: `cn-plate` utility — a warm archival
  filter inside a thick surface-colored mat with a hairline outline, like a
  tipped-in book plate. Pair with an italic caption in the reading face.
- **Tags/kickers**: small uppercase tracked labels in the accent color
  (`cn-font-heading`, ~11px, tracked) mark section eyebrows and card
  categories throughout — this system uses them far more liberally than the
  old build's single-hero-eyebrow rule.

## Do's and Don'ts

- Do keep the accent to a single hue family across light/dark.
- Do draw with borders, rules and underlines; keep large fills off the page.
- Do author illustrative example content at full fidelity, clearly labeled
  as illustrative — never a real testimonial or fabricated user story.
- Don't fill cards or buttons with solid accent color — outline only.
- Don't use heavy drop shadows — elevation is a whisper (`shadow-sm`).
- Don't tighten the leading or crowd the margins — the spacing scale is
  airy by design.
- Don't add a second display face, gradients, or glassmorphism — banned by
  the project's design direction (repo `CLAUDE.md` §23).
