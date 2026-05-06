import React, { useMemo, useState } from 'react';
import type { HistorySnapshot } from '../../types';
import { UtilityPanel } from './layout/UtilityPanel';
import { ActionButton } from './ui/ActionButton';

const HistorySnapshotDetails = React.lazy(() =>
  import('./HistorySnapshotDetails').then((module) => ({
    default: module.HistorySnapshotDetails,
  })),
);

interface HistoryPanelProps {
  snapshots: HistorySnapshot[];
  onRestoreSnapshot: (snapshotId: string) => void;
  onRestoreProduct: (snapshotId: string, productKey: string) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
  onClearSnapshots: () => void;
}

function formatCapturedAt(value: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function HistoryPanel({
  snapshots,
  onRestoreSnapshot,
  onRestoreProduct,
  onDeleteSnapshot,
  onClearSnapshots,
}: HistoryPanelProps): React.ReactElement | null {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const latest = snapshots[0] ?? null;
  const older = useMemo(() => snapshots.slice(1), [snapshots]);

  if (!latest) return null;

  const visibleSnapshots = [latest, ...older];

  return (
    <UtilityPanel
      title="History"
      count={visibleSnapshots.length}
      actions={(
        <ActionButton variant="quiet" className="min-h-8 px-2 py-1" onClick={onClearSnapshots}>
          Clear
        </ActionButton>
      )}
    >
      <div className="history-list" aria-label="Recent snapshots">
        {visibleSnapshots.map((snapshot) => {
          const expanded = expandedId === snapshot.id;
          return (
            <section key={snapshot.id} className="history-card">
              <div className="history-card-top">
                <div>
                  <div className="history-time">{formatCapturedAt(snapshot.capturedAt)}</div>
                  <div className="history-count">{snapshot.tabCount} tabs</div>
                </div>
                <button type="button" className="history-button" onClick={() => onRestoreSnapshot(snapshot.id)}>
                  Restore all
                </button>
              </div>

              <div className="history-products">
                {snapshot.products.map((product) => (
                  <button
                    key={product.productKey}
                    type="button"
                    className="history-product-button"
                    onClick={() => onRestoreProduct(snapshot.id, product.productKey)}
                    aria-label={`Restore ${product.label}`}
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
                  {expanded ? 'Hide details' : 'Show details'}
                </button>
                <button type="button" className="history-button" onClick={() => onDeleteSnapshot(snapshot.id)}>
                  Delete
                </button>
              </div>

              {expanded && (
                <React.Suspense fallback={<div className="history-loading">Loading details...</div>}>
                  <HistorySnapshotDetails snapshot={snapshot} />
                </React.Suspense>
              )}
            </section>
          );
        })}
      </div>
    </UtilityPanel>
  );
}
