import React from 'react';

type MetricPillTone = 'default' | 'yellow' | 'blue' | 'teal' | 'coral';

interface MetricPillProps {
  label: string;
  value?: string | number;
  tone?: MetricPillTone;
  className?: string;
}

const toneClasses: Record<MetricPillTone, string> = {
  default: 'bg-card-light text-text-primary-light dark:bg-card-dark dark:text-text-primary-dark',
  yellow: 'bg-accent-amber/20 text-text-primary-light dark:text-text-primary-dark',
  blue: 'bg-accent-blue text-text-primary-light',
  teal: 'bg-accent-sage text-text-primary-light',
  coral: 'bg-accent-red text-white',
};

export function MetricPill({
  label,
  value,
  tone = 'default',
  className = '',
}: MetricPillProps): React.ReactElement {
  return (
    <span
      className={[
        'inline-flex min-h-8 items-center gap-2 rounded-chip border-2 border-border-light px-2.5 py-1',
        'font-body text-xs font-medium uppercase dark:border-border-dark',
        toneClasses[tone],
        className,
      ].filter(Boolean).join(' ')}
    >
      {value !== undefined && <strong className="font-semibold">{value}</strong>}
      <span>{label}</span>
    </span>
  );
}
