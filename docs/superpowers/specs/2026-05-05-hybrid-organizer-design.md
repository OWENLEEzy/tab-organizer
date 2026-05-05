# Tab Out Hybrid Organizer Design

> Date: 2026-05-05
> Status: Approved
> Direction: Product-level grouping, switchable Cards/Table views, and user-owned organization sections.

## Summary

Tab Out should move from hostname cards to a small organizer model. The dashboard will group tabs by product, show recognizable product icons, default to the current card-based experience, and let users switch to a denser table view. Users can create named sections and drag either whole product groups or individual tabs into those sections.

The system will not auto-infer personal sections such as Work, Watch, Later, or Homepages. Tab Out owns product recognition. The user owns sections. A Homepages section can exist, but tabs enter it only when the user puts them there.

## Goals

1. Merge related tabs by product rather than raw hostname.
2. Keep Google products separate when they represent distinct products, such as Gmail, Google Docs, and Google Drive.
3. Keep YouTube and YouTube Music separate.
4. Show a stable icon for every product group and independent tab item.
5. Default to Cards view and allow users to switch to Table view.
6. Let users create, rename, reorder, and delete named sections.
7. Let users drag product groups into sections.
8. Let users drag individual tabs out of a product group into a section.
9. Persist user organization in `chrome.storage.local`.
10. Remove stored item assignments when their product or URL is no longer open.

## Non-Goals

- Free-form canvas positioning.
- Automatic personal category inference.
- Permanent bookmarking or task management.
- Server sync, accounts, or external storage.
- A new drag-and-drop library.
- A rewrite of the Chrome extension architecture.

## Current State

The current dashboard groups tabs in `src/lib/tab-grouper.ts` mostly by hostname. The UI renders `DomainCard` components inside a masonry-like card grid. `SortableDomainCard` and `@dnd-kit/sortable` already support drag ordering for domain cards. `src/utils/storage.ts` already persists extension state through `chrome.storage.local`, including `groupOrder`.

This design builds on those patterns. It changes the grouping unit from domain to product, then adds user sections and a table view.

## Product Grouping Model

Grouping should use a stable product key, not the raw hostname.

Landing or homepage URLs do not automatically enter a special Homepages group. They should first be grouped by product like any other tab. For example, `https://www.youtube.com/` belongs to the `youtube` product group until the user moves it into a section.

Examples:

- `mail.google.com` -> `gmail`
- `docs.google.com` -> `google-docs`
- `drive.google.com` -> `google-drive`
- `calendar.google.com` -> `google-calendar`
- `youtube.com`, `www.youtube.com`, and `m.youtube.com` -> `youtube`
- `music.youtube.com` -> `youtube-music`
- `vercel.com` and `www.vercel.com` -> `vercel`

Each product group should expose:

- `key`: stable product identity, such as `gmail`
- `label`: user-facing name, such as `Gmail`
- `iconDomain`: favicon source domain, such as `mail.google.com`
- `tabs`: visible tabs in this product group
- `duplicateCount`
- `hasDuplicates`
- `order`

Unknown sites should still group sensibly. The fallback should normalize common host variants such as `www.` and mobile subdomains when safe, but it must not merge unrelated products. If the rule table does not know a product, the fallback should prefer a conservative hostname-derived key.

Homepages is not a product key and not a default grouping bucket. The UI may offer `Homepages` as a suggested section name, but it must behave like user-owned organization state rather than automatic classification.

## Icon Rules

Cards and table rows should show an icon before the product label.

The icon must use `iconDomain`, not the product key. Product keys such as `gmail` or section names such as `Homepages` are not valid favicon domains. If favicon loading fails, the UI should show a stable fallback, such as the product initial in a small square.

Individual tab items can use the tab's own favicon first. If unavailable, they can fall back to the product icon or initial.

## Sections

Sections are user-owned containers. The app does not auto-populate semantic defaults such as Work, Watch, Later, or Homepages.

The default state has the main unsectioned area only. Users can add a section, name it, rename it, reorder it, and delete it.

