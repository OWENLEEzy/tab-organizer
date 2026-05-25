# Spaces — Feature Design

> Status: Design / Pre-implementation  
> Last updated: 2026-05-18

---

## Problem

Google's vertical tabs solves tab *navigation* (easier to scan a long list).  
It does not solve tab *entropy*: why do you have 60 tabs, and which ones still matter?

Tab Organizer already groups tabs by product/domain. The missing layer is **context switching** — letting users focus on one working context at a time without closing anything.

---

## What Is a Space

A **Space** is a named working context that contains one or more product groups.

- Switching to a Space filters the dashboard to show only that Space's tabs.
- Tabs outside the active Space are not closed — they're just hidden from view.
- Spaces map directly onto the existing `ManualGroup` / Section concept. No new mental model for the user.

Example Spaces a user might have:

| Space | Contains |
|---|---|
| 🛠 Dev | GitHub, Vercel, Linear, localhost |
| 📝 Work | Notion, Google Docs, Figma, Slack |
| 🎬 Media | YouTube, Twitter, Reddit |
| 🛒 Shopping | Amazon, Taobao |

---

## Auto-Assignment

Each Space can carry a list of **auto-rules** — simple regex patterns that match against a tab's hostname.

When a product group has no manual assignment, Tab Organizer runs its hostname against all Space rules and assigns it automatically.

### Rule Format

```ts
interface SpaceAutoRule {
  pattern: string;  // regex string, e.g. "github|vercel|linear"
  type: 'hostname'; // only hostname matching for now
}
```

### Matching Logic

```ts
function autoAssignProductToSpace(
  productKey: string,       // e.g. "github.com"
  spaces: ManualGroup[]
): string | null {
  for (const space of spaces) {
    for (const rule of space.autoRules ?? []) {
      const re = new RegExp(rule.pattern, 'i');
      if (re.test(productKey)) return space.id;
    }
  }
  return null;
}
```

### Trigger Timing

Auto-assignment runs when:
1. The tab store refreshes (tab opened, closed, updated)
2. A new Space is created with rules
3. A Space's rules are edited

It **skips** product groups that already have a manual `GroupAssignment`.  
Manual always wins over auto.

### Default Spaces (First Launch)

On first install, Tab Organizer seeds these Spaces with default rules:

| Space | Default Pattern |
|---|---|
| 🛠 Dev | `github\|vercel\|linear\|jira\|gitlab\|stackoverflow\|localhost\|figma` |
| 📝 Work | `notion\|google\.com\|slack\|loom\|zoom\|airtable\|confluence` |
| 🎬 Media | `youtube\|twitter\|x\.com\|reddit\|instagram\|tiktok\|bilibili` |
| 🛒 Shopping | `amazon\|taobao\|jd\.com\|shopee\|aliexpress` |

Users can edit, delete, or add their own.

---

## Data Model Changes

### `ManualGroup` (extend, not replace)

```ts
// Before
export interface ManualGroup {
  id: string;
  name: string;
  order: number;
}

// After
export interface SpaceAutoRule {
  pattern: string;
  type: 'hostname';
}

export interface ManualGroup {
  id: string;
  name: string;
  order: number;
  emoji?: string;           // NEW: visual identity in pill switcher
  autoRules?: SpaceAutoRule[]; // NEW: optional, backward compatible
}
```

`autoRules` is optional → existing stored `ManualGroup` objects remain valid without migration.

### Storage

No schema version bump required. `autoRules` and `emoji` are additive optional fields.  
Auto-generated `GroupAssignment` entries are stored the same way as manual ones.

---

## UI Changes

### 1. Space Switcher Pill Bar (Dashboard)

A horizontal pill row appears above the product group list:

```
[ All ]  [ 🛠 Dev ]  [ 📝 Work ]  [ 🎬 Media ]  [ + ]
```

- **All** (default): shows everything, same as current behavior
- **Space pill**: filters dashboard to only show product groups assigned to that Space
- **+**: create a new Space inline
- Active pill has the blue accent underline (consistent with existing accent semantics)
- Unassigned product groups appear only in **All** view

### 2. Space Settings (within Settings panel)

Each Space row shows:
- Emoji picker + name (editable inline)
- Auto-rules textarea: one regex pattern per line, e.g.:
  ```
  github
  vercel
  linear
  ```
- Delete Space button (reassigns all its groups to unassigned)

### 3. Organize Mode

No changes to DnD behavior. Dragging product groups into sections still works.  
Sections *are* Spaces — the organize mode is where manual assignment lives.  
Auto-assignment just pre-populates assignments; user can override by drag.

---

## Keyboard Shortcuts

### Global (works anywhere in Chrome)

Registered in `manifest.json` via the `commands` API. Fires background worker → sends message to dashboard.  
Chrome **automatically persists** the user's customized binding across extension updates — we get this for free.

| Shortcut | Default | Action | Configurable |
|---|---|---|---|
| `⌘⇧K` | open dashboard + focus Space switcher | Opens Tab Organizer and focuses the pill bar | ✅ via `chrome://extensions/shortcuts` |

`⌘1–9` are Chrome-owned globally (switch tabs by position). Cannot register them as global commands.

