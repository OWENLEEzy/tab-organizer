# Frontend Design Specification

> This is the source of truth for all UI decisions in Tab Organizer. It is cited by `CLAUDE.md` and `AGENTS.md`.

## Design Philosophy

### Core Principles

**Warm paper, not cold UI.** The visual tone is Notion-inspired: calm, readable, and lightly tactile. We use warm surfaces and text, not cold gray chrome. The dashboard is a tool, not a decoration — it should feel like a well-organized desk, not a SaaS landing page.

**Content-first.** Open tabs are the content. Navigation, controls, effects, and decoration must stay quiet. The user is here to find and manage tabs, not to admire the interface.

**Hierarchy through restraint.** Typography, spacing, and restrained weight create hierarchy — not loud colors or heavy borders. If something looks loud, reconsider it.

**Local-first as product contract.** The extension is local-only by design. Visual design reinforces this through understated, personal aesthetics rather than flashy cloud-connected styling.

### What We Are Not

- Not a marketing page or landing experience
- Not a cold, corporate gray dashboard
- Not a toy or playful children's app
- Not a cloud-sync, account-based product
- Not optimized for first-run impressions — optimized for daily repeated use

---

## Color System

### Base Palette (Static Tokens)

These colors are shared across all themes and represent the warm paper foundation. They never change:

| Token | Hex | Role |
|---|---|---|
| `--color-to-bg-page` | `#FAF7F2` | Page background |
| `--color-to-bg-surface` | `#F1EDE4` | Surface/cards background |
| `--color-to-bg-muted` | `#F1EDE4` | Muted areas |
| `--color-to-bg-stone` | `#e4ded7` | Stone/sidebar tone |
| `--color-to-bg-blue` | `#2563eb` | Blue accent |
| `--color-to-bg-teal` | `#16aa98` | Teal accent |
| `--color-to-bg-coral` | `#ff7169` | Coral accent |
| `--color-to-bg-dark` | `#121212` | Dark base |
| `--color-to-bg-terracotta` | `#ad5d37` | Terracotta accent |
| `--color-to-text-primary` | `#332A24` | Primary text (warm dark brown) |
| `--color-to-text-secondary` | `#7C6C60` | Secondary text |
| `--color-to-text-muted` | `#9A8A7C` | Muted/placeholder text |
| `--color-to-text-inverse` | `#ffffff` | Inverse text |
| `--color-to-border-strong` | `#DCD3C7` | Strong borders |
| `--color-to-border-muted` | `rgba(56, 56, 56, 0.24)` | Muted borders |
| `--color-to-text-primary-dark` | `#ffffff` | Dark theme primary text |
| `--color-to-text-secondary-dark` | `#cccccc` | Dark theme secondary text |
| `--color-to-text-muted-dark` | `#999999` | Dark theme muted text |
| `--color-to-border-dark` | `#444444` | Dark theme borders |
| `--color-to-border-hover` | `#999999` | Hover state borders |
| `--color-to-border-hover-dark` | `#666666` | Dark theme hover borders |

### Typography

| Token | Value | Usage |
|---|---|---|
| `--text-2xs` | `0.6875rem` (11px) | Small labels, badges |
| `--text-3xs` | `0.625rem` (10px) | Micro labels |
| `--font-mono` | `'SFMono-Regular', Consolas...` | Monospace |
| `--font-family-to-display` | `'Newsreader', Georgia, serif` | Headings |
| `--font-family-to-ui` | `'DM Sans', system-ui, sans-serif` | Body/UI text |
| `--font-family-to-reading` | `'DM Sans', system-ui, sans-serif` | Reading text |

Fonts are local `.woff2` files served from `public/`. MV3 CSP (`script-src 'self'`) blocks CDN font loading.

---

## Semantic Accent System

The 6 semantic color roles are **stable across all themes** — they always mean the same thing:

