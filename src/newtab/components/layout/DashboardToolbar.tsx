import React from 'react';
import { SearchBar } from '../SearchBar';
import { ViewToggle } from '../ViewToggle';
import { ActionButton } from '../ui/ActionButton';

interface DashboardToolbarProps {
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
}

export function DashboardToolbar({
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
}: DashboardToolbarProps): React.ReactElement {
  return (
    <section className="mb-5 border-2 border-border-light bg-card-light p-3 dark:border-border-dark dark:bg-card-dark" aria-label="Dashboard controls">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            resultCount={resultCount}
            totalCount={totalCount}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
        </div>
      </div>
    </section>
  );
}
