import React from 'react';
import { useI18n } from '../../hooks/useI18n';

export function EmptyState(): React.ReactElement {
  const { t } = useI18n();

  return (
    <div className="py-20 text-center border border-dashed border-border-color rounded-[var(--radius-card)]">
      <h2 className="font-heading text-2xl font-light italic text-text-primary-light dark:text-text-primary-dark">
        {t('emptyStateTitle')}
      </h2>
      <p className="mt-4 font-body text-base text-text-secondary">
        {t('emptyStateText')}
      </p>
    </div>
  );
}
