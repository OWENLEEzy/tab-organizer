import React from 'react';
import { ActionButton } from '../ui/ActionButton';
import { useI18n } from '../../hooks/useI18n';

// ─── Types ────────────────────────────────────────────────────────────

interface SelectionBarProps {
  count: number;
  onClose: () => void;
  onClear: () => void;
}

// ─── Component ────────────────────────────────────────────────────────

export function SelectionBar({ count, onClose, onClear }: SelectionBarProps): React.ReactElement {
  const { t } = useI18n();

  return (
    <div className="fixed bottom-5 left-1/2 z-[60] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-3 rounded-card border border-border-light bg-card-light px-5 py-3 shadow-none dark:border-border-dark dark:bg-card-dark">
      <span className="font-body text-sm text-text-primary-light dark:text-text-primary-dark">
        {t('selectedCount', { count })}
      </span>
      <ActionButton variant="danger" onClick={onClose}>
        {t('selectedClose')}
      </ActionButton>
      <ActionButton variant="quiet" onClick={onClear}>
        {t('selectedCancel')}
      </ActionButton>
    </div>
  );
}
