import React, { useCallback, useMemo, useState } from 'react';
import type { TabGroup } from '../../types';
import { TabChip } from './TabChip';
import { getVisibleTabs } from '../lib/visible-tabs';
import { getGroupFaviconUrl } from '../../lib/tab-utils';
import { useI18n } from '../hooks/useI18n';

// ─── Types ────────────────────────────────────────────────────────────

interface DomainCardProps {
  group: TabGroup;
  dragHandleProps?: Record<string, unknown>;
  expanded?: boolean;
  maxChipsVisible?: number;
  staleThresholdDays?: number;
  onCloseDomain: (group: TabGroup) => void;
  onCloseDuplicates: (urls: string[]) => void;
  onCloseTab: (url: string) => void;
  onFocusTab: (url: string) => void;
  focusedUrl?: string | null;
  closingUrls?: Set<string>;
  selectedUrls?: Set<string>;
  selectedTabIds?: Set<number>;
  onChipClick?: (url: string, event: React.MouseEvent) => void;
  onToggleExpanded?: (domain: string) => void;
  searchQuery?: string;
}

// ─── Constants ────────────────────────────────────────────────────────

const DEFAULT_MAX_CHIPS = 8;

// ─── SVG Icons ────────────────────────────────────────────────────────


function CloseAllIcon(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="size-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18 18 6M6 6l12 12"
      />
    </svg>
  );
}

function DedupIcon(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="size-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
      />
    </svg>
  );
}

