import React from 'react';
import { ActionButton } from './ui/ActionButton';

// ─── Types ────────────────────────────────────────────────────────────

interface SelectionBarProps {
  count: number;
  onClose: () => void;
  onClear: () => void;
}

// ─── Component ────────────────────────────────────────────────────────

export function SelectionBar({ count, onClose, onClear }: SelectionBarProps): React.ReactElement {
  return (
    <div className="fixed bottom-5 left-1/2 z-[60] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-3 rounded-card border-2 border-border-light bg-card-light px-5 py-3 shadow-none dark:border-border-dark dark:bg-card-dark">
      <span className="font-body text-sm text-text-primary-light dark:text-text-primary-dark">
        {count} selected
      </span>
      <ActionButton variant="danger" onClick={onClose}>
        Close
      </ActionButton>
      <ActionButton variant="quiet" onClick={onClear}>
        Cancel
      </ActionButton>
    </div>
  );
}
