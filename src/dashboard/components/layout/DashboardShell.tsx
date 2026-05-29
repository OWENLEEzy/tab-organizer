import React from 'react';

interface DashboardShellProps {
  top: React.ReactNode;
  header: React.ReactNode;
  toolbar: React.ReactNode;
  utilities?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  isSidebarExpanded?: boolean;
  onToggleSidebar?: () => void;
}

export function DashboardShell({
  top,
  header,
  toolbar,
  utilities,
  footer,
  children,
  isSidebarExpanded = true,
}: DashboardShellProps): React.ReactElement {
  const showSidebar = !!utilities && isSidebarExpanded;
  
  // Decoupled grid classes: header/top are independent of sidebar state
  const baseGridClass = 'dashboard-grid-layout';
  const contentGridClass = `${baseGridClass} ${showSidebar ? 'has-sidebar' : ''}`;

  return (
    <div className="dashboard-shell">
      {/* Skip to main content link for keyboard users */}
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-chip focus:bg-accent-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>
      <header>
        {top ? (
          <div className="dashboard-full-width border-b border-border-color bg-bg-surface">
            <div className={baseGridClass}>{top}</div>
          </div>
        ) : null}
        <div className="dashboard-full-width border-b border-border-color bg-bg-card/50 backdrop-blur-md z-20">
          <div className={baseGridClass}>{header}</div>
        </div>
        {toolbar ? (
          <div className="dashboard-full-width border-b border-border-color">
            <div className={baseGridClass}>{toolbar}</div>
          </div>
        ) : null}
      </header>
      <div className="dashboard-content">
        <div className={contentGridClass}>
          <main id="dashboard-main" className="dashboard-primary">{children}</main>
          {showSidebar && (
            <aside className="dashboard-utilities relative">
              {utilities}
            </aside>
          )}
        </div>
      </div>
      {footer && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border-color bg-bg-page/95 backdrop-blur-sm">
          <div className={baseGridClass}>{footer}</div>
        </div>
      )}
    </div>
  );
}
