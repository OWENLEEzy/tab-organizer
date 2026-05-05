import React from 'react';

interface DashboardShellProps {
  top: React.ReactNode;
  header: React.ReactNode;
  toolbar: React.ReactNode;
  utilities?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShell({
  top,
  header,
  toolbar,
  utilities,
  children,
}: DashboardShellProps): React.ReactElement {
  return (
    <div className="dashboard-shell">
      {top}
      {header}
      {toolbar}
      <div className="dashboard-workspace">
        <div className="dashboard-primary">{children}</div>
        {utilities ? <div className="dashboard-utilities">{utilities}</div> : null}
      </div>
    </div>
  );
}
