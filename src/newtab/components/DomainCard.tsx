import React, { useCallback, useMemo, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { TabGroup } from '../../types';
import { TabChip } from './TabChip';
import { getFaviconUrl } from '../../utils/url';
import { getVisibleTabs } from '../lib/visible-tabs';

// ─── Types ────────────────────────────────────────────────────────────

interface DomainCardProps {
  group: TabGroup;
  dragHandleProps?: Record<string, unknown>;
  expanded?: boolean;
  maxChipsVisible?: number;
  onCloseDomain: (group: TabGroup) => void;
  onCloseDuplicates: (urls: string[]) => void;
  onCloseTab: (url: string) => void;
  onSaveTab: (url: string, title: string) => void;
  onFocusTab: (url: string) => void;
  focusedUrl?: string | null;
  closingUrls?: Set<string>;
  selectedUrls?: Set<string>;
  onChipClick?: (url: string, event: React.MouseEvent) => void;
  onToggleExpanded?: (domain: string) => void;
  draggableTabs?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────

const DEFAULT_MAX_CHIPS = 8;

// ─── SVG Icons ────────────────────────────────────────────────────────

function TabsIcon(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
      />
    </svg>
  );
}

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

function dndIdForTabUrl(url: string): string {
  return `tabUrl:${encodeURIComponent(url)}`;
}

function DraggableTabChip({
  enabled,
  tab,
  duplicateCount,
  focusedUrl,
  closingUrls,
  selectedUrls,
  selectionMode,
  onFocus,
  onClose,
  onSave,
  onChipClick,
}: {
  enabled: boolean;
  tab: TabGroup['tabs'][number];
  duplicateCount: number;
  focusedUrl?: string | null;
  closingUrls?: Set<string>;
  selectedUrls?: Set<string>;
  selectionMode: boolean;
  onFocus: (url: string) => void;
  onClose: (url: string) => void;
  onSave: (url: string, title: string) => void;
  onChipClick?: (url: string, event: React.MouseEvent) => void;
}): React.ReactElement {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: dndIdForTabUrl(tab.url),
    disabled: !enabled,
  });
  const { role: _role, tabIndex: _tabIndex, ...dragAttributes } = attributes;

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="draggable-tab-row">
      {enabled && (
        <span
          className="tab-drag-handle"
          aria-label={`Drag ${tab.title || tab.url}`}
          role="button"
          tabIndex={0}
          {...dragAttributes}
          {...listeners}
        >
          ⋮
        </span>
      )}
      <TabChip
        url={tab.url}
        title={tab.title}
        duplicateCount={duplicateCount}
        active={tab.active}
        isFocused={tab.url === focusedUrl}
        isClosing={closingUrls?.has(tab.url)}
        isSelected={selectedUrls?.has(tab.url)}
        selectionMode={selectionMode}
        onFocus={onFocus}
        onClose={onClose}
        onSave={onSave}
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
  onSaveTab,
  onFocusTab,
  focusedUrl,
  closingUrls,
  selectedUrls,
  onChipClick,
  onToggleExpanded,
  draggableTabs = false,
}: DomainCardProps): React.ReactElement {
  const tabs = useMemo(() => group.tabs || [], [group.tabs]);
  const tabCount = tabs.length;
  const displayName = group.friendlyName || group.domain;
  const selectionMode = (selectedUrls?.size ?? 0) > 0;
  const [iconFailed, setIconFailed] = useState(false);
  const iconDomain = group.iconDomain ?? group.domain;
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

  const handleSaveTab = useCallback(
    (url: string, title: string) => {
      onSaveTab(url, title);
    },
    [onSaveTab],
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
    <div className="rounded-card bg-card-light dark:bg-card-dark shadow-card hover:shadow-card-hover overflow-hidden transition-all duration-200 hover:-translate-y-0.5">
      {/* Status bar — 3px top accent */}
      <div className={`h-[3px] ${statusBarColor}`} />

      <div className="p-4">
        {/* Header: domain name + badges — drag handle when DnD is active */}
        <div
          className={`mb-3 flex flex-wrap items-center gap-2${dragHandleProps ? ' cursor-grab active:cursor-grabbing' : ''}`}
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
          {iconFailed || iconDomain === 'local-files' ? (
            <span className="bg-surface-light dark:bg-surface-dark text-text-secondary flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] text-xs font-semibold">
              {initial}
            </span>
          ) : (
            <img
              src={getFaviconUrl(iconDomain)}
              alt=""
              width={20}
              height={20}
              className="h-5 w-5 shrink-0 rounded-[3px]"
              onError={() => setIconFailed(true)}
            />
          )}
          <h3 className="font-heading text-text-primary-light dark:text-text-primary-dark text-base font-semibold">
            {displayName}
          </h3>

          {/* Tab count badge */}
          <span className="rounded-chip bg-surface-light dark:bg-surface-dark text-text-secondary font-body inline-flex items-center gap-1 px-2 py-0.5 text-xs">
            <TabsIcon />
            {tabCount} tab{tabCount !== 1 ? 's' : ''} open
          </span>

          {hasDupes && (
          <span className="rounded-chip bg-accent-amber/10 text-accent-amber font-body inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            {totalExtras} dupe{totalExtras !== 1 ? 's' : ''}
          </span>
        )}
        </div>

        {/* Tab chips */}
        <div className="flex flex-col gap-0.5">
          {visibleTabs.map((tab) => (
            <DraggableTabChip
              key={tab.url}
              enabled={draggableTabs && !selectionMode && group.itemType !== 'tabUrl'}
              tab={tab}
              duplicateCount={urlCounts[tab.url] ?? 1}
              focusedUrl={focusedUrl}
              closingUrls={closingUrls}
              selectedUrls={selectedUrls}
              selectionMode={selectionMode}
              onFocus={handleFocusTab}
              onClose={handleCloseTab}
              onSave={handleSaveTab}
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
        <div className="border-border-light dark:border-border-dark mt-3 flex flex-wrap gap-2 border-t pt-3">
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
