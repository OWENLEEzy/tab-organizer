# Tab Out — More is Less UX Polish

> Date: 2026-04-16
> Status: Approved
> Principle: Extreme UX optimization without new features. Micro-refinements only.

## Summary

18 micro-optimizations across 3 directions — interaction speed, information density, visual polish. Zero new features. All driven by code audit + UI/UX Pro Max guidelines.

---

## Phase 1: Interaction Speed

### 1.1 Keyboard Navigation — Fill Empty Handlers

**Current state:** `useKeyboard` hook registers `onArrowUp`, `onArrowDown`, `onEnter` but all are empty functions (`() => {}`).

**Change:**
- Maintain a `focusedIndex` state in App.tsx
- `↑` / `↓` — move focus between TabChips across all visible groups
- `Enter` — call `handleFocusTab` on focused chip
- `d` — close focused tab via `handleCloseTab` (single key, not Cmd+D)
- `s` — save focused tab via `handleSaveTab` (single key, not Cmd+S — that already exists for "save all")
- `/` — focus search input (already implemented)
- `Esc` — clear focus + search (already partially implemented)

**Implementation:**
- Add `focusedIndex: number | null` state
- Build a flat list of focusable chips from `filteredGroups`
- Use `refs` array to call `.focus()` on target TabChip
- Each TabChip already has `tabIndex={0}` and keyboard handler — wire up visual focus ring via CSS
- **Important:** `useKeyboard.ts` currently only registers `d`/`s` as `Cmd/Ctrl` combos. Need to add standalone `d` and `s` handlers that only fire when NOT in an input field (same guard as `/` key). Add `onCloseFocused` and `onSaveFocused` to `KeyboardActions` interface, or repurpose the existing empty callbacks.

**Files:** `App.tsx` (state + logic), `useKeyboard.ts` (add standalone D/S handlers)

### 1.2 Action Buttons Always Visible (Semi-transparent)

**Current state:** TabChip close/save buttons are `opacity-0 group-hover:opacity-100`.

**Change:** Replace with `opacity-40 group-hover:opacity-100`. Buttons visible at 40% opacity, full on hover.

**Rationale:** UX Pro Max — "Don't rely solely on hover for important actions." Touch devices cannot hover.

**Files:** `TabChip.tsx` — change Tailwind classes on action button container.

### 1.3 Batch Selection Mode

**Current state:** No multi-select capability.

**Change:**
- `Shift+click` — range select between last focused and clicked chip
- `Cmd/Ctrl+click` — toggle individual chip selection
- `Esc` — clear all selections
- Selected chips get `ring-2 ring-accent-blue` style
- When items are selected, show a fixed bottom action bar: "N selected — Close — Save"
- Action bar replaces normal toast position

**Implementation:**
- Add `selectedUrls: Set<string>` state in App.tsx
- Track `lastClickedIndex` for shift-range logic
- New `SelectionBar` component (rendered conditionally)
- Disable drag-and-drop while in selection mode

**Files:** `App.tsx` (state), new `SelectionBar.tsx` component, `TabChip.tsx` (selection visual)

---

## Phase 2: Information Density

### 2.1 Favicon on Domain Card Header

**Current state:** DomainCard header shows domain name as text only. No favicon.

**Change:**
- Add `<img>` favicon to DomainCard header, before the domain name
- Use existing `getFaviconUrl()` from `url.ts`
- Favicon: 20x20px, rounded 3px, `onError` hides it
- When favicon loads, also use `friendlyName` as display name (already available in `group.friendlyName`)

**Files:** `DomainCard.tsx` — add favicon img element in header section

### 2.2 Duplicate Chip Visual Enhancement

**Current state:** Duplicate chips show `(Nx)` text badge. DomainCard status bar is amber. Subtle.

**Change:**
- TabChip: add `border-l-2 border-accent-amber bg-accent-amber/[0.04]` when `duplicateCount > 1`
- Replace `(Nx)` text with compact `×N` in amber color
- DomainCard dupe badge: replace text "2 duplicates" with SVG warning icon + "2 dupes"

