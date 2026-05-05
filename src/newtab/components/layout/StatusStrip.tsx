import React from 'react';
import { ActionButton } from '../ui/ActionButton';

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
    <section className="mb-6 border-x-2 border-b-2 border-border-light bg-accent-amber/30 px-4 py-3 font-body text-xs font-semibold text-text-primary-light dark:border-border-dark dark:text-text-primary-dark">
      <div className="flex flex-wrap items-center justify-center gap-3 text-center">
        {parts.map((part) => (
          <span key={part}>{part}</span>
        ))}
        {alerts.map((alert) => (
          <span key={alert.id} className="inline-flex items-center gap-2">
            <span>{alert.label}</span>
            {alert.actionLabel && alert.onAction ? (
              <ActionButton variant="quiet" className="min-h-8 px-2 py-1" onClick={alert.onAction}>
                {alert.actionLabel}
              </ActionButton>
            ) : null}
          </span>
        ))}
      </div>
    </section>
  );
}
