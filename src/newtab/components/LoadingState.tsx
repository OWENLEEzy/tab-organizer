import React from 'react';

export function LoadingState(): React.ReactElement {
  return (
    <div className="tab-out-container">
      {/* Header skeleton */}
      <div className="border-border-light dark:border-border-dark mb-12 border-b pb-6">
        <div className="bg-surface-light dark:bg-surface-dark h-7 w-48 animate-pulse rounded" />
        <div className="bg-surface-light dark:bg-surface-dark mt-2 h-4 w-32 animate-pulse rounded" />
        <div className="mt-2 flex gap-2">
          <div className="rounded-chip bg-surface-light dark:bg-surface-dark h-5 w-14 animate-pulse" />
          <div className="rounded-chip bg-surface-light dark:bg-surface-dark h-5 w-16 animate-pulse" />
          <div className="rounded-chip bg-surface-light dark:bg-surface-dark h-5 w-18 animate-pulse" />
        </div>
      </div>

      {/* Section header skeleton */}
      <div className="mb-4 flex animate-pulse items-center gap-3">
        <div className="bg-surface-light dark:bg-surface-dark h-4 w-20 rounded" />
        <div className="bg-surface-light dark:bg-surface-dark h-px flex-1" />
        <div className="bg-surface-light dark:bg-surface-dark h-3 w-12 rounded" />
      </div>

      {/* Card skeletons — match DomainCard structure */}
      <div className="columns-[300px] gap-3">
        {['skel-a', 'skel-b', 'skel-c'].map((key) => (
          <div
            key={key}
            className="rounded-card shadow-card mb-3 break-inside-avoid overflow-hidden"
          >
            {/* Status bar */}
            <div className="bg-surface-light dark:bg-surface-dark h-[3px] animate-pulse" />
            <div className="bg-card-light dark:bg-card-dark p-4">
              {/* Header row: favicon + name + badge */}
              <div className="mb-3 flex items-center gap-2">
                <div className="bg-surface-light dark:bg-surface-dark h-5 w-5 animate-pulse rounded-[3px]" />
                <div className="bg-surface-light dark:bg-surface-dark h-4 w-20 animate-pulse rounded" />
                <div className="rounded-chip bg-surface-light dark:bg-surface-dark h-4 w-16 animate-pulse" />
              </div>
              {/* Chip rows */}
              <div className="flex flex-col gap-0.5">
                <div className="rounded-chip bg-surface-light dark:bg-surface-dark h-7 w-full animate-pulse" />
                <div className="rounded-chip bg-surface-light dark:bg-surface-dark h-7 w-4/5 animate-pulse" />
                <div className="rounded-chip bg-surface-light dark:bg-surface-dark h-7 w-[90%] animate-pulse" />
              </div>
              {/* Footer action skeleton */}
              <div className="border-border-light dark:border-border-dark mt-3 border-t pt-3">
                <div className="rounded-chip bg-surface-light dark:bg-surface-dark h-6 w-24 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}