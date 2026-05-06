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
  const containerClass = 'dashboard-grid-layout'; // Base container for alignment
  const workspaceClass = `dashboard-grid-layout ${showSidebar ? 'has-sidebar' : ''}`;

  return (
    <div className="dashboard-shell">
      <div className="dashboard-full-width border-b-2 border-border-light bg-accent-amber/10 dark:border-border-dark dark:bg-accent-amber/5">
        <div className={containerClass}>{top}</div>
      </div>
      <div className="dashboard-full-width border-b-2 border-border-light bg-card-light/50 backdrop-blur-md dark:border-border-dark dark:bg-card-dark/50">
        <div className={containerClass}>{header}</div>
      </div>
      <div className="dashboard-full-width border-b-2 border-border-light">
        <div className={containerClass}>{toolbar}</div>
      </div>
      <div className="dashboard-workspace">
        <div className={workspaceClass}>
          <main className="dashboard-primary">{children}</main>
          {utilities && (
            <aside className={`dashboard-utilities relative ${!isSidebarExpanded ? 'hidden' : ''}`}>
              {utilities}
              {/* Internal toggle button can be added here if needed, or in the header */}
            </aside>
          )}
        </div>
      </div>
      <div className="dashboard-full-width border-t-2 border-border-light">
        <div className={containerClass}>{footer}</div>
      </div>
    </div>
  );
}
