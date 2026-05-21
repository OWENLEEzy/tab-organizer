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
    { value: 'default', label: t('sortDefault') },
    { value: 'name', label: t('sortByName') },
    { value: 'lastAccessed', label: t('sortByLastAccessed') },
  ];

  return (
    <div className="sort-dropdown" aria-label="Sort order">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as GroupSortOption)}
        className="rounded-chip border border-border-light bg-surface-light px-3 py-2 font-body text-xs text-text-primary-light dark:border-border-dark dark:bg-surface-dark dark:text-text-primary-dark focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue h-[--spacing-button-height]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