### Local (inside Tab Organizer dashboard only)

Standard React keyboard event listeners. Defaults shown; user can rebind all of these in Settings.

| Action | Default | Configurable |
|---|---|---|
| Switch to Space 1–9 | `⌘1` … `⌘9` | ✅ |
| Switch to "All" | `⌘0` | ✅ |
| Cycle Space ← | `←` (pill focused) | ✅ |
| Cycle Space → | `→` (pill focused) | ✅ |
| Focus tab search | `/` | ✅ |
| Clear Space filter | `Esc` | ✅ |

These do not conflict with Chrome's tab-position shortcuts because focus is inside the extension page.

### User-Configurable Local Shortcuts

Local shortcuts are stored in `AppSettings.keyBindings` in `chrome.storage.local`.

```ts
// Added to AppSettings
keyBindings: {
  switchSpaceN: string;     // template: "Meta+{n}", {n} = 1–9
  switchSpaceAll: string;   // default: "Meta+0"
  cyclePrev: string;        // default: "ArrowLeft"
  cycleNext: string;        // default: "ArrowRight"
  focusSearch: string;      // default: "/"
  clearFilter: string;      // default: "Escape"
}
```

Settings panel — "Keyboard" section:
- Lists each action + its current binding
- Click a binding → enters **record mode** (captures next keypress)
- Saves to storage immediately; no page reload needed
- "Reset to defaults" button per row

### Implementation Notes

- Global command registration in `manifest.json`:
  ```json
  "commands": {
    "open-space-switcher": {
      "suggested_key": { "default": "Ctrl+Shift+K", "mac": "Command+Shift+K" },
      "description": "Open Tab Organizer — Space switcher"
    }
  }
  ```
- Background worker listens for the command → opens/focuses the dashboard tab → posts a `FOCUS_SPACE_SWITCHER` message
- Dashboard listens for the message → scrolls pill bar into view + sets keyboard focus on it
- Local shortcut handler reads `keyBindings` from settings store and builds a lookup map on mount

---

## Data Safety & Migration

### What survives an extension update

`chrome.storage.local` is **never touched by Chrome during an extension update**. User Spaces, auto-rules, emoji, and key bindings all survive version bumps.

### Schema change risk table

| Change | Risk | Mitigation |
|---|---|---|
| Add `autoRules` to `ManualGroup` | None | Field is optional; missing = `undefined`; code defaults to `[]` |
| Add `emoji` to `ManualGroup` | None | Optional; missing renders without emoji |
| Add `keyBindings` to `AppSettings` | None | Optional; missing falls back to hardcoded defaults |
| Seed default Spaces on first launch | **Medium** | Guard: only seed when `manualGroups.length === 0` |
| Future: rename storage keys | High | Must write explicit migration in `storage.ts` |

### Safe seeding guard (critical)

Default Spaces are written **once**, only when no Spaces exist. Subsequent installs or version updates skip this entirely.

```ts
// In storage init / reconcile path
const stored = await storage.get('manualGroups');
if (!stored || stored.length === 0) {
  // First-time install — write default spaces
  await storage.set('manualGroups', DEFAULT_SPACES);
}
// User has existing spaces → do nothing, preserve their data
```

Never use a version number or a "hasSeededSpaces" flag as the guard — checking `manualGroups.length === 0` is the only safe invariant.

### User-configured auto-rules after a version update

If a new version ships updated default patterns, those new patterns only affect **new installs**. Existing users keep their stored `autoRules` unchanged. If a user has never edited a Space's rules, their patterns are whatever was seeded at install time — not the latest defaults. This is intentional: user intent > our defaults.

---

## Non-Goals (this version)

- **Tab hiding from Chrome tab strip** — `chrome.tabs.hide()` exists but adds `tabHide` permission and real UX complexity. Out of scope for v1. Space switching is view-only (dashboard filter).
- **Cross-device sync** — Spaces are local-only, stored in `chrome.storage.local`. Consistent with product contract.
- **AI-based auto-classification** — Chrome Gemini Nano API is experimental. Consider for v2.
- **Window-based Space inference** — Reasonable idea, deferred.
- **Per-Space themes / colors** — Deferred, but emoji gives enough visual identity for now.

---

## Implementation Plan (rough order)

1. **Types**: Add `emoji` and `autoRules` to `ManualGroup`
2. **Config**: Write default Space seeds with rules
3. **Logic**: `autoAssignProductToSpace()` in `src/lib/` + wire into tab store refresh
4. **Storage**: Seed default Spaces on first launch (check if `manualGroups` is empty)
5. **UI – Pill bar**: Space switcher component in dashboard header, filter state in App.tsx
6. **UI – Settings**: Space rule editor (textarea per Space)
7. **Keyboard – Local**: `⌘1–9`, `⌘0`, `←/→`, `Esc` handlers in App.tsx (reads from `keyBindings`)
8. **Keyboard – Global**: `commands` entry in manifest + background → dashboard message flow
9. **Keyboard – Settings UI**: rebind UI in Settings panel with record-mode capture
10. **Tests**: Unit tests for auto-assign logic, pill filter behavior, seeding guard
11. **Full gate**: `npm run check`
