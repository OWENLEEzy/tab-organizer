import React, { useEffect, useReducer, useRef } from 'react';
import { useI18n } from '../hooks/useI18n';

interface FooterProps {
  tabCount: number;
  duplicateCount: number;
  groupCount?: number;
  sectionCount?: number;
  alerts?: FooterAlert[];
}

const POP_DURATION = 300;

export interface FooterAlert {
  id: string;
  label: string;
  actionLabel?: string;
  onAction?: () => void;
}

type FooterState = {
  popping: boolean;
};

type FooterAction =
  | { type: 'START_POP' }
  | { type: 'END_POP' };

function footerReducer(state: FooterState, action: FooterAction): FooterState {
  switch (action.type) {
    case 'START_POP':
      return { popping: true };
    case 'END_POP':
      return { popping: false };
    default:
      return state;
  }
}

export function Footer({
  tabCount,
  duplicateCount,
  groupCount = 0,
  sectionCount = 0,
  alerts = [],
}: FooterProps): React.ReactElement {
  const [state, dispatch] = useReducer(footerReducer, { popping: false });
  const prevCount = useRef(tabCount);
  const { t } = useI18n();

  // One-shot animation: trigger pop when tab count decreases.
  useEffect(() => {
    if (tabCount < prevCount.current) {
      dispatch({ type: 'START_POP' });
      const timer = setTimeout(() => dispatch({ type: 'END_POP' }), POP_DURATION);
      prevCount.current = tabCount;
      return () => clearTimeout(timer);
    }
    prevCount.current = tabCount;
    return undefined;
  }, [tabCount]);

  const GITHUB_URL = 'https://github.com/OWENLEEzy/tab-organizer';
  const FEEDBACK_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfXJ6osy2J84TLpyLE-DYA-NcWMcjRAZbcTHBOZV9RnQ7WEfA/viewform';

  return (
    <footer className="py-1.5 px-4 mt-auto border-t border-border-color/40 bg-bg-surface/30 backdrop-blur-md relative z-20" aria-label="Dashboard footer">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left side: Metrics */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs Metric */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-bg-card border border-border-color/50 shadow-sm transition-transform hover:scale-105">
            <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M6 8h12" />
            </svg>
            <span
              className={`font-mono text-text-primary text-sm font-bold ${state.popping ? 'animate-[countPop_var(--motion-count-pop)_ease]' : ''}`}
            >
              {tabCount}
            </span>
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">{t('metricTabs')}</span>
          </div>

          {/* Groups Metric */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-bg-card border border-border-color/50 shadow-sm transition-transform hover:scale-105">
            <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
            </svg>
            <span className="font-mono text-text-primary text-sm font-bold">{groupCount}</span>
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">{t('metricGroups')}</span>
          </div>

          {/* Sections Metric */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-bg-card border border-border-color/50 shadow-sm transition-transform hover:scale-105">
            <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            <span className="font-mono text-text-primary text-sm font-bold">{sectionCount}</span>
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">{t('metricSections')}</span>
          </div>

          {/* Duplicates Metric */}
          {duplicateCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-amber/10 border border-accent-amber/25 shadow-sm transition-transform hover:scale-105 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
              <svg className="w-4 h-4 text-accent-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              <span className="font-mono text-accent-amber text-sm font-bold">{duplicateCount}</span>
              <span className="text-xs font-bold text-accent-amber uppercase tracking-wider">{t('metricDuplicates')}</span>
            </div>
          )}

          {/* Alerts */}
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-amber/10 border border-accent-amber/20 shadow-sm">
              <span className="text-xs font-semibold text-accent-amber uppercase tracking-wider">{alert.label}</span>
              {alert.actionLabel && alert.onAction ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-accent-primary hover:text-accent-primary/70 underline decoration-accent-primary/30 underline-offset-2 transition-colors"
                  onClick={alert.onAction}
                >
                  {alert.actionLabel}
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {/* Right side: Links */}
        <div className="flex items-center gap-3">
          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-card border border-border-color/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-accent-primary text-text-primary hover:text-accent-primary text-xs font-semibold tracking-wide uppercase cursor-pointer"
            aria-label="Give feedback"
          >
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Feedback
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center p-1.5 rounded-full bg-bg-card border border-border-color/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-accent-primary text-text-primary hover:text-accent-primary cursor-pointer"
            aria-label="View source code on GitHub"
          >
            <svg
              className="w-4.5 h-4.5 group-hover:scale-110 transition-transform"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
