import React from 'react';

export function EmptyState(): React.ReactElement {
  return (
    <div className="border-2 border-border-light bg-card-light p-6 dark:border-border-dark dark:bg-card-dark">
      <h2 className="font-body text-base font-semibold uppercase text-text-primary-light dark:text-text-primary-dark">
        No tabs to organize
      </h2>
      <p className="mt-2 font-body text-sm text-text-secondary">
        Open a few web pages, then come back to see them organized into groups.
      </p>
    </div>
  );
}
