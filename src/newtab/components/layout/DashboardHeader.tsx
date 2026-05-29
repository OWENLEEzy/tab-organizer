import React from 'react';
import { SearchBar } from '../search/SearchBar';
import { ViewToggle } from '../search/ViewToggle';
import { SortButton } from '../search/SortButton';
import { SortDropdown } from '../search/SortDropdown';
import { ActionButton } from '../ui/ActionButton';
import { SectionSwitcher } from '../organizer/SectionSwitcher';
import { useI18n } from '../../hooks/useI18n';
import { getDateFormatter } from '../../lib/date-formatters';
import type { GroupSortOption, Section } from '../../../types';

// ─── Helpers ──────────────────────────────────────────────────────────

const EMPTY_SECTIONS: Section[] = [];

interface DashboardHeaderProps {
  title: string;
  hasGroups: boolean;
  dateLabel?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultCount: number;
  totalCount: number;
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
  groupSortBy: GroupSortOption;
  onGroupSortByChange: (sortBy: GroupSortOption) => void;
  sortButtonDisabled: boolean;
  onSortWindow: () => void;
  onRefresh: () => void;
  onCreateSection: () => void;
  onOpenSettings: () => void;
  isSidebarExpanded?: boolean;
  onToggleSidebar?: () => void;
  sections?: Section[];
  sectionIds?: (string | null)[];
  activeSectionId: string | null;
  onSectionChange: (id: string | null) => void;
  isSectionSwitcherFocused?: boolean;
}

function RefreshIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
    </svg>
  );
}

function SettingsIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87l.22.127c.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992v.255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124l-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87l-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991v-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124l.22-.128c.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function SidebarIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.5-15h15a2.25 2.25 0 0 1 2.25 2.25v13.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75A2.25 2.25 0 0 1 4.5 4.5Z" />
    </svg>
  );
}

export function DashboardHeader({
  title,
  hasGroups,
  dateLabel,
  searchQuery,
  onSearchChange,
  resultCount,
  totalCount,
  viewMode,
  onViewModeChange,
  groupSortBy,
  onGroupSortByChange,
  sortButtonDisabled,
  onSortWindow,
  onRefresh,
  onCreateSection,
  onOpenSettings,
  isSidebarExpanded = false,
  onToggleSidebar,
  sections = EMPTY_SECTIONS,
  sectionIds,
  activeSectionId,
  onSectionChange,
  isSectionSwitcherFocused,
}: DashboardHeaderProps): React.ReactElement {
  const { t, locale } = useI18n();
  const headingId = React.useId();

  const formatDate = (date: Date): string => {
    return getDateFormatter(locale).format(date);
  };

  const activeDateLabel = dateLabel || formatDate(new Date());

  return (
    <section className="pb-3 pt-2" aria-labelledby={headingId}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 border-b border-border-light pb-3 dark:border-border-dark md:flex-row md:items-center md:justify-between">
          <SectionSwitcher
            sections={sections}
            sectionIds={sectionIds}
            activeSectionId={activeSectionId}
            onChange={onSectionChange}
            onCreateSection={onCreateSection}
            isFocused={isSectionSwitcherFocused}
          />
          <p className="font-body text-xs font-semibold tracking-normal text-text-secondary uppercase md:text-right">
            {activeDateLabel}
          </p>
        </div>
        <div className="flex flex-col gap-3 border-b border-border-light pb-3 dark:border-border-dark lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 id={headingId} className="mt-1 font-heading text-3xl font-normal tracking-tight text-text-primary-light dark:text-text-primary-dark">
              {title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {hasGroups ? (
              <>
                <ViewToggle value={viewMode} onChange={onViewModeChange} />
                <SortDropdown value={groupSortBy} onChange={onGroupSortByChange} />
                <SortButton
                  disabled={sortButtonDisabled}
                  disabledTooltip={t('sortButtonDisabledTooltip')}
                  onClick={onSortWindow}
                />
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {hasGroups ? (
            <>
              <div className="min-w-0 flex-1 md:min-w-[24rem]">
                <SearchBar
                  value={searchQuery}
                  onChange={onSearchChange}
                  resultCount={resultCount}
                  totalCount={totalCount}
                  sections={sections}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <ActionButton variant="quiet" icon={<RefreshIcon />} onClick={onRefresh} aria-label="Refresh tabs">
                  {t('refresh')}
                </ActionButton>
              </div>
            </>
          ) : (
            <div className="min-w-0 flex-1" />
          )}
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <ActionButton variant="quiet" icon={<SettingsIcon />} onClick={onOpenSettings} aria-label={t('settings')}>
              {t('settings')}
            </ActionButton>
            <ActionButton
              variant="quiet"
              icon={<SidebarIcon />}
              onClick={onToggleSidebar}
              aria-label={isSidebarExpanded ? t('historyHide') : t('historyShow')}
              className={isSidebarExpanded ? 'text-accent-blue bg-accent-blue/5' : ''}
            >
              {isSidebarExpanded ? t('historyHide') : t('historyShow')}
            </ActionButton>
          </div>
        </div>
      </div>
    </section>
  );
}
