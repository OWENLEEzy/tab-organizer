import React from 'react';
import { App } from '../newtab/App';

interface E2EHarnessProps {
  scenario?: 'default' | 'duplicates' | 'empty' | 'many-tabs';
}

/**
 * E2E test harness for Playwright tests.
 * Renders the full App with Chrome API mocked in e2e-harness.html
 */
export function E2EHarness({ scenario = 'default' }: E2EHarnessProps): React.ReactElement {
  return (
    <div data-testid="e2e-harness" data-scenario={scenario}>
      <App />
    </div>
  );
}
