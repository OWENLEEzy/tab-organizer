# Tab Out Frontend Architecture, Storage Guardrails, and Component Reuse Design

## Scope

This design defines the next-step target architecture for Tab Out without rewriting the stack. It covers:

- Frontend design system documentation
- Frontend architecture documentation
- Storage management rules
- Component reuse rules
- ESLint and verification guardrails

This is a gradual architecture cleanup plan, not a large refactor. The project keeps the current React + Zustand + Chrome extension structure.

## Goals

1. Keep the current stack and file layout broadly intact.
2. Stop further architecture drift in `App.tsx`, storage writes, and component layering.
3. Define a target structure that future work must move toward.
4. Add lightweight, enforceable guardrails instead of relying on convention alone.
5. Produce documentation that explains both current state and target state.
6. Document the actual Chrome extension runtime boundaries so the architecture reflects how Tab Out really runs.

## Non-Goals

- Replacing Zustand
- Replacing Tailwind or the current token system
- Reorganizing the whole repo into a new package structure
- Building a full internal component library in this phase
- Writing custom ESLint plugins in this phase

## Current State Summary

### Frontend structure

- `src/newtab/App.tsx` acts as the page orchestrator and currently owns page state, store wiring, several interaction flows, and some UI-level effects.
- `src/newtab/components/` contains a mix of page sections, reusable business components, and one-off UI pieces in a flat directory.
- `src/newtab/styles/global.css` already defines visual tokens and layout primitives, but usage rules are not documented.

### State and storage

- State is split across `tab-store`, `saved-store`, `settings-store`, and `workspace-store`.
- Storage safety improved with `updateStorage()` in `src/utils/storage.ts`, but there is no formal rule yet that all business writes must go through domain-safe storage adapters.
- `writeStorage()` still exists and needs explicit usage boundaries.

### Runtime boundaries

- The new tab page is a React runtime that owns page composition, user-triggered flows, and cross-store orchestration.
- The background service worker is a separate runtime that owns badge refresh and passive browser listeners.
- `chrome.storage.local` is shared extension state across runtimes and requires stricter write boundaries than ordinary page state.
- Browser APIs are currently used from more than one layer, but ownership rules are not yet documented.

### Reuse and consistency

- Several UI patterns already repeat across components:
  - icon-only action buttons
  - text inputs
  - badges
  - surface cards and section headers
  - repeated focus-ring and hover treatment
- Reuse decisions are currently convention-based rather than documented and enforced.

## Approved Architecture Direction

### 0. Runtime Ownership

Tab Out has three first-class runtime slices, and the architecture docs must describe all three:

- `src/newtab/**`: the new tab page runtime
- `src/background/**`: the service worker runtime
- `chrome.storage.local`: shared persisted state across extension runtimes

Rules:

- `src/background/**` owns passive listeners and extension-level side effects that do not require page UI:
  - badge refresh
  - startup/install listeners
  - tab lifecycle listeners used only for badge maintenance
- `src/newtab/**` owns user-triggered flows tied to visible UI:
  - fetching and rendering grouped tabs
  - focusing tabs and windows
  - closing tabs
  - restoring workspaces
  - reacting to storage changes that affect the current page
- `src/utils/storage.ts` owns direct `chrome.storage.local` access.
- Presentational components never call `chrome.*` APIs directly.

### 1. Page Layer

`App.tsx` remains the page orchestrator, but its role is narrowed.

Allowed responsibilities:

- compose page sections
- hold transient page-only UI state
- wire stores and action handlers together
- coordinate page-level interaction flows

Disallowed responsibilities:

- direct storage access
- direct Chrome storage mutation logic
- direct low-level effect primitives such as raw sound/confetti calls
- embedding domain-specific transformation helpers that belong in `lib/`, `utils/`, or stores

Page-only UI state includes:

- search query
- dialog visibility
- toast visibility
- settings panel open state
- other ephemeral view state that does not persist

### 2. Store Layer

Each store owns one business domain:

- `tab-store`: open tab data, grouping, close/focus flows, reorder persistence trigger
- `saved-store`: save-for-later lifecycle and archive state
- `settings-store`: settings state and settings persistence entrypoints
- `workspace-store`: workspace CRUD and restore flows

Rules:

- stores may own domain state and domain actions
- stores must not directly call `chrome.storage.local`
- stores should not compose full `StorageSchema` snapshots themselves
- stores may call `chrome.tabs` and `chrome.windows` only for domain browser actions in the new tab runtime
- cross-domain orchestration belongs in the page layer, not inside stores
- target for this phase: stores import domain storage readers and writers, not storage internals

