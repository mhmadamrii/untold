# Critique Rubric

The measurable thresholds and heuristics for each lens. Cite these numbers in findings. When you claim something fails, back it with the specific value from this file.

## Table of contents

1. Accessibility (WCAG 2.2 AA baseline)
2. Aesthetics (opinionated visual standards)
3. UX (behavior and flow)
4. Scoring guidance

---

## 1. Accessibility — WCAG 2.2 AA is the floor, not the goal

Measure these. Do not eyeball contrast — pull computed colors and compute the ratio.

**Contrast**

- Normal text (< 18pt / < 24px, or < 14pt bold): **4.5:1** minimum.
- Large text (≥ 18pt / 24px, or ≥ 14pt / 18.66px bold): **3:1** minimum.
- UI components and graphical objects (button borders, form field outlines, icons, focus rings, chart lines): **3:1** against adjacent colors.
- Placeholder text counts as text. Disabled controls are exempt but note if "disabled" is being used to dodge the requirement on something that should be readable.
- AAA (7:1 / 4.5:1) is worth noting as a gap for body text on content-heavy or long-reading interfaces, but don't grade AAA failures as BLOCKER.

**Keyboard**

- Every interactive element must be reachable and operable by keyboard alone. Unreachable control = BLOCKER.
- Focus must be **visible** — a clear ring or state change. `outline: none` with no replacement is a MAJOR at minimum, BLOCKER if it hides where you are entirely.
- Focus order must follow visual/reading order. Illogical jumps = MAJOR.
- No keyboard traps.
- A "skip to content" link on pages with large nav.
- Custom widgets (dropdowns, modals, tabs, accordions) must implement the expected key interactions (Esc closes modal, arrow keys move within a menu, focus returns on close).

**Touch targets (WCAG 2.2)**

- Minimum **24×24 px** (with adequate spacing). Below that = MAJOR.
- Aim for **44×44 px** — the practical usable size on phones. Between 24 and 44 is a MINOR polish note.

**Semantics & ARIA**

- One `<h1>`. Heading levels don't skip (no h1 → h3). Broken hierarchy = MAJOR.
- Landmarks present (`header`, `nav`, `main`, `footer`) — a page that's all `<div>` = MAJOR.
- Every input has a programmatic label (`<label for>`, `aria-label`, or `aria-labelledby`). Placeholder-as-label = MAJOR (vanishes on focus, low contrast).
- Images have `alt`; decorative images have empty `alt=""`. Icon-only buttons have accessible names.
- ARIA is used correctly or not at all — wrong/redundant ARIA is worse than none. `role="button"` on a `<div>` that could've been a `<button>` = MINOR-to-MAJOR.
- Color is never the only signal (error states, required fields, links in body text need a second cue).

**Forms & errors**

- Errors identified in text, tied to the field, not color-only.
- Required fields marked in text/aria, not just a red asterisk.
- Autocomplete attributes on common fields.

**Motion**

- Respect `prefers-reduced-motion`. Auto-playing motion / parallax with no reduced-motion path = MAJOR.
- Nothing flashes more than 3×/sec.

---

## 2. Aesthetics — opinionated, because "looks fine" is not a standard

You are allowed to have taste. Cite the specific violation.

**Typography**

- Body line length **45–75 characters**. Over 90ch = MINOR (hard to track lines); under 40ch on desktop = cramped.
- Line-height for body ≈ **1.4–1.6**. Tight (< 1.3) body text = MINOR.
- A real type scale (e.g. 1.2–1.333 ratio). Random font sizes with no system = MAJOR (reads as unplanned).
- Weight contrast between headings and body. If everything is 400, hierarchy is flat = MINOR/MAJOR.
- **Max two typeface families.** Three or more = MINOR unless intentional and disciplined.
- No text set in all-caps for long strings; letter-spacing on all-caps labels.

**Spacing & rhythm**

