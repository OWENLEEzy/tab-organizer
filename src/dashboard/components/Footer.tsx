import React from 'react';

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
  const GITHUB_URL = 'https://github.com/OWENLEEzy/tab-organizer';
  const FEEDBACK_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfXJ6osy2J84TLpyLE-DYA-NcWMcjRAZbcTHBOZV9RnQ7WEfA/viewform';

  return (
    <footer className="py-1 px-4 text-xs text-text-secondary font-medium" aria-label="Dashboard footer">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span>{tabCount} tabs</span>
          <span>&middot;</span>
          <span>{groupCount} groups</span>
          <span>&middot;</span>
          <span>{sectionCount} sections</span>
          
          {duplicateCount > 0 && (
            <>
              <span>&middot;</span>
              <span className="text-accent-amber font-semibold">{duplicateCount} duplicates</span>
            </>
          )}

          {alerts.length > 0 && (
            <div className="flex items-center gap-2 ml-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center gap-1.5 text-accent-amber">
                  <span>{alert.label}</span>
                  {alert.actionLabel && alert.onAction && (
                    <button
                      type="button"
                      className="underline decoration-accent-amber/50 hover:text-accent-amber/80 transition-colors"
                      onClick={alert.onAction}
                    >
                      {alert.actionLabel}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-primary-light transition-colors outline-none focus-visible:underline"
          >
            Feedback
          </a>
          <span>&middot;</span>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-primary-light transition-colors outline-none focus-visible:underline"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