| Role | Semantic Meaning | Usage |
|---|---|---|
| **Blue** | Primary actions, focus, links, hover | Buttons, links, focus rings |
| **Amber** | Duplicate / warning state | Duplicate badges, warning banners |
| **Red** | Destructive close / delete | Close buttons, delete actions, error states |
| **Sage** | Success / healthy state | Success toasts, healthy indicators |
| **Terracotta** | Stale / inactive tabs | Inactive tab indicators |
| **Ink** | Dark theme accent | Dark theme accent surfaces (not a separate toggle) |

### Accent Color Aliases (set dynamically per theme via `useTheme` hook)

| Token | Role |
|---|---|
| `--accent-primary` | Theme accent (clay/sage/frost/ochre/obsidian/pine/amethyst) |
| `--accent-primary-rgb` | RGB triplet of accent for alpha compositing |
| `--accent-amber` | Amber role (duplicate/warning) |
| `--accent-amber-rgb` | RGB triplet for amber |
| `--accent-red` | Red role (destructive) |
| `--accent-red-rgb` | RGB triplet for red |
| `--accent-sage` | Sage role (success) |
| `--accent-sage-rgb` | RGB triplet for sage |
| `--accent-stale` | Terracotta/stale role |
| `--accent-stale-rgb` | RGB triplet for stale (derived from accent-primary-rgb) |
| `--bg-stale` | Background for stale/inactive tabs |
| `--border-stale` | Border for stale/inactive tabs |
| `--bg-stale-icon` | Background for stale tab icon indicators |
| `--bg-duplicate` | Background for duplicate badge/affected rows |
| `--border-duplicate` | Border for duplicate badge/affected rows |

These runtime tokens are the source of truth. Tailwind utility classes must use
the mapped `--color-*` bridge tokens declared in `global.css`, such as
`--color-bg-duplicate: var(--bg-duplicate)` and
`--color-border-duplicate: var(--border-duplicate)`.

---

## Accent Themes

Tab Organizer offers 7 accent themes. Each theme is a complete color environment with its own page, surface, card, text, and accent colors. Themes are selected in Settings and applied at runtime via `useTheme(accent)`, which sets CSS custom properties on `:root`.

**There is no separate light/dark mode toggle.** The 4 light-background themes and 3 dark-background themes are all presented as equal accent choices. The `isDark` flag in a theme config is a technical signal that tells the CSS engine to apply `dark:` variant styles — it is not a separate product concept.

### 1. Clay Paper (暖沙陶土) — `clay`

The default theme. Warm, earthy, approachable. Light background.

| Token | Hex |
|---|---|
| `--bg-page` | `#FAF7F2` |
| `--bg-surface` | `#F1EDE4` |
| `--bg-card` | `#FFFCF7` |
| `--border-color` | `#DCD3C7` |
| `--text-primary` | `#332A24` |
| `--text-secondary` | `#7C6C60` |
| `--text-muted` | `#B5A596` |
| `--accent-primary` | `#B25C38` |
| `--accent-primary-rgb` | `178, 92, 56` |
| `--bg-header` | `rgba(250, 247, 242, 0.95)` |
| `--shadow-card` | `0 4px 12px rgba(51, 42, 36, 0.04), 0 1px 3px rgba(51, 42, 36, 0.02)` |
| `--shadow-card-hover` | `0 10px 24px rgba(51, 42, 36, 0.08), 0 3px 8px rgba(51, 42, 36, 0.04)` |

### 2. Sage Herb (草本鼠尾草) — `sage`

Natural, calm green. Light background.

| Token | Hex |
|---|---|
| `--bg-page` | `#F5F7F4` |
| `--bg-surface` | `#EAEDE7` |
| `--bg-card` | `#FAFCF9` |
| `--border-color` | `#CCD2C6` |
| `--text-primary` | `#262E28` |
| `--text-secondary` | `#5F6D62` |
| `--text-muted` | `#9CAAA0` |
| `--accent-primary` | `#4C725B` |
| `--accent-primary-rgb` | `76, 114, 91` |

### 3. Ice Frost (冰川冷蓝) — `frost`

Cool, clean blue. Light background.