**Files:** `TabChip.tsx` (chip styling), `DomainCard.tsx` (badge styling)

### 2.3 Active Tab Green Dot

**Current state:** `tab.active` exists in the Tab type but is never rendered.

**Change:**
- When `tab.active === true`, show a 6px green dot on the left side of TabChip
- Dot color: `bg-accent-sage` with `box-shadow: 0 0 0 2px rgba(77,171,154,0.2)`
- Add subtle `bg-accent-sage/[0.06]` background to the active chip
- Bold the title text for active tab

**Files:** `TabChip.tsx` — conditional rendering based on `active` prop. Need to pass `active` through from DomainCard.

### 2.4 Header Summary Pills

**Current state:** Header shows greeting + date. No tab overview.

**Change:**
- Add a row of pills below the date:
  - `{N} tabs` — blue pill (`bg-accent-blue/[0.08] text-accent-blue`)
  - `{N} dupes` — amber pill (`bg-accent-amber/[0.08] text-accent-amber`) — only shown when dupes > 0
  - `{N} domains` — sage pill (`bg-accent-sage/[0.08] text-accent-sage`)

**Files:** `Header.tsx` — add pill row, requires `totalTabs`, `totalDupes`, `totalDomains` props

### 2.5 Sort Reset Button

**Current state:** `tab-grouper.ts` already sorts by tab count descending by default (line 85). When user drags to reorder, a custom `groupOrder` is saved and takes priority. Once saved, it persists forever — no way to revert to count-based sorting without clearing storage.

**Change:**
- Add a "Reset sort order" option to SettingsPanel
- When clicked: clear `groupOrder` from storage, re-fetch tabs (triggers default count sort)
- This is a UX gap, not a missing algorithm — the sorting logic is already correct

**Files:** `SettingsPanel.tsx` (add button), `settings-store.ts` or `storage.ts` (clear groupOrder), `App.tsx` (wire handler)

---

## Phase 3: Visual Polish

### 3.1 Skeleton Loading Screen Enhancement

**Current state:** `LoadingState` already uses skeleton placeholders with `animate-pulse` (3 cards with header + chip bars). Good foundation but could better match the real DomainCard layout (especially after 2.1 adds favicons).

**Change:**
- Enhance existing skeleton to mirror optimized DomainCard structure:
  - Add favicon circle (20x20 rounded) before name bar
  - Add tab count badge skeleton after name
  - Add 3px status bar at top (gray) matching card accent bar
  - Add "Close all" button skeleton at bottom
- Consider using `columns-[300px]` to match the masonry layout of real cards
- Optional: shimmer gradient (`background: linear-gradient(...)`) instead of `animate-pulse` for premium feel

**Files:** `LoadingState.tsx` — enhance existing skeleton structure

### 3.2 TabChip Exit Animation

**Current state:** Tab disappears instantly on close.

**Change:**
- On close trigger: add CSS class that animates the chip
- Animation: translate right 60px + scale to 0.95 + fade out over 250ms
- After slide-out: set `max-height: 0; margin: 0; padding: 0; overflow: hidden` via CSS transition on `max-height` (cheaper than height, avoids reflow of siblings until final removal)
- Actual DOM removal happens after transition completes via `onTransitionEnd`
- Use `cubic-bezier(0.4, 0, 0.2, 1)` easing (ease-in for exit per UX Pro Max)
- Respect `prefers-reduced-motion: reduce` — skip animation, instant remove

**Implementation:**
- Track `closingUrls: Set<string>` state
- On close: add url to set, set timeout for actual removal (400ms)
- TabChip checks if its url is in closingUrls, applies animation class
- Alternative: CSS-only approach with `onTransitionEnd`

**Files:** `TabChip.tsx` (animation class), `DomainCard.tsx` or `App.tsx` (closing state)

### 3.3 Footer Count Pop Animation

**Current state:** Footer tab count is a static number.

