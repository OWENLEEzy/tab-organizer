import React, { useMemo, useState } from 'react';
import type { RecoverySnapshot } from '../../types';
import { UtilityPanel } from './layout/UtilityPanel';
import { ActionButton } from './ui/ActionButton';

const RecoverySnapshotDetails = React.lazy(() =>
  import('./RecoverySnapshotDetails').then((module) => ({
    default: module.RecoverySnapshotDetails,
  })),
);

interface RecoveryPanelProps {
  snapshots: RecoverySnapshot[];
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

export function RecoveryPanel({
  snapshots,
  onRestoreSnapshot,
  onRestoreProduct,
  onDeleteSnapshot,
  onClearSnapshots,
}: RecoveryPanelProps): React.ReactElement | null {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const latest = snapshots[0] ?? null;
  const older = useMemo(() => snapshots.slice(1), [snapshots]);

  if (!latest) return null;

  const visibleSnapshots = [latest, ...older];

  return (
    <UtilityPanel
      title="Recent sessions"
      count={visibleSnapshots.length}
      actions={(
        <ActionButton variant="quiet" className="min-h-8 px-2 py-1" onClick={onClearSnapshots}>
          Clear
        </ActionButton>
      )}
    >
      <div className="recovery-list" aria-label="Recent sessions">
        {visibleSnapshots.map((snapshot) => {
          const expanded = expandedId === snapshot.id;
          return (
            <section key={snapshot.id} className="recovery-card">
              <div className="recovery-card-top">
                <div>
                  <div className="recovery-time">{formatCapturedAt(snapshot.capturedAt)}</div>
                  <div className="recovery-count">{snapshot.tabCount} tabs</div>
                </div>
                <button type="button" className="recovery-button" onClick={() => onRestoreSnapshot(snapshot.id)}>
                  Restore full session
                </button>
              </div>

              <div className="recovery-products">
                {snapshot.products.map((product) => (
                  <button
                    key={product.productKey}
                    type="button"
                    className="recovery-product-button"
                    onClick={() => onRestoreProduct(snapshot.id, product.productKey)}
                    aria-label={`Restore ${product.label}`}
                  >
                    <span>{product.label}</span>
                    <span>{product.tabCount}</span>
                  </button>
                ))}
              </div>

              <div className="recovery-card-actions">
                <button
                  type="button"
                  className="recovery-button"
                  onClick={() => setExpandedId(expanded ? null : snapshot.id)}
                  aria-expanded={expanded}
                >
                  {expanded ? 'Hide session details' : 'Show session details'}
                </button>
                <button type="button" className="recovery-button" onClick={() => onDeleteSnapshot(snapshot.id)}>
                  Delete
                </button>
              </div>

              {expanded && (
                <React.Suspense fallback={<div className="recovery-loading">Loading details...</div>}>
                  <RecoverySnapshotDetails snapshot={snapshot} />
                </React.Suspense>
              )}
            </section>
          );
        })}
      </div>
    </UtilityPanel>
  );
}
