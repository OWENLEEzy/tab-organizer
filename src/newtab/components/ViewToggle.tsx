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
        className={value === 'cards' ? 'is-active' : ''}
        onClick={() => onChange('cards')}
      >
        Cards
      </button>
      <button
        type="button"
        className={value === 'table' ? 'is-active' : ''}
        onClick={() => onChange('table')}
      >
        Table
      </button>
    </div>
  );
}
