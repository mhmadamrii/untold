# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing codebase (not greenfield): Next.js 16 (App Router) on Cloudflare Workers via OpenNext, Turborepo + Bun monorepo. Auth via better-auth. Data via oRPC + TanStack Query. Styling: Tailwind CSS v4 + shadcn/ui-derived components in `@untold/ui` (workspace package). Icons: lucide-react.

## Users

Anyone with a story they don't know how to tell — no single segment prioritized first. Two overlapping groups the product must serve equally:

- People writing real-life stories: childhood memories, family history, relationships, travel, life-changing moments, stories about parents/grandparents, things they want to preserve for their children.
- People writing fiction: novels, short stories, genre fiction (romance, mystery, fantasy, adventure, horror, historical, children's), building characters/worlds/plot from scratch.

Job to be done: turn raw, unpolished material (notes, fragments, memories, images, half-formed ideas) into a structured, meaningful, long-form story — with AI as a creative collaborator, not an autopilot.

## Product Purpose

Untold helps people discover and develop the story inside their own raw material — notes, memories, fragments, images — and turn it into a structured, long-form piece of writing they actually finish and are proud of. Success looks like: a user goes from "I have this memory but don't know how to write about it" to "I have a story," keeps coming back to continue it over days/weeks/months, and eventually shares it.

## Positioning

Untold is a creative writing companion, not a text generator. The core mechanism a competitor autocomplete/AI-writer tool doesn't offer: it helps the user find and shape the story that's already implicit in their own imperfect input (notes, fragments, images) through guided exploration (directions, outlines, "what could this become") before generating prose — rather than generating a finished story from a one-line prompt. The user remains the author at every step; AI proposes, the user decides. Real-life stories are never fabricated on top of — the user's memory is the source of truth.

## Operating Context

Primary flow: Idea → Explore → Shape → Write → Continue → Refine → Share. Users start a story with minimal friction (a single open prompt, not a form), optionally attach an image, optionally pick a story type/topic, then move into a chapter-based writing workspace where AI assistance is contextual (selection-level, chapter-level, story-level) rather than one big "generate" action. Stories are revisited and continued over long timeframes (days to months), so continuity/context across sessions matters. A public reading experience and a private authoring workspace are distinct surfaces with different design goals (Read vs Operate/Persuade).

## Capabilities and Constraints

Confirmed functionality direction (see repo CLAUDE.md for full spec): story creation with progressive disclosure of metadata (title, notes, topic, story type, tags, cover image, chapters, visibility); AI-assisted story direction suggestions, outline generation, chapter writing/continuation, "getting unstuck" prompts, and contextual rewrite/expand/tone tools; chapter management (add/rename/reorder/edit/delete); sharing with explicit privacy controls (private / link / public), default private.

Current implementation state (as of this init): early foundation stage. `apps/web` has auth (sign-in/sign-up), a dashboard shell, theme toggling, and a shared `@untold/ui` package with base primitives (button, card, input, textarea, dropdown, tooltip, skeleton, sonner toasts) plus chat-oriented components (`bubble`, `message`, `message-scroller`, `attachment`) that appear scaffolded for AI-conversation UI but are not yet wired into story features. No story creation, workspace, chapter, or reader surfaces exist yet.

Terminology: "Story" (not "document"/"project"), "Chapter" (not "section"), "Direction" (an AI-proposed path the story could take), "Continue" (resuming/extending a story, distinct from generic "add").

Undecided: monetization/pricing model, discovery/search ranking approach, collaboration/multi-author support (not in current spec).

## Brand Commitments

Name: **Untold** ("Everyone has an untold story"). No logo asset exists yet — use a lucide-react icon as a placeholder mark until a real logo is designed. Any imagery a surface needs before real photography/illustration exists should use clearly-labeled placeholders, not fabricated "real" photos.

## Evidence on Hand

None yet. Pre-launch: no real stories, testimonials, case studies, press, or user data exist to reference. Do not fabricate sample stories, user quotes, or usage stats as if real — use clearly fictional/placeholder example content (the CLAUDE.md spec's own examples, e.g. "The Summer We Never Forgot," are illustrative only, not real evidence).

## Product Principles

- The user is the author; AI assists and proposes, it never silently takes ownership of the story or the facts within it.
- Imperfect input is welcome — the product must never make rough notes, fragments, or unpolished ideas feel like a mistake.
- Reveal complexity progressively — never front-load a story with a large required form; optional depth appears only as it becomes relevant.
- AI presence is contextual, not omnipresent — assistance shows up where useful (selection, chapter, story level) rather than dominating the interface with a single "generate everything" action.
- For real-life stories, the user's memory is the source of truth; AI enhances storytelling craft, it does not invent facts.

## Accessibility & Inclusion

Target WCAG 2.1 AA across the product, including the long-form reading experience (contrast, keyboard navigation, screen reader support). No additional product-specific accessibility requirement beyond this baseline has been established.