**Change:**
- On tab close: animate the count number
- Animation: `scale(1) → scale(1.2) → scale(1)` + color flash to red and back
- Duration: 200ms
- Use `transform: scale()` only — no layout reflow

**Implementation:**
- Track `previousTabCount` via `useRef`
- When `tabCount` decreases, trigger animation class on the number element
- Remove class after animation completes
- Can use CSS keyframes or a simple state toggle

**Files:** `Footer.tsx` — add animation logic + CSS keyframe

### 3.4 Card Hover Lift

**Current state:** DomainCard hover changes box-shadow only.

**Change:**
- Add `hover:translate-y-[-2px]` to card container
- Combine with existing shadow change
- Duration: 200ms ease
- Only `transform` + `box-shadow` — GPU accelerated, no reflow

**Files:** `DomainCard.tsx` — add Tailwind class to outer div

---

## Implementation Priority

### P0 — Immediate Impact (1-2 hours)
| # | Item | Files | Change Size |
|---|------|-------|-------------|
| 1.1 | Keyboard navigation | App.tsx, useKeyboard.ts | Medium — new state + logic |
| 1.2 | Buttons always visible | TabChip.tsx | Tiny — opacity class |
| 2.1 | Favicon on cards | DomainCard.tsx | Small — add img element |
| 2.3 | Active tab green dot | TabChip.tsx | Small — conditional render |
| 3.4 | Card hover lift | DomainCard.tsx | Tiny — add class |

### P1 — One Day (4-6 hours)
| # | Item | Files | Change Size |
|---|------|-------|-------------|
| 2.2 | Dupe chip styling | TabChip.tsx, DomainCard.tsx | Small — CSS changes |
| 2.4 | Header summary pills | Header.tsx | Small — add elements |
| 2.5 | Sort reset button | SettingsPanel.tsx, storage.ts | Small — add button |
| 3.1 | Skeleton enhancement | LoadingState.tsx | Small — enhance existing |
| 3.3 | Footer count pop | Footer.tsx | Small — animation |

### P2 — Design Required (1-2 days)
| # | Item | Files | Change Size |
|---|------|-------|-------------|
| 1.3 | Batch selection | App.tsx, new SelectionBar.tsx, TabChip.tsx | Large — new state + component |
| 3.2 | Exit animation | TabChip.tsx, App.tsx or DomainCard.tsx | Medium — animation state |

---

## Design Principles (from UI/UX Pro Max)

1. **No emojis as icons** — all icons must be SVG (Heroicons / Lucide style)
2. **Animation timing:** 150-300ms for micro-interactions
3. **Easing:** ease-out for entering elements, ease-in for exiting
4. **Performance:** animate only `transform` and `opacity` — never `width`/`height`/`top`/`left`
5. **Accessibility:** respect `prefers-reduced-motion: reduce` — skip all animations
6. **Contrast:** maintain 4.5:1 minimum for all text
7. **Focus:** visible focus rings on all interactive elements (`ring-2 ring-accent-blue`)
8. **Touch:** minimum 44x44px touch targets; don't rely on hover alone
9. **Max 1-2 animated elements** per view to avoid distraction
10. **cursor-pointer** on all clickable elements

---

## Files Touched

```
src/newtab/App.tsx                     — keyboard nav state, batch selection state, tab summary data
src/newtab/hooks/useKeyboard.ts        — add standalone D/S key handlers
src/newtab/components/TabChip.tsx      — button visibility, active dot, dupe styling, exit anim
src/newtab/components/DomainCard.tsx   — favicon, dupe badge, hover lift, pass active prop
src/newtab/components/Header.tsx       — summary pills (new props: totalTabs, totalDupes, totalDomains)
src/newtab/components/Footer.tsx       — count pop animation
src/newtab/components/LoadingState.tsx — enhance existing skeleton
src/newtab/components/SettingsPanel.tsx — sort reset button
src/newtab/components/SelectionBar.tsx — NEW: batch action bar
src/utils/storage.ts                   — clearGroupOrder helper for sort reset
```