The app may make common section names easy to choose, including Homepages, but this is only a naming convenience. A section named Homepages has no automatic URL rules. Items appear there only through user assignment.

Deleting a section must not close tabs. Items inside the deleted section return to the main unsectioned area.

Sections should store:

- `id`
- `name`
- `order`

## Assignments

Users can assign two kinds of items to sections:

- `product`: a whole product group, keyed by product key
- `tabUrl`: one or more open tabs with the same URL, keyed by URL

Dragging a product group into a section assigns that whole product group.

Dragging an individual tab into a section assigns that URL. The tab is visually removed from its original product group and rendered as an independent tab item in the target section. If the same URL is open more than once, all matching tabs share the same assignment.

Dragging a single tab item back to the main area removes its URL assignment. It then returns to its product group.

Assignments should store:

- `itemType`: `product` or `tabUrl`
- `itemKey`: product key or URL
- `sectionId`
- `order`

Product assignments and URL assignments can coexist. URL assignments take precedence for those specific tabs, so a tab assigned by URL does not remain inside the product group display.

## Item Actions

Actions must operate on the tabs currently rendered inside that item, not on every tab that shares a hostname or product.

Examples:

- If a YouTube product group has five tabs and one video URL is moved into a Later section, the YouTube product card now owns four rendered tabs.
- Clicking `Close all 4 tabs` on the YouTube product card closes only those four rendered tabs.
- The standalone URL item in Later keeps its own close, save, duplicate, and focus actions.
- Duplicate actions count duplicates inside the current item unless the UI explicitly says it is acting across all open tabs.

Product-level closing should therefore use exact visible tab identity, such as tab ids or exact URLs from the rendered item. It should not close by hostname after assignments have been projected.

## Persistence

Use `chrome.storage.local`, through `src/utils/storage.ts`. Do not introduce ordinary browser `localStorage`.

The storage schema should migrate from version 2 to version 3 and add:

- `sections`
- `sectionAssignments`
- `viewMode`

`viewMode` stores `cards` or `table` and remembers the last view the user chose. The initial default is `cards`.

`sections` defaults to an empty array. `sectionAssignments` defaults to an empty array. Existing installs should not get an automatic Homepages section during migration.

Existing `groupOrder` is currently keyed by hostname. Product grouping changes the key space. Migration should be conservative:

- keep order entries only when the stored key already matches a current product key
- do not guess hostname-to-product mappings during migration
- prune stale order keys during tab refresh, using the same refresh flow that prunes stale assignments

Stored assignments are temporary organization state, not permanent bookmarks. During tab refresh, Tab Out should compare assignments with the currently open tabs. If no open tab has an assigned URL, that URL assignment should be pruned. If no open tab belongs to an assigned product key, that product assignment should be pruned. Assignments pointing to deleted or invalid section ids should be pruned. Invalid section rows should be ignored or normalized without hiding current tabs. Section names can persist, but item membership only tracks currently open work.

## Cards View

Cards view is the default dashboard.

Each product group renders as a product card with:

- drag handle
- product icon
- product label
- tab count
- duplicate badge when needed
- visible tab chips
- close/save/duplicate actions

Users can drag a product card into a section. Users can also drag a tab chip into a section, which turns that tab URL into a standalone item in that section.

Sections should be simple dashboard regions, not free-form canvas zones. Each section has a header and a card grid. The main unsectioned area uses the same visual language.

## Table View

Table view is a dense organizer view for users with many tabs.

Rows can represent:

- product groups
- independent tab URL items

Suggested columns:

- icon
- name or title
- section
- tab count
- duplicates
- actions

Rows should be draggable for ordering and section movement. The section column can also expose a menu for moving an item without dragging.

Table view and Cards view use the same underlying data. Moving an item in one view must be reflected in the other.

## Drag-and-Drop Rules

Use the existing `@dnd-kit` stack.

Sortable and droppable ids must be namespaced so product groups, URL items, and sections cannot collide:

- `section:<sectionId>`
- `product:<productKey>`
- `tabUrl:<encodedUrl>`

