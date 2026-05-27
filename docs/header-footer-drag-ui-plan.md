# Header, Footer, and Direct Drag UI Plan

## Goal

Make the dashboard UI match the current product direction:

- Keep the existing layered header structure.
- Move low-priority status metrics out of the header.
- Let users drag product groups directly in Cards view without an extra organize mode.
- Align naming around sections.
- Retire old parallel UI shells after their useful behavior is merged into the
  live header, cards, footer, and settings surfaces.

## Current UI Problems

1. The header has useful layering, but the top status strip consumes vertical room for metrics that are not primary navigation.
2. `All sections` and `UNSORTED` use different language for the same mental model.
3. `Organize / Done` adds a mode switch before a user can move groups, even though moving groups is a core Cards view interaction.
4. `8 tabs` and `0 duplicates` are status facts, not header navigation.
5. Some older UI components are no longer part of the live dashboard path. They
   should be documented as candidates first, then reviewed before any deletion.

## Target Layout

```text
HEADER LAYER 1: section navigation + date
┌──────────────────────────────────────────────────────────────────────────────┐
│ [All sections]   [Work]   [+]                         WEDNESDAY, MAY 27, 2026 │
└──────────────────────────────────────────────────────────────────────────────┘

HEADER LAYER 2: page identity + view controls
┌──────────────────────────────────────────────────────────────────────────────┐
│ Tab Organizer                                                               │
│ 2 groups                                [Cards] [Table]   [By Tab Count ▾] │
└──────────────────────────────────────────────────────────────────────────────┘

HEADER LAYER 3: command/search + actions
┌──────────────────────────────────────────────────────────────────────────────┐
│ [ Search tabs or type / for commands...                                  / ] │
│                                            [Refresh] [Settings] [History]    │
└──────────────────────────────────────────────────────────────────────────────┘

CONTENT
┌──────────────────────────────────────────────────────────────────────────────┐
│ No section   7                                             Close all           │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────┐  ┌──────────────────────────┐  ┌──────────────┐ │
│ │ ⋮⋮ YouTube               │  │ ⋮⋮ AIStudio Google       │  │ ⋮⋮ GitHub    │ │
│ │ tab title...        ×    │  │ tab title...        ×    │  │ tab...   ×   │ │
│ │ Close all 2 tabs         │  │ Close 1 tab              │  │ Close 1 tab  │ │
│ └──────────────────────────┘  └──────────────────────────┘  └──────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘

FOOTER
┌──────────────────────────────────────────────────────────────────────────────┐
│ 8 tabs        0 duplicates                              Feedback    GitHub   │
└──────────────────────────────────────────────────────────────────────────────┘
```

## UI Decisions

### Header Layer 1

- Keep the section switcher as the first header layer.
- Move the date to the right side of this layer.
- Keep `All sections`, named sections such as `Work`, and the `+` section creation affordance together.
- Do not duplicate the section creation action as a second primary `New Group` button in the lower action row.

### Header Layer 2

- Keep `Tab Organizer` as the page title.
- Show `2 groups` near the title as lightweight context.
- Keep `Cards / Table` and sort controls on the right.
- Do not show `8 tabs` or `0 duplicates` here.

### Header Layer 3

- Keep search as the dominant control.
- Keep operational actions on the right: `Refresh`, `Settings`, `History`.
- Keep global destructive `Close all` out of the header. Destructive close
  actions remain at section and product-group level.

### Content Sections

- Rename `UNSORTED` to `No section`.
- Keep section counts beside section names.
- Keep section-level `Close all` on the section header.
- Avoid explanatory text; the UI should communicate behavior through naming, position, drag handles, and drop states.

### Footer

- Move `8 tabs` and `0 duplicates` to the fixed footer.
- Keep `Feedback` and `GitHub` on the right.
- If dashboard warning actions still exist, render them as compact footer alerts instead of restoring a full top status strip.

## Drag Behavior

Cards view should allow direct drag:

- Remove the `Organize / Done` mode switch.
- Render the lazy drag organizer directly for Cards view.
- Use a subtle drag affordance on the product card header.
- Keep drop highlights on `No section` and named sections.
- Keep Table view non-drag; it should continue using its existing move/select controls.

The drag model stays product-group level only:

- Manual sections contain product groups.
- Do not add URL-level section assignment.
- Do not turn this into task management or bookmark management.

## Implementation Plan

1. Refactor header composition.
   - Move `SectionSwitcher` into `DashboardHeader`.
   - Add header props for sections, active section, section switching, and group count.
   - Move date from the title block to the right side of layer 1.
   - Keep search and operational actions in layer 3.

2. Move status metrics to footer.
   - Extend `Footer` to receive `tabCount`, `duplicateCount`, and optional compact alerts.
   - Remove the old top status strip from `App`.
   - Keep existing duplicate and high-tab alerts reachable through footer compact alerts if still needed.

3. Enable direct Cards drag.
   - Remove `organizeMode` from UI state.
   - Remove `Organize / Done` button and related locale strings.
   - Render `DndOrganizer` whenever `viewMode === 'cards'`.
   - Keep `ProductTable` as the Table view path.

4. Rename section language.
   - Change `organizerUnsorted` from `Unsorted` to `No section`.
   - Change Chinese copy from `未分类` to `未分配分区`.
   - Ensure section naming aligns with `All sections` and named sections.

5. Update project guidance.
   - Update `AGENTS.md` and `CLAUDE.md` together.
   - Replace the old “default Cards view must not render drag handles” rule with the new direct Cards drag contract.
   - Keep `@dnd-kit` isolated to `DndOrganizer`.

6. Retire old UI shells.
   - Search all `src/`, tests, docs, `AGENTS.md`, and `CLAUDE.md` for stale
     component references.
   - Keep one live dashboard shell: layered header, direct-drag cards, table,
     footer metrics, settings, history, and confirmation/toast flows.
   - Move useful alert or version copy into footer compact alerts or
     Settings > General before deleting the old shell.

7. Update tests.
   - Update dashboard header tests for the new required props and layer structure.
   - Update footer tests for duplicate metric rendering.
   - Update dashboard composition tests so they expect direct Cards drag and
     footer-owned metrics.
   - Keep accessibility touch target coverage for live controls.

## Verification Plan

Run focused checks first:

```bash
npm test -- src/__tests__/dashboard-header.test.tsx src/__tests__/footer.test.tsx src/__tests__/dashboard-reskin.test.tsx src/__tests__/touch-targets.a11y.test.tsx
npm test -- src/__tests__/tab-store.test.ts src/__tests__/storage.test.ts
npm run lint
npm run build
```

Then run the full gate:

```bash
npm run check
```

After code checks pass, verify visually:

```bash
npm run dev
```

Manual browser checks:

- Header layer 1 shows sections on the left and date on the right.
- Header layer 2 shows title, group count, Cards/Table, and sort.
- Header layer 3 shows search and actions.
- Footer shows tab count and duplicate count.
- `No section` appears instead of `Unsorted`.
- Product cards can be dragged between `No section` and named sections in Cards view.
- Table view still works and does not show drag handles.
- Settings and History remain reachable.
- No visible text overlaps at desktop and narrow widths.

## Acceptance Criteria

- There is no `Organize / Done` mode in Cards view.
- Cards view supports direct product-group movement.
- The header keeps the three-layer structure.
- Date is on layer 1 right.
- `8 tabs` and `0 duplicates` live in the footer.
- `2 groups` stays near the page title.
- `UNSORTED` is renamed to `No section`.
- Old parallel UI shells are retired after useful logic is merged into the live
  dashboard surfaces.
- `npm run check` passes before the change is considered ready.
