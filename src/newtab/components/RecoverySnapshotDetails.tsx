import React from 'react';
import type { RecoverySnapshot } from '../../types';

export function RecoverySnapshotDetails({
  snapshot,
}: {
  snapshot: RecoverySnapshot;
}): React.ReactElement {
  return (
    <ul className="recovery-tabs">
      {snapshot.tabs.map((tab) => (
        <li key={tab.url}>
          <span className="recovery-tab-title">{tab.title || tab.url}</span>
          <small>{tab.productLabel}</small>
        </li>
      ))}
    </ul>
  );
}
