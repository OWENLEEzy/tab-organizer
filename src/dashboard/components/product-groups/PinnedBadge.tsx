import React, { useRef } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { useFocusFollow } from '../../hooks/useFocusFollow';

interface PinnedBadgeProps {
  groupName: string;
  onUnpin: () => void;
  /**
   * Where keyboard focus goes after unpinning removes this badge — the same
   * group's own section control, so focus is not dropped on the page.
   */
  focusAfterUnpinSelector: string;
  /** Used when `focusAfterUnpinSelector` never renders, e.g. no sections exist. */
  focusFallbackSelector?: string;
  /** Layout differences between the Cards and Table views. */
  className: string;
}

function UnpinIcon(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      className="size-3"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

/** "Pinned" badge for a group the user explicitly kept out of every section. */
export function PinnedBadge({
  groupName,
  onUnpin,
  focusAfterUnpinSelector,
  focusFallbackSelector,
  className,
}: PinnedBadgeProps): React.ReactElement {
  const { t } = useI18n();
  const unpinRef = useRef<HTMLButtonElement>(null);
  useFocusFollow(unpinRef, focusAfterUnpinSelector, focusFallbackSelector);

  return (
    <span
      className={`items-center gap-1 rounded-chip border border-dashed border-accent-amber/60 bg-bg-surface text-3xs font-semibold font-mono text-accent-amber ${className}`}
      title={t('pinnedUnsectionedHint')}
    >
      {t('pinnedUnsectioned')}
      <button
        ref={unpinRef}
        type="button"
        className="flex size-4 items-center justify-center rounded-chip hover:bg-accent-amber/10 focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:outline-none"
        onClick={onUnpin}
        aria-label={t('unpinAction', { name: groupName })}
      >
        <UnpinIcon />
      </button>
    </span>
  );
}
