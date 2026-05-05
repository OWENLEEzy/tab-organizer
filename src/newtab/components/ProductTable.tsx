import React, { useMemo, useState } from 'react';
import type { OrganizerSection, TabGroup } from '../../types';
import { TabChip } from './TabChip';
import { getFaviconUrl } from '../../utils/favicon';

interface ProductTableProps {
  items: TabGroup[];
  sections: OrganizerSection[];
  assignmentByItemId: Map<string, string>;
  onMoveItem: (group: TabGroup, sectionId: string) => void;
  onCloseDomain: (group: TabGroup) => void;
  onCloseDuplicates: (urls: string[]) => void;
  onFocusTab: (url: string) => void;
  expandedDomains?: Set<string>;
  onToggleExpanded?: (domain: string) => void;
  onCloseTab?: (url: string) => void;
  onChipClick?: (url: string, event: React.MouseEvent) => void;
  selectedUrls?: Set<string>;
  closingUrls?: Set<string>;
  focusedUrl?: string | null;
}

function ChevronIcon({ expanded }: { expanded: boolean }): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function itemId(group: TabGroup): string {
  return `product:${group.itemKey ?? group.productKey ?? group.domain}`;
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
  const [failedFaviconUrl, setFailedFaviconUrl] = useState('');
  const label = group.friendlyName || group.domain;
  const initial = label.trim().charAt(0).toUpperCase() || '?';
  const faviconUrl = useMemo(
    () => group.tabs.find((tab) => tab.favIconUrl.trim() !== '')?.favIconUrl.trim() ?? getFaviconUrl(group.tabs[0]?.url || ''),
    [group.tabs],
  );
  const failed = faviconUrl !== '' && failedFaviconUrl === faviconUrl;

  if (failed || !faviconUrl) {
    return (
      <span className="table-icon-fallback" aria-hidden="true">
        {initial}
      </span>
    );
  }

  return (
    <img
      className="favicon table-icon"
      src={faviconUrl}
      alt=""
      onError={() => setFailedFaviconUrl(faviconUrl)}
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
  expandedDomains = new Set(),
  onToggleExpanded = () => {},
  onCloseTab = () => {},
  onChipClick = () => {},
  selectedUrls = new Set(),
  closingUrls = new Set(),
  focusedUrl = null,
}: ProductTableProps): React.ReactElement {
  const rows = useMemo(() => [...items].sort((a, b) => a.order - b.order), [items]);

  return (
    <div className="product-table-wrap overflow-x-auto">
      <table className="product-table w-full border-collapse">
        <thead>
          <tr>
            <th className="w-10"></th>
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
            const isExpanded = expandedDomains.has(group.domain);
            const selectionMode = (selectedUrls?.size ?? 0) > 0;

            return (
              <React.Fragment key={group.id}>
                <tr className={isExpanded ? 'bg-surface-light/30 dark:bg-surface-dark/30' : ''}>
                  <td>
                    <button
                      type="button"
                      className="product-table-expand-toggle"
                      onClick={() => onToggleExpanded(group.domain)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? `Collapse ${group.friendlyName || group.domain}` : `Expand ${group.friendlyName || group.domain}`}
                    >
                      <ChevronIcon expanded={isExpanded} />
                    </button>
                  </td>
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
                      <option value="">Unsorted</option>
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
                {isExpanded && (
                  <tr className="product-table-detail-row">
                    <td colSpan={6}>
                      <div className="product-table-tabs-list">
                        {group.tabs.map((tab) => (
                          <TabChip
                            key={tab.url}
                            url={tab.url}
                            title={tab.title}
                            favIconUrl={tab.favIconUrl}
                            duplicateCount={group.tabs.filter(t => t.url === tab.url).length}
                            active={tab.active}
                            isFocused={tab.url === focusedUrl}
                            isClosing={closingUrls?.has(tab.url)}
                            isSelected={selectedUrls?.has(tab.url)}
                            selectionMode={selectionMode}
                            onFocus={onFocusTab}
                            onClose={onCloseTab}
                            onChipClick={onChipClick}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
