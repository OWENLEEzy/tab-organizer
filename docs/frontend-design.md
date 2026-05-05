# Tab Out Frontend Design Reference

> Canonical source of truth for the visual language. Any UI change must stay
> consistent with the rules below. When in doubt, defer to the tokens defined
> in `src/newtab/styles/global.css`.

---

## 1. Visual Goals and Tone

Tab Out uses a Notion-inspired warm-paper aesthetic. The palette avoids pure
grays in favor of warm undertones (hex values trend toward `F`, not `0`). The
goal is a calm, readable surface that feels like a well-typeset notebook --
inviting focus without demanding attention.

Key principles:

- **Warm over cold.** Background whites carry a faint yellow/warm cast
  (`#FFFDF9`, `#F7F6F3`). Borders and text use warm grays (`#37352F`,
  `#E8E7E4`).
- **Quiet hierarchy.** Headings use a serif face; body uses a geometric sans.
  Size and weight create structure -- not bright colors or heavy borders.
- **Content-first.** The paper texture overlay and restrained shadows keep
  chrome minimal so the user's tabs remain the focal point.
- **Dark mode as peer, not afterthought.** Every token has an explicit dark
  variant. Dark surfaces are truly dark (`#191919`, `#252525`), not a
  lightened approximation.

---

## 2. Typography

### Font families

| Role     | Token                        | Value                                 | Weights loaded            |
|----------|------------------------------|---------------------------------------|---------------------------|
| Heading  | `--font-family-heading`      | `'Newsreader', 'Georgia', serif`      | 400, 400 italic, 500      |
| Body     | `--font-family-body`         | `'DM Sans', system-ui, sans-serif`    | 400, 500, 600             |

### CSP compliance

All fonts are bundled as local `.woff2` files in `public/fonts/`. The manifest
enforces `script-src 'self'` which blocks CDN font loads. Never reference an
external font URL.

Loaded files:

- `newsreader-regular.woff2`
- `newsreader-italic.woff2`
- `newsreader-medium.woff2`
- `dm-sans-regular.woff2`
- `dm-sans-medium.woff2`
- `dm-sans-semibold.woff2`

### Usage rules

- **Page heading** (`h1`): `font-heading text-3xl font-light` -- Newsreader
  light at 30px. Used once for the greeting in `Header`.
- **Section heading** (`h2`): `font-heading text-base font-semibold` --
  Newsreader semibold at 16px.
- **Card heading** (`h3`): `font-heading text-base font-semibold` -- same as
  section heading.
- **Dialog heading** (`h3`): `font-heading text-lg font-semibold` -- Newsreader
  semibold at 18px.
- **Body text**: `font-body text-sm` (14px) is the default. Secondary text
  uses `text-text-secondary`.
- **Badge / chip text**: `font-body text-xs` (12px) for counts, labels,
  timestamps.
- **Keyboard hints**: `font-body text-[11px]` for `<kbd>` elements.

Font smoothing is applied globally:

```css
body {
  font-family: var(--font-family-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## 3. Color and Status Semantics

### Surface tokens

| Token                      | Light      | Dark      | Purpose                        |
|----------------------------|------------|-----------|--------------------------------|
| `--color-bg-light/dark`    | `#FFFFFF`  | `#191919` | Page background, dialog bg     |
| `--color-surface-light/dark` | `#F7F6F3` | `#252525` | Elevated surface, chip bg      |
| `--color-card-light/dark`  | `#FFFDF9`  | `#2A2A2A` | Domain card background         |
| `--color-border-light/dark` | `#E8E7E4` | `#373737` | Borders, dividers, input edges |
| `--color-toast-bg-light/dark` | `#37352F` | `#E8E7E4` | Toast background (inverted)   |

### Text tokens

| Token                            | Value     | Purpose                            |
|----------------------------------|-----------|------------------------------------|
| `--color-text-primary-light/dark` | `#37352F` / `#E8E7E4` | Primary body text       |
| `--color-text-secondary`         | `#6B6966` | Secondary labels, timestamps, hints |

Note: `text-secondary` does not have a dark variant token. In dark mode the
same `#6B6966` value is used against dark surfaces -- verify contrast is
sufficient when introducing new secondary text placements.

