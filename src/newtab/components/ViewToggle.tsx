import React from 'react';
import type { ViewMode } from '../../types';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps): React.ReactElement {
  return (
    <div className="view-toggle" aria-label="View mode">
      <button
        type="button"
        className={`rounded-chip font-body text-xs font-semibold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-blue/40 focus-visible:outline-none ${value === 'cards' ? 'bg-accent-blue text-white is-active' : 'text-text-secondary hover:bg-surface-light dark:hover:bg-surface-dark'}`}
        onClick={() => onChange('cards')}
      >
        Cards
      </button>
      <button
        type="button"
        className={`rounded-chip font-body text-xs font-semibold transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-accent-blue/40 focus-visible:outline-none ${value === 'table' ? 'bg-accent-blue text-white is-active' : 'text-text-secondary hover:bg-surface-light dark:hover:bg-surface-dark'}`}
        onClick={() => onChange('table')}
      >
        Table
      </button>
    </div>
  );
}