- A consistent spacing scale (4px or 8px base). Values like 7px, 13px, 22px sprinkled around = MAJOR — it's the number-one tell of an unsystematic UI.
- Vertical rhythm: related things close, unrelated things far (proximity). Uniform spacing everywhere flattens grouping = MINOR.
- Alignment to a grid. Elements off by a few px, ragged left edges = MINOR but they pile up into "sloppy."
- **Whitespace is a feature.** Cramped, wall-to-wall layouts read cheap. But empty acreage with tiny centered content reads unfinished. Call out both.

**Color**

- Restrained palette: roughly one or two neutrals + one accent + semantic colors. A rainbow of accents = MAJOR (no hierarchy, no focus).
- The accent should mark the primary action and little else. If everything is the brand color, nothing is emphasized.
- Sufficient distinction between surface levels (background, card, elevated) — if cards don't separate from the page, hierarchy collapses.
- Dark mode (if present) must be a real palette, not inverted colors. Pure `#000` background or pure `#FFF` text on dark = harsh; note it.

**Hierarchy & composition**

- One clear focal point per screen. If the eye doesn't know where to land = MAJOR.
- Scannability: can you find the primary action in under a second? If not, hierarchy fails.
- Deliberate use of size, weight, color, and position to rank importance — not accident.

**Polish / detail (this is where "beautiful" is won or lost)**

- Consistent border-radius across components. One card at 4px, another at 12px = MINOR.
- Shadow logic: elevation should be consistent and purposeful, not "shadow soup" where everything floats.
- Icon set consistency — same weight, same style, same grid. Mixed icon styles = MINOR.
- Optical alignment (not just mathematical) — icons next to text centered by eye.
- Designed **empty states, loading states, and error states.** A default spinner and a blank white screen on empty = MAJOR. This is the single most common gap between "functional" and "beautiful."
- Transitions/micro-interactions: present, fast (150–250ms), and purposeful — or absent. Janky or slow (> 400ms) transitions = MINOR.

**Instant tells of an unstyled / template default (flag on sight):**

- Default browser focus/buttons/form fields left unstyled.
- System font stack with no intent, default 16px everywhere.
- Everything center-aligned including long paragraphs.
- Pure black text on pure white, no spacing system, full-width text.
- Bootstrap/default-Tailwind look with no customization — say so plainly.

---

## 3. UX — does it behave well

- **Affordances:** clickable things look clickable; non-clickable things don't. Buttons that look like text, or text that looks like buttons = MAJOR.
- **Feedback:** every action produces a visible response (hover, active, loading, success/error). Silent buttons feel broken.
- **States:** loading, empty, error, success, and disabled are all designed and reachable. Missing = MAJOR (see aesthetics too).
- **Forms:** logical order, inline validation at the right time (on blur/submit, not on every keystroke), clear submit affordance, no unexpected data loss.
- **Navigation:** current location is obvious; back/close always available; no dead ends.
- **Cognitive load:** don't ask for more than needed; sensible defaults; progressive disclosure over walls of options.
- **Destructive actions:** confirmation or undo for delete/irreversible actions. None = MAJOR.
- **Mobile ergonomics:** primary actions reachable by thumb; no hover-only interactions (they don't exist on touch); no tiny tap targets in dense lists.
- **Responsiveness:** content reflows, nothing clipped, no horizontal scroll, images don't overflow. Broken mobile layout = BLOCKER.
- **Performance-perceived:** skeletons/optimistic UI over blank waits; no layout shift as content loads (CLS).

---

## 4. Scoring guidance

Scores are out of 10 per lens. Anchor them so they mean something:

- **9–10:** Would ship at a company known for craft. Passes WCAG AA fully; considered, distinctive visual system; states all handled.
- **7–8:** Solid. Minor polish gaps, maybe one AA miss. Competent, not memorable.
- **5–6:** Functional but clearly unfinished or unsystematic. Multiple MAJORs. Reads as "developer built it, no designer touched it."
- **3–4:** Notable failures. A BLOCKER or several MAJORs. Real users will struggle.
- **1–2:** Broken or inaccessible. Unstyled defaults, WCAG BLOCKERs, or unusable on a common device.

Do not grade on a curve or round up to be nice. A 5 is a 5.
