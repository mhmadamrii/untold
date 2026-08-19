# Image-Generation Prompt Format

When a finding's fix is "the UI needs an image it doesn't have" or "here's the target look," give the developer a prompt they paste into an external generator. You are not generating the image — you are writing the brief.

A prompt is useless if it produces a generic pretty picture that doesn't match the UI. It must be constrained to _this_ interface. Every prompt includes all seven of these:

1. **Subject** — what the image depicts, in one clause.
2. **Style** — flat vector illustration / isometric 3D / line art / duotone / photographic / pixel. Match the UI's existing visual language.
3. **Palette** — the actual hex codes pulled from the computed styles you captured. Not "blue tones" — `#4F46E5, #E0E7FF, #1E1B4B`.
4. **Composition / aspect ratio / dimensions** — `16:9 hero, 1600×900` or `square icon, 512×512` or `--ar 3:2`.
5. **Background** — `transparent PNG` for icons/illustrations that sit on the page, or the exact page background hex if it's a filled image.
6. **Mood / density** — how busy, how much negative space, formal vs playful. Should match the product's tone.
7. **Avoid list** — the failure modes: `no text or lettering, no watermark, no drop shadow, no gradient mesh, not photorealistic, no stock-photo people`.

Then one line: **which generator** and any flag that matters.

## Generator notes

- **Gemini (Nano Banana) / ChatGPT (DALL·E)** — good general illustration and hero images; ask explicitly for a transparent background if you need one; they follow palette hexes reasonably well.
- **Midjourney** — strongest aesthetics; use `--ar W:H` for ratio and `--no <thing>` for the avoid list; weaker at exact hex fidelity, so name the palette and accept drift.
- **Ideogram** — best when the image must contain legible text (badges, labels).
- **Recraft / vector-oriented tools** — best for icons, logos, and anything that should end up as SVG. Prefer these for icon sets over photo models.
- For **icons/logos**, tell the dev to request SVG or a clean transparent PNG at 512px+ and to generate the full set in one prompt so weight/style stay consistent.

---

## Worked examples

**Empty state — dashboard with no data yet** (UI is flat, indigo accent, light surface)

```
Flat vector spot illustration of an empty dashboard: a simple tilted chart panel
and a small magnifying glass, friendly and minimal. Style: modern flat 2D vector,
clean geometric shapes, subtle 2px line accents. Palette strictly: #4F46E5 (accent),
#A5B4FC (secondary), #E0E7FF (fills), #64748B (neutral line). Centered composition
with generous negative space, square 800x800. Transparent background.
Mood: calm, reassuring, low detail. Avoid: any text or lettering, drop shadows,
gradients, photorealism, stock-photo people, watermark.
```

Generator: DALL·E or Gemini — request transparent background explicitly.

**Hero image — SaaS landing, dark theme, teal accent**

```
Abstract isometric 3D illustration suggesting connected data flowing between nodes,
left-weighted so headline text can sit on the right third. Style: soft isometric 3D,
matte surfaces, gentle rim light. Palette: background #0B1120, accent #2DD4BF,
supporting #14B8A6 and #334155. 16:9, 1600x900, filled background #0B1120
(not transparent). Mood: premium, technical, uncluttered. Avoid: text, logos,
faces, busy backgrounds, neon glow, lens flare, watermark.
```

Generator: Midjourney (`--ar 16:9 --no text,people,logo`) or Gemini.

**Icon set — need 5 consistent nav icons** (line style, 1.5px stroke)

```
Set of 5 minimal line icons on one sheet: home, search, inbox, settings, profile.
Style: single-weight 1.5px stroke line icons, rounded joins, 24x24 grid, consistent
optical size. Color: strokes in #334155 only. Transparent background, 512x512 per
icon, evenly spaced. Avoid: fills, color, shadows, text labels, varying stroke widths.
```

Generator: Recraft / Ideogram or an SVG-capable tool; export as SVG.

**Redesign reference — communicating a target look for a cramped settings page**

```
UI reference mockup of a clean settings page: left sidebar nav, right content area
with grouped cards, generous 24px spacing, clear section headers. Style: flat modern
web UI, light theme. Palette: surface #FFFFFF, page #F8FAFC, text #0F172A, accent
#4F46E5, borders #E2E8F0. Desktop 1440x900, filled #F8FAFC background. Mood: spacious,
organized, Stripe-like restraint. Avoid: real logos, lorem-ipsum clutter, drop-shadow
soup, more than one accent color, dark mode.
```

Generator: Gemini or DALL·E — this is a look reference, not a production asset; tell the dev to treat it as direction, not final pixels.
