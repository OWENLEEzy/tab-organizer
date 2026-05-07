# Tab Out Agent Notes

Tab Out is a local-only Chrome MV3 extension. Clicking the toolbar icon opens a
React dashboard of the user's currently open Chrome tabs. It is not a server
app, account system, cloud sync product, bookmark manager, or task manager.

## How To Work In This Repo

- `AGENTS.md` and `CLAUDE.md` are mirrors of the same project guidance. Keep
  them semantically identical when either file changes.
- Start from the real code and current git state. Do not rely on stale plan text,
  old PR descriptions, or the generated `dist/` output to describe source truth.
- Keep changes scoped to the requested behavior. Do not add account, sync,
  analytics, cloud storage, bookmark/task-manager, or external API semantics
  unless the user explicitly changes the product contract.
- Preserve unrelated work in the tree. If `git status` shows modified files you
  did not touch, treat them as user work and avoid rewriting or reverting them.
- Prefer the smallest relevant verification loop while debugging, then run
  `npm run check` before claiming UI, storage, grouping, accessibility, or build
  changes are ready.
- When updating this file, record durable repo rules only: product contracts,
  architecture boundaries, commands, verification gates, and recurring gotchas.
  Do not turn it into a changelog or a one-off task log.

## Product Contract

- The first screen is the working dashboard, not a marketing page.
- Tabs are grouped automatically by product/domain; this grouping is the source
  of truth for the UI.
- Manual groups organize product groups. They must not rewrite grouping
  semantics or become URL-level task management.
- The extension is local-first by design: no account, no server sync, no
  analytics, no external storage, and no external API dependency.
- Runtime data lives in Chrome and local extension storage. Treat privacy as a
  product feature, not only an implementation detail.
- Closing tabs should be fast, direct, and satisfying. Effects can add delight,
  but must not slow cleanup or obscure what was closed.
- Duplicate cleanup means "keep one copy, close extras"; avoid ambiguous bulk
  actions.
- Recovery is lightweight local safety from recent snapshots, not full session
  sync or cross-device history.

## UI Design Core

Source of truth: `docs/frontend-design.md` and
`src/newtab/styles/global.css`.

- Visual tone is Notion-inspired warm paper: calm, readable, lightly tactile.
- Use warm surfaces and text, not cold gray UI. Key light tokens include
  `#FFFDF9`, `#F7F6F3`, `#37352F`, and `#E8E7E4`.
- Content-first: open tabs are the content. Navigation, controls, effects, and
  decoration must stay quiet.
- Hierarchy comes from typography, spacing, and restrained weight, not loud
  colors or heavy borders.
- Headings use Newsreader; body text uses DM Sans. Fonts are local `.woff2`
  files because MV3 CSP blocks CDN font loading.
- Accent semantics are stable:
  - Blue: primary actions, focus, links, hover.
  - Amber: duplicate/warning state.
  - Red: destructive close/delete.
  - Sage: success/healthy state.
- Dark mode is a peer mode, not an afterthought. Add explicit dark behavior for
  new surfaces.
- Do not turn the dashboard into cards inside cards or a decorative landing
  page. Preserve a dense, scan-friendly tool surface.
- Any UI simplification must preserve the user's ability to scan, jump, close,
  dedupe, organize, and recover tabs.

## Implemented Product Surface

- Product/domain grouping from real Chrome tabs.
- Cards view and Table view.
- Product-only manual groups and group assignments.
- Organize mode for dragging product groups into sections.
- Duplicate detection, duplicate badges, and close-duplicate actions.
- Tab title click/focus across Chrome windows.
- Single-tab close and group-close flows with sound/confetti effects.
- Search and keyboard navigation across visible tab chips.
- Settings panel for local preferences.
- History panel with local snapshot preview, restore, delete, and clear.
- Background badge updates from tab lifecycle events.
- Browser-internal pages, extension pages, and Tab Out pages are filtered out of
  grouping and recovery snapshots.

## Basic Architecture

Chrome runs two extension surfaces:

- Dashboard page: `src/newtab/index.html` -> `src/newtab/main.tsx` ->
  `src/newtab/App.tsx`.
- Background worker: `manifest.json` -> `src/background/index.ts`.

Core source layout:

```text
src/
  background/       MV3 service worker and toolbar action behavior
  newtab/           React dashboard UI, hooks, components, styles
  stores/           Zustand state for tabs, settings, workspace/session data
  lib/              Pure domain logic: grouping, titles, history, effects
  utils/            Chrome/storage/url/error adapters and helpers
  config/           Product/domain mapping and grouping configuration
  types/            Shared TypeScript interfaces
  __tests__/        Vitest coverage for storage, grouping, UI, a11y, gates
```

Build/runtime shape:

- `manifest.json` is the extension manifest CRXJS reads.
- `vite.config.ts` and `tsconfig.*.json` drive the TypeScript/Vite build.
- `public/` contains bundled fonts and icons required by MV3 CSP.
- `dist/` is the generated Chrome-ready extension bundle.

## Architecture Ownership

- `src/newtab/index.html` is the dashboard entry.
- `src/newtab/App.tsx` is the page orchestrator. It owns store wiring,
  transient UI state, search/keyboard flow, close/focus/dedupe handlers,
  settings, history, confirmations, toast, and lazy organize mode.
- `src/background/index.ts` is the MV3 service worker. It refreshes badge counts
  and opens or focuses the dashboard from the toolbar action.
- `src/utils/storage.ts` is the only adapter over `chrome.storage.local`.
- `src/lib/tab-grouper.ts` owns product/domain grouping and duplicate counts.
- `src/lib/history-snapshots.ts` owns snapshot creation and replacement rules.
- `src/newtab/components/DndOrganizer.tsx` is the only component that imports
  `@dnd-kit`.

