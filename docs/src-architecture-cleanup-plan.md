# Tab Organizer Src Architecture Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `src` so file depth, module ownership, import chains, and legacy model removal are explicit, enforced by lint, and consistent with Tab Organizer's local-only Chrome MV3 product contract.

**Architecture:** The new architecture separates page orchestration (`newtab/controllers`), React context (`newtab/providers`), pure UI hooks (`newtab/hooks`), grouped presentational components (`newtab/components/*`), newtab-only UI projections (`newtab/lib`), pure domain logic (`lib`), and Chrome/browser adapters (`utils`). Imports flow downward only; `src/lib` is pure and cannot import `src/utils`.

**Tech Stack:** React 19, TypeScript, Zustand, Chrome MV3 APIs, Vite/CRXJS, Vitest, ESLint flat config, Stylelint, Playwright a11y/e2e.

---

## Current-State Guardrails

Before implementation, check the tree because this repo may already contain partial work from an interrupted run.

- Preserve unrelated user work. Do not overwrite existing edits unless this plan names the file and the change is required.
- `AGENTS.md` and `CLAUDE.md` are mirrors. Every doc rule change must be applied to both with semantically identical content.
- `dist/`, coverage output, and generated artifacts are not source truth.
- The final gate is `npm run check`. Use targeted commands while implementing.
- The plan assumes destructive storage reset is accepted: upgrading may clear local settings, sections, assignments, view mode, and history.

---

## Target File Structure

The directory rule is: add depth only when it expresses a stable responsibility group. Single-purpose files stay shallow unless they belong to an existing group.

```text
src/
  background/
    dashboard.ts
    index.ts

  newtab/
    index.html
    main.tsx
    App.tsx

    controllers/
      useDashboardController.ts
      useTabActions.ts
      useSettingsImportExport.ts

    providers/
      I18nProvider.tsx

    hooks/
      useChromeStorage.ts
      useI18n.ts
      useKeyboard.ts
      useTheme.ts
      useUIState.ts

    components/
      layout/
        DashboardHeader.tsx
        DashboardShell.tsx
        UtilityPanel.tsx
      ui/
        ActionButton.tsx
      tabs/
        DomainCard.tsx
        ProductTable.tsx
        SelectionBar.tsx
        TabChip.tsx
      organizer/
        DndOrganizer.tsx
        SectionSwitcher.tsx
      settings/
        SettingsPanel.tsx
      history/
        HistoryPanel.tsx
        HistorySnapshotDetails.tsx
      search/
        SearchBar.tsx
        SortDropdown.tsx
        ViewToggle.tsx
      states/
        EmptyState.tsx
        ErrorBoundary.tsx
        LoadingState.tsx
        Toast.tsx

    lib/
      date-formatters.ts
      motion.ts
      search-commands.ts
      settings-import.ts
      visible-tabs.ts

    styles/
      fonts.css
      global.css

  stores/
    settings-store.ts
    tab-store.ts

  lib/
    close-effects.ts
    confetti.ts
    constants.ts
    duplicate-analysis.ts
    duplicate-tabs.ts
    group-favicon.ts
    history-snapshots.ts
    i18n/
      locales.ts
    product-key.ts
    staleness.ts
    tab-grouper.ts
    title-cleaner.ts
    url-rules.ts

  utils/
    badge.ts
    browser-url.ts
    error.ts
    favicon.ts
    storage.ts

  config/
    custom-groups.ts
    friendly-domains.ts
    group-sort.ts
    products.ts
    sections.ts
    themes.ts

  types/
    index.ts

  __tests__/
```

### Responsibility Map

- `src/newtab/controllers/*`: page-level orchestration. May import stores, `src/utils`, `src/lib`, `src/newtab/lib`, `src/types`, `src/config`, and React hooks. May coordinate toast/dialog state and Chrome runtime messages.
- `src/newtab/providers/*`: React context providers. May import stores only when the provider owns that subscription.
- `src/newtab/hooks/*`: pure UI/DOM hooks. No stores, no storage, no Chrome APIs.
- `src/newtab/components/*`: presentational UI. Props in, callbacks out. No stores, no storage, no Chrome APIs, no controllers.
- `src/newtab/lib/*`: newtab-only pure UI projection and parsing helpers. No stores, no Chrome APIs.
- `src/stores/*`: Zustand app state/actions. May call domain logic and adapters. No React components or controller imports.
- `src/lib/*`: pure product/domain logic. Only imports `src/types` and `src/config`.
- `src/utils/*`: Chrome/browser/platform adapters. Only imports `src/types` and `src/config`.
- `src/config/*`: static configuration. Only type imports if needed.
- `src/types/*`: current product contract types. No runtime imports.

---

## File Split Inventory

### Create

- `src/newtab/controllers/useDashboardController.ts`: moved controller from `useAppLogic`; owns fetch/init, derived dashboard state, keyboard coordination, section switcher focus, and handler aggregation.
- `src/newtab/controllers/useTabActions.ts`: moved action controller from `useTabHandlers`; owns close/focus/select/section action handlers and effects orchestration.
- `src/newtab/controllers/useSettingsImportExport.ts`: settings JSON import/export orchestration currently embedded in `App.tsx`.
- `src/newtab/providers/I18nProvider.tsx`: subscribes to settings store language and exposes `useI18n` context values.
- `src/newtab/lib/search-commands.ts`: pure search command parser and section target resolver currently embedded in `useAppLogic`.
- `src/lib/url-rules.ts`: pure URL/domain/internal-page rules currently mixed in `utils/url.ts`.
- `src/utils/browser-url.ts`: browser/Chrome URL adapter rules, including Tab Organizer extension-page detection that needs `chrome.runtime.getURL`.
- `src/lib/duplicate-analysis.ts`: `analyzeDuplicates`.
- `src/lib/staleness.ts`: `isTabStale`.
- `src/lib/product-key.ts`: `getProductKey`.
- `src/lib/group-favicon.ts`: `getGroupFaviconUrl`.

### Move