Current-phase exceptions must be explicit and temporary:

- if a store still imports `readStorage()` or `updateStorage()`, the spec and lint config must name that file as an approved exception
- each exception needs an exit path, for example adding `readGroupOrder()`, `readWorkspaces()`, or `writeWorkspaces()`

### 3. Storage Layer

`src/utils/storage.ts` is the only allowed adapter over `chrome.storage.local`.

Rules:

- `readStorage()` is the core storage read entrypoint used inside the storage adapter and by temporary approved exceptions only
- `updateStorage()` is the core storage write entrypoint for read-modify-write flows inside the storage adapter
- domain writers such as `writeSettings()` and `writeGroupOrder()` are preferred over raw full-schema writes
- `writeStorage()` is reserved for full replacement scenarios only:
  - migration
  - import/restore
  - controlled test setup

Public domain API direction for this phase:

- saved tabs:
  - `getSavedTabs()`
  - `saveTabForLater()`
  - `checkOffSavedTab()`
  - `dismissSavedTab()`
- settings:
  - `readSettings()`
  - `writeSettings()`
- group order:
  - `readGroupOrder()` should be added in this phase
  - `writeGroupOrder()`
- workspaces:
  - `readWorkspaces()` should be added in this phase
  - `writeWorkspaces()` should be added in this phase

Internal-only API direction for this phase:

- `readStorage()`
- `updateStorage()`
- `writeStorage()`
- `readStorageSnapshot()`
- `persistStorage()`

Enforcement target for this phase:

- pages, components, and stores do not import `writeStorage()`
- pages, components, and stores should not import `updateStorage()` directly once the missing domain readers and writers are added
- tests may import storage internals when validating migration, concurrency, or adapter behavior
- if a temporary store exception remains, it must be called out in the lint allowlist and the architecture doc as debt, not treated as normal usage

Target direction after this phase:

- keep the current file for now
- document a future split into `storage/core` plus domain-specific writers without requiring immediate migration

### 4. Effect Layer

Side effects should be routed through named effect entrypoints instead of scattered raw calls.

Examples:

- close feedback effects: `src/lib/close-effects.ts`
- theme application flow
- badge update flow
- storage change listeners

Rule:

- UI code should express intent, not call effect primitives directly
- background-only effects stay in the background runtime instead of leaking into page components

## Component Layering Model

Components are split conceptually into four layers, even if the directory is not fully migrated yet.

### Page orchestrators

- example: `App.tsx`
- owns page composition and flow wiring

### Page sections

- examples: `DomainCard`, `DeferredColumn`, `Header`
- own a complete product section with business-shaped props

### Composite components

- examples: `TabChip`, `DeferredItem`, `SettingsPanel`, `ConfirmationDialog`
- encapsulate a stable interaction pattern
- do not import stores or storage

### Primitives

This layer is mostly missing today and should be introduced gradually.

Target primitives for the next phase:

- `IconButton`
- `TextInput`
- `Badge`
- `ActionButton`
- `SectionHeader`
- `CardSurface`

Rules:

- primitives expose visual and interaction API only
- composites may carry business-friendly props
- sections may accept full domain objects
- components must not directly perform persistence or browser API work

## Reuse Rules

A new abstraction should be created only when at least two of the following are true:

- the pattern appears in two or more places
- visual structure and interaction states match
- the behavior model is the same even if labels differ
- the extracted API remains small and coherent

Do not abstract when:

- the components only look vaguely similar
- the extracted props become a loose generic bag
- abstraction hides important domain meaning
- abstraction would force low-level components to know about stores, storage, or Chrome APIs

## Frontend Design System Direction

The design documentation should define a stable product language rather than a file inventory.

It should cover:

- product visual principles
- typography roles
- color and tone roles
- card and chip surface language
- layout rules
- motion and reduced-motion behavior
- focus, hover, and feedback states
- accessibility and contrast expectations

The existing tokens in `src/newtab/styles/global.css` remain the base system. The new documentation should define how they are used, not replace them.

## Documentation Deliverables

### 1. Frontend design document

Purpose:

- explain the visual language of Tab Out
- define layout, token, and interaction rules
- help future UI changes stay consistent

Content:

- visual goals and tone
- typography rules
- color and status semantics
- spacing, radius, and surface rules
- interaction and motion rules
- accessibility expectations
- examples of what to preserve vs what to avoid