Storage should keep structured assignment fields (`itemType`, `itemKey`, `sectionId`, and `order`) rather than storing these UI ids directly. The DnD layer can derive ids from stored assignment data.

Required interactions:

1. Reorder product cards or rows within an area.
2. Drag a product group into a user section.
3. Drag a tab chip into a user section.
4. Drag an independent tab item back to the main area.
5. Reorder sections.

Selection mode should continue to disable or constrain drag interactions when needed, so multi-select actions do not conflict with drag handles.

Keyboard and accessible alternatives should exist for section moves where practical, especially in Table view through the section column.

## Error Handling

- Malformed URLs should not crash grouping.
- Unknown domains should use conservative fallback groups.
- Icon failures should show fallback initials.
- Missing or stale storage assignments should be pruned or ignored.
- Deleting a section should only remove organization metadata, never close tabs.
- If storage migration sees invalid section data, it should fall back to empty sections and keep tabs visible.

## Implementation Boundaries

The product recognition logic should live in one grouping layer, not in components.

Expected file ownership:

- `src/lib/tab-grouper.ts` or a new `src/lib/product-grouper.ts`: product grouping and assignment projection
- `src/config/friendly-domains.ts` or a new product config file: product labels and icon domains
- `src/utils/storage.ts`: schema migration and section storage APIs
- `src/stores/tab-store.ts`: fetch tabs, project groups with assignments, prune stale URL assignments, persist reorders
- `src/newtab/App.tsx`: orchestration only
- `src/newtab/components/DomainCard.tsx`: evolve toward a product card or wrap it with a product-aware component
- new components such as `ViewToggle`, `SectionBoard`, `SectionHeader`, and `ProductTable`

Avoid scattering product rules into UI components. Avoid adding a second storage adapter.

## Testing

Unit tests should cover:

- product grouping for Google products
- YouTube versus YouTube Music
- landing or homepage URLs staying in their product group until manually assigned
- `www.` and mobile subdomain normalization where intended
- unknown-domain fallback
- favicon domain selection
- product assignments
- URL assignments
- URL assignment pruning after a tab closes
- product assignment pruning after a product has no open tabs
- invalid section assignment pruning
- repeated URL tabs sharing one URL assignment
- product item actions operating only on rendered tabs after URL assignment projection

Component tests should cover:

- Cards/Table switching
- icon fallback
- section create, rename, and delete behavior
- section delete returning items to the main area
- a user-created Homepages section not receiving homepage URLs automatically
- tab URL items not appearing twice after being dragged out

E2E should cover one real organizer path:

1. Create a section.
2. Drag a product group into it.
3. Drag one tab URL into it.
4. Switch to Table view.
5. Refresh and confirm assignments remain.
6. Close the assigned URL.
7. Refresh and confirm the URL assignment is pruned.

A second E2E or focused component test should cover the action boundary: drag one URL out of a product group, close the remaining product group, and confirm the standalone URL item is not closed by the product action.

The final validation gate remains `npm run check`.

## Acceptance Criteria

1. Gmail, Google Docs, Google Drive, YouTube, YouTube Music, and Vercel appear as correct product groups.
2. Product cards and table rows show meaningful icons or stable fallbacks.
3. Cards view is the default.
4. Users can switch between Cards and Table, and the chosen view persists.
5. Users can create, rename, reorder, and delete sections.
6. Users can drag product groups into sections.
7. Users can drag individual tabs into sections.
8. A URL assigned to a section disappears from its original product group display.
9. Closing the last open tab for an assigned URL removes that URL assignment from storage.
10. Deleting a section does not close tabs.
11. Closing the last open tab for an assigned product removes that product assignment from storage.
12. Landing or homepage URLs stay in their product groups unless the user assigns them to a section such as Homepages.
13. Product item actions operate only on the tabs currently rendered inside that product item.
14. DnD ids are namespaced for sections, products, and URL items.
15. Storage migrates to schema version 3 with `sections`, `sectionAssignments`, and `viewMode`.
16. The implementation passes `npm run check`.
