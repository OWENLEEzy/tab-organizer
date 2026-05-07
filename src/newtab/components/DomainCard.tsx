import React, { useCallback, useMemo, useState } from 'react';
import type { TabGroup } from '../../types';
import { TabChip } from './TabChip';
import { getVisibleTabs } from '../lib/visible-tabs';
import { getFaviconUrl } from '../../utils/favicon';

// ─── Types ────────────────────────────────────────────────────────────

interface DomainCardProps {
  group: TabGroup;
  dragHandleProps?: Record<string, unknown>;
  expanded?: boolean;
  maxChipsVisible?: number;
  onCloseDomain: (group: TabGroup) => void;
  onCloseDuplicates: (urls: string[]) => void;
  onCloseTab: (url: string) => void;
  onFocusTab: (url: string) => void;
  focusedUrl?: string | null;
  closingUrls?: Set<string>;
  selectedUrls?: Set<string>;
  onChipClick?: (url: string, event: React.MouseEvent) => void;
  onToggleExpanded?: (domain: string) => void;
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
      className="h-4 w-4"
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
      className="h-4 w-4"
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
  selectionMode,
  onFocus,
  onClose,
  onChipClick,
}: {
  tab: TabGroup['tabs'][number];
  duplicateCount: number;
  focusedUrl?: string | null;
  closingUrls?: Set<string>;
  selectedUrls?: Set<string>;
  selectionMode: boolean;
  onFocus: (url: string) => void;
  onClose: (url: string) => void;
  onChipClick?: (url: string, event: React.MouseEvent) => void;
}): React.ReactElement {
  return (
    <div className="tab-chip-row">
      <TabChip
        url={tab.url}
        title={tab.title}
        favIconUrl={tab.favIconUrl}
        duplicateCount={duplicateCount}
        active={tab.active}
        isFocused={tab.url === focusedUrl}
        isClosing={closingUrls?.has(tab.url)}
        isSelected={selectedUrls?.has(tab.url)}
        selectionMode={selectionMode}
        onFocus={onFocus}
        onClose={onClose}
        onChipClick={onChipClick}
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
  onCloseDomain,
  onCloseDuplicates,
  onCloseTab,
  onFocusTab,
  focusedUrl,
  closingUrls,
  selectedUrls,
  onChipClick,
  onToggleExpanded,
}: DomainCardProps): React.ReactElement {
  const tabs = useMemo(() => group.tabs || [], [group.tabs]);
  const tabCount = tabs.length;
  const displayName = group.friendlyName || group.domain;
  const selectionMode = (selectedUrls?.size ?? 0) > 0;
  const [failedFaviconUrl, setFailedFaviconUrl] = useState('');
  const groupFaviconUrl = useMemo(
    () => tabs.find((tab) => tab.favIconUrl.trim() !== '')?.favIconUrl.trim() ?? getFaviconUrl(tabs[0]?.url || ''),
    [tabs],
  );
  const iconFailed = groupFaviconUrl !== '' && failedFaviconUrl === groupFaviconUrl;
  const initial = displayName.trim().charAt(0).toUpperCase() || '?';

  // Count URL occurrences to detect duplicates
  const { urlCounts, dupeUrls, totalExtras } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of tabs) {
      counts[tab.url] = (counts[tab.url] || 0) + 1;
    }
    const dupes = Object.entries(counts).filter(([, c]) => c > 1);
    const extras = dupes.reduce((sum, [, c]) => sum + c - 1, 0);
    return { urlCounts: counts, dupeUrls: dupes, totalExtras: extras };
  }, [tabs]);

  const hasDupes = dupeUrls.length > 0;

  const { visibleTabs, hiddenTabs } = useMemo(
    () => getVisibleTabs(tabs, maxChipsVisible, expanded),
    [tabs, maxChipsVisible, expanded],
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

  const statusBarColor = hasDupes ? 'bg-accent-amber/30' : 'bg-accent-sage/80';

  return (
    <div className="overflow-hidden rounded-card border-2 border-border-light bg-card-light shadow-none transition-colors duration-150 dark:border-border-dark dark:bg-card-dark">
      <div className={`h-2 border-b-2 border-border-light dark:border-border-dark ${statusBarColor}`} />

      <div className="border-b-2 border-border-light p-4 dark:border-border-dark">
        {/* Header: domain name + badges — drag handle when DnD is active */}
        <div
          className={`flex flex-wrap items-center gap-2${dragHandleProps ? ' cursor-grab active:cursor-grabbing' : ''}`}
          {...dragHandleProps}
        >
          {dragHandleProps && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="text-text-secondary h-4 w-4 shrink-0"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
          {iconFailed || !groupFaviconUrl ? (
            <span
              className="bg-surface-light dark:bg-surface-dark text-text-secondary flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] text-xs font-semibold"
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
              className="favicon h-5 w-5 shrink-0 rounded-[3px]"
              onError={() => setFailedFaviconUrl(groupFaviconUrl)}
            />
          )}
          <h3 className="min-w-0 flex-1 truncate font-heading text-base font-normal tracking-tight text-text-primary-light dark:text-text-primary-dark">
            {displayName}
          </h3>

          <div className="flex items-center gap-1">
            {hasDupes && (
              <button
                type="button"
                className="flex h-7 items-center gap-1 rounded-sm bg-accent-amber px-2 text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
                onClick={handleCloseDuplicates}
                title="Close duplicate tabs"
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
          {visibleTabs.map((tab) => (
            <TabChipRow
              key={tab.url}
              tab={tab}
              duplicateCount={urlCounts[tab.url] ?? 1}
              focusedUrl={focusedUrl}
              closingUrls={closingUrls}
              selectedUrls={selectedUrls}
              selectionMode={selectionMode}
              onFocus={handleFocusTab}
              onClose={handleCloseTab}
              onChipClick={onChipClick}
            />
          ))}
        </div>

        {/* "+N more" expand button */}
        {extraCount > 0 && (
          <button
            type="button"
            className="rounded-chip text-accent-blue font-body hover:bg-accent-blue/10 focus-visible:ring-accent-blue/40 mt-1 flex min-h-11 cursor-pointer items-center px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
            onClick={handleExpand}
            aria-expanded={expanded}
            aria-label={
              expanded
                ? `Collapse ${extraCount} more tabs`
                : `Show ${extraCount} more tabs`
            }
          >
            {expanded
              ? 'Show less'
              : `+${extraCount} more`}
          </button>
        )}

        {/* Footer actions */}
        <div className="mt-3 flex flex-wrap gap-2 border-t-2 border-border-light pt-3 dark:border-border-dark">
          <button
            type="button"
            className="rounded-chip text-text-secondary font-body hover:bg-surface-light hover:text-accent-red dark:hover:bg-surface-dark focus-visible:ring-accent-blue/40 inline-flex min-h-11 cursor-pointer items-center gap-1.5 px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
            onClick={handleCloseDomain}
          >
            <CloseAllIcon />
            Close all {tabCount} tab{tabCount !== 1 ? 's' : ''}
          </button>

          {hasDupes && (
            <button
              type="button"
              className="rounded-chip text-text-secondary font-body hover:bg-accent-amber/10 hover:text-accent-amber focus-visible:ring-accent-blue/40 inline-flex min-h-11 cursor-pointer items-center gap-1.5 px-3 py-1.5 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
              onClick={handleCloseDuplicates}
            >
              <DedupIcon />
              Close {totalExtras} duplicate{totalExtras !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
