import React, { useMemo, useState } from 'react';
import { getFaviconUrl } from '../../utils/url';
import type { OrganizerSection, TabGroup } from '../../types';

interface ProductTableProps {
  items: TabGroup[];
  sections: OrganizerSection[];
  assignmentByItemId: Map<string, string>;
  onMoveItem: (group: TabGroup, sectionId: string) => void;
  onCloseDomain: (group: TabGroup) => void;
  onCloseDuplicates: (urls: string[]) => void;
  onFocusTab: (url: string) => void;
}

function itemId(group: TabGroup): string {
  return `${group.itemType ?? 'product'}:${group.itemKey ?? group.domain}`;
}

function duplicateUrls(group: TabGroup): string[] {
  const counts = new Map<string, number>();
  for (const tab of group.tabs) {
    counts.set(tab.url, (counts.get(tab.url) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([url]) => url);
}

function RowIcon({ group }: { group: TabGroup }): React.ReactElement {
  const [failed, setFailed] = useState(false);
  const label = group.friendlyName || group.domain;
  const initial = label.trim().charAt(0).toUpperCase() || '?';
  const iconDomain = group.iconDomain ?? group.domain;

  if (failed || iconDomain === 'local-files') {
    return (
      <span className="table-icon-fallback">
        {initial}
      </span>
    );
  }

  return (
    <img
      className="table-icon"
      src={getFaviconUrl(iconDomain)}
      alt=""
      onError={() => setFailed(true)}
    />
  );
}

export function ProductTable({
  items,
  sections,
  assignmentByItemId,
  onMoveItem,
  onCloseDomain,
  onCloseDuplicates,
  onFocusTab,
}: ProductTableProps): React.ReactElement {
  const rows = useMemo(() => [...items].sort((a, b) => a.order - b.order), [items]);

  return (
    <div className="product-table-wrap">
      <table className="product-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Section</th>
            <th>Tabs</th>
            <th>Duplicates</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((group) => {
            const id = itemId(group);
            const sectionId = assignmentByItemId.get(id) ?? '';
            const dupes = duplicateUrls(group);
            return (
              <tr key={group.id}>
                <td>
                  <button
                    type="button"
                    className="product-table-name"
                    onClick={() => onFocusTab(group.tabs[0]?.url ?? '')}
                  >
                    <RowIcon group={group} />
                    <span>{group.friendlyName || group.domain}</span>
                  </button>
                </td>
                <td>
                  <select
                    value={sectionId}
                    onChange={(event) => onMoveItem(group, event.target.value)}
                    aria-label={`Move ${group.friendlyName || group.domain}`}
                  >
                    <option value="">Right now</option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{group.tabs.length}</td>
                <td>{group.duplicateCount}</td>
                <td>
                  <div className="table-actions">
                    <button type="button" onClick={() => onCloseDomain(group)}>
                      Close
                    </button>
                    {dupes.length > 0 && (
                      <button type="button" onClick={() => onCloseDuplicates(dupes)}>
                        Dedupe
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
