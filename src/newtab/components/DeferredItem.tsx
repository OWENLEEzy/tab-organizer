import React from 'react';
import type { SavedTab } from '../../types';
import { getHostname, getFaviconUrl } from '../../utils/url';

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Convert an ISO date string into a human-readable relative time label.
 */
function timeAgo(dateStr: string): string {
  if (!dateStr) return '';

  const then = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'yesterday';
  return `${diffDays} days ago`;
}

// ─── DeferredItem (Active Checklist Item) ─────────────────────────

interface DeferredItemProps {
  item: SavedTab;
  onCheckOff: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function DeferredItem({
  item,
  onCheckOff,
  onDismiss,
}: DeferredItemProps): React.ReactElement {
  const domain = getHostname(item.url).replace(/^www\./, '');
  const faviconUrl = getFaviconUrl(domain);
  const ago = timeAgo(item.savedAt);

  const handleCheckboxChange = (): void => {
    onCheckOff(item.id);
  };

  const handleDismiss = (): void => {
    onDismiss(item.id);
  };

  return (
    <div className="group rounded-chip hover:bg-bg-light dark:hover:bg-bg-dark flex items-start gap-2 px-2 py-1.5 transition-colors">
      {/* Checkbox */}
      <input
        type="checkbox"
        className="accent-accent-sage mt-0.5 h-4 w-4 shrink-0 cursor-pointer"
        onChange={handleCheckboxChange}
        aria-label={`Check off ${item.title || item.url}`}
      />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-primary-light dark:text-text-primary-dark hover:text-accent-blue block truncate text-sm leading-snug font-medium transition-colors"
          title={item.title || item.url}
        >
          {faviconUrl && (
            <img
              src={faviconUrl}
              alt=""
              width={14}
              height={14}
              className="mr-1 inline-block align-[-2px]"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          {item.title || item.url}
        </a>
        <div className="text-text-secondary mt-0.5 flex items-center gap-2 text-xs">
          <span>{domain}</span>
          <span>{ago}</span>
        </div>
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        className="text-text-secondary hover:text-accent-red focus-visible:ring-accent-blue/40 mt-0.5 flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded opacity-40 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none"
        onClick={handleDismiss}
        title="Dismiss"
        aria-label={`Dismiss ${item.title || item.url}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

// ─── ArchiveItem (Completed / Archived Item) ──────────────────────

interface ArchiveItemProps {
  item: SavedTab;
}

export function ArchiveItem({ item }: ArchiveItemProps): React.ReactElement {
  const ago = item.completedAt
    ? timeAgo(item.completedAt)
    : timeAgo(item.savedAt);

  return (
    <div className="rounded-chip flex items-center gap-2 px-2 py-1 text-sm">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-text-secondary decoration-border-light dark:decoration-border-dark hover:text-accent-blue truncate line-through transition-colors"
        title={item.title || item.url}
      >
        {item.title || item.url}
      </a>
      <span className="text-text-secondary shrink-0 text-xs">{ago}</span>
    </div>
  );
}