| Token | Hex |
|---|---|
| `--bg-page` | `#F3F6FA` |
| `--bg-surface` | `#E6EDF5` |
| `--bg-card` | `#FAFCFF` |
| `--border-color` | `#CCD7E5` |
| `--text-primary` | `#232B38` |
| `--text-secondary` | `#5B687C` |
| `--text-muted` | `#93A5BE` |
| `--accent-primary` | `#2F65D6` |
| `--accent-primary-rgb` | `47, 101, 214` |

### 4. Chalk Ochre (白垩赭石) — `ochre`

Warm, sunlit yellow-brown. Light background.

| Token | Hex |
|---|---|
| `--bg-page` | `#FAF6EE` |
| `--bg-surface` | `#F1ECD8` |
| `--bg-card` | `#FFFCF5` |
| `--border-color` | `#DCCCAE` |
| `--text-primary` | `#3A301A` |
| `--text-secondary` | `#756441` |
| `--text-muted` | `#AFA184` |
| `--accent-primary` | `#A0781A` |
| `--accent-primary-rgb` | `160, 120, 26` |

### 5. Obsidian Ink (黑曜石墨) — `obsidian`

Rich dark theme. Neutral charcoal with warm gray accents. Dark background (`isDark: true`).

| Token | Hex |
|---|---|
| `--bg-page` | `#121110` |
| `--bg-surface` | `#1b1918` |
| `--bg-card` | `#22201f` |
| `--border-color` | `#3d3734` |
| `--text-primary` | `#e6e1dc` |
| `--text-secondary` | `#b0a8a4` |
| `--text-muted` | `#7d7571` |
| `--accent-primary` | `#A3A19E` |
| `--accent-primary-rgb` | `163, 161, 158` |
| `--shadow-card` | `0 4px 12px rgba(0, 0, 0, 0.4)` |
| `--shadow-card-hover` | `0 10px 24px rgba(0, 0, 0, 0.6)` |

### 6. Deep Pine (暗针长青) — `pine`

Deep forest dark with teal-green accents. Dark background (`isDark: true`).

| Token | Hex |
|---|---|
| `--bg-page` | `#121110` |
| `--bg-surface` | `#1b1918` |
| `--bg-card` | `#22201f` |
| `--border-color` | `#3d3734` |
| `--text-primary` | `#e6e1dc` |
| `--text-secondary` | `#b0a8a4` |
| `--text-muted` | `#7d7571` |
| `--accent-primary` | `#56A3A1` |
| `--accent-primary-rgb` | `86, 163, 161` |

### 7. Amethyst Night (紫曜晚霞) — `amethyst`

Evening purple-dark with lavender accents. Dark background (`isDark: true`).

| Token | Hex |
|---|---|
| `--bg-page` | `#121110` |
| `--bg-surface` | `#1b1918` |
| `--bg-card` | `#22201f` |
| `--border-color` | `#3d3734` |
| `--text-primary` | `#e6e1dc` |
| `--text-secondary` | `#b0a8a4` |
| `--text-muted` | `#7d7571` |
| `--accent-primary` | `#A887CE` |
| `--accent-primary-rgb` | `168, 135, 206` |

---

## Theme Application Mechanics

Themes are defined in `src/config/themes.ts` as `AccentConfig` objects. The `useTheme(accent: AccentKey)` hook in `src/dashboard/hooks/useTheme.ts` applies them at runtime by setting CSS custom properties on `:root`.

```typescript
export type AccentKey = 'clay' | 'sage' | 'frost' | 'ochre' | 'obsidian' | 'pine' | 'amethyst';
```

The `isDark: boolean` flag in each theme config:
1. Toggles the `.dark` CSS class on `:root` (`root.classList.toggle('dark', config.isDark)`)
2. This activates `dark:` CSS variant selectors throughout the stylesheet
3. It does NOT represent a separate "dark mode" product concept — it is an implementation detail of accent themes

**Components that use `dark:` variants:**
- Settings panel (line 248 onward): `dark:border-border-dark/40`, `dark:bg-card-dark`, etc.
- Keyboard shortcuts section: `dark:bg-surface-dark/40`, `dark:text-text-primary-dark`
- Custom groups section: `dark:bg-surface-dark`, etc.

