# Tab Out More is Less — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 18 micro-UX optimizations across interaction speed, information density, and visual polish — no new features.

**Architecture:** Incremental changes to existing React components. Each task is self-contained and produces a working build. Keyboard nav (Task 6) is the only task that adds significant new state logic. All visual changes use existing Tailwind/CSS infrastructure.

**Tech Stack:** React 19, Zustand 5, Tailwind v4, Vitest, Chrome Extension MV3

**Spec:** `docs/2026-04-16-more-is-less-ux-polish-design.md`

---

## File Structure

```
Files modified (existing):
  src/newtab/components/TabChip.tsx       — 1.2, 2.2, 2.3, 3.2
  src/newtab/components/DomainCard.tsx    — 2.1, 2.2, 2.3 (prop), 3.4
  src/newtab/components/Header.tsx        — 2.4
  src/newtab/components/Footer.tsx        — 3.3
  src/newtab/components/LoadingState.tsx  — 3.1
  src/newtab/components/SettingsPanel.tsx — 2.5
  src/newtab/components/SortableDomainCard.tsx — 2.3 (prop pass-through)
  src/newtab/App.tsx                      — 2.4, 2.5, 3.2, 3.3, 1.1, 1.3
  src/newtab/hooks/useKeyboard.ts         — 1.1
  src/newtab/styles/global.css            — 3.2, 3.3 (keyframes)
  src/utils/storage.ts                    — 2.5

Files created (new):
  src/newtab/components/SelectionBar.tsx   — 1.3
```

---

### Task 1: TabChip action buttons always visible (Spec 1.2)

**Files:**
- Modify: `src/newtab/components/TabChip.tsx:178`

- [ ] **Step 1: Change button container opacity**

In `src/newtab/components/TabChip.tsx`, find the action button container div (around line 178):

```tsx
// BEFORE:
<div className="ml-auto flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">

// AFTER:
<div className="ml-auto flex shrink-0 items-center gap-1 opacity-40 transition-opacity duration-150 group-hover:opacity-100">
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Visual verification**

Run: `npm run dev`, open the new tab page. Confirm:
- Close/save buttons on each TabChip are visible at ~40% opacity without hovering
- On hover, buttons become fully opaque
- No layout shift when hovering

- [ ] **Step 4: Commit**

```bash
git add src/newtab/components/TabChip.tsx
git commit -m "feat: show TabChip action buttons at 40% opacity always"
```

---

### Task 2: DomainCard hover lift (Spec 3.4)

**Files:**
- Modify: `src/newtab/components/DomainCard.tsx:170`

- [ ] **Step 1: Add hover lift class**

In `src/newtab/components/DomainCard.tsx`, find the outer card div (around line 170):

```tsx
// BEFORE:
<div className="rounded-card bg-card-light dark:bg-card-dark shadow-card transition-shadow duration-200 hover:shadow-card-hover overflow-hidden">

// AFTER:
<div className="rounded-card bg-card-light dark:bg-card-dark shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 overflow-hidden">
```

Note: `transition-shadow` → `transition-all` to cover both shadow and transform. `-translate-y-0.5` = 2px lift.

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Visual verification**

Run: `npm run dev`. Hover over a DomainCard. Confirm:
- Card lifts 2px on hover
- Shadow expands simultaneously
- Smooth 200ms transition
- Card returns to position when mouse leaves

- [ ] **Step 4: Commit**

```bash
git add src/newtab/components/DomainCard.tsx
git commit -m "feat: add hover lift effect to DomainCard"
```

---

### Task 3: Favicon on DomainCard header (Spec 2.1)

**Files:**
- Modify: `src/newtab/components/DomainCard.tsx`

- [ ] **Step 1: Add favicon to DomainCard header**

In `src/newtab/components/DomainCard.tsx`, add the `getFaviconUrl` import at the top:

```tsx
import { getFaviconUrl } from '../../utils/url';
```

Then in the header section (around line 193), add favicon before the domain name `<h3>`:

```tsx
{/* Favicon */}
<img
  src={getFaviconUrl(group.domain)}
  alt=""
  width={20}
  height={20}
  className="h-5 w-5 shrink-0 rounded-[3px]"
  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).style.display = 'none';
  }}
/>
```

Also update the `<h3>` to use `friendlyName` as primary display (it already does this on line 200: `group.friendlyName || group.domain` — verify no change needed).

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Visual verification**

Run: `npm run dev`. Confirm:
- Each DomainCard shows a favicon (Google's favicon service) before the domain name
- If favicon fails to load, it hides gracefully (no broken image icon)
- Favicon is 20x20px with 3px border radius

- [ ] **Step 4: Commit**

```bash
git add src/newtab/components/DomainCard.tsx
git commit -m "feat: add favicon to DomainCard header"
```

---

### Task 4: Active tab green dot (Spec 2.3)

**Files:**
- Modify: `src/newtab/components/DomainCard.tsx` (pass `active` prop)
- Modify: `src/newtab/components/TabChip.tsx` (render green dot)

- [ ] **Step 1: Pass `active` prop from DomainCard to TabChip**

In `src/newtab/components/DomainCard.tsx`, update the TabChip rendering (around line 213-221) to pass the `active` field:

```tsx
// Each TabChip call gets an `active` prop:
<TabChip
  key={tab.url}
  url={tab.url}
  title={tab.title}
  duplicateCount={urlCounts[tab.url] ?? 1}
  active={tab.active}
  onFocus={handleFocusTab}
  onClose={handleCloseTab}
  onSave={handleSaveTab}
