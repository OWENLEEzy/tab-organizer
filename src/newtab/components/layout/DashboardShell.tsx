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
  const gridClass = `dashboard-grid-layout ${showSidebar ? 'has-sidebar' : ''}`;

  return (
    <div className="dashboard-shell">
      <div className="dashboard-full-width border-b-2 border-border-light bg-accent-amber/10 dark:border-border-dark dark:bg-accent-amber/5">
        <div className={gridClass}>{top}</div>
      </div>
      <div className="dashboard-full-width border-b-2 border-border-light bg-card-light/50 backdrop-blur-md dark:border-border-dark dark:bg-card-dark/50">
        <div className={gridClass}>{header}</div>
      </div>
      <div className="dashboard-full-width border-b-2 border-border-light">
        <div className={gridClass}>{toolbar}</div>
      </div>
      <div className="dashboard-workspace">
        <div className={gridClass}>
          <main className="dashboard-primary">{children}</main>
          {showSidebar && (
            <aside className="dashboard-utilities relative">
              {utilities}
            </aside>
          )}
        </div>
      </div>
      {footer && (
        <div className="dashboard-full-width border-t-2 border-border-light">
          <div className={gridClass}>{footer}</div>
        </div>
      )}
    </div>
  );
}