Never hardcode theme colors in components. Always use CSS custom properties. When adding new dark-theme-aware elements, use `dark:` Tailwind variants scoped to the appropriate selector.

---

## Mapped Semantic Tokens (Tailwind v4)

These tokens bridge raw theme values and the Tailwind utility layer:

### Light Theme Tokens

```css
--color-bg-page: var(--bg-page);
--color-bg-surface: var(--bg-surface);
--color-bg-card: var(--bg-card);
--color-border-color: var(--border-color);
--color-text-primary: var(--text-primary);
--color-text-secondary: var(--text-secondary);
--color-text-muted: var(--text-muted);
--color-accent-primary: var(--accent-primary);
--color-accent-amber: var(--accent-amber);
--color-accent-red: var(--accent-red);
--color-accent-sage: var(--accent-sage);
--color-accent-terracotta: var(--color-to-bg-terracotta);
--color-bg-light: var(--bg-page);
--color-card-light: var(--bg-card);
--color-surface-light: var(--bg-surface);
--color-text-primary-light: var(--text-primary);
--color-border-light: var(--border-color);
--color-accent-blue: var(--accent-primary);
```

### Dark Theme Tokens (static — for use with Tailwind `dark:` variants)

```css
--color-surface-dark: #1e1e1e;
--color-border-dark: var(--color-to-border-dark);
--color-text-primary-dark: var(--color-to-text-primary-dark);
--color-text-secondary-dark: var(--color-to-text-secondary-dark);
--color-text-muted-dark: var(--color-to-text-muted-dark);
--color-bg-dark: var(--color-to-bg-dark);
--color-card-dark: #2a2a2a;
```

### Stale State Tokens (derived at runtime)

Stale state uses the active theme's `accentPrimary` with computed alpha values:

```css
--accent-stale: var(--accent-primary);        /* Terracotta/stale role */
--accent-stale-rgb: var(--accent-primary-rgb);
--bg-stale: rgba(var(--accent-primary-rgb), 0.05);
--border-stale: rgba(var(--accent-primary-rgb), 0.2);
--bg-stale-icon: rgba(var(--accent-primary-rgb), 0.1);
```

### Semantic Alias Tokens

```css
--color-toast-bg-light: var(--color-to-text-primary);
--color-toast-bg-dark: var(--color-to-bg-surface);
--font-family-heading: var(--font-family-to-display);
--font-family-body: var(--font-family-to-ui);
--font-family-mono: var(--font-mono);
--radius-card: var(--radius-to-card);
--radius-chip: var(--radius-to-button);
```

---

## Layout System

### Dashboard Grid

```css
.dashboard-grid-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: min(1280px, calc(100vw - 48px));
  margin: 0 auto;
}

.dashboard-grid-layout.has-sidebar {
  grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
  gap: 32px;
}
```

### Card Grid (Missions)

```css
.missions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 40px;
  align-items: start;
}
```

### Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| `< 640px` | Single column, reduced padding |
| `< 800px` | Sidebar stacks below main column |
| `< 1080px` | Utilities grid collapses to single column |

---

## Component Patterns

### Card with Corner Accents

Cards (`app-card`) have subtle corner border accents that appear on hover:

```css
.app-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.app-card::before, .app-card::after {
  /* 6px corner accents using border-style */
  /* top-left and bottom-right only, accent-primary color */
  opacity: 0;
  transition: opacity 200ms ease;
}

.app-card:hover::before,
.app-card:hover::after {
  opacity: 0.8;
}
```

### Focus Ring

Global focus ring uses accent-primary with alpha:

```css
:focus-visible {
  outline: 2px solid var(--color-accent-blue);
  outline-offset: 2px;
}
```

### Toggle Switch

Uses CSS custom properties for dimensions:

```css
--spacing-toggle-width: 36px;
--spacing-toggle-height: 20px;
--spacing-toggle-dot-size: 16px;
--spacing-toggle-translate-x: 16px;
```

