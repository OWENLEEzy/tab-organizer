# Tab Out Architecture

## System Overview

Tab Out is a Chrome Extension built on Manifest V3. The build toolchain is Vite 8 with the CRXJS plugin (`@crxjs/vite-plugin@^2.4.0`), which reads `manifest.json` at the project root. Vite also keeps the dashboard HTML as an explicit build input so the toolbar action can open it as an extension page.

Two runtime entry points are used by the extension:

| Entry Point | Manifest Key | Runtime | Purpose |
|---|---|---|---|
| `src/newtab/index.html` | Vite build input; opened by toolbar action | React app | Renders grouped tabs, saved items, settings without replacing Chrome's default new tab page. |
| `src/background/index.ts` | `background.service_worker` | Service worker | Badge refresh on tab lifecycle events and toolbar-button dashboard launch. Stateless. |

Permissions declared: `tabs`, `storage`. Content Security Policy enforces `script-src 'self'` -- no inline scripts, no CDN loads. Fonts are bundled as local woff2 in `public/fonts/`.

Tech stack: React 19, Zustand 5, TypeScript 6, Vite 8, Tailwind v4 (CSS-based `@theme` directives, no `tailwind.config.ts`), `@dnd-kit` for drag-and-drop.

---

## Runtime Ownership

Three first-class runtime slices own all state and side effects:

### 1. Dashboard Runtime (`src/newtab/**`)

The React application that renders when the user clicks the Tab Out toolbar icon. Owns all dashboard flows:

- Fetching and rendering open tabs grouped by domain
- Closing and focusing tabs
- Saving tabs for later, checking off, dismissing saved items
- Restoring workspaces
- Reacting to storage changes via `useChromeStorage` hook
- Search, keyboard shortcuts, drag-and-drop reordering, settings UI

### 2. Background Runtime (`src/background/index.ts`)

The MV3 service worker. Owns passive, extension-level side effects and dashboard launch only:

- Badge count refresh on `onInstalled`, `onStartup`, `onCreated`, `onRemoved`, `onUpdated`
- Debounced badge updates (300ms) to avoid thrashing on rapid tab changes
- Toolbar action click handling: focus an existing dashboard tab in the current window when possible, otherwise open one.

The background script does not import stores, storage utilities, or any newtab code. It is stateless.

### 3. Shared Persisted State (`chrome.storage.local`)

The single source of truth for data that must survive service worker lifecycle events and newtab page reloads. Access is mediated exclusively through `src/utils/storage.ts`.

### Ownership Rules

| Concern | Owner |
|---|---|
| Passive listeners (badge, install/startup) | Background runtime |
| Extension-level side effects (badge refresh) | Background runtime |
| User-triggered flows (fetch/render, close, focus, save, restore) | Newtab runtime |
| Storage change reactions (`useChromeStorage`) | Newtab runtime |
| Direct `chrome.storage.local` access | `src/utils/storage.ts` only |
| Raw `chrome.*` API calls in components | Prohibited |

---

## Layer Responsibilities

### Page Layer (`src/newtab/App.tsx`)

`App.tsx` is the page orchestrator with a narrowed role. It is the only component permitted to import stores directly (enforced by ESLint rule 5).

**Allowed:**
- Compose sections (header, search, domain cards, saved column, footer, settings panel, dialogs)
- Hold transient UI state (loading, toast, search query, confirmation dialog, settings panel open/close, nudge dismissed)
- Wire store hooks to handlers and pass data/callbacks to child components via props
- Coordinate page-level flows (init data fetch, dark mode, keyboard shortcuts, drag-and-drop)

**Disallowed:**
- Direct storage access (`chrome.storage.local`, `readStorage`, `writeStorage`)
- Direct Chrome tab mutation (`chrome.tabs.remove`, `chrome.tabs.update`) -- these are encapsulated in store actions
- Raw effect primitives (`playCloseSound`, `shootConfetti`) -- routed through `playCloseEffects()`
- Embedded domain helpers (grouping, title cleaning, URL parsing) -- imported from `src/lib/` and `src/utils/`

### Store Layer (`src/stores/`)

Four Zustand stores, each owning one business domain:

