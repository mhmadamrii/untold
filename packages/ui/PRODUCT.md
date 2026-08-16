# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Shared component/design-system package (`@untold/ui`) in the Untold Turborepo + Bun monorepo. Tailwind CSS v4, shadcn/ui-derived primitives, lucide-react icons. Consumed as a workspace dependency by `apps/web` (Next.js 16 on Cloudflare Workers) and any future Untold app surface.

## Users

Not a standalone product — this package has no end users of its own. Its "user" is the Untold engineering/design work building `apps/web` (and future apps) on top of it. Product truth (who Untold serves, why, positioning) lives in `apps/web/PRODUCT.md`; do not duplicate or diverge from it here.

## Product Purpose

Provide the single shared visual and interaction vocabulary for every Untold surface: base primitives (button, card, input, textarea, dropdown, tooltip, skeleton, toast) plus conversation-oriented components (bubble, message, message-scroller, attachment) intended for AI-assisted writing interactions. Its job is consistency and reuse across surfaces, not product-level decisions.

## Positioning

N/A at the package level — positioning is a product concern owned by `apps/web/PRODUCT.md`.

## Operating Context

Components here must work across the distinct surface modes Untold's app layer needs: Operate (dashboard, story workspace, chapter editor), Read (public story reader), and Persuade (marketing/landing, if built). The chat-style components (bubble/message) exist for contextual AI assistance embedded within writing surfaces — not as a standalone chat product — and must avoid generic AI-chatbot visual patterns per the parent CLAUDE.md's anti-"AI slop" direction.

## Capabilities and Constraints

Current inventory: attachment, bubble, button, card, checkbox, dropdown-menu, empty, input-group, input, label, marker, message-scroller, message, skeleton, sonner (toast), textarea, tooltip. No design tokens/theme documented yet beyond `src/styles/globals.css` and `components.json` (shadcn config) — treat existing CSS as incumbent authority until `/impeccable document` records it formally. No Storybook or isolated component-preview surface currently exists.

Terminology should stay aligned with `apps/web/PRODUCT.md` (Story, Chapter, Direction, Continue) wherever a component's naming or copy is story-domain-specific (e.g. `bubble`/`message` used for AI writing-assistant dialogue, not generic chat).

## Brand Commitments

Inherits Untold's brand from `apps/web/PRODUCT.md` (name, no logo asset yet — lucide icon as placeholder). This package should not introduce a separate visual identity.

## Evidence on Hand

None. No published component documentation, usage guidelines, or design tokens exist yet beyond the source code itself.

## Product Principles

- One shared vocabulary: no surface should invent one-off variants of a primitive that already exists here.
- Components stay domain-agnostic where possible (button, card, input) but the conversational components (bubble, message) should be shaped for Untold's contextual-AI-companion feel specifically, not generic chatbot styling.
- Changes here ripple to every consuming app — treat this package as higher-blast-radius than a single app's components.

## Accessibility & Inclusion

Target WCAG 2.1 AA, matching `apps/web/PRODUCT.md`. As the shared primitive layer, this package carries primary responsibility for baseline accessibility (focus states, keyboard operability, contrast, ARIA semantics) that consuming apps then inherit.
