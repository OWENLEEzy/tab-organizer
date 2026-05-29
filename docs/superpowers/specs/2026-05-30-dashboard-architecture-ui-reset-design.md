# Dashboard Architecture, UI, And Storage Reset Design

## Purpose

Tab Organizer's source architecture cleanup is partially implemented. The dashboard surface has moved from `src/newtab` to `src/dashboard`, and major product-group/recovery names have already changed. The remaining work needs one source of truth for architecture boundaries, storage reset behavior, UI feature ownership, vocabulary, and verification gates.

This design intentionally chooses the thorough cleanup path:

- Use `src/dashboard` as the only React dashboard surface.
- Reset storage on schema mismatch instead of migrating old models.
- Reorganize current UI changes under feature-owned component directories.
- Remove legacy product vocabulary from current source.
- Enforce the result with ESLint, tooling tests, and `npm run check`.

## Current Problems

The current tree still has several boundary and vocabulary mismatches:

- `src/dashboard/components/organizer/DndOrganizer.tsx` still uses the generic organizer name even though it owns section drag-and-drop behavior.
- `SectionActionsDropdown` is embedded inside the DnD file instead of living as a section feature component.
- `expandedDomains` describes dashboard UI state even though the UI expands product groups.
- `noSectionOverrides` survives in pure section-organizer logic even though the current product term is `unsectionedProductKeys`.
- Storage still contains old migration concepts such as `unsortedOverrides`, `manualGroups`, `groupAssignments`, `historyCandidate`, `recoveryHistory`, `deferred`, and `workspaces`.
- `reconcileOrganizerState()` currently seeds `DEFAULT_SECTIONS` whenever `sections.length === 0`, which overwrites an intentionally persisted empty section list.
- Current dirty UI changes touch layout, settings, footer, search, CSS, and e2e tests; they should be either brought inside the architecture or rejected by gates, not left as unowned drift.

## Architecture Boundaries

The source tree should settle on this ownership model:

```text
src/
  dashboard/
    App.tsx
    controllers/
    providers/
    hooks/
    components/
      layout/
      product-groups/
      sections/
      recovery/
      tabs/
      search/
      settings/
      states/
      ui/
    lib/
    styles/
  stores/
  lib/
  utils/
  config/
  types/
  __tests__/
```

Responsibilities:

- `src/dashboard/App.tsx` composes page-level state and lazy feature components. It should not grow into a business-flow module.
- `src/dashboard/controllers/` coordinates stores, Chrome/runtime effects, dialog state, toast state, and user actions.
- `src/dashboard/components/` contains presentational UI grouped by durable feature ownership.
- `src/dashboard/hooks/` contains pure UI/DOM hooks only.
- `src/dashboard/lib/` contains dashboard-only pure projections and parsers.
- `src/stores/` contains Zustand state and app actions.
- `src/lib/` contains pure product/domain rules only.
- `src/utils/` contains Chrome/browser/storage adapters only.
- `src/config/` contains static configuration.
- `src/types/` contains current shared contracts.

Import rules:

```text
dashboard/components -> components/hooks/dashboard-lib/lib/types/config
dashboard/hooks      -> dashboard-lib/lib/types/config
dashboard/controllers -> stores/utils/lib/dashboard-lib/types/config
stores               -> lib/utils/types/config
dashboard-lib        -> lib/types/config
lib                  -> types/config only
utils                -> pure-lib/types/config only
config               -> types only
types                -> no runtime imports
```

Forbidden directions:

```text
components -> stores/controllers/utils/storage/chrome.*
hooks -> stores/utils/storage/chrome.*
stores -> dashboard/components/controllers
lib -> utils/stores/dashboard/React/Zustand/chrome.*
utils -> stores/dashboard/React/Zustand
config/types -> runtime layer
```

## Storage Reset Design

Storage uses a destructive reset strategy.

Current schema keys:

```text
schemaVersion
settings
groupOrder
sections
sectionAssignments
unsectionedProductKeys
viewMode
recoveryCandidate
recoverySnapshots
```

Deprecated keys are not read into current state:

```text
unsortedOverrides
manualGroups
groupAssignments
historyCandidate
history
recoveryHistory
deferred
workspaces
SavedTab
Workspace
```

Read behavior:

```text
readStorage()
  -> chrome.storage.local.get()
  -> if schemaVersion !== CURRENT_SCHEMA_VERSION:
       reset current schema into chrome.storage.local
       return DEFAULT_STORAGE
  -> if schemaVersion matches:
       normalize current fields only
       preserve explicit empty values
```

Default behavior:

- `DEFAULT_STORAGE.sections` should be `DEFAULT_SECTIONS`.
- A schema mismatch resets to `DEFAULT_SECTIONS`.
- A current-schema explicit `sections: []` is preserved.
- Empty arrays and empty objects in a current schema are valid user state, not a signal to reseed defaults.

Adapter boundary:

