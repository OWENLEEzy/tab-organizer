# Component Reuse Reference

This document defines the current component layering model for the Tab Out Chrome extension. It reflects the V1 dashboard: product/domain grouping, product-only sections, lazy organize mode, and local recovery.

## Component Layers

### Page Orchestrator

`src/newtab/App.tsx` owns page composition, store wiring, transient UI state, and cross-cutting effects such as keyboard shortcuts, toast messages, confirmation dialogs, and close effects.

Rules:

- `App.tsx` is the only newtab UI file that imports Zustand stores.
- Child components receive plain data and callbacks.
- Components do not import `chrome.*`, stores, or storage utilities.

### Page Sections

Section-level components own complete regions of the dashboard:

| Component | Role |
|---|---|
| `SectionBoard` | Renders the unsectioned product area and user-created product sections. |
| `DndOrganizer` | Lazy-loaded organize mode for product group drag-and-drop. |
| `DomainCard` | Product card with icon, tab chips, duplicate state, and close actions. |
| `ProductTable` | Dense product rows with section selector and actions. |
| `SettingsPanel` | Theme/effects/settings dialog. |
| `RecoveryPanel` | Recent-session summaries and restore entry points. |

Section components accept business-shaped props such as `TabGroup`, `OrganizerSection[]`, and handler callbacks. They may manage local display state but must not own persisted data.

### Composite Components

Composite components encapsulate stable interaction patterns:

| Component | Role |
|---|---|
| `TabChip` | Focusable tab row with favicon, duplicate badge, selection state, and close action. |
| `SelectionBar` | Bottom action bar for selected tab chips. |
| `SearchBar` | Search input, result count, clear action, and keyboard hint. |
| `ConfirmationDialog` | Modal confirmation with focus management. |
| `Toast` | Fixed-position status message. |
| `EmptyState` / `LoadingState` / `ErrorBoundary` | Shared app states. |

Composite components accept primitives and callbacks. They can import pure utilities such as URL or title-formatting helpers.

### Primitives

Low-level visual primitives live under `src/newtab/components/ui/` and layout primitives under `src/newtab/components/layout/`.

Current primitives include:

- `ActionButton`
- `MetricPill`
- `DashboardShell`
- `StatusStrip`
- `CommandHeader`
- `DashboardToolbar`

Primitive APIs should stay visual and interaction-oriented. They must not accept domain objects or know about Chrome extension behavior.

## Drag-and-Drop Boundary

`DndOrganizer` is the only component that may import `@dnd-kit`. Default Cards and Table views must not import or render drag handles.

Organizer drag ids are product-only:

- `product:<productKey>`
- `section:<sectionId>`

URL-level drag ids are not part of V1.

## Props Rules

- Pass `TabGroup` when the component renders a full product card or row.
- Pass primitive fields when a component needs only one or two values, such as `url` and `title` for `TabChip`.
- Pass callbacks from `App.tsx`; components raise events, the orchestrator decides the side effect.
- Never pass an entire store object as a prop.

## Reuse Criteria

Create a new abstraction only when at least two are true:

1. The pattern appears in two or more places.
2. Visual structure and states match.
3. The behavior model is the same.
4. The API remains small and coherent.

Avoid abstractions that hide domain meaning or become generic slot containers.

## Current Invariants

- Components under `src/newtab/components/` are store-free and storage-free.
- Product sections contain product groups only.
- Recovery is a local dashboard utility, not a task-management surface.
- Current UI docs should describe product sections, Table view, recovery, and duplicate cleanup.