- `src/newtab/hooks/useAppLogic.ts` -> `src/newtab/controllers/useDashboardController.ts`.
- `src/newtab/hooks/useTabHandlers.ts` -> `src/newtab/controllers/useTabActions.ts`.
- `src/newtab/components/DomainCard.tsx` -> `src/newtab/components/tabs/DomainCard.tsx`.
- `src/newtab/components/ProductTable.tsx` -> `src/newtab/components/tabs/ProductTable.tsx`.
- `src/newtab/components/SelectionBar.tsx` -> `src/newtab/components/tabs/SelectionBar.tsx`.
- `src/newtab/components/TabChip.tsx` -> `src/newtab/components/tabs/TabChip.tsx`.
- `src/newtab/components/DndOrganizer.tsx` -> `src/newtab/components/organizer/DndOrganizer.tsx`.
- `src/newtab/components/SectionSwitcher.tsx` -> `src/newtab/components/organizer/SectionSwitcher.tsx`.
- `src/newtab/components/SettingsPanel.tsx` -> `src/newtab/components/settings/SettingsPanel.tsx`.
- `src/newtab/components/HistoryPanel.tsx` -> `src/newtab/components/history/HistoryPanel.tsx`.
- `src/newtab/components/HistorySnapshotDetails.tsx` -> `src/newtab/components/history/HistorySnapshotDetails.tsx`.
- `src/newtab/components/SearchBar.tsx` -> `src/newtab/components/search/SearchBar.tsx`.
- `src/newtab/components/SortDropdown.tsx` -> `src/newtab/components/search/SortDropdown.tsx`.
- `src/newtab/components/ViewToggle.tsx` -> `src/newtab/components/search/ViewToggle.tsx`.
- `src/newtab/components/EmptyState.tsx` -> `src/newtab/components/states/EmptyState.tsx`.
- `src/newtab/components/ErrorBoundary.tsx` -> `src/newtab/components/states/ErrorBoundary.tsx`.
- `src/newtab/components/LoadingState.tsx` -> `src/newtab/components/states/LoadingState.tsx`.
- `src/newtab/components/Toast.tsx` -> `src/newtab/components/states/Toast.tsx`.

### Delete

- `src/newtab/hooks/useAppLogic.ts`.
- `src/newtab/hooks/useTabHandlers.ts`.
- `src/lib/tab-utils.ts`.
- `src/utils/url.ts` after pure rules move to `src/lib/url-rules.ts` and Chrome-dependent pieces move to `src/utils/browser-url.ts`.
- `src/stores/workspace-store.ts`.
- `src/__tests__/workspace-store.test.ts`.
- Workspace/saved-for-later blocks inside `src/__tests__/store-rollbacks.test.ts`, `src/__tests__/storage.test.ts`, `src/__tests__/storage-extra.test.ts`, and `src/__tests__/factories.ts`.
- `.DS_Store` files under `src/`.

### Modify

- `AGENTS.md` and `CLAUDE.md`: add identical source-layout, import-chain, `lib` vs `utils`, and lint guardrail rules.
- `eslint.config.js`: enforce import chains and Chrome/store/storage access restrictions.
- `src/newtab/App.tsx`: import new controller/provider/component paths; remove embedded import/export logic; receive settings import/export controller.
- `src/newtab/main.tsx`: wrap `App` with `I18nProvider` if provider is app-root level.
- `src/newtab/hooks/useI18n.ts`: read context only; no store import.
- `src/newtab/components/settings/SettingsPanel.tsx`: receive `appVersion` prop; remove `chrome.runtime` access.
- `src/stores/tab-store.ts`, `src/background/index.ts`, `src/lib/history-snapshots.ts`, `src/lib/tab-grouper.ts`: replace `utils/url` and `tab-utils` imports.
- `src/utils/storage.ts`: remove `SavedTab`, `Workspace`, `deferred`, `workspaces`; reset storage schema destructively on schema mismatch.
- `src/types/index.ts`: remove `SavedTab`, `Workspace`, `SavedState`, `WorkspaceState`, and `StorageSchema.deferred/workspaces`.
- Tests that import moved files.

---

## Task 1: Document Architecture Rules

**Files:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Test: none

- [ ] **Step 1: Add source layout rules to `AGENTS.md`**

Add this content under `## Basic Architecture`, after the existing source layout block:

```markdown
Source placement rules:

- Use shallow files when a source has one clear responsibility and no stable peer group.
- Use subdirectories only when depth expresses a durable responsibility group.
- `src/newtab/controllers/` owns page-level orchestration and may coordinate stores, Chrome runtime messages, toast/dialog state, and user actions.
- `src/newtab/hooks/` is for pure UI/DOM hooks only. Hooks in this directory must not import stores, storage utilities, or Chrome APIs.
- `src/newtab/components/` is grouped by UI responsibility: `layout`, `ui`, `tabs`, `organizer`, `settings`, `history`, `search`, and `states`.
- `src/newtab/lib/` is for newtab-only pure UI projections and parsers.
- `src/lib/` is pure product/domain logic. It must not import `src/utils`, React, Zustand, DOM, storage, or Chrome APIs.
- `src/utils/` is for Chrome/browser/platform adapters. It must not import stores, newtab modules, controllers, or components.
```

- [ ] **Step 2: Add import-chain rules to `AGENTS.md`**

Add this content under `## Architecture Ownership`:

```markdown
Allowed import chains:

```text
App -> controllers/providers/components
controllers -> stores/newtab-lib/lib/utils/types/config
providers -> stores/lib/types/config
components -> components/hooks/newtab-lib/lib/types/config
stores -> lib/utils/types/config
newtab-lib -> lib/types/config
lib -> types/config only
utils -> types/config only
config -> types only
types -> no runtime imports
```

Forbidden import chains:

```text
components -> stores/controllers/utils/storage/chrome.*
hooks -> stores/utils/storage/chrome.*
lib -> utils/stores/newtab/React/Zustand/chrome.*
utils -> stores/newtab/components/controllers/React/Zustand
stores -> newtab/components/controllers
config/types -> runtime layer
```
```

- [ ] **Step 3: Mirror the same changes in `CLAUDE.md`**

Copy the exact semantic content from Steps 1 and 2 into `CLAUDE.md`.

- [ ] **Step 4: Verify mirror status**

Run:

```bash
cmp -s AGENTS.md CLAUDE.md; echo $?
```

Expected:

```text
0
```

- [ ] **Step 5: Commit documentation checkpoint**

```bash
git add AGENTS.md CLAUDE.md docs/src-architecture-cleanup-plan.md
git commit -m "docs: define src architecture boundaries"
```

---

## Task 2: Add ESLint Architecture Guardrails

**Files:**
- Modify: `eslint.config.js`
- Modify: `src/__tests__/tooling-gates.test.ts`
- Test: `npm run lint`
- Test: `npm test -- src/__tests__/tooling-gates.test.ts`

- [ ] **Step 1: Add tooling-gate tests for lint architecture text**

Append tests to `src/__tests__/tooling-gates.test.ts`:

```ts
import { readFileSync } from 'node:fs';

describe('architecture lint guardrails', () => {
  const eslintConfig = readFileSync('eslint.config.js', 'utf8');

  it('prevents presentational components from importing stores, controllers, storage, or chrome APIs', () => {
    expect(eslintConfig).toContain("files: ['src/newtab/components/**/*.tsx']");
    expect(eslintConfig).toContain("group: ['**/stores/*']");
    expect(eslintConfig).toContain("group: ['**/newtab/controllers/*', '**/controllers/*']");
    expect(eslintConfig).toContain("group: ['**/utils/storage']");
    expect(eslintConfig).toContain("MemberExpression[object.name='chrome']");
  });

  it('keeps pure newtab hooks free of stores, storage, and chrome APIs', () => {
    expect(eslintConfig).toContain("files: ['src/newtab/hooks/**/*.{ts,tsx}']");
    expect(eslintConfig).toContain("group: ['**/stores/*']");
    expect(eslintConfig).toContain("group: ['**/utils/storage']");
  });

  it('keeps src/lib pure and independent from utils and app layers', () => {
    expect(eslintConfig).toContain("files: ['src/lib/**/*.{ts,tsx}']");
    expect(eslintConfig).toContain("group: ['../utils/*', '**/utils/*']");
    expect(eslintConfig).toContain("group: ['../stores/*', '**/stores/*']");
    expect(eslintConfig).toContain("group: ['../newtab/*', '**/newtab/*']");
  });

  it('keeps src/utils as adapter layer without app imports', () => {
    expect(eslintConfig).toContain("files: ['src/utils/**/*.{ts,tsx}']");
    expect(eslintConfig).toContain("group: ['../stores/*', '**/stores/*']");
    expect(eslintConfig).toContain("group: ['../newtab/*', '**/newtab/*']");
  });
});
```

