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
    <aside className="border border-border-color bg-bg-card rounded-card overflow-hidden shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-border-color bg-bg-surface/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="font-mono text-3xs font-semibold uppercase tracking-wider text-text-primary">
            {title}
          </h2>
          {count !== undefined ? (
            <span className="rounded-sm bg-bg-surface border border-border-color/30 px-1.5 py-0.5 font-mono text-3xs font-bold text-text-secondary">
              {count}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {actions}
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </aside>
  );
}
