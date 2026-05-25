# CSS Token System Design Specification

## Concept & Vision

A pixel-perfect design token system where **only colors are themeable** (via 6 accent themes). All other design values—typography, spacing, radius, shadows, transitions—are **fixed design tokens** that define the visual language. This ensures visual consistency across all accent themes while allowing color personalization.

## Design Token Architecture

### Token Categories

| Category | Themeable? | Purpose |
|----------|------------|---------|
| **Colors** | ✅ Yes | Accent themes only (bg, text, border, accent) |
| **Typography** | ❌ No | Font family, size, weight, line-height |
| **Spacing** | ❌ No | Padding, margin, gap values |
| **Radius** | ❌ No | Border radius for cards, buttons, chips |
| **Shadow** | ❌ No | Card elevation (light mode only) |
| **Motion** | ❌ No | Transition/animation durations |
| **Layout** | ❌ No | Grid columns, widths, breakpoints |

## Token Definitions

### Color Tokens (Themeable via `useTheme` hook)

These tokens are set dynamically per accent theme via JavaScript:

```css
/* Page layers */
--bg-page: #FAF7F2;           /* Page background */
--bg-surface: #F1EDE4;          /* Surface/cards background */
--bg-card: #FFFCF7;             /* Card background */
--bg-header: rgba(...);         /* Header backdrop */

/* Text colors */
--text-primary: #332A24;         /* Primary text */
--text-secondary: #7C6C60;      /* Secondary text */
--text-muted: #9A8A7C;         /* Muted/disabled text */

/* Borders */
--border-color: #DCD3C7;        /* Default border */
--border-strong: #DCD3C7;       /* Stronger border */

/* Accent colors */
--accent-primary: #B25C38;       /* Primary accent (buttons, links) */
--accent-primary-rgb: 178, 92, 56;  /* RGB for alpha compositing */
--accent-amber: #8B6914;        /* Warning/duplicate state */
--accent-amber-rgb: 139, 105, 20;
--accent-red: #ff7169;          /* Destructive actions */
--accent-sage: #16aa98;         /* Success/healthy state */

/* Semantic colors */
--bg-duplicate: rgba(...);       /* Duplicate badge background */
--border-duplicate: rgba(...);
```

### Typography Tokens (FIXED)

```css
/* Font families */
--font-display: 'Newsreader', Georgia, serif;
--font-body: 'DM Sans', system-ui, sans-serif;
--font-mono: 'IBM Plex Mono', SFMono-Regular, monospace;

/* Font sizes */
--text-xs: 0.75rem;     /* 12px - muted labels */
--text-sm: 0.8rem;       /* 13px - secondary text */
--text-base: 0.875rem;   /* 14px - body text */
--text-lg: 1rem;         /* 16px - section headers */
--text-xl: 1.125rem;     /* 18px - card titles */
--text-2xl: 1.5rem;      /* 24px - page titles */
--text-3xl: 1.875rem;    /* 30px - hero headings */

/* Font weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;

/* Letter spacing */
--tracking-tight: -0.01em;
--tracking-normal: 0;
--tracking-wide: 0.05em;
--tracking-wider: 0.1em;
--tracking-widest: 0.15em;
```

### Spacing Tokens (FIXED)

```css
/* Core spacing scale (4px base) */
--space-0: 0;
--space-0.5: 0.125rem;   /* 2px */
--space-1: 0.25rem;       /* 4px */
--space-1.5: 0.375rem;    /* 6px */
--space-2: 0.5rem;        /* 8px */
--space-2.5: 0.625rem;    /* 10px */
--space-3: 0.75rem;       /* 12px */
--space-3.5: 0.875rem;    /* 14px */
--space-4: 1rem;          /* 16px */
--space-5: 1.25rem;       /* 20px */
--space-6: 1.5rem;        /* 24px */
--space-8: 2rem;          /* 32px */
--space-10: 2.5rem;       /* 40px */
--space-12: 3rem;         /* 48px */
--space-16: 4rem;         /* 64px */
--space-20: 5rem;         /* 80px */

/* Component-specific spacing */
--gap-card: 16px;           /* Gap between cards */
--gap-section: 32px;       /* Gap between major sections */
--gap-grid: 32px;          /* Dashboard grid gap */

/* Sidebar */
--sidebar-width: 260px;
--sidebar-max-width: 320px;
```

### Radius Tokens (FIXED)

```css
--radius-sm: 2px;           /* Small elements */
--radius-button: 4px;        /* Buttons, inputs */
--radius-chip: 4px;          /* Chip/tab chips */
--radius-card: 6px;          /* Cards */
--radius-lg: 8px;            /* Larger elements */
--radius-xl: 12px;           /* Modals, dialogs */
--radius-full: 9999px;      /* Pills, toggles */
```

### Shadow Tokens (FIXED - light mode only)

```css
--shadow-sm: 0 1px 2px rgba(44, 42, 41, 0.02);
--shadow-card: 0 4px 12px rgba(44, 42, 41, 0.04), 0 1px 3px rgba(44, 42, 41, 0.02);
--shadow-card-hover: 0 10px 24px rgba(44, 42, 41, 0.08), 0 3px 8px rgba(44, 42, 41, 0.04);
--shadow-lg: 0 10px 40px rgba(44, 42, 41, 0.12);
--shadow-toast: 0 4px 20px rgba(44, 42, 41, 0.15);
```

### Motion Tokens (FIXED)

```css
--duration-instant: 50ms;
--duration-fast: 100ms;
--duration-normal: 150ms;
--duration-slow: 200ms;
--duration-slower: 300ms;

--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Layout Tokens (FIXED)

```css
--container-max: 1280px;
--container-padding: 24px;      /* (100vw - 1280px) / 2 = 48px total, 24px each side */
--sidebar-width: 260px;
--sidebar-max-width: 320px;
--header-height: auto;          /* Content-driven */

/* Button sizing */
--button-height-sm: 32px;       /* Small buttons */
--button-height: 36px;          /* Standard buttons */
--button-height-lg: 40px;       /* Large buttons */
--button-icon-sm: 32px;
--button-icon: 36px;
```

## Component Token Usage

### Cards
```css
.app-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
}

.app-card:hover {
  box-shadow: var(--shadow-card-hover);
}
```

### Buttons
```css
.btn {
  height: var(--button-height);
  padding: 0 var(--space-4);
  border-radius: var(--radius-button);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: all var(--duration-normal) var(--ease-default);
}
```

### Form Inputs
```css
.input {
  height: var(--button-height);
  padding: 0 var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-button);
  font-size: var(--text-sm);
}

.input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(var(--accent-primary-rgb), 0.15);
}
```

### Typography Classes

```css
.text-display {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: var(--font-normal);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

.text-heading {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
}

.text-body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
}

.text-mono {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}
```

## Implementation Checklist

- [ ] Consolidate all design tokens in `@theme` block
- [ ] Remove hardcoded values from components
- [ ] Ensure all components reference CSS variables
- [ ] Verify pixel-perfect match with HTML preview
- [ ] All 52 E2E tests pass