| Store | File | Domain | Key Imports |
|---|---|---|---|
| `useTabStore` | `tab-store.ts` | Open tab data, grouping, close/focus, reorder | `readGroupOrder`, `writeGroupOrder` from storage; `groupTabsByDomain` from lib |
| `useSavedStore` | `saved-store.ts` | Save-for-later lifecycle (save, check off, dismiss) | `getSavedTabs`, `saveTabForLater`, `checkOffSavedTab`, `dismissSavedTab` from storage |
| `useSettingsStore` | `settings-store.ts` | Settings state and persistence | `readSettings`, `writeSettings`, `DEFAULT_SETTINGS` from storage |
| `useWorkspaceStore` | `workspace-store.ts` | Workspace CRUD and restore | `readWorkspaces`, `writeWorkspaces` from storage |

**Store rules:**
- Stores own domain state (the shape of data) and domain actions (how data changes).
- Stores must NOT directly call `chrome.storage.local` or import `readStorage`/`updateStorage`. They use domain readers/writers from `storage.ts` (enforced by ESLint rule 3).
- Stores may call `chrome.tabs.*` APIs for tab mutation (query, remove, update, create) since these are inherent to their domain.
- Cross-domain orchestration (e.g., closing a domain's tabs then showing a toast then triggering confetti) belongs in the page layer, not in stores.

**Optimistic update pattern:**
All stores that persist data use an optimistic update pattern -- the Zustand state is updated immediately with `set()`, then the storage write is attempted. If the write fails, the state is rolled back to the previous value.

### Storage Layer (`src/utils/storage.ts`)

The single adapter over `chrome.storage.local`. No other module in the codebase touches the storage API directly (enforced by ESLint rule 1).

**Internal API (module-private, not exported):**

| Function | Purpose |
|---|---|
| `queuedWrite(fn)` | Serializes async writes onto a single promise chain |
| `readStorageSnapshot()` | Raw `chrome.storage.local.get` for all schema keys |
| `persistStorage(data)` | Raw `chrome.storage.local.set` for all schema keys |
| `migrate(data)` | Applies schema migrations sequentially (currently v0 -> v1 -> v2) |

**Exported for testing only:**

| Constant | Purpose |
|---|---|
| `EMPTY_SCHEMA` | Default empty schema for initialization |
| `CURRENT_SCHEMA_VERSION` | Current schema version number (for migration tests) |

**Core API (exported, use with caution):**

| Function | Purpose |
|---|---|
| `readStorage()` | Read full schema with migration applied |
| `writeStorage(data)` | Replace full schema (uses write queue). Reserved for migration/import/restore only (enforced by ESLint rule 2). |
| `updateStorage(updater)` | Read-modify-write inside the write queue. Returns the resulting `StorageSchema`. |

**Public domain API (exported, preferred):**

| Function | Domain | Operation |
|---|---|---|
| `getSavedTabs()` | Saved tabs | Returns `{ active, archived }`, filtering dismissed |
| `saveTabForLater(tab)` | Saved tabs | Creates a new `SavedTab` entry |
| `checkOffSavedTab(id)` | Saved tabs | Marks a tab as completed |
| `dismissSavedTab(id)` | Saved tabs | Marks a tab as dismissed (soft delete) |
| `readSettings()` | Settings | Returns current `AppSettings` |
| `writeSettings(partial)` | Settings | Merges partial settings into stored settings |
| `readGroupOrder()` | Group order | Returns domain-to-position map |
| `writeGroupOrder(order)` | Group order | Replaces group ordering |
| `clearGroupOrder()` | Group order | Resets to empty (deletes all custom ordering) |
| `readWorkspaces()` | Workspaces | Returns all workspaces |
| `writeWorkspaces(list)` | Workspaces | Replaces all workspaces |

All domain writers wrap `updateStorage()`, which performs a fresh read inside the write queue. This ensures that concurrent writes to different domains never overwrite each other's data.

### Effect Layer

Side effects are routed through named entrypoints rather than called as raw primitives:

- **`src/lib/close-effects.ts`** exports `playCloseEffects(settings, options?)`, which conditionally calls `playCloseSound()` and `shootConfetti()` based on user settings. Raw effect functions (`playCloseSound`, `shootConfetti`) are restricted to this module (enforced by ESLint rule 4).
- **`src/background/index.ts`** contains background-only effects (badge refresh) that stay in the background runtime.

---

## Data Flow

The primary data flow path for all user-triggered mutations:

```
User action
  -> Page orchestrator (App.tsx) handler
    -> Store action (e.g., savedStore.checkOff)
      -> Domain storage adapter (e.g., checkOffSavedTab)
        -> updateStorage(updater)
          -> queuedWrite
            -> readStorageSnapshot + persistStorage
              -> chrome.storage.local
```

Read path for initial hydration:

```
App.tsx init effect
  -> Store action (e.g., tabStore.fetchTabs)
    -> chrome.tabs.query + domain storage adapter (e.g., readGroupOrder)
      -> storage layer
        -> chrome.storage.local
    -> Zustand set()
```

Real-time update path:

```
chrome.tabs event
  -> tabStore.startListeners (debounced)
    -> tabStore.fetchTabs (re-fetch + re-group)
```

Cross-runtime sync:

```
Background or newtab writes to chrome.storage.local
  -> chrome.storage.onChanged
    -> useChromeStorage hook (in App.tsx)
      -> savedStore.fetchSaved (re-hydrate)
```

**Key invariant:** Components receive data via props from the page orchestrator. They never import stores or storage utilities directly (enforced by ESLint rules 5 and 6).

---

## Storage Model and Safety

### Schema Versioning

The storage schema is defined in `StorageSchema` (see `src/types/index.ts`). Current version is `2`.

```typescript
interface StorageSchema {
  schemaVersion: number;   // Currently 2
  deferred: SavedTab[];    // Saved-for-later items
  workspaces: Workspace[]; // User workspaces
  settings: AppSettings;   // User preferences
  groupOrder: Record<string, number>; // Domain card drag-and-drop order
}
```

Migrations are applied sequentially in `migrate()`: v0 -> v1 (initial schema), v1 -> v2 (add `groupOrder`). Each migration step transforms a `Partial<StorageSchema>` into the next version's shape. New migrations are added as additional `if (version < N)` blocks.

### Write Queue

All writes pass through `queuedWrite(fn)`, which chains async operations onto a single promise. This prevents race conditions during rapid consecutive mutations (e.g., checking off multiple saved items in quick succession).

```
queuedWrite chains:
  writeQueue = Promise.resolve()
  each call: writeQueue = writeQueue.then(fn).catch(() => {})
```

The `updateStorage()` function performs a read-modify-write cycle entirely inside the queue:

1. Acquire position in the write queue
2. Read the latest snapshot from storage
3. Apply migration
4. Run the updater function to produce the next state
5. Persist the full schema
6. Return the resulting state

This guarantees that no two concurrent `updateStorage` calls will read stale data from each other.

### Immutability

All store mutations use immutable patterns -- spread operators, `.map()`, and `.filter()` produce new objects and arrays. No store ever mutates an existing object in place. This is consistent across all four stores:

- `tab-store.ts`: `set({ tabs: mapped, groups, loading: false })`
- `saved-store.ts`: `set({ active, archived, loading: false })`
- `settings-store.ts`: `set({ settings: { ...prev, ...updated } })`
- `workspace-store.ts`: `set({ workspaces: [...prev, workspace] })`

---

## Import Boundary Rules

Layer boundaries are enforced via ESLint `no-restricted-imports` and `no-restricted-syntax` rules defined in `eslint.config.js`. Each rule has explicit file matchers and allowlists.

### Rule 1: chrome.storage.local restricted to storage adapter

- **Pattern:** `MemberExpression` matching `chrome.storage.local`
- **Allowed in:** `src/utils/storage.ts`, `src/__tests__/**`
- **Blocked everywhere else**

### Rule 2: writeStorage restricted

- **Pattern:** Import of `writeStorage` from `*/utils/storage`
- **Allowed in:** `src/utils/storage.ts` (self-export), `src/__tests__/**`
- **Blocked everywhere else**
- **Intent:** `writeStorage` is for full-schema replacement during migration/import/restore only

### Rule 3: readStorage/updateStorage restricted in stores

- **Pattern:** Import of `readStorage` or `updateStorage` from `*/utils/storage`
- **Applies to:** `src/stores/**/*.ts`
- **Blocked in:** All store files
- **Stores must use domain readers/writers instead**

### Rule 4: Raw effect primitives restricted

- **Pattern:** Import of `playCloseSound` from `*/lib/sound` or `shootConfetti` from `*/lib/confetti`
- **Allowed in:** `src/lib/close-effects.ts`, `src/__tests__/**`
- **Blocked everywhere else**
- **UI code must call `playCloseEffects()` from `close-effects.ts`**

### Rule 5: Components must not import stores

- **Pattern:** Import of `*/stores/*`
- **Applies to:** `src/newtab/components/**/*.tsx`
- **Intent:** Components receive data and handlers via props from `App.tsx`

### Rule 6: Components must not import storage utilities

- **Pattern:** Import of `*/utils/storage`
- **Applies to:** `src/newtab/components/**/*.tsx`
- **Intent:** Data flows through stores and props, not direct storage access

---

## File Map

```
src/
  types/index.ts                  # All TypeScript interfaces and type definitions
  config/
    friendly-domains.ts           # 40+ domain-to-friendly-name mappings
    custom-groups.ts              # User-defined tab grouping rules
  lib/
    constants.ts                  # Shared constants (animation, sound, confetti)
    tab-grouper.ts                # Tab grouping by domain + dupe detection
    title-cleaner.ts              # Tab title normalization
    landing-pages.ts              # Landing page detection logic
    close-effects.ts              # Effect router for close actions (sound + confetti)
    confetti.ts                   # Confetti animation implementation
    sound.ts                      # Sound effect implementation
  utils/
    storage.ts                    # Chrome Storage adapter (schema versioning + write queue)
    badge.ts                      # Badge color logic
    url.ts                        # URL parsing, hostname extraction, sanitization
    error.ts                      # Error message extraction utility
  stores/
    tab-store.ts                  # Open tab state, grouping, close/focus, reorder
    saved-store.ts                # Save-for-later lifecycle
    settings-store.ts             # User preferences (theme, sound, confetti, custom groups)
    workspace-store.ts            # Workspace CRUD and restore
  background/
    index.ts                      # Service worker: badge refresh on tab lifecycle
  newtab/
    App.tsx                       # Page orchestrator (the only store consumer)
    main.tsx                      # React root mount
    index.html                    # HTML shell for the toolbar-opened dashboard
    components/                   # 17 presentational UI components
    hooks/
      useChromeStorage.ts         # Storage change listener hook
      useKeyboard.ts              # Keyboard shortcut hook
    styles/
      global.css                  # Tailwind v4 @theme tokens (Notion-inspired palette)
      fonts.css                   # @font-face declarations for local woff2 fonts
  __tests__/                      # Vitest unit tests (badge, landing-pages, storage, tab-grouper, title-cleaner, url)
```

---

## Migration Direction

### Current state

All domain writers live in a single `src/utils/storage.ts` file (263 lines). This is manageable but consolidates five domains (saved tabs, settings, group order, workspaces, schema migration) into one module.

### Future direction

Split `storage.ts` into a core module and domain-specific writer modules:

```
src/utils/storage/
  core.ts            # Schema, migration, write queue, readStorage, updateStorage, writeStorage
  saved-tabs.ts      # getSavedTabs, saveTabForLater, checkOffSavedTab, dismissSavedTab
  settings.ts        # readSettings, writeSettings
  group-order.ts     # readGroupOrder, writeGroupOrder
  workspaces.ts      # readWorkspaces, writeWorkspaces
```

This split preserves all existing import boundaries and ESLint rules. No immediate migration is required -- the current file is well-organized and under 300 lines.

---

## Key Technical Decisions

**CRXJS plus explicit dashboard input.** CRXJS reads `manifest.json` and resolves the background service worker. `vite.config.ts` keeps `src/newtab/index.html` as an explicit input so the dashboard remains bundled even though it no longer uses `chrome_url_overrides.newtab`.

**Tailwind v4 via CSS.** Configuration lives in `global.css` through `@theme` directives, not a separate `tailwind.config.ts`. The `@tailwindcss/vite` plugin handles processing. `lightningcss` warnings during build are expected and harmless.

**React 19 return types.** Components use `React.ReactElement` instead of `JSX.Element` for return type annotations.

**Serial write queue.** The `queuedWrite` mechanism in `storage.ts` serializes all storage mutations. This was introduced to prevent data loss during rapid consecutive operations (checking off multiple saved items, drag-and-drop reordering while saves are in flight).

**Optimistic updates with rollback.** Stores update Zustand state immediately, then attempt the storage write. On failure, state reverts. This keeps the UI responsive while maintaining correctness.

**Domain writers over raw storage.** Stores import domain-specific functions (`readSettings`, `writeWorkspaces`) rather than raw storage primitives (`readStorage`, `updateStorage`). This ensures each store only touches its own data and prevents cross-domain coupling at the storage level.
