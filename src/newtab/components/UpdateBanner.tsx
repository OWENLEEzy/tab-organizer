import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────

interface UpdateBannerProps {
  version: string;
  onDismiss: () => void;
}

// ─── Component ────────────────────────────────────────────────────────

export function UpdateBanner({
  version,
  onDismiss,
}: UpdateBannerProps): React.ReactElement {
  return (
    <div
      role="status"
      className="rounded-card border-accent-sage/20 from-accent-sage/[0.04] to-accent-sage/[0.09] mb-4 flex animate-[fadeUp_0.5s_ease_both] items-center justify-between border bg-gradient-to-br px-6 py-4"
    >
      <div className="flex items-center gap-4">
        <div className="bg-accent-sage/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="text-accent-sage h-[18px] w-[18px]"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
        <p className="text-text-primary-light dark:text-text-primary-dark text-sm leading-relaxed">
          Tab Out updated to <strong className="font-semibold">v{version}</strong> &mdash; What&apos;s new?
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-chip text-text-secondary hover:bg-accent-sage/10 hover:text-accent-sage focus-visible:ring-accent-blue/40 ml-4 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
        aria-label="Dismiss update notice"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-4 w-4"
          aria-hidden="true"
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
