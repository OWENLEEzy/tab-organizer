import React from 'react';
import { SearchBar } from '../SearchBar';
import { ViewToggle } from '../ViewToggle';
import { ActionButton } from '../ui/ActionButton';

interface DashboardHeaderProps {
  title: string;
  hasGroups: boolean;
  groupCount: number;
  dateLabel?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultCount: number;
  totalCount: number;
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
  onRefresh: () => void;
  onCreateGroup: () => void;
  onCloseAll: () => void;
  onOpenSettings: () => void;
  isSidebarExpanded?: boolean;
  onToggleSidebar?: () => void;
}

function RefreshIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
    </svg>
  );
}

function SettingsIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87l.22.127c.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992v.255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124l-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87l-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991v-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124l.22-.128c.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function SidebarIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.5-15h15a2.25 2.25 0 0 1 2.25 2.25v13.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75A2.25 2.25 0 0 1 4.5 4.5Z" />
    </svg>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function DashboardHeader({
  title,
  hasGroups,
  groupCount,
  dateLabel = formatDate(new Date()),
  searchQuery,
  onSearchChange,
  resultCount,
  totalCount,
  viewMode,
  onViewModeChange,
  onRefresh,
  onCreateGroup,
  onCloseAll,
  onOpenSettings,
  isSidebarExpanded = false,
  onToggleSidebar,
}: DashboardHeaderProps): React.ReactElement {
  const groupLabel = `${groupCount} Group${groupCount === 1 ? '' : 's'}`;

  return (
    <header className="pb-6 pt-8" aria-label="Dashboard controls">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 border-b-2 border-border-light pb-5 dark:border-border-dark lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="font-body text-xs font-semibold tracking-normal text-text-secondary uppercase">
              {dateLabel}
            </p>
            <h1 className="mt-1 font-heading text-3xl font-normal tracking-tight text-text-primary-light dark:text-text-primary-dark">
              {title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {hasGroups ? (
              <>
                <span className="inline-flex items-center rounded-sm bg-surface-light px-3 py-1.5 font-body text-xs font-semibold text-text-secondary dark:bg-surface-dark">
                  {groupLabel}
                </span>
                <ViewToggle value={viewMode} onChange={onViewModeChange} />
              </>
            ) : null}
            <div className="h-6 w-px bg-border-light dark:bg-border-dark mx-2" />
            <ActionButton variant="quiet" icon={<SettingsIcon />} onClick={onOpenSettings} aria-label="Settings">
              Settings
            </ActionButton>
            <ActionButton 
              variant="quiet" 
              icon={<SidebarIcon />} 
              onClick={onToggleSidebar} 
              aria-label={isSidebarExpanded ? 'Hide History' : 'Show History'}
              className={isSidebarExpanded ? 'text-accent-blue bg-accent-blue/5' : ''}
            >
              {isSidebarExpanded ? 'Hide History' : 'History'}
            </ActionButton>
          </div>
        </div>

        {hasGroups ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="min-w-0 flex-1 md:min-w-[24rem]">
              <SearchBar
                value={searchQuery}
                onChange={onSearchChange}
                resultCount={resultCount}
                totalCount={totalCount}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <ActionButton variant="quiet" icon={<RefreshIcon />} onClick={onRefresh} aria-label="Refresh tabs">
                Refresh
              </ActionButton>
              <ActionButton onClick={onCreateGroup}>New Group</ActionButton>
              <ActionButton variant="danger" onClick={onCloseAll}>Close All</ActionButton>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
