import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────

interface SelectionBarProps {
  count: number;
  onClose: () => void;
  onSave: () => void;
  onClear: () => void;
}

// ─── Component ────────────────────────────────────────────────────────

export function SelectionBar({ count, onClose, onSave, onClear }: SelectionBarProps): React.ReactElement {
  return (
    <div className="rounded-card border-border-light bg-card-light shadow-card-hover dark:border-border-dark dark:bg-card-dark fixed bottom-5 left-1/2 z-[60] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-3 border px-5 py-3">
      <span className="font-body text-text-primary-light dark:text-text-primary-dark text-sm">
        {count} selected
      </span>
      <button
        type="button"
        onClick={onClose}
        className="rounded-chip bg-accent-red/10 text-accent-red font-body hover:bg-accent-red/20 focus-visible:ring-accent-red/40 inline-flex min-h-11 cursor-pointer items-center gap-1.5 px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Close
      </button>
      <button
        type="button"
        onClick={onSave}
        className="rounded-chip bg-accent-blue/10 text-accent-blue font-body hover:bg-accent-blue/20 focus-visible:ring-accent-blue/40 inline-flex min-h-11 cursor-pointer items-center gap-1.5 px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
        </svg>
        Save
      </button>
      <button
        type="button"
        onClick={onClear}
        className="rounded-chip text-text-secondary hover:bg-surface-light dark:hover:bg-surface-dark focus-visible:ring-accent-blue/40 min-h-11 cursor-pointer px-3 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        Cancel
      </button>
    </div>
  );
}