### 2. Architecture document

Purpose:

- define the operational boundaries of page, store, storage, and effect layers
- document allowed and forbidden dependencies
- explain storage management and concurrency rules

Content:

- system overview
- runtime ownership: newtab page vs background vs shared storage
- layer responsibilities
- data flow
- storage model and safety rules
- effect routing
- import boundary rules
- migration direction for future cleanup

### 3. Component reuse document

Purpose:

- define how to classify components
- define when to reuse, when to abstract, and when not to
- identify target primitive candidates

Content:

- component layering model
- naming and placement rules
- props design rules
- reuse criteria
- anti-patterns
- target primitive backlog

## Guardrail Plan

### ESLint guardrails to add now

1. Restrict direct `chrome.storage.local` property access outside:
   - `src/utils/storage.ts`
   - `src/__tests__/**`
2. Restrict importing `writeStorage` outside:
   - `src/utils/storage.ts`
   - `src/__tests__/**`
   - future migration or import/restore files explicitly named in the allowlist
3. Restrict importing `readStorage` and `updateStorage` outside approved internal files.
   - target end state for this phase:
     - stores import only domain readers and writers
   - if that is not yet true during rollout, the allowlist must explicitly name the remaining temporary exceptions such as:
     - `src/stores/tab-store.ts`
     - `src/stores/settings-store.ts`
     - `src/stores/workspace-store.ts`
     - `src/__tests__/**`
4. Restrict importing `playCloseSound` and `shootConfetti` outside:
   - `src/lib/close-effects.ts`
   - `src/__tests__/**`
5. Restrict files under `src/newtab/components/**` from importing stores directly.
6. Restrict files under `src/newtab/components/**` from importing storage utilities directly.
7. Page orchestrator exceptions must be explicit.
   - `src/newtab/App.tsx` may import stores because it is the page orchestrator
   - this exception does not apply to `src/newtab/components/**`

The lint implementation must encode file matchers and exceptions directly. No rule should depend on an unwritten convention.

### Documentation-enforced rules

1. Every new persistent feature must declare:
   - page state
   - store state
   - persisted state
2. Every new UI component must be classified as:
   - section
   - composite
   - primitive
3. Every new side effect must have a named entrypoint rather than ad hoc direct calls.
4. Every new browser API integration must declare its owning runtime:
   - newtab page
   - store in newtab runtime
   - background service worker
   - storage adapter

### Verification guardrails

- UI-only changes: `lint + build`
- store or storage changes: `test + lint + build`
- interaction/effect changes: regression coverage or explicit justification
- token or visual system changes: manual light/dark/focus/reduced-motion review

## Implementation Plan For This Phase

1. Write the three docs using the approved target architecture above.
2. Add the minimum domain readers and writers needed to make the storage boundary enforceable:
   - `readGroupOrder()`
   - `readWorkspaces()`
   - `writeWorkspaces()`
   - or equivalent domain-safe adapters with the same boundary effect
3. Add the minimum viable ESLint guardrails with explicit matchers and allowlists.
4. Keep implementation incremental and avoid broad file reorganization.
5. Verify with `npm test`, `npm run lint`, and `npm run build`.

## Risks

### Over-documenting current flaws

If the docs only describe current implementation, they will fossilize accidental structure. The docs must separate:

- current state
- target state
- current phase constraints

### Over-enforcing too early

If lint rules are stronger than the codebase can support today, they will be ignored or bypassed. This phase should enforce the highest-signal restrictions only, and every temporary exception must be named rather than left implicit.

### Primitive explosion

If every repeated class string becomes a shared component immediately, the UI layer will become harder to work in. Primitive extraction should start with the most repeated, stable patterns only.

### Runtime blind spots

If the docs describe only the React page and ignore the background runtime, future changes will put browser listeners and badge effects in arbitrary places. The formal architecture doc must describe the full extension runtime model, not only the visible UI tree.

## Acceptance Criteria

- This spec file is the phase design doc for this architecture direction.
- Three formal docs exist:
  - frontend design
  - architecture
  - component reuse
- The architecture doc explicitly documents runtime ownership for newtab, background, and shared storage.
- Storage adapters expose the minimum domain readers and writers needed to make the lint boundary real, or any temporary exceptions are explicitly documented as debt.
- ESLint includes minimum viable architectural guardrails with explicit file scopes and allowlists.
- Existing test, lint, and build commands still pass.
