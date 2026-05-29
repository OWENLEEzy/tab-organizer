import React from 'react';
import { SearchBar } from '../search/SearchBar';
import { SortButton } from '../search/SortButton';
import { SortDropdown } from '../search/SortDropdown';
import { ActionButton } from '../ui/ActionButton';
import { SectionSwitcher } from '../organizer/SectionSwitcher';
import { useI18n } from '../../hooks/useI18n';
import { getDateFormatter } from '../../lib/date-formatters';
import type { GroupSortOption, Section } from '../../../types';

const EMPTY_SECTIONS: Section[] = [];

interface DashboardHeaderProps {
  title: string;
  hasGroups: boolean;
  dateLabel?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultCount: number;
  totalCount: number;
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

function FolderIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6 text-text-primary-light dark:text-text-primary-dark opacity-80">
      <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" />
    </svg>
  );
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
        <div className="flex flex-col gap-3 border-b border-border-light/40 pb-3 dark:border-border-dark/40 md:flex-row md:items-center md:justify-between">
          <SectionSwitcher
            sections={sections}
            sectionIds={sectionIds}
            activeSectionId={activeSectionId}
            onChange={onSectionChange}
            onCreateSection={onCreateSection}
            isFocused={isSectionSwitcherFocused}
          />
          <p className="font-body text-[11px] font-semibold tracking-wide text-text-secondary uppercase md:text-right">
            {activeDateLabel}
          </p>
        </div>
        
        <div className="flex flex-col gap-3 border-b border-border-light/40 pb-3 dark:border-border-dark/40">
          <div className="flex items-center gap-2.5">
            <FolderIcon />
            <h1 id={headingId} className="font-heading text-2xl font-medium tracking-tight text-text-primary-light dark:text-text-primary-dark">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center pt-1">
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
                <SortDropdown value={groupSortBy} onChange={onGroupSortByChange} />
                <SortButton
                  disabled={sortButtonDisabled}
                  disabledTooltip={t('sortButtonDisabledTooltip')}
                  onClick={onSortWindow}
                />
                <div className="w-px h-4 bg-border-color mx-0.5 hidden md:block" />
                <ActionButton variant="quiet" icon={<RefreshIcon />} onClick={onRefresh} aria-label="Refresh tabs" />
              </div>
            </>
          ) : (
            <div className="min-w-0 flex-1" />
          )}
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <ActionButton variant="quiet" icon={<SettingsIcon />} onClick={onOpenSettings} aria-label={t('settings')} />
            <ActionButton
              variant="quiet"
              icon={<SidebarIcon />}
              onClick={onToggleSidebar}
              aria-label={isSidebarExpanded ? t('historyHide') : t('historyShow')}
              className={isSidebarExpanded ? 'text-accent-blue bg-accent-blue/5' : ''}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
