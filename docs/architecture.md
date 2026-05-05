# Tab Out Architecture

## System Overview

Tab Out is a local-only Chrome Extension built on Manifest V3. The toolbar action opens a React dashboard page bundled by Vite and CRXJS. The extension uses only `tabs` and `storage` permissions.

| Entry Point | Runtime | Purpose |
|---|---|---|
| `src/newtab/index.html` | React app | Shows the open-tab dashboard grouped by product/domain, product sections, table view, settings, and recovery UI. |
| `src/background/index.ts` | MV3 service worker | Maintains the badge and opens or focuses the dashboard when the toolbar icon is clicked. |

The Content Security Policy keeps scripts self-hosted. Fonts are bundled locally. No account, server sync, analytics, or external storage is part of the runtime.

## Runtime Ownership

### Dashboard Runtime

`src/newtab/App.tsx` is the page orchestrator. It fetches store state, owns transient UI state, and passes props to presentational components.

Owned flows:

- Fetch and render current Chrome tabs grouped by product/domain.
- Search and keyboard navigation across visible tab chips.
- Close, focus, and duplicate-cleanup actions.
- Product-only organizer sections in Cards/Table views.
- Lazy-loaded organize mode for product drag-and-drop.
- Settings, toast, confirmation dialog, and recovery surfaces.

### Background Runtime

`src/background/index.ts` is stateless apart from Chrome events.

Owned flows:

- Refresh badge counts on tab lifecycle events.
- Debounce badge refreshes.
- Open or focus the Tab Out dashboard from the toolbar action.

### Storage Runtime

`src/utils/storage.ts` is the only adapter over `chrome.storage.local`.

Persisted domains:

- Settings.
- Product group order.
- Product-only organizer sections and product assignments.
- Recovery candidate/history snapshots.
- Legacy schema fields needed for migration compatibility.

## Data Model

The dashboard starts from real web tabs returned by `chrome.tabs.query`. Browser-internal URLs, extension pages, and Tab Out dashboard pages are filtered before grouping.

Product groups use `TabGroup.productKey` / `TabGroup.itemKey` as the stable product identity. Unknown sites fall back to a conservative hostname-derived product key.

Organizer assignments are product-only:

```ts
interface SectionAssignment {
  productKey: string;
  sectionId: string;
  order: number;
}
```

URL-level organizer assignments are not part of V1. Legacy URL assignment shapes are ignored during storage normalization. Product assignments are pruned when their product is no longer open or their section no longer exists.

## Component Boundaries

`App.tsx` is the only newtab component that imports Zustand stores. Components under `src/newtab/components/` receive data and callbacks through props.

Important components:

- `DashboardShell`, `StatusStrip`, `CommandHeader`, `DashboardToolbar`: dashboard frame and top controls.
- `SectionBoard`: product section region used by default Cards view.
- `DndOrganizer`: lazy-loaded organize mode; the only component that imports `@dnd-kit`.
- `DomainCard`: product card and tab chip list.
- `ProductTable`: dense product rows with section selector.
- `RecoveryPanel` / `RecoverySnapshotDetails`: recovery display and restore affordances.

`@dnd-kit` must stay out of the default dashboard entry path. Default Cards/Table render without drag handles; drag handles appear only after the user enables Organize mode.

## Mutation Flow

User-triggered mutations follow this path:

```text
User action
  -> App.tsx handler
    -> Zustand store action
      -> storage adapter or Chrome tabs API
        -> Zustand state refresh
```

Examples:

- Closing a product card calls a store tab-close action with the exact rendered tab URLs.
- Moving a table row calls `moveProductToSection(productKey, sectionId)` or `moveProductToMain(productKey)`.
- Organize mode drag end uses namespaced ids such as `product:<productKey>` and `section:<sectionId>`, then calls the same product movement actions.

Components do not call `chrome.tabs.*` or `chrome.storage.local` directly.

## Verification Gates

Use `npm run check` as the full gate. It runs lint, CSS lint, Vitest, build, bundle/startup budgets, and Playwright e2e through the project harness.

Static invariants:

- `@dnd-kit` appears only in `DndOrganizer.tsx`.
- Organizer storage and store APIs are product-only.
- Current user-facing docs describe sections and recovery, not legacy task-management flows.