- [ ] **Step 2: Run the tooling-gate test and verify it fails**

Run:

```bash
npm test -- src/__tests__/tooling-gates.test.ts
```

Expected: FAIL because the new lint rule strings are not all present yet.

- [ ] **Step 3: Add ESLint component restrictions**

In `eslint.config.js`, add or replace component architecture rules with:

```js
{
  files: ['src/newtab/components/**/*.tsx'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/stores/*'],
            message: 'Components must not import stores. Pass data and callbacks from controllers/App.',
          },
          {
            group: ['**/newtab/controllers/*', '**/controllers/*'],
            message: 'Components must not import controllers. Controllers compose components, never the reverse.',
          },
          {
            group: ['**/utils/storage'],
            message: 'Components must not import storage utilities. Use props and controller actions.',
          },
        ],
      },
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector: "MemberExpression[object.name='chrome']",
        message: 'Components must not access chrome.* APIs. Route Chrome interactions through controllers or stores.',
      },
      {
        selector: "MemberExpression[object.object.name='chrome']",
        message: 'Components must not access chrome.* APIs. Route Chrome interactions through controllers or stores.',
      },
    ],
  },
}
```

- [ ] **Step 4: Add ESLint hook restrictions**

Add:

```js
{
  files: ['src/newtab/hooks/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['**/stores/*'],
            message: 'Pure newtab hooks must not import stores. Move orchestration to src/newtab/controllers.',
          },
          {
            group: ['**/utils/storage'],
            message: 'Pure newtab hooks must not import storage utilities. Move persistence orchestration to controllers or stores.',
          },
        ],
      },
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector: "MemberExpression[object.name='chrome']",
        message: 'Pure newtab hooks must not access chrome.* APIs. Move runtime coordination to controllers.',
      },
      {
        selector: "MemberExpression[object.object.name='chrome']",
        message: 'Pure newtab hooks must not access chrome.* APIs. Move runtime coordination to controllers.',
      },
    ],
  },
}
```

- [ ] **Step 5: Add ESLint `lib` restrictions**

Add:

```js
{
  files: ['src/lib/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['../utils/*', '**/utils/*'],
            message: 'src/lib is pure domain logic and must not import src/utils adapters.',
          },
          {
            group: ['../stores/*', '**/stores/*'],
            message: 'src/lib must not import stores.',
          },
          {
            group: ['../newtab/*', '**/newtab/*'],
            message: 'src/lib must not import newtab modules.',
          },
          {
            group: ['react', 'react-dom', 'zustand'],
            message: 'src/lib must stay framework-independent.',
          },
        ],
      },
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector: "MemberExpression[object.name='chrome']",
        message: 'src/lib must not access chrome.* APIs.',
      },
      {
        selector: "MemberExpression[object.object.name='chrome']",
        message: 'src/lib must not access chrome.* APIs.',
      },
    ],
  },
}
```

- [ ] **Step 6: Add ESLint `utils` restrictions**

Add:

```js
{
  files: ['src/utils/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['../stores/*', '**/stores/*'],
            message: 'src/utils is an adapter layer and must not import stores.',
          },
          {
            group: ['../newtab/*', '**/newtab/*'],
            message: 'src/utils is an adapter layer and must not import newtab modules.',
          },
          {
            group: ['react', 'react-dom', 'zustand'],
            message: 'src/utils must stay framework-independent.',
          },
        ],
      },
    ],
  },
}
```

- [ ] **Step 7: Run targeted tests and lint**

Run:

```bash
npm test -- src/__tests__/tooling-gates.test.ts
npm run lint
```

Expected: tooling-gates PASS. `npm run lint` may fail on existing boundary violations; those failures are expected until later tasks remove the violations.

- [ ] **Step 8: Commit lint checkpoint**

```bash
git add eslint.config.js src/__tests__/tooling-gates.test.ts
git commit -m "test: enforce src architecture lint guardrails"
```

---

## Task 3: Split Pure URL Rules from Browser URL Adapters

**Files:**
- Create: `src/lib/url-rules.ts`
- Create: `src/utils/browser-url.ts`
- Modify: `src/utils/url.ts`
- Modify: `src/background/index.ts`
- Modify: `src/lib/history-snapshots.ts`
- Modify: `src/lib/tab-grouper.ts`
- Modify: `src/stores/tab-store.ts`
- Modify: `src/newtab/controllers/useDashboardController.ts`
- Modify: `src/__tests__/url.test.ts`
- Modify: `src/__tests__/url-extra.test.ts`
- Test: `npm test -- src/__tests__/url.test.ts src/__tests__/url-extra.test.ts src/__tests__/history-snapshots.test.ts src/__tests__/tab-grouper.test.ts`

- [ ] **Step 1: Create failing tests for pure URL rules**

Update `src/__tests__/url.test.ts` imports:

```ts
import { isRealTab, sanitizeUrl, getHostname, getTabDomain } from '../lib/url-rules';
```

Update `src/__tests__/url-extra.test.ts` imports:

```ts
import { getTabDomain } from '../lib/url-rules';
import { isTabOrganizerPage } from '../utils/browser-url';
```

- [ ] **Step 2: Run URL tests and verify they fail**

Run:

```bash
npm test -- src/__tests__/url.test.ts src/__tests__/url-extra.test.ts
```

Expected: FAIL because `src/lib/url-rules.ts` and `src/utils/browser-url.ts` do not exist yet.

- [ ] **Step 3: Create `src/lib/url-rules.ts`**

Move pure functions from `src/utils/url.ts` into `src/lib/url-rules.ts`:

```ts
export function isRealTab(url: string): boolean {
  if (!url) return false;
  return !(
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('devtools://')
  );
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url;
  }
}

export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export function getTabDomain(url: string): string {
  const hostname = getHostname(url);
  return hostname.replace(/^www\./, '').replace(/^m\./, '');
}

export function isExtensionPageUrl(url: string, extensionBaseUrl: string): boolean {
  if (!url || !extensionBaseUrl) return false;
  return url.startsWith(extensionBaseUrl);
}
```

If the current `src/utils/url.ts` implementations differ, preserve current behavior exactly and only move code.

- [ ] **Step 4: Create `src/utils/browser-url.ts`**

