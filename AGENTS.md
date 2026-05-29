# Tab Organizer Agent Notes

Tab Organizer is a local-only Chrome MV3 extension. Clicking the toolbar icon opens a
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
- Tabs are single pages. They are grouped automatically into product/domain
  `TabGroup`s; this grouping is the source of truth for the UI.
- Sections are local label containers for automatic product groups. Init release
  starts with built-in smart section templates, and users can create, rename,
  delete, and edit sections locally.
- Assigning a group to a section means applying a section label to the
  product/domain `TabGroup`; it must not rewrite grouping semantics or become
  URL-level task management.
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

## Terminology

| Term | Meaning |
|------|---------|
| dashboard | toolbar-opened React page surface |
| tab | one Chrome tab/page |
| product group | automatic product/domain TabGroup |
| section | user-created container for product groups |
| unsectioned | product group intentionally outside any section |
| recovery snapshot | local restore snapshot |
| adapter | Chrome/browser API wrapper |
| domain logic | pure product rules in src/lib |

Casing convention: `camelCase` for variables/functions/props, `PascalCase` for
types/interfaces/components, `kebab-case` for files/IDs/storage keys/CSS classes,
`UPPER_SNAKE_CASE` for module-level constants.

## UI Design Core

Source of truth: `docs/frontend-design.md` and
`src/dashboard/styles/global.css`.

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
  - Terracotta: stale/inactive tabs.
  - Ink: dark theme accent surfaces.
- There is no separate dark mode toggle. Dark-background themes (obsidian,
  pine, amethyst, ember) are presented as equal accent choices alongside the seven
  light-background themes. The `isDark` flag in theme configs is a technical
  detail that toggles the `.dark` CSS class for Tailwind `dark:` variants.
- Do not turn the dashboard into cards inside cards or a decorative landing
  page. Preserve a dense, scan-friendly tool surface.
- Any UI simplification must preserve the user's ability to scan, jump, close,
  dedupe, organize, and recover tabs.

## Implemented Product Surface

- Product/domain grouping from real Chrome tabs.
- Cards view and Table view.
- Product-only organizer sections and section assignments.
- Cards view directly drags product groups into sections.
- Duplicate detection, duplicate badges, and close-duplicate actions.
- Tab title click/focus across Chrome windows.
- Single-tab close and group-close flows with sound/confetti effects.
- Search and keyboard navigation across visible tab chips.
- Settings panel for local preferences.
- History panel with local snapshot preview, restore, delete, and clear.
- Background badge updates from tab lifecycle events.
- Browser-internal pages, extension pages, and Tab Organizer pages are filtered out of
  grouping and recovery snapshots.

## Basic Architecture

Chrome runs two extension surfaces:

- Dashboard page: `src/dashboard/index.html` -> `src/dashboard/main.tsx` ->
  `src/dashboard/App.tsx`.
- Background worker: `manifest.json` -> `src/background/index.ts`.

Core source layout:

