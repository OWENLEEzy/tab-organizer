import React from 'react';
import type { GroupSortOption } from '../../types';
import { useI18n } from '../hooks/useI18n';

interface SortDropdownProps {
  value: GroupSortOption;
  onChange: (value: GroupSortOption) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps): React.ReactElement {
  const { t } = useI18n();

  const options: { value: GroupSortOption; label: string }[] = [
    { value: 'count', label: t('sortCount') },
    { value: 'name', label: t('sortByName') },
    { value: 'lastAccessed', label: t('sortByLastAccessed') },
  ];

  return (
    <div className="sort-dropdown" aria-label="Sort order">
      <select
        aria-label="Sort order"
        value={value}
        onChange={(e) => onChange(e.target.value as GroupSortOption)}
        className="rounded-chip border border-border-light bg-surface-light font-body text-xs text-text-primary-light dark:border-border-dark dark:bg-surface-dark dark:text-text-primary-dark focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 text-text-secondary" aria-hidden="true">
        <svg className="size-3" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}