### Segmented Control

Two-item toggle for Cards/Table view switching.

### Search Input

WebKit native cancel button is hidden:

```css
input[type="search"]::-webkit-search-cancel-button {
  -webkit-appearance: none;
}
```

---

## Spacing Scale

| Token | Value | Usage |
|---|---|---|
| `--space-1.5` | `0.375rem` (6px) | Tight gaps |
| `--space-2.5` | `0.625rem` (10px) | Default gaps |
| `--spacing-button-height` | `2.25rem` (36px) | Standard button |
| `--spacing-button-height-sm` | `2rem` (32px) | Small button |
| `--spacing-input-height` | `32px` | Input height |
| `--spacing-button-icon` | `var(--spacing-button-height)` | Icon button container |
| `--spacing-button-icon-sm` | `2rem` | Small icon button |

When using these tokens in Tailwind arbitrary utilities, wrap them in `var(...)`:
`min-h-[var(--spacing-button-height)]`. Do not omit the `var(...)` wrapper.

---

## Icon Sizes

| Token | Value | Usage |
|---|---|---|
| `--icon-size-xs` | `0.75rem` (12px) | Inline icons |
| `--icon-size-sm` | `1.125rem` (18px) | Small icons |
| `--icon-size-md` | `1.25rem` (20px) | Medium icons |
| `--icon-size-lg` | `1.5rem` (24px) | Large icons |

---

## Radius Scale

| Token | Value | Usage |
|---|---|---|
| `--radius-to-card` | `6px` | Cards, panels |
| `--radius-to-button` | `4px` | Buttons, chips, inputs |
| `--radius-badge` | `3px` | Badges, small chips |

---

## Shadows

Light themes use warm `rgba(51, 42, 36, ...)` shadows. Dark themes use `rgba(0, 0, 0, 0.4)` and `rgba(0, 0, 0, 0.6)` because dark surfaces don't show subtle warm shadows effectively. Each theme defines its own `shadowCard` and `shadowCardHover` values.

---

## Animations

| Animation | Duration | Easing | Purpose |
|---|---|---|---|
| `fadeUp` | `0.4s` | `ease-out` | Panel entrance |
| `checkPop` | `0.3s` | Spring-ish | Checkmark on duplicate close |
| `countPop` | `0.4s` | Custom | Tab count change |
| `chipExit` | `0.25s` | `cubic-bezier(0.4, 0, 1, 1)` | Tab close animation |

All animations are disabled when `prefers-reduced-motion: reduce` is set.

---

## Noise Texture Overlay

A subtle SVG noise texture gives the UI a tactile, paper-like feel. It appears at low opacity on light backgrounds:

```css
.noise-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.02;
  background-image: url("data:image/svg+xml,...");
}
```

On dark backgrounds the texture is reduced:

```css
.dark .noise-overlay {
  opacity: 0.015;
}
```

---

## Active Tab Indicator

Left border accent for the currently active tab:

```css
.tab-active {
  border-left: 3px solid var(--accent-primary) !important;
  background-color: rgba(var(--accent-primary-rgb), 0.08) !important;
}
```

---

## CSS Custom Properties Architecture

All design tokens are defined as CSS custom properties in `src/dashboard/styles/global.css` under `@theme`. Theme-aware tokens (that change per accent) are set at runtime by `useTheme` on `:root`.

**Static tokens** (base palette, typography, spacing, radius) never change and are shared across all themes.

**Dynamic tokens** (accent colors, backgrounds, shadows) are overwritten per theme selection.

The Tailwind v4 `@theme` block maps semantic names to these custom properties, enabling utility classes like `bg-[var(--bg-page)]` and `text-[var(--text-primary)]` to resolve to the correct value for the active theme automatically.

**`isDark` flag behavior:**
- When `isDark: false` (clay, sage, frost, ochre): `.dark` class is NOT added to `:root`, so `dark:` CSS variants are inactive
- When `isDark: true` (obsidian, pine, amethyst): `.dark` class IS added to `:root`, activating `dark:` variant styles in components
