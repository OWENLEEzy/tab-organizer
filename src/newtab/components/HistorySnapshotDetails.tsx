import React from 'react';
import type { HistorySnapshot } from '../../types';

export function HistorySnapshotDetails({
  snapshot,
}: {
  snapshot: HistorySnapshot;
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
