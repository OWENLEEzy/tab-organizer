import React from 'react';
import { useI18n } from '../../hooks/useI18n';

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
  const { t } = useI18n();

  const parts = [
    `${totalTabs} ${t('metricTabs')}`,
    `${totalDupes} ${t('metricDuplicates')}`,
    `${totalGroups} ${t('metricGroups')}`,
  ];

  return (
    <section className="py-2" aria-label="Tab status summary">
      <div className="flex flex-wrap items-center justify-between gap-4 font-body text-xs font-semibold text-text-primary">
        <div className="flex items-center gap-6">
          {parts.map((part, i) => (
            <React.Fragment key={part}>
              {i > 0 && <div className="h-3 w-px bg-border-color" />}
              <span>{part}</span>
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="inline-flex items-center gap-3 rounded-full bg-bg-card/50 border border-border-color/30 px-3 py-1">
              <span className="text-accent-amber">{alert.label}</span>
              {alert.actionLabel && alert.onAction ? (
                <button
                  type="button"
                  className="text-[var(--text-3xs)] font-semibold tracking-wide text-accent-primary hover:underline"
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
