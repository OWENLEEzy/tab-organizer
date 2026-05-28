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
    <footer className="py-1.5" aria-label="Dashboard footer">
      <div className="text-text-primary flex items-center justify-between gap-4 text-xs font-semibold tracking-wider uppercase">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-body text-text-primary inline-block text-xs font-bold${state.popping ? ' animate-[countPop_var(--motion-count-pop)_ease]' : ''}`}
            >
              {tabCount}
            </span>
            <span className="normal-case">{t('metricTabs')}</span>
          </div>
          <div className="h-3 w-px bg-border-color" />
          <div className="flex items-center gap-1.5">
            <span className="font-body text-text-primary inline-block text-xs font-bold">
              {groupCount}
            </span>
            <span className="normal-case">{t('metricGroups')}</span>
          </div>
          <div className="h-3 w-px bg-border-color" />
          <div className="flex items-center gap-1.5">
            <span className="font-body text-text-primary inline-block text-xs font-bold">
              {sectionCount}
            </span>
            <span className="normal-case">{t('metricSections')}</span>
          </div>
          <div className="h-3 w-px bg-border-color" />
          {duplicateCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="font-body text-text-primary inline-block text-xs font-bold">
                {duplicateCount}
              </span>
              <span className="normal-case">{t('metricDuplicates')}</span>
            </div>
          )}
          {alerts.map((alert) => (
            <div key={alert.id} className="inline-flex items-center gap-2 rounded-full border border-border-color/30 bg-bg-card/50 px-2.5 py-0.5">
              <span className="normal-case text-accent-amber">{alert.label}</span>
              {alert.actionLabel && alert.onAction ? (
                <button
                  type="button"
                  className="text-[var(--text-3xs)] font-semibold tracking-wide text-accent-primary normal-case hover:underline"
                  onClick={alert.onAction}
                >
                  {alert.actionLabel}
                </button>
              ) : null}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-primary hover:text-accent-blue transition-colors text-xs font-semibold normal-case"
            aria-label="Give feedback"
          >
            Feedback
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-primary hover:text-accent-blue transition-colors flex items-center"
            aria-label="View source code on GitHub"
          >
            <svg
              className="size-4"
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