/>
```

Do this for both `visibleTabs.map(...)` and `hiddenTabs.map(...)` blocks.

- [ ] **Step 2: Update TabChip interface and render**

In `src/newtab/components/TabChip.tsx`, add `active` to the props interface:

```tsx
interface TabChipProps {
  url: string;
  title: string;
  duplicateCount: number;
  active?: boolean;  // NEW
  onFocus: (url: string) => void;
  onClose: (url: string, title: string) => void;
  onSave: (url: string, title: string) => void;
}
```

Destructure `active` in the component:

```tsx
export function TabChip({
  url,
  title,
  duplicateCount,
  active = false,  // NEW
  onFocus,
  onClose,
  onSave,
}: TabChipProps): React.ReactElement {
```

Add the active dot and modified chip classes. Update `chipClasses` array:

```tsx
const chipClasses = [
    'group flex items-center gap-2 rounded-chip px-2.5 py-1.5',
    'cursor-pointer transition-colors duration-150',
    'hover:bg-surface-light dark:hover:bg-surface-dark',
    'focus-visible:ring-2 focus-visible:ring-accent-blue/40 focus-visible:outline-none',
    duplicateCount > 1 ? 'ring-1 ring-accent-amber/30' : '',
    active ? 'bg-accent-sage/[0.06]' : '',  // NEW
  ]
    .filter(Boolean)
    .join(' ');
```

Inside the chip div, before the favicon `<img>`, add the active dot:

```tsx
{/* Active indicator */}
{active && (
  <span
    className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-sage"
    style={{ boxShadow: '0 0 0 2px rgba(77,171,154,0.2)' }}
    aria-hidden="true"
  />
)}
```

Also conditionally bold the title when active:

```tsx
<span className={`truncate text-sm text-text-primary-light dark:text-text-primary-dark font-body ${active ? 'font-semibold' : ''}`}>
  {displayLabel}
</span>
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Visual verification**

Run: `npm run dev`. Open a tab, then open the Tab Out new tab page. Confirm:
- The tab you just came from has a small green dot on the left
- That chip has a subtle sage-tinted background
- The title text is bolder for the active tab
- Other tabs show no green dot

- [ ] **Step 5: Commit**

```bash
git add src/newtab/components/TabChip.tsx src/newtab/components/DomainCard.tsx
git commit -m "feat: show green dot on active tab chip"
```

---

### Task 5: Duplicate chip visual enhancement (Spec 2.2)

**Files:**
- Modify: `src/newtab/components/TabChip.tsx`
- Modify: `src/newtab/components/DomainCard.tsx`

- [ ] **Step 1: Update TabChip dupe styling**

In `src/newtab/components/TabChip.tsx`, update the `chipClasses` to add left border for dupes:

```tsx
// Replace the duplicate ring class:
// BEFORE: duplicateCount > 1 ? 'ring-1 ring-accent-amber/30' : '',
// AFTER:
duplicateCount > 1 ? 'border-l-2 border-accent-amber bg-accent-amber/[0.04]' : '',
```

Update the duplicate badge text from `(Nx)` to `×N`:

```tsx
// BEFORE:
{duplicateCount > 1 && (
  <span className="shrink-0 text-xs text-accent-amber font-body font-medium">
    ({duplicateCount}x)
  </span>
)}
// AFTER:
{duplicateCount > 1 && (
  <span className="shrink-0 text-xs text-accent-amber font-body font-medium">
    ×{duplicateCount}
  </span>
)}
```

- [ ] **Step 2: Update DomainCard dupe badge**

In `src/newtab/components/DomainCard.tsx`, update the duplicate count badge (around line 204-208):

```tsx
// BEFORE:
{hasDupes && (
  <span className="inline-flex items-center rounded-chip bg-accent-amber/10 px-2 py-0.5 text-xs text-accent-amber font-body font-medium">
    {totalExtras} duplicate{totalExtras !== 1 ? 's' : ''}
  </span>
)}
// AFTER:
{hasDupes && (
  <span className="inline-flex items-center gap-1 rounded-chip bg-accent-amber/10 px-2 py-0.5 text-xs text-accent-amber font-body font-medium">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
    {totalExtras} dupe{totalExtras !== 1 ? 's' : ''}
  </span>
)}
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Visual verification**

Open multiple duplicate tabs of the same URL. Confirm:
- Duplicate TabChips have a yellow left border + faint amber background
- Badge shows `×2` instead of `(2x)`
- DomainCard dupe badge shows warning SVG icon + "N dupes"

- [ ] **Step 5: Commit**

```bash
git add src/newtab/components/TabChip.tsx src/newtab/components/DomainCard.tsx
git commit -m "feat: enhance duplicate tab visual indicators"
```

---

### Task 6: Header summary pills (Spec 2.4)

**Files:**
- Modify: `src/newtab/components/Header.tsx`
- Modify: `src/newtab/App.tsx`

- [ ] **Step 1: Update Header component**

In `src/newtab/components/Header.tsx`, add props interface and pill row:

```tsx
interface HeaderProps {
  totalTabs: number;
  totalDupes: number;
  totalDomains: number;
}

export function Header({ totalTabs, totalDupes, totalDomains }: HeaderProps): React.ReactElement {
  return (
    <header className="mb-12 border-b border-border-light pb-6 dark:border-border-dark">
      <h1 className="font-heading text-3xl font-light text-text-primary-light dark:text-text-primary-dark">
        {getGreeting()}
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        {getDateDisplay()}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span className="inline-flex items-center rounded-chip bg-accent-blue/[0.08] px-2.5 py-0.5 text-xs text-accent-blue font-body">
          {totalTabs} tab{totalTabs !== 1 ? 's' : ''}
        </span>
        {totalDupes > 0 && (
          <span className="inline-flex items-center rounded-chip bg-accent-amber/[0.08] px-2.5 py-0.5 text-xs text-accent-amber font-body">
            {totalDupes} dupe{totalDupes !== 1 ? 's' : ''}
          </span>
        )}
        <span className="inline-flex items-center rounded-chip bg-accent-sage/[0.08] px-2.5 py-0.5 text-xs text-accent-sage font-body">
          {totalDomains} domain{totalDomains !== 1 ? 's' : ''}
        </span>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Compute and pass props from App.tsx**

In `src/newtab/App.tsx`, add computed values after `totalTabs` (around line 311):

```tsx
const totalTabs = tabs.length;
const totalDupes = useMemo(
  () => groups.reduce((sum, g) => sum + g.duplicateCount, 0),
  [groups],
);
const totalDomains = groups.length;
```

Update the `<Header />` call:

```tsx
// BEFORE: <Header />
// AFTER:
<Header totalTabs={totalTabs} totalDupes={totalDupes} totalDomains={totalDomains} />
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Visual verification**

Confirm Header shows pills: "23 tabs · 4 dupes · 8 domains". Dupe pill only appears when dupes > 0.

- [ ] **Step 5: Commit**

```bash
git add src/newtab/components/Header.tsx src/newtab/App.tsx
git commit -m "feat: add summary pills to Header (tabs/dupes/domains)"
```

---

### Task 7: Sort reset button in Settings (Spec 2.5)

**Files:**
- Modify: `src/newtab/components/SettingsPanel.tsx`
- Modify: `src/utils/storage.ts`
- Modify: `src/newtab/App.tsx`

- [ ] **Step 1: Add clearGroupOrder to storage.ts**

In `src/utils/storage.ts`, add a function to clear the group order:

```tsx
export async function clearGroupOrder(): Promise<void> {
  const storage = await readStorage();
  storage.groupOrder = {};
  await writeStorage(storage);
}
```

Export it alongside existing exports.

- [ ] **Step 2: Update SettingsPanel props and UI**

In `src/newtab/components/SettingsPanel.tsx`, add `onResetSortOrder` prop:

```tsx
interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  confettiEnabled: boolean;
  onSetTheme: (theme: 'light' | 'dark' | 'system') => void;
  onToggleSound: () => void;
  onToggleConfetti: () => void;
  onResetSortOrder: () => void;
}
```

Destructure it. After the confetti toggle row (around line 113), add:

```tsx
{/* Sort reset */}
<div className="flex items-center justify-between">
  <span className="text-sm font-body text-text-primary-light dark:text-text-primary-dark">
    Sort order
  </span>
  <button
    type="button"
    onClick={onResetSortOrder}
    className="rounded-chip px-3 py-1 text-xs font-body text-accent-blue transition-colors hover:bg-accent-blue/10 focus-visible:ring-2 focus-visible:ring-accent-blue/40 focus-visible:outline-none"
  >
    Reset to default
  </button>
</div>
```

- [ ] **Step 3: Wire handler in App.tsx**

In `src/newtab/App.tsx`, add the import:

```tsx
import { clearGroupOrder } from '../utils/storage';
```

Add the handler (near other handlers):

```tsx
const handleResetSortOrder = useCallback(async () => {
  await clearGroupOrder();
  await tabStore.fetchTabs();
  showToast('Sort order reset');
  setSettingsOpen(false);
}, [tabStore, showToast]);
```

Pass to SettingsPanel:

```tsx
<SettingsPanel
  open={settingsOpen}
  onClose={() => setSettingsOpen(false)}
  theme={settings.theme}
  soundEnabled={settings.soundEnabled}
  confettiEnabled={settings.confettiEnabled}
  onSetTheme={settingsStore.setTheme}
  onToggleSound={settingsStore.toggleSound}
  onToggleConfetti={settingsStore.toggleConfetti}
  onResetSortOrder={handleResetSortOrder}
/>
```

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Manual verification**

1. Drag some domain cards to reorder them
2. Open Settings → click "Reset to default"
3. Confirm cards re-sort by tab count (most tabs first)

- [ ] **Step 6: Commit**

```bash
git add src/utils/storage.ts src/newtab/components/SettingsPanel.tsx src/newtab/App.tsx
git commit -m "feat: add sort order reset button to settings"
```

---

### Task 8: Skeleton loading enhancement (Spec 3.1)

**Files:**
- Modify: `src/newtab/components/LoadingState.tsx`

- [ ] **Step 1: Enhance skeleton to match optimized DomainCard**

Replace the content of `src/newtab/components/LoadingState.tsx`:

```tsx
import React from 'react';

export function LoadingState(): React.ReactElement {
  return (
    <div className="tab-out-container">
      {/* Header skeleton */}
      <div className="mb-12 border-b border-border-light dark:border-border-dark pb-6">
        <div className="animate-pulse h-7 w-48 rounded bg-surface-light dark:bg-surface-dark" />
        <div className="animate-pulse mt-2 h-4 w-32 rounded bg-surface-light dark:bg-surface-dark" />
        <div className="mt-2 flex gap-2">
          <div className="animate-pulse h-5 w-14 rounded-chip bg-surface-light dark:bg-surface-dark" />
          <div className="animate-pulse h-5 w-16 rounded-chip bg-surface-light dark:bg-surface-dark" />
          <div className="animate-pulse h-5 w-18 rounded-chip bg-surface-light dark:bg-surface-dark" />
        </div>
      </div>

      {/* Section header skeleton */}
      <div className="animate-pulse mb-4 flex items-center gap-3">
        <div className="h-4 w-20 rounded bg-surface-light dark:bg-surface-dark" />
        <div className="h-px flex-1 bg-surface-light dark:bg-surface-dark" />
        <div className="h-3 w-12 rounded bg-surface-light dark:bg-surface-dark" />
      </div>

      {/* Card skeletons — match DomainCard structure */}
      <div className="columns-[300px] gap-3">
        {['skel-a', 'skel-b', 'skel-c'].map((key) => (
          <div
            key={key}
            className="mb-3 break-inside-avoid overflow-hidden rounded-card shadow-card"
          >
            {/* Status bar */}
            <div className="animate-pulse h-[3px] bg-surface-light dark:bg-surface-dark" />
            <div className="bg-card-light dark:bg-card-dark p-4">
              {/* Header row: favicon + name + badge */}
              <div className="mb-3 flex items-center gap-2">
                <div className="animate-pulse h-5 w-5 rounded-[3px] bg-surface-light dark:bg-surface-dark" />
                <div className="animate-pulse h-4 w-20 rounded bg-surface-light dark:bg-surface-dark" />
                <div className="animate-pulse h-4 w-16 rounded-chip bg-surface-light dark:bg-surface-dark" />
              </div>
              {/* Chip rows */}
              <div className="flex flex-col gap-0.5">
                <div className="animate-pulse h-7 w-full rounded-chip bg-surface-light dark:bg-surface-dark" />
                <div className="animate-pulse h-7 w-4/5 rounded-chip bg-surface-light dark:bg-surface-dark" />
                <div className="animate-pulse h-7 w-[90%] rounded-chip bg-surface-light dark:bg-surface-dark" />
              </div>
              {/* Footer action skeleton */}
              <div className="mt-3 border-t border-border-light dark:border-border-dark pt-3">
                <div className="animate-pulse h-6 w-24 rounded-chip bg-surface-light dark:bg-surface-dark" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Visual verification**

Reload the extension. Confirm skeleton cards:
- Have 3px status bar at top
- Show favicon circle + name bar + badge in header
- 3 chip-shaped rows
- Footer action button skeleton
- Match the real DomainCard dimensions closely

- [ ] **Step 4: Commit**

```bash
git add src/newtab/components/LoadingState.tsx
git commit -m "feat: enhance skeleton loading to match DomainCard layout"
```

---

### Task 9: Footer count pop animation (Spec 3.3)

**Files:**
- Modify: `src/newtab/components/Footer.tsx`
- Modify: `src/newtab/styles/global.css`

- [ ] **Step 1: Add keyframe to global.css**

In `src/newtab/styles/global.css`, after the `checkPop` keyframe (around line 157), add:

```css
@keyframes countPop {
  0% {
    transform: scale(1);
    color: var(--color-text-primary-light);
  }
  40% {
    transform: scale(1.2);
    color: var(--color-accent-red);
  }
  100% {
    transform: scale(1);
    color: var(--color-text-primary-light);
  }
}
```

Dark mode variant — add after the keyframe:

```css
.dark .count-pop {
  animation-name: countPopDark;
}

@keyframes countPopDark {
  0% {
    transform: scale(1);
    color: var(--color-text-primary-dark);
  }
  40% {
    transform: scale(1.2);
    color: var(--color-accent-red);
  }
  100% {
    transform: scale(1);
    color: var(--color-text-primary-dark);
  }
}
```

- [ ] **Step 2: Update Footer component with animation logic**

Replace `src/newtab/components/Footer.tsx`:

```tsx
import React, { useEffect, useRef, useState } from 'react';

interface FooterProps {
  tabCount: number;
}

export function Footer({ tabCount }: FooterProps): React.ReactElement {
  const [popping, setPopping] = useState(false);
  const prevCount = useRef(tabCount);

  useEffect(() => {
    if (tabCount < prevCount.current) {
      setPopping(true);
      const timer = setTimeout(() => setPopping(false), 300);
      return () => clearTimeout(timer);
    }
    prevCount.current = tabCount;
  }, [tabCount]);

  // Update ref after animation trigger
  useEffect(() => {
    prevCount.current = tabCount;
  });

  return (
    <footer className="mt-12 border-t border-border-light pt-5 dark:border-border-dark">
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <div className="stat">
          <span
            className={`font-heading text-lg font-light text-text-primary-light dark:text-text-primary-dark inline-block ${popping ? 'animate-[countPop_0.3s_ease]' : ''}`}
          >
            {tabCount}
          </span>
          <span className="ml-1.5">open tab{tabCount !== 1 ? 's' : ''}</span>
        </div>
        <span>
          <a
            href="https://github.com/OWENLEEzy/tab-out"
            target="_top"
            className="text-text-secondary underline underline-offset-2 transition-colors hover:text-text-primary-light dark:hover:text-text-primary-dark"
          >
            Tab Out
          </a>
        </span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Visual verification**

Close a tab. Confirm the count number in Footer:
- Pops (scale 1 → 1.2 → 1)
- Flashes red briefly
- Returns to normal in 300ms

- [ ] **Step 5: Commit**

```bash
git add src/newtab/components/Footer.tsx src/newtab/styles/global.css
git commit -m "feat: add count pop animation to Footer on tab close"
```

---

### Task 10: Keyboard navigation (Spec 1.1)

This is the largest P0 task. It adds focused index state management, updates useKeyboard hook, and handles the Enter double-fire edge case.

**Files:**
- Modify: `src/newtab/hooks/useKeyboard.ts`
- Modify: `src/newtab/App.tsx`

- [ ] **Step 1: Extend useKeyboard hook with D/S standalone keys**

In `src/newtab/hooks/useKeyboard.ts`, add `onDClose` and `onDSave` to the interface:

```tsx
interface KeyboardActions {
  onSearch: () => void;
  onSave: () => void;
  onEscape: () => void;
  onArrowUp: () => void;
  onArrowDown: () => void;
  onEnter: () => void;
  onDClose: () => void;  // NEW: standalone D key
  onDSave: () => void;   // NEW: standalone S key
}
```

Add handlers after the Enter block (around line 89), before the closing `};` of `handleKeyDown`:

```tsx
// d -> onDClose (only outside input fields)
if (e.key === 'd' && !isInputField) {
  callbackRef.current.onDClose();
  return;
}

// s -> onDSave (only outside input fields — Cmd+S still works in inputs)
if (e.key === 's' && !isInputField) {
  e.preventDefault();
  callbackRef.current.onDSave();
  return;
}
```

- [ ] **Step 2: Add focused index state and flat chip list in App.tsx**

In `src/newtab/App.tsx`, add state:

```tsx
const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
```

Build a flat list of all visible chips from filteredGroups:

```tsx
const flatChips = useMemo(
  () =>
    filteredGroups.flatMap((group) =>
      group.tabs.map((tab) => ({ url: tab.url, title: tab.title })),
    ),
  [filteredGroups],
);
```

- [ ] **Step 3: Wire up keyboard handlers**

Update the `useKeyboard` call in App.tsx:

```tsx
useKeyboard({
  onSearch: () => {
    const input = document.querySelector<HTMLInputElement>('input[aria-label="Search tabs"]');
    input?.focus();
  },
  onSave: () => {
    showToast('No tab selected');
  },
  onEscape: () => {
    setSearchQuery('');
    setSettingsOpen(false);
    setFocusedIndex(null);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  },
  onArrowUp: () => {
    setFocusedIndex((prev) => {
      if (prev === null) return flatChips.length - 1;
      return prev > 0 ? prev - 1 : flatChips.length - 1;
    });
  },
  onArrowDown: () => {
    setFocusedIndex((prev) => {
      if (prev === null) return 0;
      return prev < flatChips.length - 1 ? prev + 1 : 0;
    });
  },
  onEnter: () => {
    // Skip if focus is on a TabChip (it handles its own Enter)
    const active = document.activeElement;
    if (active?.closest('[data-tab-url]')) return;
    if (focusedIndex !== null && flatChips[focusedIndex]) {
      handleFocusTab(flatChips[focusedIndex].url);
    }
  },
  onDClose: () => {
    if (focusedIndex !== null && flatChips[focusedIndex]) {
      handleCloseTab(flatChips[focusedIndex].url);
    }
  },
  onDSave: () => {
    if (focusedIndex !== null && flatChips[focusedIndex]) {
      handleSaveTab(flatChips[focusedIndex].url, flatChips[focusedIndex].title);
    }
  },
});
```

- [ ] **Step 4: Apply visual focus to focused TabChip**

Pass `isFocused` prop through the component chain. Update SortableDomainCard to accept and pass `focusedUrl`:

In App.tsx, compute the focused URL:

```tsx
const focusedUrl = focusedIndex !== null ? flatChips[focusedIndex]?.url ?? null : null;
```

Pass to SortableDomainCard:

```tsx
<SortableDomainCard
  key={group.domain}
  group={group}
  maxChipsVisible={settings.maxChipsVisible}
  focusedUrl={focusedUrl}
  onCloseDomain={handleCloseDomain}
  onCloseDuplicates={handleCloseDuplicates}
  onCloseTab={handleCloseTab}
  onSaveTab={handleSaveTab}
  onFocusTab={handleFocusTab}
/>
```

In `SortableDomainCard.tsx`, pass through to DomainCard:

```tsx
// Add to interface
focusedUrl?: string | null;

// Pass to DomainCard
<DomainCard
  {...props}
  focusedUrl={focusedUrl}
/>
```

In `DomainCard.tsx`, pass to TabChip:

```tsx
// Add to interface
focusedUrl?: string | null;

// In TabChip calls, add:
isFocused={tab.url === focusedUrl}
```

In `TabChip.tsx`, add `isFocused` prop:

```tsx
// Add to interface
isFocused?: boolean;

// In chipClasses, add:
isFocused ? 'ring-2 ring-accent-blue/40 bg-surface-light dark:bg-surface-dark' : '',
```

When `isFocused` changes to true, programmatically focus the element:

```tsx
// Add ref
const chipRef = useRef<HTMLDivElement>(null);

// Add effect
useEffect(() => {
  if (isFocused && chipRef.current) {
    chipRef.current.focus({ preventScroll: false });
    chipRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}, [isFocused]);

// Add ref to the chip div:
<div ref={chipRef} className={chipClasses} ... >
```

- [ ] **Step 5: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Manual verification**

1. Open Tab Out with 5+ tabs
2. Press `↓` — first tab chip should get a blue focus ring
3. Press `↓` repeatedly — focus moves through chips, wraps around
4. Press `↑` — focus moves up, wraps around
5. Press `Enter` — browser switches to that tab
6. Press `d` — focused tab closes
7. Press `s` — focused tab is saved
8. Press `/` — search input gets focus
9. Press `Esc` — focus clears
10. Type in search → press `d` — should NOT close (isInputField guard)

- [ ] **Step 7: Commit**

```bash
git add src/newtab/App.tsx src/newtab/hooks/useKeyboard.ts src/newtab/components/TabChip.tsx src/newtab/components/DomainCard.tsx src/newtab/components/SortableDomainCard.tsx
git commit -m "feat: full keyboard navigation for TabChips (arrows/enter/d/s)"
```

---

### Task 11: TabChip exit animation (Spec 3.2)

**Files:**
- Modify: `src/newtab/styles/global.css`
- Modify: `src/newtab/App.tsx`
- Modify: `src/newtab/components/DomainCard.tsx`
- Modify: `src/newtab/components/TabChip.tsx`

- [ ] **Step 1: Add exit animation keyframe to global.css**

In `src/newtab/styles/global.css`, add after the `countPop` keyframes:

```css
@keyframes chipExit {
  0% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  60% {
    opacity: 0;
    transform: translateX(60px) scale(0.95);
  }
  100% {
    opacity: 0;
    transform: translateX(60px) scale(0.9);
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    margin-top: 0;
    margin-bottom: 0;
    overflow: hidden;
  }
}

.chip-closing {
  animation: chipExit 0.35s cubic-bezier(0.4, 0, 1, 1) forwards;
}
```

- [ ] **Step 2: Add closingUrls state to App.tsx**

In `src/newtab/App.tsx`:

```tsx
const [closingUrls, setClosingUrls] = useState<Set<string>>(new Set());
```

Create a wrapped close handler that delays the real close:

```tsx
const handleCloseTabAnimated = useCallback(
  (url: string) => {
    setClosingUrls((prev) => new Set([...prev, url]));
    setTimeout(() => {
      playCloseSound();
      tabStore.closeTabByUrl(url).then(() => {
        showToast('Tab closed');
        setClosingUrls((prev) => {
          const next = new Set(prev);
          next.delete(url);
          return next;
        });
      });
    }, 350);
  },
  [tabStore, showToast],
);
```

- [ ] **Step 3: Pass closingUrls through component chain**

In App.tsx, compute the set as an array for prop passing, or pass the Set directly:

Pass `closingUrls` to SortableDomainCard → DomainCard → TabChip.

Update the SortableDomainCard rendering in App.tsx:

```tsx
<SortableDomainCard
  key={group.domain}
  group={group}
  maxChipsVisible={settings.maxChipsVisible}
  focusedUrl={focusedUrl}
  closingUrls={closingUrls}
  onCloseDomain={handleCloseDomain}
  onCloseDuplicates={handleCloseDuplicates}
  onCloseTab={handleCloseTabAnimated}  // Use animated version
  onSaveTab={handleSaveTab}
  onFocusTab={handleFocusTab}
/>
```

Thread `closingUrls` through SortableDomainCard and DomainCard interfaces, pass to each TabChip:

```tsx
// In DomainCard, pass to TabChip:
isClosing={closingUrls.has(tab.url)}
```

- [ ] **Step 4: Apply animation class in TabChip**

In `TabChip.tsx`, add `isClosing` prop:

```tsx
// Add to interface
isClosing?: boolean;
```

Update chipClasses to include closing animation:

```tsx
isClosing ? 'chip-closing pointer-events-none' : '',
```

- [ ] **Step 5: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Visual verification**

Click the close button on a TabChip. Confirm:
- Chip slides right 60px while fading out (350ms)
- Chip collapses to zero height
- Other chips smoothly move up to fill the gap
- `prefers-reduced-motion`: chip disappears instantly (CSS already handles this)

- [ ] **Step 7: Commit**

```bash
git add src/newtab/styles/global.css src/newtab/App.tsx src/newtab/components/TabChip.tsx src/newtab/components/DomainCard.tsx src/newtab/components/SortableDomainCard.tsx
git commit -m "feat: add slide-out exit animation for TabChip close"
```

---

### Task 12: Batch selection mode (Spec 1.3)

This is the most complex task. It adds multi-select state, a new SelectionBar component, and Shift/Cmd+click handling.

**Files:**
- Create: `src/newtab/components/SelectionBar.tsx`
- Modify: `src/newtab/App.tsx`
- Modify: `src/newtab/components/TabChip.tsx`
- Modify: `src/newtab/components/DomainCard.tsx`
- Modify: `src/newtab/components/SortableDomainCard.tsx`

- [ ] **Step 1: Create SelectionBar component**

Create `src/newtab/components/SelectionBar.tsx`:

```tsx
import React from 'react';

interface SelectionBarProps {
  count: number;
  onClose: () => void;
  onSave: () => void;
  onClear: () => void;
}

export function SelectionBar({ count, onClose, onSave, onClear }: SelectionBarProps): React.ReactElement {
  return (
    <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-card border border-border-light bg-card-light px-5 py-3 shadow-card-hover dark:border-border-dark dark:bg-card-dark animate-[fadeUp_0.3s_ease_both]">
      <span className="text-sm font-body text-text-primary-light dark:text-text-primary-dark">
        {count} selected
      </span>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center gap-1.5 rounded-chip bg-accent-red/10 px-3 py-1.5 text-sm text-accent-red font-body transition-colors hover:bg-accent-red/20 focus-visible:ring-2 focus-visible:ring-accent-red/40 focus-visible:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Close
      </button>
      <button
        type="button"
        onClick={onSave}
        className="inline-flex items-center gap-1.5 rounded-chip bg-accent-blue/10 px-3 py-1.5 text-sm text-accent-blue font-body transition-colors hover:bg-accent-blue/20 focus-visible:ring-2 focus-visible:ring-accent-blue/40 focus-visible:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
        </svg>
        Save
      </button>
      <button
        type="button"
        onClick={onClear}
        className="rounded-chip px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-surface-light dark:hover:bg-surface-dark focus-visible:ring-2 focus-visible:ring-accent-blue/40 focus-visible:outline-none"
      >
        Cancel
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Add selection state to App.tsx**

```tsx
const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
```

Add the flat chips list for selection range (reuse `flatChips` from Task 10 if already implemented).

Selection toggle handler:

```tsx
const handleChipClick = useCallback(
  (url: string, event: React.MouseEvent) => {
    const chipIndex = flatChips.findIndex((c) => c.url === url);

    if (event.shiftKey && lastClickedIndex !== null) {
      // Range select
      const start = Math.min(lastClickedIndex, chipIndex);
      const end = Math.max(lastClickedIndex, chipIndex);
      const rangeUrls = flatChips.slice(start, end + 1).map((c) => c.url);
      setSelectedUrls((prev) => new Set([...prev, ...rangeUrls]));
    } else if (event.metaKey || event.ctrlKey) {
      // Toggle single
      setSelectedUrls((prev) => {
        const next = new Set(prev);
        if (next.has(url)) {
          next.delete(url);
        } else {
          next.add(url);
        }
        return next;
      });
    }
    // Plain click (no modifier) = normal focus behavior, don't select
    setLastClickedIndex(chipIndex);
  },
  [flatChips, lastClickedIndex],
);

const handleClearSelection = useCallback(() => {
  setSelectedUrls(new Set());
  setLastClickedIndex(null);
}, []);

const handleCloseSelected = useCallback(() => {
  const urls = [...selectedUrls];
  playCloseSound();
  tabStore.closeTabsExact(urls).then(() => {
    showToast(`Closed ${urls.length} tab${urls.length !== 1 ? 's' : ''}`);
    setSelectedUrls(new Set());
  });
}, [selectedUrls, tabStore, showToast]);

const handleSaveSelected = useCallback(() => {
  const chipsToSave = flatChips.filter((c) => selectedUrls.has(c.url));
  Promise.all(chipsToSave.map((c) => savedStore.saveTab(c.url, c.title))).then(() => {
    showToast(`Saved ${chipsToSave.length} tab${chipsToSave.length !== 1 ? 's' : ''}`);
    setSelectedUrls(new Set());
  });
}, [selectedUrls, flatChips, savedStore, showToast]);
```

- [ ] **Step 3: Disable drag-and-drop during selection**

In the DndContext in App.tsx, disable when selection is active:

```tsx
{selectedUrls.size > 0 ? (
  // No DnD wrapper — just render cards directly
  <div className="missions">
    {filteredGroups.map((group) => (
      <DomainCard
        key={group.domain}
        group={group}
        maxChipsVisible={settings.maxChipsVisible}
        focusedUrl={focusedUrl}
        closingUrls={closingUrls}
        selectedUrls={selectedUrls}
        onChipClick={handleChipClick}
        onCloseDomain={handleCloseDomain}
        onCloseDuplicates={handleCloseDuplicates}
        onCloseTab={handleCloseTabAnimated}
        onSaveTab={handleSaveTab}
        onFocusTab={handleFocusTab}
      />
    ))}
  </div>
) : (
  <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
    <SortableContext items={filteredGroups.map((g) => g.domain)} strategy={verticalListSortingStrategy}>
      <div className="missions">
        {filteredGroups.map((group) => (
          <SortableDomainCard
            key={group.domain}
            group={group}
            maxChipsVisible={settings.maxChipsVisible}
            focusedUrl={focusedUrl}
            closingUrls={closingUrls}
            onCloseDomain={handleCloseDomain}
            onCloseDuplicates={handleCloseDuplicates}
            onCloseTab={handleCloseTabAnimated}
            onSaveTab={handleSaveTab}
            onFocusTab={handleFocusTab}
          />
        ))}
      </div>
    </SortableContext>
  </DndContext>
)}
```

- [ ] **Step 4: Render SelectionBar**

Add after the Toast in App.tsx's return:

```tsx
{selectedUrls.size > 0 && (
  <SelectionBar
    count={selectedUrls.size}
    onClose={handleCloseSelected}
    onSave={handleSaveSelected}
    onClear={handleClearSelection}
  />
)}
```

- [ ] **Step 5: Thread selection props to TabChip**

Add `selectedUrls`, `onChipClick` to DomainCard interface. In DomainCard, pass `isSelected={selectedUrls.has(tab.url)}` and `onChipClick` to each TabChip.

In TabChip, add `isSelected` and `onChipClick` props. When `isSelected`, add `ring-2 ring-accent-blue` to chipClasses. The `onClick` handler calls `onChipClick(url, event)`.

- [ ] **Step 6: Update Esc to clear selection**

In the `useKeyboard` `onEscape` handler:

```tsx
onEscape: () => {
  setSearchQuery('');
  setSettingsOpen(false);
  setFocusedIndex(null);
  setSelectedUrls(new Set());  // Clear selection
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
},
```

- [ ] **Step 7: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 8: Manual verification**

1. Cmd/Ctrl+click a tab chip → it gets blue ring (selected)
2. Cmd/Ctrl+click another → both selected
3. Shift+click a third → range selected
4. SelectionBar appears at bottom: "3 selected · Close · Save · Cancel"
5. Click Close → all selected tabs close
6. Click Cancel → selection clears
7. Press Esc → selection clears
8. DnD is disabled while selection is active

- [ ] **Step 9: Commit**

```bash
git add src/newtab/App.tsx src/newtab/components/SelectionBar.tsx src/newtab/components/TabChip.tsx src/newtab/components/DomainCard.tsx src/newtab/components/SortableDomainCard.tsx
git commit -m "feat: batch selection mode with Shift/Cmd+click"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** Every item in the spec (1.1–1.3, 2.1–2.5, 3.1–3.4) maps to a task
- [x] **Placeholder scan:** No TBD/TODO/"implement later" anywhere
- [x] **Type consistency:** All prop names (`active`, `isFocused`, `isClosing`, `isSelected`, `focusedUrl`, `closingUrls`, `selectedUrls`) are consistent across tasks
- [x] **Edge cases covered:** Enter double-fire (Task 10 Step 3), prefers-reduced-motion (Task 11 CSS), input field guard for D/S (Task 10 Step 1)