```text
src/
  background/       MV3 service worker and toolbar action behavior
  dashboard/           React dashboard UI, hooks, components, styles
  stores/           Zustand state for tabs, settings, sections, recovery
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

Source placement rules:

- Use shallow files when a source has one clear responsibility and no stable peer group.
- Use subdirectories only when depth expresses a durable responsibility group.
- `src/dashboard/controllers/` owns page-level orchestration and may coordinate stores, Chrome runtime messages, toast/dialog state, and user actions.
- `src/dashboard/hooks/` is for pure UI/DOM hooks only. Hooks in this directory must not import stores, storage utilities, or Chrome APIs.
- `src/dashboard/components/` is grouped by UI responsibility: `layout`, `ui`, `tabs`, `organizer`, `product-groups`, `sections`, `recovery`, `settings`, `search`, and `states`.
- `src/dashboard/lib/` is for dashboard-only pure UI projections and parsers.
- `src/lib/` is pure product/domain logic. It must not import `src/utils`, React, Zustand, DOM, storage, or Chrome APIs.
- `src/utils/` is for Chrome/browser/platform adapters. It may import pure `src/lib` rules, but must not import stores, dashboard modules, controllers, or components.

## Naming Rules

- Do not rename the tree only for casing consistency. Existing `PascalCase.tsx` component files, `useThing.ts` hook files, and `kebab-case.ts` utility/domain files are accepted until a planned architecture rename touches them.
- For new files or files already being renamed, use the existing local pattern for that file kind:
  - React component files: `PascalCase.tsx`, matching the exported component name, for example `DashboardHeader.tsx`.
  - React component exports: `PascalCase`, for example `DashboardHeader`.
  - Hook files: `useThing.ts`, for example `useDashboardController.ts`.
  - Hook exports: `camelCase` beginning with `use`, for example `useDashboardController`.
  - Store files: `kebab-case-store.ts`, for example `settings-store.ts`.
  - Pure domain, adapter, config, and test helper files: `kebab-case.ts`, for example `url-rules.ts`, `browser-url.ts`, and `product-groups.ts`.
  - Test files: `kebab-case.test.ts` or `kebab-case.test.tsx`; accessibility tests use `kebab-case.a11y.test.tsx`.
  - Directory names: lowercase responsibility groups; use plural nouns for stable collections such as `controllers`, `providers`, `components`, `stores`, `product-groups`, `sections`, and `recovery`.
- TypeScript symbols follow standard TS/React casing:
  - Types, interfaces, classes, enums, and React components use `PascalCase`.
  - Functions, variables, parameters, object properties, and callback props use `camelCase`.
  - Boolean values start with `is`, `has`, `can`, or `should`.
  - Module-level exported constants use `UPPER_SNAKE_CASE` when they represent fixed config or limits; local derived maps/helpers use `camelCase`.
  - String ids, command ids, storage keys, CSS classes, and CSS custom properties use `kebab-case` unless Chrome or an external API requires a different shape.
- Name files and symbols from the product contract first, not from temporary implementation history. Prefer `dashboard`, `productGroup`, `section`, `unsectioned`, and `recoverySnapshot` vocabulary for new or renamed source.
- Use `domain` only for literal hostname/domain data. UI that renders automatic product/domain groups should use product-group names, not domain-only names.
- Do not introduce misleading legacy terms for current behavior: `space`, `workspace`, `SavedTab`, `deferred`, or new domain-only names for product-group UI.
- Avoid vague or temporary names: `helpers.ts`, `misc.ts`, `common.ts`, `utils2.ts`, `url-new.ts`, `new-url.ts`, `url2.ts`, `temp.ts`, `old.ts`, or `new.ts`.
- Event handlers owned by App/controllers use `handleX`; component callback props use `onX`. Async storage/browser actions use concrete verbs such as `read`, `write`, `fetch`, `restore`, `close`, `focus`, or `sync`.
- IDs and keys must say what namespace they belong to. Organizer ids stay namespaced as `product:<productKey>` and `section:<sectionId>`.
- Keep accepted technical abbreviations only when they are clearer than spelling out the phrase: `URL`, `UI`, `DOM`, `MV3`, `DnD`, and `i18n`.

## Architecture Ownership

- `src/dashboard/index.html` is the dashboard entry.
- `src/dashboard/App.tsx` is the page orchestrator. It owns store wiring,
  transient UI state, search/keyboard flow, close/focus/dedupe handlers,
  settings, history, confirmations, toast, and the lazy drag organizer.
- `src/background/index.ts` is the MV3 service worker. It refreshes badge counts
  and opens or focuses the dashboard from the toolbar action.
- `src/utils/storage.ts` is the only adapter over `chrome.storage.local`.
- `src/lib/product-groups.ts` owns product/domain grouping and duplicate counts.
- `src/lib/recovery-snapshots.ts` owns snapshot creation and replacement rules.
- `src/dashboard/components/sections/DndSectionOrganizer.tsx` is the only dashboard component that may import `@dnd-kit`.

Import boundary:

- `src/lib` is pure and imports only `src/types` and `src/config`.
- `src/utils` is the adapter layer and may import `src/types`, `src/config`, and pure `src/lib` rules.
- `src/lib` must never import `src/utils`.

Mutation flow:

```text
User action
  -> App.tsx handler
    -> Zustand store action
      -> storage adapter or Chrome tabs API
        -> Zustand state refresh
