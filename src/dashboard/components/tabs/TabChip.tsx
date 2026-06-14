import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getHostname, sanitizeUrl } from '../../../lib/url-rules';
import {
  cleanTitle,
  smartTitle,
  stripTitleNoise,
} from '../../../lib/title-cleaner';
import { getFaviconUrl } from '../../../utils/favicon';

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
  favIconUrl?: string;
  duplicateCount: number;
  /** Whether this is the single globally most-recently-used tab (the one to highlight). */
  isLastUsed?: boolean;
  isFocused?: boolean;
  isClosing?: boolean;
  isSelected?: boolean;
  selectionMode?: boolean;
  onFocus: (url: string) => void;
  onClose: (url: string, title: string) => void;
  onChipClick?: (url: string, event: React.MouseEvent) => void;
  searchQuery?: string;
  lastAccessed?: number;
  staleThresholdDays?: number;
  pinned?: boolean;
  audible?: boolean;
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

function CloseIcon(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      className="size-3.5"
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

function HighlightedText({ text, highlight = '' }: { text: string; highlight?: string }): React.ReactElement {
  let cleanHighlight = (highlight || '').trim();
  const trimmedLower = cleanHighlight.toLowerCase();
  const isCommand = 
    trimmedLower.startsWith('/') ||
    trimmedLower.startsWith('section:') ||
    trimmedLower.startsWith('sec:') ||
    trimmedLower.startsWith('s:') ||
    trimmedLower === 'stale' || trimmedLower === 'stales' ||
    trimmedLower === 'dupe' || trimmedLower === 'dupes' ||
    trimmedLower.startsWith('stale ') || trimmedLower.startsWith('stales ') ||
    trimmedLower.startsWith('dupe ') || trimmedLower.startsWith('dupes ');

  if (isCommand) {
    cleanHighlight = cleanHighlight
      .replace(/^\/?dupes?\s*/i, '')
      .replace(/^\/?stales?\s*/i, '')
      .replace(/^\/?(?:section|sec|s):[^\s]*\s*/i, '')
      .trim();
  }
  if (!cleanHighlight) return <>{text}</>;

  const regex = new RegExp(`(${cleanHighlight.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === cleanHighlight.toLowerCase() ? (
          <mark
            key={`${part}-${i}`}
            className="bg-accent-amber/25 text-text-primary rounded-sm px-0.5 font-semibold"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────

function TabChipComponent({
  url,
  title,
  favIconUrl = '',
  duplicateCount,
  isLastUsed = false,
  isFocused = false,
  isClosing = false,
  isSelected = false,
  selectionMode = false,
  onFocus,
  onClose,
  onChipClick,
  searchQuery = '',
  lastAccessed,
  staleThresholdDays = 3,
  pinned = false,
  audible = false,
}: TabChipProps): React.ReactElement {
  const faviconUrl = favIconUrl.trim() || getFaviconUrl(url);
  const displayLabel = buildLabel(title, url);
  const safeUrl = sanitizeUrl(url);
  const initial = displayLabel.trim().charAt(0).toUpperCase() || '?';

  const chipRef = useRef<HTMLButtonElement>(null);
  // Detect touch device once per component lifecycle
  const [isTouch] = useState(() => isTouchDevice());
  const [failedFaviconUrl, setFailedFaviconUrl] = useState('');
  const faviconFailed = faviconUrl !== '' && failedFaviconUrl === faviconUrl;

  const isStale = React.useMemo(() => {
    if (isLastUsed || pinned || audible || !lastAccessed) return false;
    // eslint-disable-next-line react-hooks/purity
    return Date.now() - lastAccessed > staleThresholdDays * 24 * 60 * 60 * 1000;
  }, [lastAccessed, isLastUsed, pinned, audible, staleThresholdDays]);

  useEffect(() => {
    if (isFocused && chipRef.current) {
      const active = document.activeElement;
      const isInputFocused =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable === true);

      if (!isInputFocused) {
        chipRef.current.focus({ preventScroll: false });
      }
      if (typeof chipRef.current.scrollIntoView === 'function') {
        chipRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [isFocused]);

  const handleFocusOrSelect = useCallback((e: React.MouseEvent) => {
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

  const handleImageError = useCallback(() => {
    setFailedFaviconUrl(faviconUrl);
  }, [faviconUrl]);

  const chipClasses = useMemo(() => [
    'flex min-h-[var(--spacing-button-icon)] min-w-0 flex-1 items-center gap-2 rounded-chip border border-transparent px-2.5 py-1.5 text-left font-mono text-xs',
    'cursor-pointer bg-transparent transition-all duration-[var(--motion-toast)] ease-spring',
    isSelected ? '' : 'hover:border-border-color hover:bg-bg-surface hover:translate-x-1',
    'focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:outline-none',
    duplicateCount > 1 ? 'border-accent-amber/25 bg-accent-amber/10' : '',
    isLastUsed && !isSelected ? 'tab-active' : '',
    isFocused && !isSelected ? 'ring-2 ring-accent-primary/40 border-border-color bg-bg-surface' : '',
    isClosing ? 'chip-closing' : '',
    isSelected ? 'ring-2 ring-accent-primary border-accent-primary bg-accent-primary/[0.12]' : '',
    isStale && !isSelected
      ? 'opacity-55 saturate-[0.15] bg-bg-surface/40 border-dashed border-border-color hover:opacity-100 hover:saturate-100 hover:border-transparent transition-all duration-[var(--motion-standard)]'
      : '',
  ]
    .filter(Boolean)
    .join(' '), [isSelected, isFocused, isClosing, isStale, duplicateCount, isLastUsed]);

  return (
    <div className={`group flex items-center gap-1${isClosing ? ' chip-closing' : ''}`}>
      <button
        ref={chipRef}
        type="button"
        className={chipClasses}
        data-tab-url={safeUrl}
        title={displayLabel}
        onClick={handleFocusOrSelect}
        aria-current={isLastUsed ? 'page' : undefined}
      >
        {/*
          Last-used indicator dot.
          Marks the SINGLE globally most-recently-used real tab — the one you'd
          jump back to — not each window's foreground tab. Our own dashboard/popup
          pages are excluded, so opening the dashboard never steals the marker.
        */}
        {isLastUsed && (
          <span
            className="bg-accent-sage size-1.5 shrink-0 rounded-full"
            style={{ boxShadow: 'var(--shadow-focus)' }}
            aria-hidden="true"
          />
        )}

        {/* Favicon */}
        {faviconUrl && !faviconFailed ? (
          <img
            className={`favicon size-4 shrink-0 ${isStale && !isSelected ? 'sepia-[.4]' : ''}`}
            src={faviconUrl}
            alt=""
            onError={handleImageError}
          />
        ) : (
          <span
            className="bg-bg-surface text-text-secondary flex size-4 shrink-0 items-center justify-center rounded-badge text-3xs font-semibold"
            aria-hidden="true"
          >
            {initial}
          </span>
        )}

        {/* Title */}
        <span className={`min-w-0 flex-1 truncate text-text-primary font-mono text-xs${isLastUsed ? ' font-semibold' : ''}`}>
          <HighlightedText text={displayLabel} highlight={searchQuery} />
        </span>

        {/* Duplicate badge */}
        {duplicateCount > 1 && (
          <span className="flex items-center text-3xs font-medium bg-accent-amber/10 text-accent-amber px-1.5 py-0.5 rounded-badge border border-accent-amber/25 tabular-nums">
            ×{duplicateCount}
          </span>
        )}
      </button>

      {/* Action buttons — always visible on touch, visible on hover for desktop */}
      {!isSelected && (
        <div className={`ml-auto flex shrink-0 items-center gap-1 transition-opacity duration-[var(--motion-fast)] ${isTouch ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>
          <button
            type="button"
            className="rounded-chip text-text-secondary hover:bg-accent-red/10 hover:text-accent-red focus-visible:ring-accent-red/40 flex size-[var(--spacing-button-icon)] min-w-auto cursor-pointer items-center justify-center transition-colors duration-[var(--motion-fast)] focus-visible:ring-2 focus-visible:outline-none"
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

function areTabChipPropsEqual(prev: TabChipProps, next: TabChipProps): boolean {
  return (
    prev.url === next.url &&
    prev.title === next.title &&
    prev.favIconUrl === next.favIconUrl &&
    prev.duplicateCount === next.duplicateCount &&
    prev.isLastUsed === next.isLastUsed &&
    prev.isFocused === next.isFocused &&
    prev.isClosing === next.isClosing &&
    prev.isSelected === next.isSelected &&
    prev.selectionMode === next.selectionMode &&
    prev.searchQuery === next.searchQuery &&
    prev.lastAccessed === next.lastAccessed &&
    prev.staleThresholdDays === next.staleThresholdDays &&
    prev.pinned === next.pinned &&
    prev.audible === next.audible &&
    prev.onFocus === next.onFocus &&
    prev.onClose === next.onClose &&
    prev.onChipClick === next.onChipClick
  );
}

export const TabChip = React.memo(TabChipComponent, areTabChipPropsEqual);