Mutation flow:

```text
User action
  -> App.tsx handler
    -> Zustand store action
      -> storage adapter or Chrome tabs API
        -> Zustand state refresh
```

## State And Component Invariants

- `App.tsx` is the only newtab UI file that imports Zustand stores.
- Components under `src/newtab/components/` receive data and callbacks by props.
- Components do not call `chrome.tabs.*`, `chrome.storage.local`, or storage
  utilities directly.
- Manual groups contain product groups only.
- URL-level section assignments are not part of the current model.
- Organizer ids are namespaced as `product:<productKey>` and
  `group:<groupId>`.
- Default Cards/Table views must not import or render drag handles.
- `@dnd-kit` must stay out of the default dashboard entry path.
- `dist/` is generated output. Do not edit it manually.
- CRXJS reads `manifest.json`; keep `src/newtab/index.html` as an explicit Vite
  build input so the toolbar dashboard stays bundled.

## Change Playbooks

For UI changes:

- Check `docs/frontend-design.md` and `src/newtab/styles/global.css` first.
- Preserve Cards/Table parity unless the user asks for a mode-specific change.
- Verify scan, jump, close, dedupe, organize, settings, and history paths still
  make sense after simplification.
- Add or update explicit dark-mode styling for new surfaces.

For grouping, duplicate, or visible-tab behavior:

- Treat `src/lib/tab-grouper.ts` and the visible chip model as source of truth.
- Duplicate cleanup keeps one tab and closes extras. Keyboard navigation and
  batch-close behavior should derive from the same visible set the UI renders.
- Prefer targeted coverage in `src/__tests__/tab-grouper.test.ts` or
  `src/__tests__/visible-tabs.test.ts` before the full gate.

For storage and history changes:

- Route persisted mutations through `src/utils/storage.ts`.
- Keep legacy normalization at the adapter boundary.
- Validate snapshot caps, local-only behavior, and internal-page filtering.

For review/fix loops:

- Review concrete runtime, accessibility, state, and contract risks first.
- Fix verified issues directly when asked, then re-review the same behavior class
  instead of stopping at the first failing line.
- Do not waive `color-contrast` in `tests/e2e/a11y.spec.ts` unless the user
  explicitly accepts that regression.

## Storage Model

Persisted in `chrome.storage.local`:

- Settings.
- Product group order.
- Product-only organizer sections.
- Product-to-group assignments.
- History candidate/history snapshots.
- Legacy `sections`, `sectionAssignments`, `recoveryCandidate`, and
  `recoveryHistory` fields required for migration compatibility.

Storage rules:

- All read-modify-write mutations go through the serial write queue in
  `src/utils/storage.ts`.
- Normalize legacy storage shapes at the adapter boundary.
- Prune product assignments when the product is no longer open or the group no
  longer exists.
- History snapshots are capped and local-only; do not introduce cloud/session
  account semantics.

## Commands

| Command | Use |
|---|---|
| `npm install` | Install dependencies when needed. |
| `npm run dev` | Vite dev server for `src/newtab/index.html`. |
| `npm run dev:a11y` | Vite dev server for the a11y harness. |
| `npm run build` | `tsc -b`, Vite build, then sync Chrome-ready output to `dist/`. |
| `npm run sync:dist` | Sync generated/static assets into `dist/` after build-only changes. |
| `npm run preview` | Preview production build. |
| `npm test` | Run all Vitest tests. |
| `npm run test:watch` | Run Vitest watch mode. |
| `npm run test:a11y` | Run accessibility unit tests. |
| `npm run test:e2e` | Run Playwright a11y/e2e harness. |
| `npm run lint` | Run ESLint. |
| `npm run lint:css` | Run Stylelint on `src/**/*.css`. |
| `npm run check:bundle` | Check bundle budget. |
| `npm run check:startup` | Check startup budget. |
| `npm run check` | Full gate: lint, CSS lint, tests, build, budgets, e2e. |

## Verification

Use the full gate before claiming code changes are ready:

```bash
npm run check
```

For focused local loops, choose the smallest relevant command from the Commands
table, then finish with `npm run check` when behavior, UI, storage, grouping,
accessibility, or build output changed.

Targeted Vitest examples:

```bash
npm test -- src/__tests__/storage.test.ts
npm test -- src/__tests__/tab-grouper.test.ts
npm test -- src/__tests__/history-snapshots.test.ts
npm test -- src/__tests__/tab-store.test.ts
npm test -- src/__tests__/dashboard-reskin.test.tsx
npm test -- src/__tests__/visible-tabs.test.ts
```

Use targeted tests to debug. Do not substitute them for the final full gate.

## Extension Loading

After `npm run build`, load `dist/` in Chrome:

```bash
cd dist && pwd | pbcopy && open "chrome://extensions" && open .
```

Chrome steps: enable Developer mode, click **Load unpacked**, select `dist/`,
then click the Tab Out toolbar icon. To update the loaded extension after a
source change, rebuild and click reload for Tab Out in `chrome://extensions`.

## Gotchas

- Requires Node.js 22+.
- Use `@crxjs/vite-plugin@^2.4.0` stable and named import
  `import { crx } from '@crxjs/vite-plugin'`.
- Tailwind v4 config lives in CSS through `@theme`; there is no
  `tailwind.config.ts`.
- Lightning CSS `@theme` warnings during build are expected.
- `@types/chrome` must stay in `tsconfig.app.json` `types`.
- React 19 return types should use `React.ReactElement`, not `JSX.Element`.
- MV3 CSP is `script-src 'self'`; no inline scripts, CDN scripts, or CDN fonts.
- Immutable state updates are expected: use spread/map patterns.
