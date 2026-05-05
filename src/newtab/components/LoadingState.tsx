import React from 'react';

export function LoadingState(): React.ReactElement {
  return (
    <div className="dashboard-shell">
      <div className="mt-10 border-2 border-border-light bg-card-light p-6 font-body text-sm font-semibold uppercase text-text-primary-light dark:border-border-dark dark:bg-card-dark dark:text-text-primary-dark">
        Loading tabs
      </div>
    </div>
  );
}
