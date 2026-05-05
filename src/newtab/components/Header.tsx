import React from 'react';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDateDisplay(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface HeaderProps {
  totalTabs: number;
  totalDupes: number;
  totalDomains: number;
}

export function Header({ totalTabs, totalDupes, totalDomains }: HeaderProps): React.ReactElement {
  return (
    <header className="border-border-light dark:border-border-dark mb-12 border-b pb-6">
      <h1 className="font-heading text-text-primary-light dark:text-text-primary-dark text-3xl font-light">
        {getGreeting()}
      </h1>
      <p className="text-text-secondary mt-1 text-sm">
        {getDateDisplay()}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span className="rounded-chip bg-accent-blue/[0.08] text-accent-blue font-body inline-flex items-center px-2.5 py-0.5 text-xs font-medium">
          {totalTabs} tab{totalTabs !== 1 ? 's' : ''}
        </span>
        {totalDupes > 0 && (
          <span className="rounded-chip bg-accent-amber/[0.08] text-accent-amber font-body inline-flex items-center px-2.5 py-0.5 text-xs font-medium">
            {totalDupes} dupe{totalDupes !== 1 ? 's' : ''}
          </span>
        )}
        <span className="rounded-chip bg-accent-sage/[0.08] text-accent-sage font-body inline-flex items-center px-2.5 py-0.5 text-xs font-medium">
          {totalDomains} domain{totalDomains !== 1 ? 's' : ''}
        </span>
      </div>
    </header>
  );
}
