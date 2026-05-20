import React from 'react';
import { useI18n } from '../hooks/useI18n';
import type { TranslationKey } from '../hooks/useI18n';

interface HeaderProps {
  totalTabs: number;
  totalDupes: number;
  totalDomains: number;
}

export function Header({ totalTabs, totalDupes, totalDomains }: HeaderProps): React.ReactElement {
  const { t, locale } = useI18n();

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    let key: TranslationKey = 'greetHello';
    if (hour < 12) key = 'greetMorning';
    else if (hour < 17) key = 'greetAfternoon';
    else key = 'greetEvening';
    return t(key);
  };

  const getDateDisplay = (): string => {
    return new Date().toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
          {totalTabs} {t('metricTabs')}
        </span>
        {totalDupes > 0 && (
          <span className="rounded-chip bg-accent-amber/[0.08] text-accent-amber font-body inline-flex items-center px-2.5 py-0.5 text-xs font-medium">
            {totalDupes} {t('metricDuplicates')}
          </span>
        )}
        <span className="rounded-chip bg-accent-sage/[0.08] text-accent-sage font-body inline-flex items-center px-2.5 py-0.5 text-xs font-medium">
          {totalDomains} {t('metricGroups')}
        </span>
      </div>
    </header>
  );
}
