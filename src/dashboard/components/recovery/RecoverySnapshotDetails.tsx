import type { RecoverySnapshot } from '../../../types';

export function RecoverySnapshotDetails({
  snapshot,
}: {
  snapshot: RecoverySnapshot;
}): React.ReactElement {
  return (
    <ul className="history-tabs">
      {snapshot.tabs.map((tab) => (
        <li key={tab.url}>
          <span className="history-tab-title">{tab.title || tab.url}</span>
          <small>{tab.productLabel}</small>
        </li>
      ))}
    </ul>
  );
}