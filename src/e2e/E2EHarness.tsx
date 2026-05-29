import React from 'react';
import { App } from '../dashboard/App';
import { I18nProvider } from '../dashboard/providers/I18nProvider';

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
      <I18nProvider>
        <App />
      </I18nProvider>
    </div>
  );
}
