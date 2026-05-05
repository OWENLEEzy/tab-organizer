# Tab Out MotherDuck-Inspired Dashboard Reskin Design

## Summary

Tab Out will migrate from its current Notion-inspired warm notebook interface to a MotherDuck-inspired warm flat dashboard. This is a full visual reskin and first-screen recomposition, but it is not a MotherDuck clone. Tab Out keeps its own product identity, local-only Chrome extension behavior, and existing tab-management flows.

The selected direction is **Warm Flat Canvas** with **Status + Toolbar + Product Grid** dashboard composition.

## Goals

1. Replace the current soft paper/card visual system with a warm, flat, mono-first interface.
2. Recompose the dashboard around a clear global status strip, command header, toolbar, product grid, and utility panels.
3. Preserve all existing behavior: product grouping, sections, cards/table views, organize mode, saved tabs, recovery snapshots, duplicate handling, search, settings, and batch selection.
4. Use CSS tokens as the control layer for the new style.
5. Avoid oversized files and duplicate components by introducing small layout and UI primitives.

## Non-Goals

1. Do not copy MotherDuck's logo, brand assets, trademarked copy, or page content.
2. Do not introduce a new UI library.
3. Do not change tab grouping, storage schema, Chrome API behavior, saved-tab logic, or recovery-snapshot logic unless a style migration exposes a narrow compatibility need.
4. Do not replace real tab titles with uppercase styling. Tab titles must remain readable and faithful to the source page.
5. Do not turn the extension into a marketing landing page.

## Current Code Context

Tab Out is a Manifest V3 Chrome extension built with React, TypeScript, Vite, Tailwind v4, Zustand, and `chrome.storage.local`.

The current dashboard structure is:

1. `App.tsx` owns store access, derived state, handlers, loading/error composition, and top-level page assembly.
2. `Header` renders greeting, date, and summary pills.
3. `DupeBanner` and `NudgeBanner` render global warnings.
4. `SearchBar` sits above the dashboard.
5. `dashboard-columns` contains the main active section plus saved/recovery side panels.
6. `SectionBoard`, `DomainCard`, `ProductTable`, and `DndOrganizer` render the main tab work surface.
7. `DeferredColumn` and `RecoveryPanel` render saved-for-later and recent-session recovery.

This migration should keep those behavioral components and introduce new presentation boundaries around them.

## Visual Direction

The target visual language is MotherDuck-inspired, not MotherDuck-identical:

1. Warm canvas background.
2. Mono-first headings, labels, buttons, and metrics.
3. Flat white or colored surfaces.
4. Strong dark outlines.
5. Little to no shadow.
6. Tight 0px to 2px radii for cards and buttons.
7. Bright color blocks used with purpose, not as ambient decoration.

Primary style references:

1. Warm flat canvas.
2. Yellow status strip.
3. Sky-blue primary actions.
4. White hard-outlined utility cards.
5. Teal success/healthy state.
6. Coral/red destructive state.

## CSS Token System

The migration must add Tab Out-owned tokens instead of scattering raw MotherDuck values through components.

The preferred token layer lives in `src/newtab/styles/global.css` and maps into Tailwind v4 `@theme` variables where useful.

Core tokens:

```css
--to-bg-page
--to-bg-surface
--to-bg-muted
--to-bg-stone
--to-bg-yellow
--to-bg-blue
--to-bg-teal
--to-bg-coral
--to-text-primary
--to-text-secondary
--to-text-muted
--to-text-inverse
--to-border-strong
--to-border-muted
--to-radius-card
--to-radius-button
--to-border-width
--to-border-width-strong
--to-shadow-none
--to-font-display
--to-font-ui
--to-font-reading
```

Tailwind-facing semantic tokens should consume these values. Component code should prefer semantic classes over raw hex values.

The token system must support light and dark theme settings. The first implementation can keep dark mode as a readable token-mapped peer of the warm flat style. It must not switch into the rejected Dark Compute direction.

## Typography

UI and display typography should use a mono-first stack:

```css
"IBM Plex Mono", "SFMono-Regular", ui-monospace, monospace
```

If licensed Aeonik Mono assets exist later, they can become the first family in the stack. The implementation must not load remote fonts from Google or any external host because the extension must remain local and CSP-safe.

Longer helper text can use the existing bundled sans stack if needed, but high-visibility UI should use the mono stack.

Use uppercase for:

1. Status strip text.
2. Main dashboard headline.
3. Toolbar buttons.
4. Panel headings.
5. Metric labels.

Do not uppercase:

1. Tab titles.
2. User-created section names.
3. URLs or page-derived labels where case affects readability.

## Dashboard Composition

The dashboard should be recomposed into this structure:

1. **StatusStrip**
   - Top warm-yellow strip.
   - Shows global metrics such as tab count, duplicate count, and product count.
   - Can include global alerts such as extra Tab Out tabs or tab-count nudges.
   - Replaces the feeling of scattered banners.

2. **CommandHeader**
   - Strong mono headline, for example `OPEN TABS BY PRODUCT` or `CLEAR YOUR BROWSER DESK`.
   - Shows date or compact context.
   - Holds small global metrics or settings affordance if that is cleaner than the current floating gear.
   - Must feel like an app command surface, not a marketing hero.

3. **DashboardToolbar**
   - Contains search, cards/table toggle, organize mode, new section, and close all.
   - Replaces the current section-header button cluster.
   - Search should stay prominent and keyboard-accessible.
   - Buttons use hard outlines, 2px radius, and mono uppercase labels.

