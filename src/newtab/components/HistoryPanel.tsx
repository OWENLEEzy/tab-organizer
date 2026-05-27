import React, { useMemo, useState } from 'react';
import type { HistorySnapshot } from '../../types';
import { UtilityPanel } from './layout/UtilityPanel';
import { ActionButton } from './ui/ActionButton';
import { useI18n } from '../hooks/useI18n';

const HistorySnapshotDetails = React.lazy(() =>
  import('./HistorySnapshotDetails').then((module) => ({
    default: module.HistorySnapshotDetails,
  })),
);

// ─── Helpers ──────────────────────────────────────────────────────────

const EN_SNAPSHOT_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const ZH_SNAPSHOT_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function getSnapshotDateFormatter(locale: string): Intl.DateTimeFormat {
  return locale === 'zh' ? ZH_SNAPSHOT_FORMATTER : EN_SNAPSHOT_FORMATTER;
}

interface HistoryPanelProps {
  snapshots: HistorySnapshot[];
  onRestoreSnapshot: (snapshotId: string) => void;
  onRestoreProduct: (snapshotId: string, productKey: string) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
  onClearSnapshots: () => void;
}

export function HistoryPanel({
  snapshots,
  onRestoreSnapshot,
  onRestoreProduct,
  onDeleteSnapshot,
  onClearSnapshots,
}: HistoryPanelProps): React.ReactElement | null {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { t, locale } = useI18n();
  const latest = snapshots[0] ?? null;
  const older = useMemo(() => snapshots.slice(1), [snapshots]);

  const visibleSnapshots = latest ? [latest, ...older] : [];

  const formatCapturedAt = (value: string): string => {
    try {
      return getSnapshotDateFormatter(locale).format(new Date(value));
    } catch {
      return value;
    }
  };

  return (
    <UtilityPanel
      title={t('historyTitle')}
      count={visibleSnapshots.length}
      actions={visibleSnapshots.length > 0 ? (
        <ActionButton variant="quiet" className="min-h-[--spacing-button-height-sm] min-w-auto px-2 py-1" onClick={onClearSnapshots}>
          {t('historyClear')}
        </ActionButton>
      ) : null}
    >
      <div className="history-list" aria-label="Recent snapshots">
        {visibleSnapshots.length === 0 ? (
          <div className="history-empty-state text-center py-12 px-6">
            <div className="text-text-secondary text-sm mb-2 opacity-60">{t('historyNoSnapshotsTitle')}</div>
            <p className="text-text-secondary text-[var(--text-2xs)] leading-relaxed opacity-40 max-w-[var(--width-label)] mx-auto">
              {t('historyNoSnapshotsDesc')}
            </p>
          </div>
        ) : (
          visibleSnapshots.map((snapshot) => {
            const expanded = expandedId === snapshot.id;
            return (
              <section key={snapshot.id} className="history-card">
                <div className="history-card-top">
                  <div>
                    <div className="history-time">{formatCapturedAt(snapshot.capturedAt)}</div>
                    <div className="history-count">
                      {snapshot.tabCount === 1
                        ? t('historyCountTabsSingle')
                        : t('historyCountTabsPlural', { count: snapshot.tabCount })}
                    </div>
                  </div>
                  <button type="button" className="history-button" onClick={() => onRestoreSnapshot(snapshot.id)}>
                    {t('historyRestoreAll')}
                  </button>
                </div>

                <div className="history-products">
                  {snapshot.products.map((product) => (
                    <button
                      key={product.productKey}
                      type="button"
                      className="history-product-button"
                      onClick={() => onRestoreProduct(snapshot.id, product.productKey)}
                      aria-label={t('historyRestoreProduct', { product: product.label })}
                    >
                      <span>{product.label}</span>
                      <span>{product.tabCount}</span>
                    </button>
                  ))}
                </div>

                <div className="history-card-actions">
                  <button
                    type="button"
                    className="history-button"
                    onClick={() => setExpandedId(expanded ? null : snapshot.id)}
                    aria-expanded={expanded}
                  >
                    {expanded ? t('historyHideDetails') : t('historyShowDetails')}
                  </button>
                  <button type="button" className="history-button" onClick={() => onDeleteSnapshot(snapshot.id)}>
                    {t('historyDelete')}
                  </button>
                </div>

                {expanded && (
                  <React.Suspense fallback={<div className="history-loading">{t('historyLoadingDetails')}</div>}>
                    <HistorySnapshotDetails snapshot={snapshot} />
                  </React.Suspense>
                )}
              </section>
            );
          })
        )}
      </div>
    </UtilityPanel>
  );
}
