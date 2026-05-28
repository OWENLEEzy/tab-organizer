import React from 'react';
import { ActionButton } from '../ui/ActionButton';
import { useI18n } from '../../hooks/useI18n';

interface SortButtonProps {
  disabled: boolean;
  disabledTooltip: string;
  onClick: () => void;
}

function SortIcon(): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="size-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0 .75 1.5L3 7.5m7.5 0v13.5m13.5 0-4.5-4.5m4.5 4.5L3 16.5m9-4.5h6l-3-3" />
    </svg>
  );
}

export function SortButton({ disabled, disabledTooltip, onClick }: SortButtonProps): React.ReactElement {
  const { t } = useI18n();

  return (
    <div className="relative group/sort">
      <ActionButton
        variant="quiet"
        icon={<SortIcon />}
        onClick={onClick}
        disabled={disabled}
        aria-label={disabled ? disabledTooltip : t('sortButtonLabel')}
        title={disabled ? disabledTooltip : t('sortButtonTooltip')}
      >
        {t('sortButtonLabel')}
      </ActionButton>
    </div>
  );
}