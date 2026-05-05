# Dashboard Header Merge Design

Date: 2026-05-05

## Decision

Use option A from the visual brainstorm: merge the current page title bar and toolbar into one visual header panel, while keeping two functional rows inside that panel.

The user-facing grouping language changes from `Product` to `Group`. This is a copy and presentation change only. Existing internal identifiers such as `productKey`, `moveProductToSection`, and `product:<productKey>` stay unchanged for this iteration to avoid unnecessary storage or migration risk.

## Problem

The current dashboard presents two adjacent control bars:

- A title/status-control bar with date, title, section count, view toggle, and settings.
- A separate toolbar with search, organize, new section, and close all.

This makes the top of the dashboard feel heavier than the amount of work it is doing. The term `Product` is also semantically narrow: Tab Out groups tabs by site, app, domain, or known product, so `Group` is clearer for users.

## Target Layout

The merged header is one bordered panel with two internal rows:

```text
[ Tuesday, May 5, 2026    Open Tabs by Group        1 Section  Cards/Table  Settings ]
[ Search tabs...                                      Organize  New Section  Close All ]
```

The top status strip can remain separate for this phase. Folding stats into the header is explicitly out of scope because it increases information density and broadens the change.

## Interaction Model

The top row contains view identity and low-frequency configuration:

- Date.
- Page title: `Open Tabs by Group`.
- Section count.
- Cards/Table view toggle.
- Settings.

The second row contains immediate dashboard actions:

- Search input.
- Organize toggle.
- New Section.
- Close All.

`Close All` remains visible and stays at the end of the action row. It should not be hidden in a generic overflow menu because it is destructive and benefits from explicit placement.

## User-Facing Copy

Use `Group` / `Groups` for user-facing aggregate language:

- `Open Tabs by Group`.
- `3 Groups` in dashboard statistics.
- Empty state and dashboard-adjacent explanatory copy should avoid `product` when describing what the user sees.

Keep section labels concise. For the default section heading, `Unsorted` is preferred over `Unsorted Groups` because the page title already establishes the object type.

## Responsive Behavior

Desktop:

- One outer bordered panel.
- First row: title/date on the left, view/config controls on the right.
- Second row: search grows to fill available width, actions stay on the right.

Tablet and narrow desktop:

- Controls may wrap within their row.
- Search must keep a useful minimum width before buttons wrap.

Mobile:

- The same outer panel stacks into title, search, and action groups.
- Button text must not overflow its container.
- `Close All` remains last in the action order.

## Accessibility

The merge must preserve the existing control semantics:

- Search keeps `aria-label="Search tabs"` and `/` shortcut behavior.
- Cards/Table remains a proper segmented control.
- Organize keeps pressed/disabled state semantics.
- Settings remains keyboard reachable and clearly named.
- Close All still opens confirmation before closing tabs.

Do not change tab chip selection, visible-chip behavior, duplicate cleanup, or batch close semantics as part of this design.

## Implementation Boundaries

Expected code impact:

- Concentrate layout changes in `src/newtab/components/layout/DashboardHeader.tsx`.
- Keep `DashboardShell` support for `top`, `header`, and `toolbar`, but continue passing `toolbar={null}` for this merged design.
- Update user-facing copy in `StatusStrip`, `DashboardHeader`, empty states, and relevant tests/docs where they describe the visible dashboard.

Out of scope:

- Renaming `ProductTable` or internal store APIs.
- Migrating persisted `productKey` data.
- Changing organizer drag IDs.
- Folding the status strip into the header.
- Hiding core actions behind a `More` menu.

## Validation

Required checks before implementation is considered done:

- `npm run check`
- Focused tests for dashboard header rendering and toolbar actions.
- Visual/browser check at desktop and mobile widths to confirm:
  - The header reads as one panel.
  - Search does not collapse too far.
  - Buttons do not overflow.
  - The title and action controls do not overlap.
  - User-facing `Product` copy no longer appears in the dashboard header/statistics.