4. **Product Work Surface**
   - Continues to use `SectionBoard`, `DomainCard`, `ProductTable`, and `DndOrganizer`.
   - Cards become white hard-outlined units with flat state blocks.
   - Table view receives the same flat border system.
   - Organize mode keeps drag-and-drop behavior and accessible controls.

5. **Utility Panels**
   - `DeferredColumn` and `RecoveryPanel` become hard-outlined utility panels.
   - On desktop they can sit to the right of the product work surface.
   - On narrow screens they move below the main work surface.

## Component Boundaries

New layout components should stay small and presentation-focused:

1. `DashboardShell`
   - Owns page container, warm canvas, width, and responsive grid.

2. `StatusStrip`
   - Receives derived metrics and alert descriptors from `App.tsx`.
   - Does not read stores.

3. `CommandHeader`
   - Receives title, date/context, metrics, and settings/open callbacks.
   - Does not own business behavior.

4. `DashboardToolbar`
   - Receives search value, search handler, result counts, view mode, organize state, section action, and close-all action.
   - Composes existing `SearchBar` and `ViewToggle` when possible.

5. `UtilityPanel`
   - Provides shared hard-outlined panel chrome for saved/recovery content.

6. `MetricPill` and `ActionButton`
   - Small reusable controls for hard-bordered labels and actions.
   - Should replace repeated ad hoc button class strings where it reduces duplication.

Existing behavioral components stay in place:

1. `SectionBoard`
2. `DomainCard`
3. `ProductTable`
4. `DndOrganizer`
5. `DeferredColumn`
6. `RecoveryPanel`
7. `SearchBar`
8. `ViewToggle`
9. `SelectionBar`

`App.tsx` should remain the orchestration layer. It should not absorb large new markup blocks.

## File Organization

Preferred structure:

```text
src/newtab/components/layout/
  DashboardShell.tsx
  StatusStrip.tsx
  CommandHeader.tsx
  DashboardToolbar.tsx
  UtilityPanel.tsx

src/newtab/components/ui/
  ActionButton.tsx
  MetricPill.tsx
```

CSS should remain token-first:

1. Global tokens and base rules in `src/newtab/styles/global.css`.
2. Component-specific classes only when Tailwind composition becomes unreadable.
3. No large unrelated CSS block for one screen.
4. No hardcoded hex values inside JSX class strings or inline styles.

## Data Flow

Data flow stays one-way:

1. `App.tsx` reads `tab-store`, `saved-store`, and `settings-store`.
2. `App.tsx` computes metrics: total tabs, duplicates, products, filtered count, Tab Out duplicate pages, saved count, and recovery availability.
3. Layout components receive metrics and handlers as props.
4. Existing action handlers remain in `App.tsx` or existing stores.
5. Child components do not access `chrome.storage.local` directly.
6. Store and storage boundaries from `docs/architecture.md` remain valid.

## Responsive Behavior

Desktop:

1. Status strip spans the top.
2. Command header and toolbar sit above the work surface.
3. Main grid has a primary content area and utility panels.

Medium width:

1. Toolbar wraps cleanly.
2. Search remains the widest control.
3. Utility panels can narrow but must not crush the product cards.

Narrow width:

1. Product cards become single column.
2. Utility panels move below the product work surface.
3. Toolbar becomes two rows if needed.
4. Buttons must keep stable touch targets.
5. Text must not overflow or overlap.

## State and Error Handling

Existing error and state behavior remains:

1. `ErrorBoundary` stays at the top level.
2. `LoadingState` migrates visually but keeps behavior.
3. `EmptyState` migrates visually but keeps behavior.
4. Favicon failures still fall back to initials.
5. Search with no matches still uses current filtering behavior.
6. Recovery snapshot expansion and lazy-loaded details remain intact.
7. Section create, rename, delete, and drag behavior remain intact.
8. Selection mode keeps `SelectionBar` behavior and keyboard handling.

## Accessibility

The migration must keep or improve current accessibility:

1. Preserve skip-to-content behavior.
2. Keep visible focus rings with strong contrast.
3. Keep touch targets at least 44px where current tests expect them.
4. Preserve button semantics for icon and text actions.
5. Do not make cards clickable unless they have clear button/link semantics.
6. Maintain contrast for yellow, blue, teal, coral, and dark outlines in light and dark modes.
7. Ensure toolbar wrapping does not change tab order in a confusing way.

## Testing and Verification

Implementation should pass:

```bash
npm run lint
npm run lint:css
npm run test
npm run build
npm run check
```

Visual verification should cover:

1. Desktop wide viewport.
2. Medium viewport.
3. Mobile viewport.
4. Light mode.
5. Dark mode.
6. Cards view.
7. Table view.
8. Organize mode.
9. Search active.
10. Duplicates present.
11. Saved-for-later present.
12. Recovery snapshots present.
13. Empty state.
14. Loading state.

## Open Decisions

1. Final headline copy should be chosen during implementation review. The default recommendation is `OPEN TABS BY PRODUCT` because it is direct and not overly heroic.
2. Settings entry can remain a fixed gear for the first pass or move into `CommandHeader` if the layout reads cleaner.
3. The first implementation should use available local fonts. Licensed Aeonik Mono support can be a later enhancement.

## Self-Review

This spec has no incomplete requirement markers, no unfinished sections, and no unresolved scope split. The work is a single focused implementation plan: migrate the Tab Out dashboard to a MotherDuck-inspired warm flat visual system while preserving existing behavior and component responsibilities.
