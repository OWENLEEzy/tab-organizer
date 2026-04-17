import React, { useState, useCallback, useMemo } from 'react';
import type { SavedTab } from '../../types';
import { DeferredItem, ArchiveItem } from './DeferredItem';

// ─── DeferredColumn (Right Sidebar) ──────────────────────────────

interface DeferredColumnProps {
  active: SavedTab[];
  archived: SavedTab[];
  archiveSearch: string;
  onCheckOff: (id: string) => void;
  onDismiss: (id: string) => void;
  onArchiveSearch: (query: string) => void;
}

export function DeferredColumn({
  active,
  archived,
  archiveSearch,
  onCheckOff,
  onDismiss,
  onArchiveSearch,
}: DeferredColumnProps): React.ReactElement | null {
  const [archiveOpen, setArchiveOpen] = useState(false);

  // Hooks must be called unconditionally (Rules of Hooks)
  const toggleArchive = useCallback((): void => {
    setArchiveOpen((prev) => !prev);
  }, []);

  const filteredArchived = useMemo<SavedTab[]>(() => {
    if (!archiveSearch.trim()) return archived;
    const query = archiveSearch.toLowerCase();
    return archived.filter(
      (item) =>
        (item.title || '').toLowerCase().includes(query) ||
        item.domain.toLowerCase().includes(query) ||
        item.url.toLowerCase().includes(query),
    );
  }, [archived, archiveSearch]);

  const handleSearchInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      onArchiveSearch(e.target.value);
    },
    [onArchiveSearch],
  );

  // Hide the entire column when there is nothing to show
  const hasContent = active.length > 0 || archived.length > 0;
  if (!hasContent) return null;

  return (
    <aside className="w-72 shrink-0">
      {/* ── Section header ─────────────────────────────────── */}
      <div className="mb-3 flex items-center gap-3">
        <h2 className="font-heading text-text-primary-light dark:text-text-primary-dark text-base font-semibold whitespace-nowrap">
          Saved for later
        </h2>
        <div className="border-border-light dark:border-border-dark h-px flex-1" />
        {active.length > 0 && (
          <span className="text-text-secondary text-xs whitespace-nowrap">
            {active.length} item{active.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Active checklist ───────────────────────────────── */}
      {active.length > 0 ? (
        <div className="flex flex-col gap-0.5">
          {active.map((item) => (
            <DeferredItem
              key={item.id}
              item={item}
              onCheckOff={onCheckOff}
              onDismiss={onDismiss}
            />
          ))}
        </div>
      ) : (
        <p className="text-text-secondary text-sm italic">
          Nothing saved. Living in the moment.
        </p>
      )}

      {/* ── Collapsible archive ────────────────────────────── */}
      {archived.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            className="text-text-secondary hover:text-text-primary-light dark:hover:text-text-primary-dark focus-visible:ring-accent-blue/40 rounded-chip flex min-h-11 w-full cursor-pointer items-center gap-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            onClick={toggleArchive}
            aria-expanded={archiveOpen}
          >
            {/* Chevron icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className={`h-4 w-4 transition-transform ${
                archiveOpen ? 'rotate-180' : ''
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
            <span>Archive</span>
            <span className="text-xs">({archived.length})</span>
          </button>

          {archiveOpen && (
            <div className="mt-2">
              <input
                type="text"
                className="border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark rounded-chip placeholder:text-text-secondary focus:border-accent-sage focus-visible:ring-accent-blue/40 min-h-11 w-full border px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2"
                placeholder="Search archived tabs..."
                value={archiveSearch}
                onChange={handleSearchInput}
                aria-label="Search archived tabs"
              />
              <div className="mt-1.5 flex max-h-60 flex-col gap-0.5 overflow-y-auto">
                {filteredArchived.map((item) => (
                  <ArchiveItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
