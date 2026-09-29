import React from 'react';
import type { CustomGroup } from '../../../types';
import { useI18n } from '../../hooks/useI18n';

interface HostnameGroupingRulesProps {
  groups: readonly CustomGroup[];
  onRemove: (groupKey: string) => void;
}

/**
 * Hostname rules that merge sites into one product group. Renaming no longer
 * creates them, but shipped defaults and rules saved by earlier versions still
 * apply, so the user must be able to see and remove them.
 */
export function HostnameGroupingRules({
  groups,
  onRemove,
}: HostnameGroupingRulesProps): React.ReactElement | null {
  const { t } = useI18n();
  if (groups.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="font-body text-text-primary-light dark:text-text-primary-dark text-sm font-medium">
        {t('hostnameRulesTitle')}
      </span>
      <p className="font-body text-text-secondary text-xs">{t('hostnameRulesHint')}</p>
      <ul className="flex flex-col gap-1">
        {groups.map((group) => (
          <li
            key={group.groupKey}
            className="flex items-center justify-between gap-3 rounded-chip bg-surface-light px-3 py-1.5 dark:bg-surface-dark"
          >
            <div className="flex min-w-0 flex-col">
              <span className="font-body text-text-primary-light dark:text-text-primary-dark truncate text-xs font-medium">
                {group.groupLabel}
              </span>
              <span className="font-body text-text-secondary truncate text-xs">
                {group.hostname ?? `*${group.hostnameEndsWith ?? ''}`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onRemove(group.groupKey)}
              aria-label={t('hostnameRulesRemove', { name: group.groupLabel })}
              className="text-accent-red hover:bg-accent-red/10 shrink-0 cursor-pointer rounded px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-accent-primary/40 focus-visible:outline-none"
            >
              {t('hostnameRulesRemoveShort')}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