```ts
import { isExtensionPageUrl } from '../lib/url-rules';

export function isTabOrganizerPage(url: string): boolean {
  if (typeof chrome === 'undefined' || !chrome.runtime?.getURL) return false;
  return isExtensionPageUrl(url, chrome.runtime.getURL(''));
}
```

- [ ] **Step 5: Replace source imports**

Use these replacements:

```text
src/background/index.ts:
  getTabDomain, isRealTab -> ../lib/url-rules

src/lib/history-snapshots.ts:
  getTabDomain, isRealTab -> ./url-rules

src/lib/tab-grouper.ts:
  getTabDomain -> ./url-rules

src/stores/tab-store.ts:
  getTabDomain, isRealTab -> ../lib/url-rules
  isTabOrganizerPage -> ../utils/browser-url

src/newtab/controllers/useDashboardController.ts:
  isTabOrganizerPage -> ../../utils/browser-url

src/newtab/components/tabs/TabChip.tsx:
  getHostname, sanitizeUrl -> ../../../lib/url-rules
```

- [ ] **Step 6: Preserve `src/utils/url.ts` as a compatibility barrel only temporarily**

For one task only, leave:

```ts
export { getHostname, getTabDomain, isExtensionPageUrl, isRealTab, sanitizeUrl } from '../lib/url-rules';
export { isTabOrganizerPage } from './browser-url';
```

Task 12 removes this file once all imports are gone.

- [ ] **Step 7: Run URL and affected domain tests**

Run:

```bash
npm test -- src/__tests__/url.test.ts src/__tests__/url-extra.test.ts src/__tests__/history-snapshots.test.ts src/__tests__/tab-grouper.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit URL split**

```bash
git add src/lib/url-rules.ts src/utils/browser-url.ts src/utils/url.ts src/background/index.ts src/lib/history-snapshots.ts src/lib/tab-grouper.ts src/stores/tab-store.ts src/newtab/controllers/useDashboardController.ts src/__tests__/url.test.ts src/__tests__/url-extra.test.ts
git commit -m "refactor: split pure url rules from browser adapters"
```

---

## Task 4: Split `src/lib/tab-utils.ts`

**Files:**
- Create: `src/lib/duplicate-analysis.ts`
- Create: `src/lib/staleness.ts`
- Create: `src/lib/product-key.ts`
- Create: `src/lib/group-favicon.ts`
- Modify: `src/lib/tab-grouper.ts`
- Modify: `src/newtab/lib/visible-tabs.ts`
- Modify: `src/newtab/controllers/useDashboardController.ts`
- Modify: `src/newtab/controllers/useTabActions.ts`
- Modify: `src/newtab/components/tabs/DomainCard.tsx`
- Modify: `src/newtab/components/tabs/ProductTable.tsx`
- Modify: `src/__tests__/tab-utils.test.ts`
- Test: `npm test -- src/__tests__/tab-utils.test.ts src/__tests__/visible-tabs.test.ts src/__tests__/tab-grouper.test.ts`

- [ ] **Step 1: Update tests to import split modules**

Replace `src/__tests__/tab-utils.test.ts` imports with:

```ts
import { analyzeDuplicates } from '../lib/duplicate-analysis';
import { isTabStale } from '../lib/staleness';
import { getGroupFaviconUrl } from '../lib/group-favicon';
import { getProductKey } from '../lib/product-key';
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm test -- src/__tests__/tab-utils.test.ts
```

Expected: FAIL because split modules do not exist yet.

- [ ] **Step 3: Create `src/lib/duplicate-analysis.ts`**

Move `analyzeDuplicates` and its interface from `src/lib/tab-utils.ts`:

```ts
import type { Tab } from '../types';

export interface DuplicateAnalysis {
  duplicateCount: number;
  hasDuplicates: boolean;
  duplicateUrls: string[];
  duplicateTabs: Tab[];
  dedupedTabs: Tab[];
}

export function analyzeDuplicates(tabs: readonly Tab[]): DuplicateAnalysis {
  const urlCounts = new Map<string, number>();
  for (const tab of tabs) {
    urlCounts.set(tab.url, (urlCounts.get(tab.url) ?? 0) + 1);
  }

  const duplicateUrls: string[] = [];
  const duplicateTabs: Tab[] = [];
  const dedupedTabs: Tab[] = [];
  let duplicateCount = 0;

  for (const [url, count] of urlCounts.entries()) {
    if (count > 1) {
      duplicateUrls.push(url);
      duplicateCount += count - 1;
    }
  }

  const seen = new Set<string>();
  for (const tab of tabs) {
    const count = urlCounts.get(tab.url)!;
    if (count > 1) duplicateTabs.push(tab);
    if (!seen.has(tab.url)) {
      dedupedTabs.push(tab);
      seen.add(tab.url);
    }
  }

  return { duplicateCount, hasDuplicates: duplicateCount > 0, duplicateUrls, duplicateTabs, dedupedTabs };
}
```

- [ ] **Step 4: Create `src/lib/staleness.ts`**

```ts
import type { Tab } from '../types';

export function isTabStale(tab: Tab, now: number, thresholdDays = 3): boolean {
  if (tab.active || tab.pinned || tab.audible) return false;
  const msThreshold = thresholdDays * 24 * 60 * 60 * 1000;
  const lastAccess = tab.lastAccessed ?? now;
  return now - lastAccess > msThreshold;
}
```

- [ ] **Step 5: Create `src/lib/product-key.ts`**

```ts
export function getProductKey(group: { productKey?: string; itemKey?: string; domain: string }): string {
  return group.productKey ?? group.itemKey ?? group.domain;
}
```

- [ ] **Step 6: Create `src/lib/group-favicon.ts`**

Do not import `src/utils/favicon.ts`. Keep this pure:

```ts
import type { Tab } from '../types';

