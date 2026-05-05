import React from 'react';

export interface StatusStripAlert {
  id: string;
  label: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface StatusStripProps {
  totalTabs: number;
  totalDupes: number;
  totalGroups: number;
  alerts: StatusStripAlert[];
}

export function StatusStrip({
  totalTabs,
  totalDupes,
  totalGroups,
  alerts,
}: StatusStripProps): React.ReactElement {
  const parts = [
    `${totalTabs} Tab${totalTabs === 1 ? '' : 's'}`,
    `${totalDupes} Duplicate${totalDupes === 1 ? '' : 's'}`,
    `${totalGroups} Group${totalGroups === 1 ? '' : 's'}`,
  ];

  return (
    <section className="py-3" aria-label="Tab status summary">
      <div className="flex flex-wrap items-center justify-between gap-4 font-body text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">
        <div className="flex items-center gap-6">
          {parts.map((part, i) => (
            <React.Fragment key={part}>
              {i > 0 && <div className="h-3 w-px bg-border-light dark:bg-border-dark" />}
              <span>{part}</span>
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="inline-flex items-center gap-3 rounded-full bg-white/50 px-3 py-1 dark:bg-black/20">
              <span className="text-accent-amber">{alert.label}</span>
              {alert.actionLabel && alert.onAction ? (
                <button
                  type="button"
                  className="text-[10px] font-bold uppercase tracking-wider text-accent-blue hover:underline"
                  onClick={alert.onAction}
                >
                  {alert.actionLabel}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