- `src/utils/storage.ts` is the only module that knows reset behavior.
- Stores and controllers should only see current schema names.
- Import/export compatibility should stop reading removed legacy model names unless a separate future product requirement explicitly reintroduces import migration.

## UI Structure

Current UI changes are in scope and may be reorganized. The final component layout should be:

```text
src/dashboard/components/
  layout/
    DashboardHeader.tsx
    DashboardShell.tsx
    UtilityPanel.tsx
  product-groups/
    ProductGroupCard.tsx
    ProductGroupTable.tsx
    product-group-icon.ts
  sections/
    DndSectionOrganizer.tsx
    SectionActionsDropdown.tsx
    SectionSwitcher.tsx
  recovery/
    RecoveryPanel.tsx
    RecoverySnapshotDetails.tsx
  search/
    SearchBar.tsx
    SortButton.tsx
    SortDropdown.tsx
    ViewToggle.tsx
  settings/
    SettingsPanel.tsx
  tabs/
    SelectionBar.tsx
    TabChip.tsx
  states/
    EmptyState.tsx
    ErrorBoundary.tsx
    LoadingState.tsx
    Toast.tsx
  ui/
    ActionButton.tsx
```

Rules:

- `DndSectionOrganizer.tsx` is the only dashboard component that may import `@dnd-kit`.
- `SectionActionsDropdown.tsx` is a section feature component, not a generic UI primitive.
- `ProductGroupCard` and `ProductGroupTable` render product groups and tabs. They do not know storage, Chrome APIs, or section mutation details.
- `SettingsPanel` receives runtime values and callbacks by props. It does not read `chrome.runtime` or stores.
- `SearchBar` and related controls render input and commands. Parsing stays in `src/dashboard/lib/search-commands.ts`.
- New UI components must avoid `any`, direct English-only hardcoded strings when i18n keys exist, old terminology, and hidden store/storage dependencies.

## Vocabulary Rules

Use these names for current product behavior:

```text
dashboard
productGroup / productGroups
productKey
expandedProductGroups
section
sectionId
unsectionedProductKeys
recoveryCandidate
recoverySnapshots
```

Allowed domain terminology:

- `tab.domain`
- `group.domain`
- `iconDomain`
- hostname/domain parsing utilities
- product rules that match hostnames or domains
- literal Chrome URL `chrome://newtab/`
- literal brand name `Google Workspace`

Forbidden current-behavior terminology:

```text
src/newtab
dev:newtab
open-space-switcher
DomainCard
tab-grouper
history-snapshots
tab-utils
DndOrganizer
components/organizer
expandedDomains
noSectionOverrides
unsortedOverrides
manualGroups
groupAssignments
historyCandidate
recoveryHistory
workspace
workspaces
deferred
SavedTab
Workspace
url-new
new-url
url2
utils2
helpers.ts
misc.ts
common.ts
```

Do not rename `tab.domain` or `group.domain` in this cleanup. That would be a deeper product identity model rewrite and is intentionally out of scope.

## Error Handling

Storage reset is explicit and narrow:

- Reset only on schema version mismatch.
- Do not reset current-schema empty arrays or objects.
- If storage read/write fails, keep the current adapter-level behavior: log a warning and return current defaults so the dashboard does not crash.
- Chrome/runtime errors stay in `utils` or `controllers`.
- Presentational components receive failure state by props and do not call runtime APIs directly.

## Testing And Gates

Focused tests should cover:

- Schema mismatch resets to current schema and removes legacy keys.
- Current-schema `sections: []` remains empty.
- Storage does not read legacy keys into current state.
- `DndSectionOrganizer` and `SectionActionsDropdown` render expected section actions.
- Product group card/table tests use product-group names.
- Recovery tests use recovery terminology only.
- Settings/search/footer UI changes still pass a11y and e2e expectations.

Governance tests should enforce:

- No `src/newtab` source path references.
- No old command id `open-space-switcher`.
- No old component/module names such as `DomainCard`, `tab-grouper`, `history-snapshots`, `DndOrganizer`, or `components/organizer`.
- No old storage/model names in current source or tests.
- No `.DS_Store` under `src/` or `docs/`.
- Old plan files stay deleted.

ESLint should enforce:

- Components cannot import stores, controllers, storage utilities, or `chrome.*`.
- Pure dashboard hooks cannot import stores, storage utilities, or `chrome.*`.
- `src/lib` cannot import `src/utils`, `src/stores`, `src/dashboard`, React, Zustand, or Chrome APIs.
- `src/utils` cannot import stores, dashboard modules, React, or Zustand.

Final gate:

```bash
npm run lint
npm run knip
npm test
npm run build
npm run check
```

`npm run check` passing is the completion standard.

## Out Of Scope

- Renaming `tab.domain` or `group.domain`.
- Introducing cloud sync, accounts, analytics, bookmarks, or task management.
- Reworking the product grouping algorithm beyond names needed for this cleanup.
- Preserving old storage models through migration.
- Keeping historical plan files as source-of-truth docs.