### Accent tokens

| Token                | Value     | Semantics                                      |
|----------------------|-----------|-------------------------------------------------|
| `--color-accent-blue` | `#2383E2` | Primary actions, focus rings, links, hover states |
| `--color-accent-amber` | `#DFAB01` | Warnings, duplicate badges, duplicate status bar |
| `--color-accent-red`  | `#EB5757` | Destructive actions (close, delete), danger hover |
| `--color-accent-sage` | `#4DAB9A` | Success, healthy state, status bar on clean cards |

### Status bar (card top accent)

Each domain card has a 3px colored bar at the top:

- **Sage** (`accent-sage`): No duplicates detected. Card is healthy.
- **Amber** (`accent-amber`): Duplicates detected. Attention needed.

### Accent color usage patterns

- Accent colors are used at **reduced opacity for backgrounds**:
  `bg-accent-red/10`, `bg-accent-amber/10`, `bg-accent-blue/10`.
- Full-opacity accent fills are reserved for:
  - Destructive confirm buttons (`bg-accent-red` with white text).
  - Focus rings (`ring-accent-blue/40` or `ring-accent-red/50`).
  - Toast checkmark icon (`text-accent-sage`).

### Dark mode

Dark mode toggles via the `.dark` class on `<html>`. The Tailwind v4 custom
variant is defined as:

```css
@variant dark (&:where(.dark, .dark *));
```

Initialization logic in `App.tsx` reads the `theme` setting from
`settings-store`. Three modes:

1. `light` -- remove `.dark` class.
2. `dark` -- add `.dark` class.
3. `system` -- toggle based on `prefers-color-scheme` media query, with a
   live listener for OS-level changes.

All color references use the `dark:` Tailwind prefix (e.g.,
`text-text-primary-light dark:text-text-primary-dark`).

---

## 4. Spacing, Radius, and Surface Rules

### Border radius

| Token            | Value  | Usage                                    |
|------------------|--------|------------------------------------------|
| `--radius-card`  | `6px`  | Domain cards, dialogs, settings panel    |
| `--radius-chip`  | `4px`  | Tab chips, badges, buttons, inputs, kbd  |

Favicons on domain cards use an inline radius of `3px`
(`rounded-[3px]`), softer than a chip.

### Shadow system

| Token                 | Value                                    | Usage                        |
|-----------------------|------------------------------------------|------------------------------|
| `--shadow-card`       | `0 1px 3px rgba(0,0,0,0.08)`            | Domain cards at rest         |
| `--shadow-card-hover` | `0 4px 20px rgba(26,22,19,0.06)`         | Domain card hover            |

Cards lift on hover with a combined shadow + translate:
`hover:shadow-card-hover hover:-translate-y-0.5` (2px upward shift).

The settings gear button also uses `shadow-card` at rest and
`shadow-card-hover` on hover.

### Paper texture overlay