export function getGroupFaviconSource(tabs: readonly Tab[]): string {
  const firstWithFavicon = tabs.find((tab) => tab.favIconUrl.trim() !== '');
  if (firstWithFavicon) return firstWithFavicon.favIconUrl.trim();
  return tabs[0]?.url ?? '';
}
```

Then update callers that need a Chrome favicon URL to call `getFaviconUrl(getGroupFaviconSource(tabs))` from UI/controller code, or to use the raw favicon source if current UI behavior already supports it. Do not put Chrome URL building in `src/lib`.

- [ ] **Step 7: Replace imports**

Use these replacements:

```text
analyzeDuplicates -> src/lib/duplicate-analysis
isTabStale -> src/lib/staleness
getProductKey -> src/lib/product-key
getGroupFaviconUrl -> replace with getGroupFaviconSource + utils/favicon at UI layer
```

- [ ] **Step 8: Run split tests**

Run:

```bash
npm test -- src/__tests__/tab-utils.test.ts src/__tests__/visible-tabs.test.ts src/__tests__/tab-grouper.test.ts
```

Expected: PASS.

- [ ] **Step 9: Delete `src/lib/tab-utils.ts`**

Run:

```bash
rg "tab-utils" src
```

Expected: no source imports except this plan text or none. Then delete `src/lib/tab-utils.ts`.

- [ ] **Step 10: Commit tab-utils split**

```bash
git add src/lib/duplicate-analysis.ts src/lib/staleness.ts src/lib/product-key.ts src/lib/group-favicon.ts src/lib/tab-grouper.ts src/newtab/lib/visible-tabs.ts src/newtab/controllers/useDashboardController.ts src/newtab/controllers/useTabActions.ts src/newtab/components/tabs/DomainCard.tsx src/newtab/components/tabs/ProductTable.tsx src/__tests__/tab-utils.test.ts
git rm src/lib/tab-utils.ts
git commit -m "refactor: split tab utility domain modules"
```

---

## Task 5: Move Page Orchestration Hooks to Controllers

**Files:**
- Move: `src/newtab/hooks/useAppLogic.ts` -> `src/newtab/controllers/useDashboardController.ts`
- Move: `src/newtab/hooks/useTabHandlers.ts` -> `src/newtab/controllers/useTabActions.ts`
- Modify: `src/newtab/App.tsx`
- Modify: `src/__tests__/search-parsing.test.ts`
- Modify: `src/__tests__/visible-tabs.test.ts`
- Test: `npm test -- src/__tests__/search-parsing.test.ts src/__tests__/visible-tabs.test.ts src/__tests__/dashboard.test.ts`

- [ ] **Step 1: Move files and rename exported symbols**

Use non-destructive file move tooling or manual edits:

```text
useAppLogic -> useDashboardController
useTabHandlers -> useTabActions
```

- [ ] **Step 2: Update `App.tsx` import**

```ts
import { useDashboardController } from './controllers/useDashboardController';
```

Then replace:

```ts
const { state, stores, derived, handlers, dispatch } = useAppLogic();
```

with:

```ts
const { state, stores, derived, handlers, dispatch } = useDashboardController();
```

- [ ] **Step 3: Update test imports**

`src/__tests__/search-parsing.test.ts`:

```ts
import { parseSearchQuery, resolveSectionQueryTarget } from '../newtab/lib/search-commands';
```

`src/__tests__/visible-tabs.test.ts`:

```ts
import { duplicateTabIdsForProducts, staleTabUrlsForProducts } from '../newtab/controllers/useTabActions';
```

- [ ] **Step 4: Run targeted tests**

Run:

```bash
npm test -- src/__tests__/search-parsing.test.ts src/__tests__/visible-tabs.test.ts src/__tests__/dashboard.test.ts
```

Expected: PASS.

- [ ] **Step 5: Confirm hooks directory purity**

Run:

```bash
rg -n "stores|utils/storage|chrome\\." src/newtab/hooks
```

Expected: no matches except comments that do not import or call these APIs.

- [ ] **Step 6: Commit controller move**

```bash
git add src/newtab/App.tsx src/newtab/controllers/useDashboardController.ts src/newtab/controllers/useTabActions.ts src/__tests__/search-parsing.test.ts src/__tests__/visible-tabs.test.ts
git rm src/newtab/hooks/useAppLogic.ts src/newtab/hooks/useTabHandlers.ts
git commit -m "refactor: move dashboard orchestration into controllers"
```

---

## Task 6: Extract Search Commands to Newtab Lib

**Files:**
- Create: `src/newtab/lib/search-commands.ts`
- Modify: `src/newtab/controllers/useDashboardController.ts`
- Modify: `src/__tests__/search-parsing.test.ts`
- Test: `npm test -- src/__tests__/search-parsing.test.ts`

- [ ] **Step 1: Move parser tests to new module import**

`src/__tests__/search-parsing.test.ts`:

```ts
import { parseSearchQuery, resolveSectionQueryTarget } from '../newtab/lib/search-commands';
```

- [ ] **Step 2: Run parser tests and verify failure**

Run:

```bash
npm test -- src/__tests__/search-parsing.test.ts
```

Expected: FAIL until `search-commands.ts` exists.

- [ ] **Step 3: Create `src/newtab/lib/search-commands.ts`**

Move `CommandParsed`, `parseSearchQuery`, and `resolveSectionQueryTarget` from the controller:

```ts
import type { Section } from '../../types';

export interface CommandParsed {
  type: 'dupes' | 'stale' | 'section' | 'text';
  sectionToken?: string;
  textQuery: string;
}

type SectionTarget = Pick<Section, 'id' | 'name' | 'order'>;

export function parseSearchQuery(query: string): CommandParsed {
  const trimmed = query.trim().toLowerCase();

  const dupeMatch = trimmed.match(/^(\/?dupes?)(?:\s+(.*))?$/);
  if (dupeMatch) {
    const term = dupeMatch[1];
    if (term.startsWith('/') || term === 'dupe' || term === 'dupes') {
      return { type: 'dupes', textQuery: (dupeMatch[2] || '').trim() };
    }
  }

  const staleMatch = trimmed.match(/^(\/?stales?)(?:\s+(.*))?$/);
  if (staleMatch) {
    const term = staleMatch[1];
    if (term.startsWith('/') || term === 'stale' || term === 'stales') {
      return { type: 'stale', textQuery: (staleMatch[2] || '').trim() };
    }
  }

  const sectionMatch = trimmed.match(/^(\/?(?:section|sec|s):)([^\s]*)(?:\s+(.*))?$/);
  if (sectionMatch) {
    return {
      type: 'section',
      sectionToken: sectionMatch[2] || '',
      textQuery: (sectionMatch[3] || '').trim(),
    };
  }

  return { type: 'text', textQuery: trimmed };
}

export function resolveSectionQueryTarget(token: string, sections: SectionTarget[]): SectionTarget | null {
  const normalizedToken = token.trim().toLowerCase();
  if (!normalizedToken) return null;

  const idMatch = sections.find((section) => section.id.toLowerCase() === normalizedToken);
  if (idMatch) return idMatch;

  return [...sections]
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    .find((section) => section.name.trim().toLowerCase().includes(normalizedToken)) ?? null;
}
```

- [ ] **Step 4: Import parser from controller**

In `src/newtab/controllers/useDashboardController.ts`:

```ts
import { parseSearchQuery, resolveSectionQueryTarget } from '../lib/search-commands';
```

Delete local parser definitions.

- [ ] **Step 5: Run parser tests**

Run:

```bash
npm test -- src/__tests__/search-parsing.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit search command split**

```bash
git add src/newtab/lib/search-commands.ts src/newtab/controllers/useDashboardController.ts src/__tests__/search-parsing.test.ts
git commit -m "refactor: extract search command parsing"
```

---

## Task 7: Add I18n Provider Boundary

**Files:**
- Create: `src/newtab/providers/I18nProvider.tsx`
- Modify: `src/newtab/hooks/useI18n.ts`
- Modify: `src/newtab/main.tsx`
- Modify: `src/__tests__/i18n.test.ts`
- Test: `npm test -- src/__tests__/i18n.test.ts src/__tests__/dashboard-header.test.tsx`

- [ ] **Step 1: Add provider behavior tests**

Update or add to `src/__tests__/i18n.test.ts`:

