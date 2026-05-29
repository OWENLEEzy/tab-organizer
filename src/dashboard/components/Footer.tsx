import React, { useEffect, useRef } from 'react';
import { useI18n } from '../hooks/useI18n';

interface FooterProps {
  tabCount: number;
  duplicateCount: number;
  groupCount?: number;
  sectionCount?: number;
  alerts?: FooterAlert[];
}

export interface FooterAlert {
  id: string;
  label: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function Footer({
  tabCount,
  duplicateCount,
  groupCount = 0,
  sectionCount = 0,
  alerts = [],
}: FooterProps): React.ReactElement {
  const { t } = useI18n();
  const prevCount = useRef(tabCount);
  const tabRef = useRef<HTMLSpanElement>(null);

  // Subtle pop when tab count decreases
  useEffect(() => {
    if (tabCount < prevCount.current && tabRef.current) {
      tabRef.current.classList.add('footer-count-pop');
      const timer = setTimeout(() => {
        tabRef.current?.classList.remove('footer-count-pop');
      }, 250);
      prevCount.current = tabCount;
      return () => clearTimeout(timer);
    }
    prevCount.current = tabCount;
    return undefined;
  }, [tabCount]);

  const GITHUB_URL = 'https://github.com/OWENLEEzy/tab-organizer';
  const FEEDBACK_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfXJ6osy2J84TLpyLE-DYA-NcWMcjRAZbcTHBOZV9RnQ7WEfA/viewform';

  return (
    <footer className="footer-status-bar" aria-label="Dashboard footer">
      <div className="footer-inner">
        {/* Left: metrics */}
        <div className="footer-metrics">
          {/* Tabs */}
          <span className="footer-metric" title={`${tabCount} ${t('metricTabs')}`}>
            <svg className="footer-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1.5" y="3.5" width="13" height="10" rx="1.5" />
              <path d="M4 3.5V2.5a1 1 0 011-1h6a1 1 0 011 1v1" />
            </svg>
            <span ref={tabRef} className="footer-number">{tabCount}</span>
            <span className="footer-label">{t('metricTabs')}</span>
          </span>

          <span className="footer-sep" aria-hidden="true" />

          {/* Groups */}
          <span className="footer-metric" title={`${groupCount} ${t('metricGroups')}`}>
            <svg className="footer-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="1" width="5.5" height="5.5" rx="1" />
              <rect x="9.5" y="1" width="5.5" height="5.5" rx="1" />
              <rect x="1" y="9.5" width="5.5" height="5.5" rx="1" />
              <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1" />
            </svg>
            <span className="footer-number">{groupCount}</span>
            <span className="footer-label">{t('metricGroups')}</span>
          </span>

          <span className="footer-sep" aria-hidden="true" />

          {/* Sections */}
          <span className="footer-metric" title={`${sectionCount} ${t('metricSections')}`}>
            <svg className="footer-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" />
              <path d="M1.5 6h13M6 6v8.5" />
            </svg>
            <span className="footer-number">{sectionCount}</span>
            <span className="footer-label">{t('metricSections')}</span>
          </span>

          {/* Duplicates — amber accent when present */}
          {duplicateCount > 0 && (
            <>
              <span className="footer-sep" aria-hidden="true" />
              <span className="footer-metric footer-metric-warn" title={`${duplicateCount} ${t('metricDuplicates')}`}>
                <svg className="footer-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="4" y="1.5" width="9" height="11" rx="1.5" />
                  <path d="M3 4.5H2.5A1.5 1.5 0 001 6v8a1.5 1.5 0 001.5 1.5h7A1.5 1.5 0 0011 14v-.5" />
                </svg>
                <span className="footer-number">{duplicateCount}</span>
                <span className="footer-label">{t('metricDuplicates')}</span>
              </span>
            </>
          )}

          {/* Alerts inline */}
          {alerts.length > 0 && (
            <>
              <span className="footer-sep" aria-hidden="true" />
              {alerts.map((alert) => (
                <div key={alert.id} className="footer-metric footer-metric-warn">
                  <svg className="footer-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 1.5l6.5 12H1.5z" />
                    <path d="M8 6.5v3M8 11.5h.01" />
                  </svg>
                  <span className="footer-label">{alert.label}</span>
                  {alert.actionLabel && alert.onAction && (
                    <button
                      type="button"
                      className="footer-action"
                      onClick={alert.onAction}
                    >
                      {alert.actionLabel}
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Right: links */}
        <div className="footer-links">
          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
            aria-label="Feedback"
            title="Send feedback"
          >
            <svg className="footer-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 9h.01M8 9h.01M11 9h.01" strokeLinecap="round" />
              <path d="M1.5 3.5h13v8a1 1 0 01-1 1H9L6 15v-2.5H2.5a1 1 0 01-1-1z" />
            </svg>
            <span className="footer-link-label">Feedback</span>
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
            aria-label="GitHub"
            title="View on GitHub"
          >
            <svg className="footer-icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-1.02-.09-.23-.48-1.02-.82-1.23-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