A full-viewport SVG noise filter is rendered behind all content at 3% opacity:

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,...feTurbulence...");
  pointer-events: none;
  z-index: 0;
}
```

This overlay is always present in both light and dark mode. The app container
uses `position: relative; z-index: 1` to sit above it. Never remove or change
the opacity without visual review -- it is part of the warm-paper identity.

### Spacing conventions

- Container padding: `48px 32px 80px` (top, horizontal, bottom).
- Section header margin: `8px` top, `20px` bottom, `12px` gap between items.
- Card internal padding: `p-4` (16px).
- Card footer separator: `border-t` with `pt-3 mt-3`.
- Gap between cards in masonry: `12px` column gap, `12px` row gap
  (`margin-bottom` on children).
- Chip vertical spacing: `gap-0.5` (2px) between tab chips.

---

## 5. Interaction and Motion

### Animations

Two named keyframe animations are defined:

**fadeUp** -- used for dialog entrance and card appearances:

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Applied via `animate-[fadeUp_0.3s_ease_both]` on the confirmation dialog.

**checkPop** -- used for checkbox/state transitions:

```css
@keyframes checkPop {
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
```

### Transition patterns

- Card hover: `transition-all duration-200` for shadow + lift.
- Chip hover: `transition-colors duration-150` for background color shift.
- Button hover: `transition-colors duration-150` (standard) or
  `transition-all duration-200` (destructive with opacity).
- Toast: `transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]` for
  slide-up entrance and fade-out exit.
- Domain card expand/collapse: instant (no animation on the overflow chip
  list; items appear/disappear immediately).

### Hover state patterns

| Element         | Hover behavior                                          |
|-----------------|---------------------------------------------------------|
| Domain card     | Shadow elevation + 2px upward lift                     |
| Tab chip        | Surface-colored background fill                         |
| Action button   | Background tint + text color shift to accent           |
| Close button    | `text-accent-red` with `bg-accent-red/10`              |
| Destructive btn | `opacity-85` on filled red button                      |
| Dismiss button  | `opacity-0` -> `opacity-100` on parent group hover     |
| Search input    | `border-accent-sage` + `ring-accent-blue/30`           |

### Reduced motion

All animations and transitions are suppressed when the user has
`prefers-reduced-motion: reduce` enabled:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This is a global override. Individual components do not need to handle this
case themselves.

### Drag and drop

Cards use `cursor-grab` at rest and `cursor-grabbing` while actively dragged,
defined as utility classes in `global.css`.

---

## 6. Accessibility

### Focus management

A global focus ring is applied to all `:focus-visible` elements:

```css
:focus-visible {
  outline: 2px solid var(--color-accent-blue);
  outline-offset: 2px;
}

:focus:not(:focus-visible) {
  outline: none;
}
```

Mouse users never see an outline. Keyboard users get a consistent blue ring.

Component-level focus rings (e.g., `focus-visible:ring-2 focus-visible:ring-accent-blue/40`)
supplement the global outline for interactive elements like buttons and inputs.

### Skip-to-content link

A skip link is the first focusable element in `App.tsx`:

```html
<a href="#main-content"
   class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4
          focus:z-[60] focus:rounded-chip focus:bg-accent-blue focus:px-4
          focus:py-2 focus:text-sm focus:text-white focus:outline-none">
  Skip to main content
</a>
```

The target is `<div id="main-content">` wrapping the open-tabs section.

### Dialog accessibility

`ConfirmationDialog` implements:

- `aria-modal="true"` and `role="dialog"` on the backdrop.
- `aria-label` with the dialog title.
- Focus trap: Tab and Shift+Tab cycle within the dialog.
- Escape key closes the dialog.
- Focus returns to the previously focused element on close.

### ARIA patterns

- Toast uses `role="status"` and `aria-live="polite"`.
- Expand/collapse buttons use `aria-expanded`.
- Tab chips use `role="button"` and `tabIndex={0}` with keyboard Enter/Space
  handlers.
- Icon-only buttons use `aria-label`.
- Decorative SVGs use `aria-hidden="true"`.

### Semantic color

Color is never the sole indicator of state. Duplicate status uses both an
amber color and explicit text labels ("2 duplicates"). The status bar on
cards is a supplementary visual cue, not the primary indicator.

---

## 7. Examples: Preserve vs. Avoid

### Preserve

- **Warm card surface.** `bg-card-light dark:bg-card-dark` uses `#FFFDF9`
  (warm white), not pure `#FFFFFF`. This warmth is intentional.
- **Status bar accent.** The 3px top bar on domain cards communicates state
  at a glance. Keep it.
- **Hover opacity reveal.** Action buttons on tab chips are hidden at
  `opacity-40` and reveal at `opacity-100` on hover. This keeps the default
  view clean.
- **Section dividers.** Horizontal rules use `border-border-light dark:border-border-dark`
  with `mx-3 h-px flex-1` for a subtle, flexible-width separator.
- **kbd styling.** Keyboard hints use a bordered chip:
  `border border-border-light bg-surface-light rounded-chip text-[11px]`.
- **Toast inverted palette.** Light mode uses dark toast (`#37352F`); dark
  mode uses light toast (`#E8E7E4`). The inversion creates visual contrast.
- **Favicon error handling.** Broken favicon images are hidden via
  `onError` handler setting `display: none` rather than showing a broken
  image icon.

### Avoid

