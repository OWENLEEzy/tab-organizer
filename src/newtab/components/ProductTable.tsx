import React, { useMemo, useState } from 'react';
import type { ManualGroup, TabGroup } from '../../types';
import { TabChip } from './TabChip';
import { getFaviconUrl } from '../../utils/favicon';
import { getDuplicateUrls } from '../../lib/tab-utils';

interface ProductTableProps {
  items: TabGroup[];
  groups: ManualGroup[];
  assignmentByItemId: Map<string, string>;
  onMoveItem: (p: TabGroup, groupId: string) => void;
  onCloseProduct: (p: TabGroup) => void;
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

function itemId(p: TabGroup): string {
  return `product:${p.itemKey ?? p.productKey ?? p.domain}`;
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
  groups,
  assignmentByItemId,
  onMoveItem,
  onCloseProduct,
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
            <th className="col-name">Name</th>
            <th className="col-group w-32">Group</th>
            <th className="col-tabs w-20 text-center">Tabs</th>
            <th className="col-dupes w-24 text-center">Duplicates</th>
            <th className="col-actions text-right pr-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const id = itemId(p);
            const groupId = assignmentByItemId.get(id) ?? '';
            const dupes = getDuplicateUrls(p.tabs);
            const isExpanded = expandedDomains.has(p.domain);
            const selectionMode = (selectedUrls?.size ?? 0) > 0;

            return (
              <React.Fragment key={p.id}>
                <tr className={isExpanded ? 'bg-surface-light/30 dark:bg-surface-dark/30' : ''}>
                  <td className="w-10">
                    <button
                      type="button"
                      className="product-table-expand-toggle"
                      onClick={() => onToggleExpanded(p.domain)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? `Collapse ${p.friendlyName || p.domain}` : `Expand ${p.friendlyName || p.domain}`}
                    >
                      <ChevronIcon expanded={isExpanded} />
                    </button>
                  </td>
                  <td className="col-name">
                    <button
                      type="button"
                      className="product-table-name"
                      onClick={() => onFocusTab(p.tabs[0]?.url ?? '')}
                    >
                      <RowIcon group={p} />
                      <span>{p.friendlyName || p.domain}</span>
                    </button>
                  </td>
                  <td className="col-group">
                    <select
                      value={groupId}
                      onChange={(event) => onMoveItem(p, event.target.value)}
                      aria-label={`Move ${p.friendlyName || p.domain}`}
                      className="w-full"
                    >
                      <option value="">Unsorted</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="col-tabs text-center">{p.tabs.length}</td>
                  <td className="col-dupes text-center">{p.duplicateCount}</td>
                  <td className="col-actions text-right pr-4">
                    <div className="table-actions justify-end">
                      <button type="button" onClick={() => onCloseProduct(p)}>
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
                        {p.tabs.map((tab) => (
                          <TabChip
                            key={tab.url}
                            url={tab.url}
                            title={tab.title}
                            favIconUrl={tab.favIconUrl}
                            duplicateCount={p.tabs.filter(t => t.url === tab.url).length}
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
