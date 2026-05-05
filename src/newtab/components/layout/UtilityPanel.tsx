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
    <aside className="border-2 border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark rounded-sm overflow-hidden shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b-2 border-border-light bg-surface-light px-3 py-2 dark:border-border-dark dark:bg-surface-dark">
        <div className="flex items-center gap-2">
          <h2 className="font-body text-[10px] font-bold uppercase tracking-widest text-text-primary-light dark:text-text-primary-dark">
            {title}
          </h2>
          {count !== undefined ? (
            <span className="rounded-sm bg-white/50 px-1.5 py-0.5 font-body text-[10px] font-bold text-text-secondary dark:bg-black/20">
              {count}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {actions}
        </div>
      </div>
      <div className="p-3">
        {children}
      </div>
    </aside>
  );
}