```tsx
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '../newtab/providers/I18nProvider';
import { useI18n } from '../newtab/hooks/useI18n';
import { useSettingsStore } from '../stores/settings-store';

function Probe(): React.ReactElement {
  const { t, locale } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span>{t('titleOpenTabs')}</span>
    </div>
  );
}

it('provides translations from context instead of component store subscriptions', () => {
  useSettingsStore.setState((state) => ({
    ...state,
    settings: { ...state.settings, language: 'en' },
  }));

  render(
    <I18nProvider>
      <Probe />
    </I18nProvider>,
  );

  expect(screen.getByTestId('locale')).toHaveTextContent('en');
  expect(screen.getByText('Open tabs')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run i18n tests and verify failure**

Run:

```bash
npm test -- src/__tests__/i18n.test.ts
```

Expected: FAIL because `I18nProvider` does not exist yet.

- [ ] **Step 3: Create `src/newtab/providers/I18nProvider.tsx`**

```tsx
import React, { createContext, useContext, useMemo } from 'react';
import { useSettingsStore } from '../../stores/settings-store';
import { locales } from '../../lib/i18n/locales';
import type { TranslationKey } from '../hooks/useI18n';

interface I18nContextValue {
  locale: 'en' | 'zh';
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveLocale(language: 'en' | 'zh' | 'system' | undefined): 'en' | 'zh' {
  if (language === 'en' || language === 'zh') return language;
  if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh')) return 'zh';
  return 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const language = useSettingsStore((state) => state.settings.language);
  const locale = useMemo(() => resolveLocale(language), [language]);

  const value = useMemo<I18nContextValue>(() => {
    const dictionary = locales[locale];
    return {
      locale,
      t: (key, params) => {
        const template = dictionary[key] ?? locales.en[key] ?? key;
        if (!params) return template;
        return Object.entries(params).reduce(
          (text, [paramKey, paramValue]) => text.replaceAll(`{${paramKey}}`, String(paramValue)),
          template,
        );
      },
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18nContext(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return value;
}
```

- [ ] **Step 4: Update `src/newtab/hooks/useI18n.ts`**

Keep the existing `TranslationKey` export, but remove store imports:

```ts
import { locales } from '../../lib/i18n/locales';
import { useI18nContext } from '../providers/I18nProvider';

export type TranslationKey = keyof typeof locales.en;

export function useI18n() {
  return useI18nContext();
}
```

- [ ] **Step 5: Wrap app in provider**

In `src/newtab/main.tsx`, wrap `App`:

```tsx
import { I18nProvider } from './providers/I18nProvider';

root.render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>,
);
```

Preserve the current root creation code.

- [ ] **Step 6: Run i18n and dashboard header tests**

Run:

```bash
npm test -- src/__tests__/i18n.test.ts src/__tests__/dashboard-header.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Confirm hook purity**

Run:

```bash
rg -n "stores|useSettingsStore|chrome\\.|utils/storage" src/newtab/hooks
```

Expected: no matches.

- [ ] **Step 8: Commit i18n provider**

```bash
git add src/newtab/providers/I18nProvider.tsx src/newtab/hooks/useI18n.ts src/newtab/main.tsx src/__tests__/i18n.test.ts
git commit -m "refactor: route translations through i18n provider"
```

---

## Task 8: Move Components into Responsibility Groups

**Files:**
- Move files listed in the Move section.
- Modify imports in `src/newtab/App.tsx`, `src/newtab/components/layout/DashboardHeader.tsx`, moved components, and tests.
- Test: `npm test -- src/__tests__/dashboard-header.test.tsx src/__tests__/dashboard-reskin.test.tsx src/__tests__/history-panel.test.tsx src/__tests__/tab-chip.selection.test.tsx`

- [ ] **Step 1: Move files with git-aware moves**

Use `git mv` for tracked files:

```bash
mkdir -p src/newtab/components/{tabs,organizer,settings,history,search,states}
git mv src/newtab/components/DomainCard.tsx src/newtab/components/tabs/DomainCard.tsx
git mv src/newtab/components/ProductTable.tsx src/newtab/components/tabs/ProductTable.tsx
git mv src/newtab/components/SelectionBar.tsx src/newtab/components/tabs/SelectionBar.tsx
git mv src/newtab/components/TabChip.tsx src/newtab/components/tabs/TabChip.tsx
git mv src/newtab/components/DndOrganizer.tsx src/newtab/components/organizer/DndOrganizer.tsx
git mv src/newtab/components/SectionSwitcher.tsx src/newtab/components/organizer/SectionSwitcher.tsx
git mv src/newtab/components/SettingsPanel.tsx src/newtab/components/settings/SettingsPanel.tsx
git mv src/newtab/components/HistoryPanel.tsx src/newtab/components/history/HistoryPanel.tsx
git mv src/newtab/components/HistorySnapshotDetails.tsx src/newtab/components/history/HistorySnapshotDetails.tsx
git mv src/newtab/components/SearchBar.tsx src/newtab/components/search/SearchBar.tsx
git mv src/newtab/components/SortDropdown.tsx src/newtab/components/search/SortDropdown.tsx
git mv src/newtab/components/ViewToggle.tsx src/newtab/components/search/ViewToggle.tsx
git mv src/newtab/components/EmptyState.tsx src/newtab/components/states/EmptyState.tsx
git mv src/newtab/components/ErrorBoundary.tsx src/newtab/components/states/ErrorBoundary.tsx
git mv src/newtab/components/LoadingState.tsx src/newtab/components/states/LoadingState.tsx
git mv src/newtab/components/Toast.tsx src/newtab/components/states/Toast.tsx
```

- [ ] **Step 2: Update `App.tsx` imports**

Use these paths:

```ts
import { ErrorBoundary } from './components/states/ErrorBoundary';
import { LoadingState } from './components/states/LoadingState';
import { ProductTableMemo as ProductTable } from './components/tabs/ProductTable';
import { SelectionBar } from './components/tabs/SelectionBar';
import { EmptyState } from './components/states/EmptyState';
import { Toast } from './components/states/Toast';
import { HistoryPanel } from './components/history/HistoryPanel';
```

Update lazy imports:

```ts
const SettingsPanel = React.lazy(() =>
  import('./components/settings/SettingsPanel').then((module) => ({ default: module.SettingsPanel })),
);

const DndOrganizer = React.lazy(() =>
  import('./components/organizer/DndOrganizer').then((module) => ({ default: module.DndOrganizer })),
);
```

- [ ] **Step 3: Update layout imports**

`src/newtab/components/layout/DashboardHeader.tsx`:

```ts
import { SearchBar } from '../search/SearchBar';
import { ViewToggle } from '../search/ViewToggle';
import { SortDropdown } from '../search/SortDropdown';
import { SectionSwitcher } from '../organizer/SectionSwitcher';
```

- [ ] **Step 4: Update moved component relative imports**

Examples:

```text
components/tabs/DomainCard.tsx:
  TabChip -> ./TabChip
  visible-tabs -> ../../lib/visible-tabs
  types -> ../../../types
  lib modules -> ../../../lib/*

components/organizer/DndOrganizer.tsx:
  DomainCard -> ../tabs/DomainCard
  types -> ../../../types

components/history/HistoryPanel.tsx:
  UtilityPanel -> ../layout/UtilityPanel
  ActionButton -> ../ui/ActionButton
  date-formatters -> ../../lib/date-formatters

components/settings/SettingsPanel.tsx:
  types -> ../../../types
  config/themes -> ../../../config/themes

components/search/SortDropdown.tsx:
  types -> ../../../types
```

- [ ] **Step 5: Update test imports**

Use `rg "newtab/components/" src/__tests__ tests` and update imports to the new grouped paths.

- [ ] **Step 6: Run focused component tests**

Run:

```bash
npm test -- src/__tests__/dashboard-header.test.tsx src/__tests__/dashboard-reskin.test.tsx src/__tests__/history-panel.test.tsx src/__tests__/tab-chip.selection.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit component grouping**

```bash
git add src/newtab/App.tsx src/newtab/components src/__tests__ tests
git commit -m "refactor: group newtab components by responsibility"
```

---

## Task 9: Extract Settings Import/Export Controller and Remove Chrome Runtime from SettingsPanel

**Files:**
- Create: `src/newtab/controllers/useSettingsImportExport.ts`
- Modify: `src/newtab/App.tsx`
- Modify: `src/newtab/components/settings/SettingsPanel.tsx`
- Modify: `src/__tests__/settings-import.test.ts`
- Modify: `src/__tests__/settings-panel.a11y.test.tsx`
- Test: `npm test -- src/__tests__/settings-import.test.ts src/__tests__/settings-panel.a11y.test.tsx`

- [ ] **Step 1: Add test expectation that SettingsPanel accepts version as prop**

In `src/__tests__/settings-panel.a11y.test.tsx`, when rendering `SettingsPanel`, pass:

```tsx
appVersion="2.0.0-test"
```

Assert version text if the test currently checks the panel footer/version. If no version assertion exists, add:

```ts
expect(screen.getByText(/2\.0\.0-test/)).toBeInTheDocument();
```

- [ ] **Step 2: Run settings panel test and verify failure**

Run:

```bash
npm test -- src/__tests__/settings-panel.a11y.test.tsx
```

Expected: FAIL because `SettingsPanelProps` has no `appVersion` prop yet.

- [ ] **Step 3: Create `src/newtab/controllers/useSettingsImportExport.ts`**

Move JSON import/export logic out of `App.tsx`. The hook should receive the concrete stores and toast callback from the dashboard controller:

```ts
import { useCallback } from 'react';
import type { CustomGroup } from '../../types';
import { parseImportedSettings } from '../lib/settings-import';
import type { TranslationKey } from '../hooks/useI18n';

interface SettingsImportExportDeps {
  settingsStore: {
    settings: {
      soundEnabled: boolean;
      confettiEnabled: boolean;
      customGroups: CustomGroup[];
      keyBindings: Record<string, string>;
    };
    setTheme: (theme: never) => Promise<void> | void;
    toggleSound: () => Promise<void> | void;
    toggleConfetti: () => Promise<void> | void;
    setMaxChipsVisible: (count: number) => Promise<void> | void;
    setStaleThresholdDays: (days: number) => Promise<void> | void;
    setGroupSortBy: (sortBy: never) => Promise<void> | void;
    removeCustomGroup: (groupKey: string) => Promise<void> | void;
    addCustomGroup: (group: CustomGroup) => Promise<void> | void;
    updateKeyBinding: (key: string, binding: string) => Promise<void> | void;
  };
  tabStore: {
    sections: unknown[];
    sectionAssignments: unknown[];
    importBackup: (sections: never[], sectionAssignments: never[]) => Promise<void>;
  };
  showToast: (message: string) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}
```

Use concrete project types instead of `never` when implementing; the key requirement is that `App.tsx` no longer owns JSON orchestration.

- [ ] **Step 4: Update `App.tsx` to use the controller hook**

`App.tsx` should call:

```ts
const { handleExportConfig, handleImportConfig, appVersion } = useSettingsImportExport({
  settingsStore,
  tabStore,
  showToast: handlers.showToast,
  t,
});
```

Pass:

```tsx
appVersion={appVersion}
onExportSettings={handleExportConfig}
onImportSettings={handleImportConfig}
```

- [ ] **Step 5: Update SettingsPanel props**

In `src/newtab/components/settings/SettingsPanel.tsx`, add:

```ts
appVersion: string;
```

Remove:

```ts
const FALLBACK_APP_VERSION = '2.0.0';

function getAppVersion(): string {
  if (typeof chrome === 'undefined') return FALLBACK_APP_VERSION;
  return chrome.runtime?.getManifest?.().version ?? FALLBACK_APP_VERSION;
}
```

Replace internal `const appVersion = getAppVersion();` with the prop.

- [ ] **Step 6: Run settings tests**

Run:

```bash
npm test -- src/__tests__/settings-import.test.ts src/__tests__/settings-panel.a11y.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Verify no component Chrome runtime access**

Run:

```bash
rg -n "chrome\\." src/newtab/components
```

Expected: no matches.

- [ ] **Step 8: Commit settings controller**

```bash
git add src/newtab/controllers/useSettingsImportExport.ts src/newtab/App.tsx src/newtab/components/settings/SettingsPanel.tsx src/__tests__/settings-import.test.ts src/__tests__/settings-panel.a11y.test.tsx
git commit -m "refactor: move settings import export into controller"
```

---

## Task 10: Delete Workspace/SavedTab Model and Reset Storage Schema

**Files:**
- Delete: `src/stores/workspace-store.ts`
- Delete: `src/__tests__/workspace-store.test.ts`
- Modify: `src/types/index.ts`
- Modify: `src/utils/storage.ts`
- Modify: `src/__tests__/storage.test.ts`
- Modify: `src/__tests__/storage-extra.test.ts`
- Modify: `src/__tests__/store-rollbacks.test.ts`
- Modify: `src/__tests__/factories.ts`
- Test: `npm test -- src/__tests__/storage.test.ts src/__tests__/storage-extra.test.ts src/__tests__/settings-store.test.ts src/__tests__/tab-store.test.ts src/__tests__/store-rollbacks.test.ts`

- [ ] **Step 1: Update tests to assert current schema only**

In storage tests, replace expectations for `deferred` and `workspaces` with expectations that they are absent:

```ts
expect('deferred' in result).toBe(false);
expect('workspaces' in result).toBe(false);
```

Remove imports and describe blocks for:

```text
getSavedTabs
saveTabForLater
checkOffSavedTab
dismissSavedTab
readWorkspaces
writeWorkspaces
useWorkspaceStore
makeSavedTab
makeWorkspace
```

- [ ] **Step 2: Run storage tests and verify failure**

Run:

```bash
npm test -- src/__tests__/storage.test.ts src/__tests__/storage-extra.test.ts src/__tests__/store-rollbacks.test.ts
```

Expected: FAIL because code still exposes legacy fields/functions.

- [ ] **Step 3: Remove types**

In `src/types/index.ts`, delete:

```ts
export interface SavedTab { ... }
export interface Workspace { ... }
export interface SavedState { ... }
export interface WorkspaceState { ... }
```

Remove from `StorageSchema`:

```ts
deferred: SavedTab[];
workspaces: Workspace[];
```

- [ ] **Step 4: Remove storage keys and APIs**

In `src/utils/storage.ts`, remove:

```text
'deferred'
'workspaces'
SavedTab import
Workspace import
EMPTY_SCHEMA.deferred
EMPTY_SCHEMA.workspaces
read/write handling for deferred/workspaces
getSavedTabs
saveTabForLater
checkOffSavedTab
dismissSavedTab
readWorkspaces
writeWorkspaces
```

- [ ] **Step 5: Implement destructive schema reset**

In `src/utils/storage.ts`, make schema mismatch reset storage to current schema:

```ts
async function resetStorageToCurrentSchema(): Promise<StorageSchema> {
  await chrome.storage.local.clear();
  const next = { ...EMPTY_SCHEMA };
  await chrome.storage.local.set(next);
  return next;
}
```

In the read path, when `schemaVersion !== CURRENT_SCHEMA_VERSION`, call `resetStorageToCurrentSchema()` instead of preserving old fields. Preserve any existing code path that normalizes current-schema reads.

- [ ] **Step 6: Delete workspace store and test**

```bash
git rm src/stores/workspace-store.ts src/__tests__/workspace-store.test.ts
```

- [ ] **Step 7: Clean factories and rollback tests**

In `src/__tests__/factories.ts`, delete `makeSavedTab` and `makeWorkspace`.

In `src/__tests__/store-rollbacks.test.ts`, delete the workspace store coverage block and its imports.

- [ ] **Step 8: Run storage tests**

Run:

```bash
npm test -- src/__tests__/storage.test.ts src/__tests__/storage-extra.test.ts src/__tests__/settings-store.test.ts src/__tests__/tab-store.test.ts src/__tests__/store-rollbacks.test.ts
```

Expected: PASS.

- [ ] **Step 9: Verify legacy terms are gone**

Run:

```bash
rg -n "Workspace|SavedTab|deferred|workspaces|workspace-store|getSavedTabs|saveTabForLater|checkOffSavedTab|dismissSavedTab" src
```

Expected: no matches.

- [ ] **Step 10: Commit legacy deletion**

```bash
git add src/types/index.ts src/utils/storage.ts src/__tests__/storage.test.ts src/__tests__/storage-extra.test.ts src/__tests__/store-rollbacks.test.ts src/__tests__/factories.ts
git rm src/stores/workspace-store.ts src/__tests__/workspace-store.test.ts
git commit -m "refactor: remove workspace and saved tab legacy model"
```

---

## Task 11: Remove Compatibility Barrels and Old Imports

**Files:**
- Delete: `src/utils/url.ts`
- Modify: all source/tests still importing `src/utils/url`
- Test: `npm run lint`

- [ ] **Step 1: Find old imports**

Run:

```bash
rg -n "utils/url|\\.\\./utils/url|\\.\\./\\.\\./utils/url|tab-utils|useAppLogic|useTabHandlers" src
```

Expected: matches only before cleanup.

- [ ] **Step 2: Replace remaining imports**

Use:

```text
getHostname/getTabDomain/isRealTab/sanitizeUrl -> src/lib/url-rules
isTabOrganizerPage -> src/utils/browser-url
analyzeDuplicates -> src/lib/duplicate-analysis
isTabStale -> src/lib/staleness
getProductKey -> src/lib/product-key
getGroupFaviconSource -> src/lib/group-favicon
useDashboardController -> src/newtab/controllers/useDashboardController
useTabActions -> src/newtab/controllers/useTabActions
```

- [ ] **Step 3: Delete compatibility file**

```bash
git rm src/utils/url.ts
```

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS for architecture guardrails. If lint fails, fix imports rather than weakening rules.

- [ ] **Step 5: Commit old import cleanup**

```bash
git add src
git rm src/utils/url.ts
git commit -m "refactor: remove legacy module barrels"
```

---

## Task 12: Clean Source Hygiene Files

**Files:**
- Delete: `src/.DS_Store`
- Delete: `src/newtab/.DS_Store`
- Delete: `src/newtab/components/.DS_Store`
- Modify: `.gitignore`
- Test: `git status --ignored --short`

- [ ] **Step 1: Ensure `.gitignore` covers `.DS_Store`**

Add if missing:

```gitignore
.DS_Store
**/.DS_Store
```

- [ ] **Step 2: Remove source `.DS_Store` files**

```bash
rm -f src/.DS_Store src/newtab/.DS_Store src/newtab/components/.DS_Store
```

- [ ] **Step 3: Verify ignored state**

Run:

```bash
git status --ignored --short | rg "\\.DS_Store" || true
```

Expected: any `.DS_Store` entries are ignored (`!!`) or absent.

- [ ] **Step 4: Commit hygiene cleanup**

```bash
git add .gitignore
git commit -m "chore: ignore source metadata files"
```

If the `.DS_Store` files are untracked, do not try to `git rm` them.

---

## Task 13: Final Verification and Documentation Sync

**Files:**
- Modify as needed: `AGENTS.md`
- Modify as needed: `CLAUDE.md`
- Test: full gate

- [ ] **Step 1: Verify architecture terms**

Run:

```bash
rg -n "Workspace|SavedTab|deferred|workspaces|tab-utils|utils/url|useAppLogic|useTabHandlers" src AGENTS.md CLAUDE.md docs --glob '!docs/src-architecture-cleanup-plan.md'
```

Expected: no matches in `src`. Documentation may mention deleted terms only as forbidden legacy product models.

- [ ] **Step 2: Verify import boundaries**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run unit tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 4: Run full check**

Run:

```bash
npm run check
```

Expected: PASS. Lightning CSS `@theme` warnings during build are acceptable if they match existing known warnings.

- [ ] **Step 5: Verify docs mirror**

Run:

```bash
cmp -s AGENTS.md CLAUDE.md; echo $?
```

Expected:

```text
0
```

- [ ] **Step 6: Final commit**

```bash
git add AGENTS.md CLAUDE.md docs/src-architecture-cleanup-plan.md src eslint.config.js .gitignore
git commit -m "refactor: enforce src architecture boundaries"
```

---

## Self-Review Checklist

- [ ] The plan includes file placement and exact split targets for deep vs flat structure.
- [ ] The plan defines `lib` vs `utils` and enforces `lib` purity.
- [ ] The plan includes lint guardrails and tooling tests.
- [ ] The plan removes workspace/saved-for-later code and tests.
- [ ] The plan includes I18nProvider and SettingsPanel Chrome runtime cleanup.
- [ ] The plan preserves `AGENTS.md` / `CLAUDE.md` mirroring.
- [ ] The plan includes targeted tests and final `npm run check`.
- [ ] The plan explicitly protects unrelated user work.

