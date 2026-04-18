import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getFaviconUrl, getHostname, sanitizeUrl } from '../../utils/url';
import {
  cleanTitle,
  smartTitle,
  stripTitleNoise,
} from '../../lib/title-cleaner';

// ─── Touch device detection ────────────────────────────────────────

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - vendor prefix
    navigator.msMaxTouchPoints > 0
  );
}

// ─── Types ────────────────────────────────────────────────────────────

interface TabChipProps {
  url: string;
  title: string;
  duplicateCount: number;
  active?: boolean;
  isFocused?: boolean;
  isClosing?: boolean;
  isSelected?: boolean;
  selectionMode?: boolean;
  onFocus: (url: string) => void;
  onClose: (url: string, title: string) => void;
  onSave: (url: string, title: string) => void;
  onChipClick?: (url: string, event: React.MouseEvent) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Build the display label for a tab chip.
 * Applies noise stripping, smart title generation, and site-name cleanup.
 * For localhost URLs with a port, prepends the port number.
 */
function buildLabel(rawTitle: string, url: string): string {
  const label = cleanTitle(
    smartTitle(stripTitleNoise(rawTitle || ''), url),
    getHostname(url),
  );

  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'localhost' && parsed.port) {
      return `${parsed.port} ${label}`;
    }
  } catch {
    // Invalid URL — return label as-is
  }

  return label;
}

// ─── SVG Icons ────────────────────────────────────────────────────────

function BookmarkIcon(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
      />
    </svg>
  );
}

function CloseIcon(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18 18 6M6 6l12 12"
      />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────

export function TabChip({
  url,
  title,
  duplicateCount,
  active = false,
  isFocused = false,
  isClosing = false,
  isSelected = false,
  selectionMode = false,
  onFocus,
  onClose,
  onSave,
  onChipClick,
}: TabChipProps): React.ReactElement {
  const hostname = getHostname(url);
  const faviconUrl = getFaviconUrl(hostname);
  const displayLabel = buildLabel(title, url);
  const safeUrl = sanitizeUrl(url);

  const chipRef = useRef<HTMLButtonElement>(null);
  // Detect touch device once per component lifecycle
  const [isTouch] = useState(() => isTouchDevice());

  useEffect(() => {
    if (isFocused && chipRef.current) {
      chipRef.current.focus({ preventScroll: false });
      chipRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isFocused]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (onChipClick && (selectionMode || e.shiftKey || e.metaKey || e.ctrlKey)) {
      e.stopPropagation();
      onChipClick(url, e);
      return;
    }
    onFocus(url);
  }, [onFocus, onChipClick, selectionMode, url]);

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose(url, title);
    },
    [onClose, url, title],
  );

  const handleSave = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSave(url, title);
    },
    [onSave, url, title],
  );

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const target = e.currentTarget;
      target.style.display = 'none';
    },
    [],
  );

  const chipClasses = [
    'flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-chip px-2.5 py-1.5',
    'cursor-pointer transition-colors duration-150',
    isSelected ? '' : 'hover:bg-surface-light dark:hover:bg-surface-dark',
    'focus-visible:ring-2 focus-visible:ring-accent-blue/40 focus-visible:outline-none',
    duplicateCount > 1 ? 'border-l-2 border-accent-amber bg-accent-amber/[0.04]' : '',
    active && !isSelected ? 'bg-accent-sage/[0.06]' : '',
    isFocused && !isSelected ? 'ring-2 ring-accent-blue/40 bg-surface-light dark:bg-surface-dark' : '',
    isClosing ? 'chip-closing' : '',
    isSelected ? 'ring-2 ring-accent-blue bg-accent-blue/[0.12]' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`group flex items-center gap-1${isClosing ? ' chip-closing' : ''}`}>
      <button
        ref={chipRef}
        type="button"
        className={chipClasses}
        data-tab-url={safeUrl}
        title={displayLabel}
        onClick={handleClick}
        aria-current={active ? 'page' : undefined}
      >
        {/* Active indicator dot */}
        {active && (
          <span
            className="bg-accent-sage h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ boxShadow: '0 0 0 2px rgba(77,171,154,0.2)' }}
            aria-hidden="true"
          />
        )}

        {/* Favicon */}
        {faviconUrl && (
          <img
            className="h-4 w-4 shrink-0"
            src={faviconUrl}
            alt=""
            onError={handleImageError}
          />
        )}

        {/* Title */}
        <span className={`font-body text-text-primary-light dark:text-text-primary-dark min-w-0 flex-1 truncate text-sm${active ? ' font-semibold' : ''}`}>
          {displayLabel}
        </span>

        {/* Duplicate badge */}
        {duplicateCount > 1 && (
          <span className="font-body text-accent-amber shrink-0 text-xs font-medium">
            ×{duplicateCount}
          </span>
        )}
      </button>

      {/* Action buttons — always visible on touch, visible on hover for desktop */}
      {!isSelected && (
        <div className={`ml-auto flex shrink-0 items-center gap-1 transition-opacity duration-150 ${isTouch ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>
          <button
            type="button"
            className="rounded-chip text-text-secondary hover:bg-accent-blue/10 hover:text-accent-blue focus-visible:ring-accent-blue/40 flex h-11 w-11 cursor-pointer items-center justify-center transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
            onClick={handleSave}
            title="Save for later"
            aria-label={`Save ${displayLabel} for later`}
          >
            <BookmarkIcon />
          </button>
          <button
            type="button"
            className="rounded-chip text-text-secondary hover:bg-accent-red/10 hover:text-accent-red focus-visible:ring-accent-red/40 flex h-11 w-11 cursor-pointer items-center justify-center transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
            onClick={handleClose}
            title="Close this tab"
            aria-label={`Close ${displayLabel}`}
          >
            <CloseIcon />
          </button>
        </div>
      )}
    </div>
  );
}
