import React from 'react';
import type { RulePreviewRow } from '../../../lib/rule-preview';
import { useI18n } from '../../hooks/useI18n';

interface RuleMatchPreviewProps {
  rows: readonly RulePreviewRow[];
  sectionNameById: ReadonlyMap<string, string>;
  /** Offered only when at least one row is blocked. Never fires for pinned-only rows — those are a deliberate user veto, not a conflict to bulk-resolve. */
  onMoveBlockedHere?: () => void;
}

export function RuleMatchPreview({
  rows,
  sectionNameById,
  onMoveBlockedHere,
}: RuleMatchPreviewProps): React.ReactElement {
  const { t } = useI18n();
  const willTake = rows.filter((row) => row.status === 'will-take');
  const held = rows.filter((row) => row.status !== 'will-take');
  const blocked = rows.filter((row) => row.status === 'blocked');

  return (
    <div className="border-border-color rounded-md border p-3">
      <span className="font-body text-text-secondary text-3xs font-bold uppercase tracking-wider">
        {t('rulePreviewTitle')}
      </span>

      {rows.length === 0 && (
        <p className="font-body text-text-secondary mt-2 text-xs italic">{t('rulePreviewNone')}</p>
      )}

      <ul className="mt-2 flex flex-col gap-1">
        {willTake.map((row) => (
          <li key={row.product.id} className="font-body flex items-center gap-2 text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="text-accent-sage size-3.5 shrink-0"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <span className="sr-only">{t('rulePreviewWillTake')}</span>
            <span className="text-text-primary-light dark:text-text-primary-dark">
              {row.product.friendlyName || row.product.domain}
            </span>
            <span className="text-text-secondary">
              {t('rulePreviewTabCount', { count: row.product.tabs.length })}
            </span>
          </li>
        ))}
      </ul>

      {held.length > 0 && (
        <>
          <ul className="border-border-color/40 mt-2 flex flex-col gap-1 border-t pt-2">
            {held.map((row) => (
              <li key={row.product.id} className="font-body flex flex-wrap items-center gap-2 text-xs">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="text-accent-terracotta size-3.5 shrink-0"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.364 18.364A9 9 0 105.636 5.636a9 9 0 0012.728 12.728ZM8.464 8.464l7.072 7.072"
                  />
                </svg>
                <span className="text-text-primary-light dark:text-text-primary-dark">
                  {row.product.friendlyName || row.product.domain}
                </span>
                <span className="text-accent-terracotta text-3xs">
                  {row.status === 'blocked'
                    ? t('rulePreviewBlocked', {
                        section: sectionNameById.get(row.blockedBySectionId ?? '') ?? '',
                      })
                    : t('rulePreviewPinned')}
                </span>
              </li>
            ))}
          </ul>

          {onMoveBlockedHere && blocked.length > 0 && (
            <button
              type="button"
              onClick={() => onMoveBlockedHere()}
              className="rounded-chip font-body text-accent-blue border-accent-blue/40 hover:bg-accent-blue/10 focus-visible:ring-accent-primary/40 mt-2 min-h-[var(--spacing-button-height)] cursor-pointer border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {t('rulePreviewMoveThem', { count: blocked.length })}
            </button>
          )}
        </>
      )}
    </div>
  );
}