- **Pure gray borders or backgrounds.** Never use `#000`, `#ccc`, or
  `#eee`. Use the warm-tinted tokens (`border-light`, `surface-light`).
- **External font loads.** Never add a `@import url(...)` or `<link>` for
  fonts. MV3 CSP blocks them. Add new weights as local `.woff2` files in
  `public/fonts/` and register them in `fonts.css`.
- **Inline styles for dynamic colors.** Use Tailwind `dark:` variants and
  CSS tokens. Avoid `style={{ color: ... }}` for theme-aware colors.
- **Large border-radius.** Never use `rounded-lg` (8px) or higher. Cards
  are `6px`, chips are `4px`. The design language is understated, not bubbly.
- **Box shadows beyond the defined tokens.** Only `shadow-card` and
  `shadow-card-hover` exist. Do not introduce ad-hoc shadows.
- **Heavy font weights.** Body text caps at `font-semibold` (600). Never
  use `font-bold` (700) or `font-extrabold` (800). Headings use `font-light`
  (300) or `font-semibold` (500).
- **Decorative animations on routine interactions.** Reserve `fadeUp` and
  `checkPop` for meaningful state changes (dialog open, checkbox toggle).
  Do not add entrance animations to every element.
- **Primary color for non-primary actions.** `accent-blue` is reserved for
  focus, links, and primary interactive states. Close/delete actions must
  use `accent-red`. Warning/duplicate states must use `accent-amber`.

---

## 8. Layout Rules

### Container

The app renders inside `.tab-out-container`:

```css
.tab-out-container {
  position: relative;
  z-index: 1;
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 32px 80px;
}
```

### Dashboard workspace

When utility panels such as recovery are visible, the dashboard workspace uses a primary content column plus a utility column:

```css
.dashboard-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
  gap: 24px;
  align-items: start;
}
```

The main product sections live in the primary column:

```css
.dashboard-primary {
  flex: 1;
  min-width: 0;
}
```

Utility panels are secondary and collapse under the main content on smaller screens.

### Masonry card grid

Domain cards render in a CSS columns masonry layout:

```css
.missions {
  columns: 300px;
  column-gap: 12px;
}
.missions > * {
  break-inside: avoid;
  margin-bottom: 12px;
}
```

Cards flow into as many columns as the container width allows (minimum 300px
per column). Within a single column, cards stack vertically.

### Responsive stacking

At 800px and below, the two-column dashboard collapses to a single column:

```css
@media (max-width: 800px) {
  .dashboard-columns {
    flex-direction: column;
  }
}
```

The masonry grid naturally reduces columns as the viewport narrows since
`columns: 300px` is a minimum-width hint.

### Fixed elements

- **Settings gear**: `fixed bottom-5 right-5` with `z-40`.
- **Toast**: `fixed bottom-8 left-1/2` with `translate-x-[-50%]` centering
  and `z-50`.
- **Confirmation dialog**: `fixed inset-0` backdrop with `z-50`.

### Z-index layers

| Layer              | Z-index | Content                     |
|--------------------|---------|-----------------------------|
| Paper texture      | 0       | `body::before` overlay      |
| App container      | 1       | `.tab-out-container`        |
| Settings gear      | 40      | Fixed FAB button            |
| Toast              | 50      | Status notifications        |
| Confirmation dialog| 50      | Modal backdrop + panel      |
| Skip link          | 60      | Accessibility skip-to link  |

---

## Quick Reference: Token Map

```
Backgrounds:   bg-light  bg-dark  surface-light  surface-dark  card-light  card-dark
Borders:       border-light  border-dark
Text:          text-primary-light  text-primary-dark  text-secondary
Accents:       accent-blue  accent-amber  accent-red  accent-sage
Typography:    font-heading (Newsreader)  font-body (DM Sans)
Radius:        rounded-card (6px)  rounded-chip (4px)
Shadows:       shadow-card  shadow-card-hover
```

Source file: `src/newtab/styles/global.css`
Font declarations: `src/newtab/styles/fonts.css`
Font files: `public/fonts/*.woff2`
Theme toggle logic: `src/newtab/App.tsx` (first `useEffect`)
