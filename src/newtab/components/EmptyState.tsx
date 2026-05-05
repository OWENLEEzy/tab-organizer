import React from 'react';

export function EmptyState(): React.ReactElement {
  return (
    <div className="py-20 text-center">
      <h2 className="font-heading text-2xl font-light text-text-primary-light dark:text-text-primary-dark">
        No tabs to organize
      </h2>
      <p className="mt-4 font-body text-base text-text-secondary">
        Open a few web pages, then come back to see them organized into groups.
      </p>
    </div>
  );
}
