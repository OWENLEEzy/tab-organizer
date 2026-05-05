import React from 'react';

interface UtilityPanelProps {
  title: string;
  count?: number;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function UtilityPanel({
  title,
  count,
  children,
  actions,
}: UtilityPanelProps): React.ReactElement {
  return (
    <aside className="border-2 border-border-light bg-card-light p-3 dark:border-border-dark dark:bg-card-dark">
      <div className="mb-3 flex items-center justify-between gap-3 border-b-2 border-border-light pb-2 dark:border-border-dark">
        <h2 className="font-body text-xs font-semibold uppercase text-text-primary-light dark:text-text-primary-dark">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {count !== undefined ? (
            <span className="font-body text-xs font-semibold text-text-secondary">
              {count}
            </span>
          ) : null}
          {actions}
        </div>
      </div>
      {children}
    </aside>
  );
}
