import React from 'react';
import { SearchBar } from '../SearchBar';
import { ViewToggle } from '../ViewToggle';
import { ActionButton } from '../ui/ActionButton';

interface DashboardHeaderProps {
  title: string;
  hasGroups: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultCount: number;
  totalCount: number;
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
  organizeActive: boolean;
  canOrganize: boolean;
  onToggleOrganize: () => void;
  onCreateSection: () => void;
  onCloseAll: () => void;
  onOpenSettings: () => void;
}

function SettingsIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87l.22.127c.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992v.255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124l-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87l-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991v-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124l.22-.128c.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

export function DashboardHeader({
  title,
  hasGroups,
  searchQuery,
  onSearchChange,
  resultCount,
  totalCount,
  viewMode,
  onViewModeChange,
  organizeActive,
  canOrganize,
  onToggleOrganize,
  onCreateSection,
  onCloseAll,
  onOpenSettings,
}: DashboardHeaderProps): React.ReactElement {
  return (
    <header className="mb-5 flex flex-col gap-4 border-2 border-border-light bg-card-light p-3 dark:border-border-dark dark:bg-card-dark lg:flex-row lg:items-center lg:justify-between" aria-label="Dashboard controls">
      <div className="flex items-center">
        <h1 className="font-heading text-xl font-normal tracking-normal text-text-primary-light uppercase dark:text-text-primary-dark whitespace-nowrap">
          {title}
        </h1>
      </div>
      {hasGroups ? (
        <div className="min-w-0 flex-1 lg:mx-4">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            resultCount={resultCount}
            totalCount={totalCount}
          />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {hasGroups ? (
          <>
            <ViewToggle value={viewMode} onChange={onViewModeChange} />
            <ActionButton
              variant={organizeActive ? 'primary' : 'default'}
              onClick={onToggleOrganize}
              aria-pressed={organizeActive}
              disabled={!canOrganize}
            >
              Organize
            </ActionButton>
            <ActionButton onClick={onCreateSection}>New section</ActionButton>
            <ActionButton variant="danger" onClick={onCloseAll}>Close all</ActionButton>
          </>
        ) : null}
        <ActionButton variant="quiet" icon={<SettingsIcon />} onClick={onOpenSettings} aria-label="Settings">
          Settings
        </ActionButton>
      </div>
    </header>
  );
}
