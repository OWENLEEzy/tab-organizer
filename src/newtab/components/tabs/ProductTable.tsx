import React, { useMemo, useState } from 'react';
import type { Section, TabGroup } from '../../../types';
import { TabChip } from './TabChip';
import { analyzeDuplicates } from '../../../lib/duplicate-analysis';
import { getProductKey } from '../../../lib/product-key';
import { getGroupFaviconSource } from '../../../lib/group-favicon';
import { getFaviconUrl } from '../../../utils/favicon';
import { ActionButton } from '../ui/ActionButton';
import { useI18n } from '../../hooks/useI18n';

interface ProductTableProps {
  items: TabGroup[];
  sections: Section[];
  assignmentByItemId: Map<string, string>;
  onMoveItem: (p: TabGroup, sectionId: string) => void;
  onCloseProduct: (p: TabGroup) => void;
  onCloseDuplicates: (urls: string[]) => void;
  onFocusTab: (url: string) => void;
  expandedDomains?: Set<string>;
  onToggleExpanded?: (domain: string) => void;
  onCloseTab?: (url: string) => void;
  onChipClick?: (url: string, event: React.MouseEvent) => void;
  selectedUrls?: Set<string>;
  selectedTabIds?: Set<number>;
  closingUrls?: Set<string>;
  focusedUrl?: string | null;
  searchQuery?: string;
  staleThresholdDays?: number;
}

function ChevronIcon({ expanded }: { expanded: boolean }): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={`size-4 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function itemId(p: TabGroup): string {
  return `product:${getProductKey(p)}`;
}

function RowIcon({ group }: { group: TabGroup }): React.ReactElement {
  const [failedFaviconUrl, setFailedFaviconUrl] = useState('');
  const label = group.friendlyName || group.domain;
  const initial = label.trim().charAt(0).toUpperCase() || '?';
  const faviconUrl = useMemo(
    () => getFaviconUrl(getGroupFaviconSource(group.tabs)),
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
  onCloseProduct,
  onCloseDuplicates,
  onFocusTab,
  expandedDomains = new Set(),
  onToggleExpanded = () => {},
  onCloseTab = () => {},
  onChipClick = () => {},
  selectedUrls = new Set(),
  selectedTabIds = new Set(),
  closingUrls = new Set(),
  focusedUrl = null,
  searchQuery = '',
  staleThresholdDays = 3,
}: ProductTableProps): React.ReactElement {
  const { t } = useI18n();
  const rows = items;

  // Pre-compute duplicate URLs once per items array instead of once per rendered row.
  const dupeUrlsByProductId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of items) {
      map.set(p.id, analyzeDuplicates(p.tabs).duplicateUrls);
    }
    return map;
  }, [items]);

  return (
    <div className="product-table-wrap overflow-x-auto">
      <table className="product-table w-full border-collapse">
        <thead>
          <tr>
            <th className="w-10"></th>
            <th className="col-name">{t('tableHeaderName')}</th>
            <th className="col-group w-32">{t('tableHeaderGroup')}</th>
            <th className="col-tabs w-20 text-center">{t('tableHeaderTabs')}</th>
            <th className="col-dupes w-24 text-center">{t('tableHeaderDuplicates')}</th>
            <th className="col-actions text-right pr-4">{t('tableHeaderActions')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const id = itemId(p);
            const sectionId = assignmentByItemId.get(id) ?? '';
            const dupes = dupeUrlsByProductId.get(p.id) ?? [];
            const isExpanded = expandedDomains.has(p.domain);
            const selectionMode = (selectedUrls?.size ?? 0) > 0 || (selectedTabIds?.size ?? 0) > 0;

            return (
              <React.Fragment key={p.id}>
                <tr className={isExpanded ? 'bg-surface-light/30 dark:bg-surface-dark/30' : ''}>
                  <td className="w-10">
                    <button
                      type="button"
                      className="product-table-expand-toggle"
                      onClick={() => onToggleExpanded(p.domain)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? t('tableCollapseLabel', { name: p.friendlyName || p.domain }) : t('tableExpandLabel', { name: p.friendlyName || p.domain })}
                    >
                      <ChevronIcon expanded={isExpanded} />
                    </button>
                  </td>
                  <td className="col-name">
                    <button
                      type="button"
                      className="product-table-name cursor-pointer"
                      onClick={() => onFocusTab(p.tabs[0]?.url ?? '')}
                    >
                      <RowIcon group={p} />
                      <span>{p.friendlyName || p.domain}</span>
                    </button>
                  </td>
                  <td className="col-group">
                    <select
                      value={sectionId}
                      onChange={(event) => onMoveItem(p, event.target.value)}
                      aria-label={`Move ${p.friendlyName || p.domain}`}
                      className="w-full"
                    >
                      <option value="">{t('tableUnsorted')}</option>
                      {sections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="col-tabs text-center">{p.tabs.length}</td>
                  <td className="col-dupes text-center">{p.duplicateCount}</td>
                  <td className="col-actions text-right pr-4">
                    <div className="table-actions flex items-center justify-end gap-2">
                      <ActionButton variant="default" onClick={() => onCloseProduct(p)}>
                        {t('tableBtnClose')}
                      </ActionButton>
                      {dupes.length > 0 && (
                        <ActionButton variant="default" onClick={() => onCloseDuplicates(dupes)}>
                          {t('tableBtnDedupe')}
                        </ActionButton>
                      )}
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="product-table-detail-row">
                    <td colSpan={6}>
                      <div className="product-table-tabs-list">
                        {p.tabs.map((tab, index) => (
                          <TabChip
                            key={tab.id >= 0 ? tab.id : `${tab.url}:${index}`}
                            url={tab.url}
                            title={tab.title}
                            favIconUrl={tab.favIconUrl}
                            duplicateCount={p.tabs.filter(t => t.url === tab.url).length}
                            active={tab.active}
                            isFocused={tab.url === focusedUrl}
                            isClosing={closingUrls?.has(tab.url)}
                            isSelected={selectedUrls?.has(tab.url) || (selectedTabIds?.has(tab.id) ?? false)}
                            selectionMode={selectionMode}
                            onFocus={onFocusTab}
                            onClose={onCloseTab}
                            onChipClick={onChipClick}
                            searchQuery={searchQuery}
                            lastAccessed={tab.lastAccessed}
                            staleThresholdDays={staleThresholdDays}
                            pinned={tab.pinned}
                            audible={tab.audible}
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

export const ProductTableMemo = React.memo(ProductTable);