function TabChipRow({
  tab,
  duplicateCount,
  focusedUrl,
  closingUrls,
  selectedUrls,
  selectedTabIds,
  selectionMode,
  onFocus,
  onClose,
  onChipClick,
  searchQuery,
  staleThresholdDays,
}: {
  tab: TabGroup['tabs'][number];
  duplicateCount: number;
  focusedUrl?: string | null;
  closingUrls?: Set<string>;
  selectedUrls?: Set<string>;
  selectedTabIds?: Set<number>;
  selectionMode: boolean;
  onFocus: (url: string) => void;
  onClose: (url: string) => void;
  onChipClick?: (url: string, event: React.MouseEvent) => void;
  searchQuery?: string;
  staleThresholdDays?: number;
}): React.ReactElement {
  return (
    <div className="tab-chip-row cursor-pointer">
      <TabChip
        url={tab.url}
        title={tab.title}
        favIconUrl={tab.favIconUrl}
        duplicateCount={duplicateCount}
        active={tab.active}
        isFocused={tab.url === focusedUrl}
        isClosing={closingUrls?.has(tab.url)}
        isSelected={selectedUrls?.has(tab.url) || (selectedTabIds?.has(tab.id) ?? false)}
        selectionMode={selectionMode}
        onFocus={onFocus}
        onClose={onClose}
        onChipClick={onChipClick}
        searchQuery={searchQuery}
        lastAccessed={tab.lastAccessed}
        staleThresholdDays={staleThresholdDays}
        pinned={tab.pinned}
        audible={tab.audible}
      />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────

export function DomainCard({
  group,
  dragHandleProps,
  expanded = false,
  maxChipsVisible = DEFAULT_MAX_CHIPS,
  staleThresholdDays = 3,
  onCloseDomain,
  onCloseDuplicates,
  onCloseTab,
  onFocusTab,
  focusedUrl,
  closingUrls,
  selectedUrls,
  selectedTabIds,
  onChipClick,
  onToggleExpanded,
  searchQuery = '',
}: DomainCardProps): React.ReactElement {
  const { t } = useI18n();
  const tabs = useMemo(() => group.tabs || [], [group.tabs]);
  const tabCount = tabs.length;
  const displayName = group.friendlyName || group.domain;
  const selectionMode = (selectedUrls?.size ?? 0) > 0 || (selectedTabIds?.size ?? 0) > 0;
  const [failedFaviconUrl, setFailedFaviconUrl] = useState('');
  const groupFaviconUrl = useMemo(
    () => getGroupFaviconUrl(tabs),
    [tabs],
  );
  const iconFailed = groupFaviconUrl !== '' && failedFaviconUrl === groupFaviconUrl;
  const initial = displayName.trim().charAt(0).toUpperCase() || '?';

  // Count URL occurrences to detect duplicates (Map is faster than plain object)
  const { tabUrlCounts, dupeUrls, totalExtras } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tab of tabs) {
      counts.set(tab.url, (counts.get(tab.url) ?? 0) + 1);
    }
    const dupes = [...counts.entries()].filter(([, c]) => c > 1);
    const extras = dupes.reduce((sum, [, c]) => sum + c - 1, 0);
    return { tabUrlCounts: counts, dupeUrls: dupes, totalExtras: extras };
  }, [tabs]);

  const hasDupes = dupeUrls.length > 0;

  const isSearching = searchQuery.trim().length > 0;

  const { visibleTabs, hiddenTabs } = useMemo(
    () => getVisibleTabs(tabs, maxChipsVisible, isSearching ? true : expanded),
    [tabs, maxChipsVisible, isSearching, expanded],
  );
  const extraCount = hiddenTabs.length;

  // ─── Handlers ────────────────────────────────────────────────────────

  const handleCloseDomain = useCallback(() => {
    onCloseDomain(group);
  }, [onCloseDomain, group]);

  const handleCloseDuplicates = useCallback(() => {
    const urls = dupeUrls.map(([url]) => url);
    onCloseDuplicates(urls);
  }, [onCloseDuplicates, dupeUrls]);

  const handleExpand = useCallback(() => {
    onToggleExpanded?.(group.domain);
  }, [group.domain, onToggleExpanded]);

  const handleCloseTab = useCallback(
    (url: string) => {
      onCloseTab(url);
    },
    [onCloseTab],
  );

  const handleFocusTab = useCallback(
    (url: string) => {
      onFocusTab(url);
    },
    [onFocusTab],
  );

  // ─── Render ──────────────────────────────────────────────────────────

  const statusBarColor = hasDupes ? 'bg-accent-amber' : 'bg-accent-sage';

  return (
    <div className="app-card rounded-card overflow-hidden">
      <div className={`h-0.5 ${statusBarColor}`} />

      <div className="border-b border-border-color p-4 bg-bg-surface/20">
        {/* Header: domain name + badges — DnD uses a dedicated handle to avoid nested interactive controls. */}
        <div className="flex flex-wrap items-center gap-2">
          {dragHandleProps && (
            <button
              type="button"
              className="text-text-secondary hover:text-text-primary focus-visible:ring-accent-primary/40 flex size-6 shrink-0 cursor-grab items-center justify-center rounded-sm transition-colors active:cursor-grabbing focus-visible:ring-2 focus-visible:outline-none"
              {...dragHandleProps}
              onClick={(event) => event.preventDefault()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-4"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          )}
          {iconFailed || !groupFaviconUrl ? (
            <span
              className="bg-bg-surface border border-border-color/30 text-text-secondary flex size-5 shrink-0 items-center justify-center rounded-[3px] text-xs font-semibold"
              aria-hidden="true"
            >
              {initial}
            </span>
          ) : (
            <img
              src={groupFaviconUrl}
              alt=""
              width={20}
              height={20}
              className="favicon size-5 shrink-0 rounded-[3px]"
              onError={() => setFailedFaviconUrl(groupFaviconUrl)}
            />
          )}
          <h3 className="min-w-0 flex-1 truncate font-mono text-sm font-medium uppercase tracking-wider text-text-primary">
            {displayName}
          </h3>

          <div className="flex items-center gap-1">
            {hasDupes && (
              <button
                type="button"
                className="flex h-7 items-center gap-1 rounded-sm bg-accent-amber px-2 text-[var(--text-3xs)] font-semibold tracking-wider text-white transition-opacity hover:opacity-90 rotate-[2deg]"
                onClick={handleCloseDuplicates}
                title={t('cardCloseDupesTitle')}
              >
                <DedupIcon />
                <span>{totalExtras}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">

        {/* Tab chips */}
        <div className="flex flex-col gap-0.5">
          {visibleTabs.map((tab, index) => (
            <TabChipRow
              key={tab.id >= 0 ? tab.id : `${tab.url}:${index}`}
              tab={tab}
              duplicateCount={tabUrlCounts.get(tab.url) ?? 1}
              focusedUrl={focusedUrl}
              closingUrls={closingUrls}
              selectedUrls={selectedUrls}
              selectedTabIds={selectedTabIds}
              selectionMode={selectionMode}
              onFocus={handleFocusTab}
              onClose={handleCloseTab}
              onChipClick={onChipClick}
              searchQuery={searchQuery}
              staleThresholdDays={staleThresholdDays}
            />
          ))}
        </div>

        {extraCount > 0 && (
          <button
            type="button"
            className="w-full mt-1.5 py-1.5 text-[10px] font-mono tracking-wider text-text-muted border border-dashed border-border-color rounded hover:text-text-primary bg-transparent cursor-pointer transition-colors duration-150"
            onClick={handleExpand}
            aria-expanded={expanded}
            aria-label={
              expanded
                ? t('cardCollapseMoreLabel', { count: extraCount })
                : t('cardShowMoreLabel', { count: extraCount })
            }
          >
            <span className="uppercase">
              {expanded
                ? t('cardBtnShowLess')
                : t('cardBtnShowMore', { count: extraCount })}
            </span>
          </button>
        )}

        {/* Footer actions */}
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border-color pt-3">
          <button
            type="button"
            className="rounded-chip text-text-secondary font-body hover:bg-bg-surface hover:text-accent-red focus-visible:ring-accent-primary/40 inline-flex min-h-[var(--spacing-button-height)] cursor-pointer items-center gap-1.5 px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
            onClick={handleCloseDomain}
          >
            <CloseAllIcon />
            {tabCount === 1 ? t('cardBtnCloseAllSingle') : t('cardBtnCloseAllPlural', { count: tabCount })}
          </button>

          {hasDupes && (
            <button
              type="button"
              className="rounded-chip text-text-secondary font-body hover:bg-accent-amber/10 hover:text-accent-amber focus-visible:ring-accent-primary/40 inline-flex min-h-[var(--spacing-button-height)] cursor-pointer items-center gap-1.5 px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
              onClick={handleCloseDuplicates}
            >
              <DedupIcon />
              {totalExtras === 1 ? t('cardBtnCloseDupesSingle') : t('cardBtnCloseDupesPlural', { count: totalExtras })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export const DomainCardMemo = React.memo(DomainCard);