```

Allowed import chains:

```text
App -> controllers/providers/components
controllers -> stores/dashboard-lib/lib/utils/types/config
providers -> stores/lib/types/config
components -> components/hooks/dashboard-lib/lib/types/config
stores -> lib/utils/types/config
dashboard-lib -> lib/types/config
lib -> types/config only
utils -> pure-lib/types/config only
config -> types only
types -> no runtime imports
```

Forbidden import chains:

```text
components -> stores/controllers/utils/storage/chrome.*
hooks -> stores/utils/storage/chrome.*
lib -> utils/stores/dashboard/React/Zustand/chrome.*
utils -> stores/dashboard/components/controllers/React/Zustand
stores -> dashboard/components/controllers
config/types -> runtime layer
```

## State And Component Invariants

- `App.tsx` is the only dashboard UI file that imports Zustand stores.
- Components under `src/dashboard/components/` receive data and callbacks by props.
- Components do not call `chrome.tabs.*`, `chrome.storage.local`, or storage
  utilities directly.
- Sections contain automatic product groups only.
- Sections are local label containers for product groups. Sections contain
  groups, never individual URLs.
- Built-in smart sections are default local templates; user-created sections use
  the same object model.
- No section is a system bucket for product groups without a section assignment.
  It is not a persisted section object.
- Terminology: tab = single page, group = automatic TabGroup of tabs, section =
  local label container for groups.
- English UI: tab / group / section. Chinese UI: 页面 / 区域 / 分区.
- Cards view is directly draggable; Table view is not.
- URL-level section assignments are not part of the current model.
- Organizer ids are namespaced as `product:<productKey>` and
  `section:<sectionId>`.
- Cards view uses the lazy drag organizer directly so product groups can move
  between sections without a separate organize mode.
- `src/dashboard/components/sections/DndSectionOrganizer.tsx` is the only dashboard component that may import `@dnd-kit`.
- Stores may own state transitions, but raw `chrome.tabs.*`, `chrome.windows.*`, and `chrome.runtime.*` calls belong in `src/utils` adapter modules.
- `dist/` is generated output. Do not edit it manually.
- CRXJS reads `manifest.json`; keep `src/dashboard/index.html` as an explicit Vite
  build input so the toolbar dashboard stays bundled.

## Change Playbooks

For UI changes:

- Check `docs/frontend-design.md` and `src/dashboard/styles/global.css` first.
- Preserve Cards/Table parity unless the user asks for a mode-specific change.
- Verify scan, jump, close, dedupe, organize, settings, and history paths still
  make sense after simplification.
- Add or update explicit dark-mode styling for new surfaces.

For grouping, duplicate, or visible-tab behavior:

- Treat `src/lib/product-groups.ts` and the visible chip model as source of truth.
- Duplicate cleanup keeps one tab and closes extras. Keyboard navigation and
  batch-close behavior should derive from the same visible set the UI renders.
- Prefer targeted coverage in `src/__tests__/product-groups.test.ts` or
  `src/__tests__/visible-tabs.test.ts` before the full gate.

For storage and history changes:

- Route persisted mutations through `src/utils/storage.ts`.
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
- Product-to-section assignments.
- Recovery candidate/recovery snapshots.
- On schema mismatch, storage resets destructively to the current schema. Do not read legacy storage keys into current state.
- Current schema keys are `schemaVersion`, `settings`, `groupOrder`, `sections`, `sectionAssignments`, `unsectionedProductKeys`, `viewMode`, `recoveryCandidate`, and `recoverySnapshots`.

Storage rules:

- Use the full registrable domain (minus `www.`/`m.`) as the `productKey` for unknown sites to ensure identity isolation.
- Decouple technical `productKey` (for grouping/actions) from visual `label` (for display).
- Localized consolidation (stripping TLDs) is limited to known safe variants in `PRODUCT_RULES` only.
- All read-modify-write mutations go through the serial write queue in
  `src/utils/storage.ts`.
- On schema mismatch, storage resets to current schema defaults (see above).
- Prune product assignments when the product is no longer open or the group no
  longer exists.
- Product-to-section assignments are group-level label relationships:
  `{ productKey, sectionId, order }`.
- `unsectionedProductKeys` stores product keys the user explicitly moved to No
  section so auto-rules do not immediately reapply.
- History snapshots are capped and local-only; do not introduce cloud/session
  account semantics.

## Commands

| Command | Use |
|---|---|
| `npm install` | Install dependencies when needed. |
| `npm run dev` | Vite dev server for `src/dashboard/index.html`. |
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
| `npm run knip` | Run knip dead code detection. |
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
npm test -- src/__tests__/product-groups.test.ts
npm test -- src/__tests__/recovery-snapshots.test.ts
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
then click the Tab Organizer toolbar icon. To update the loaded extension after a
source change, rebuild and click reload for Tab Organizer in `chrome://extensions`.

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
