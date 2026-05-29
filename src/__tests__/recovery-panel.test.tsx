import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../dashboard/providers/I18nProvider';
import { RecoveryPanel } from '../dashboard/components/recovery/RecoveryPanel';
import type { RecoverySnapshot } from '../types';

function makeSnapshot(): RecoverySnapshot {
  return {
    id: 'snapshot-1',
    capturedAt: '2026-05-05T00:00:00.000Z',
    tabCount: 2,
    products: [
      { productKey: 'github', label: 'GitHub', iconDomain: 'github.com', tabCount: 1 },
      { productKey: 'youtube', label: 'YouTube', iconDomain: 'youtube.com', tabCount: 1 },
    ],
    tabs: [
      {
        url: 'https://github.com/OWENLEEzy/tab-out',
        title: 'Repo',
        domain: 'github.com',
        productKey: 'github',
        productLabel: 'GitHub',
        iconDomain: 'github.com',
        favIconUrl: '',
        capturedAt: '2026-05-05T00:00:00.000Z',
      },
      {
        url: 'https://www.youtube.com/watch?v=1',
        title: 'Video',
        domain: 'youtube.com',
        productKey: 'youtube',
        productLabel: 'YouTube',
        iconDomain: 'youtube.com',
        favIconUrl: '',
        capturedAt: '2026-05-05T00:00:00.000Z',
      },
    ],
  };
}

describe('RecoveryPanel', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders summaries first and expands tab details on demand', async () => {
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <RecoveryPanel
          recoverySnapshots={[makeSnapshot()]}
          onRestoreRecoverySnapshot={vi.fn()}
          onRestoreRecoveryProduct={vi.fn()}
          onDeleteSnapshot={vi.fn()}
          onClearSnapshots={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('2 tabs')).toBeInTheDocument();
    expect(screen.queryByText('Repo')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /show details/i }));

    expect(await screen.findByText('Repo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restore GitHub/i })).toBeInTheDocument();
  });

  it('requires explicit restore action', async () => {
    const user = userEvent.setup();
    const onRestoreRecoverySnapshot = vi.fn();

    render(
      <I18nProvider>
        <RecoveryPanel
          recoverySnapshots={[makeSnapshot()]}
          onRestoreRecoverySnapshot={onRestoreRecoverySnapshot}
          onRestoreRecoveryProduct={vi.fn()}
          onDeleteSnapshot={vi.fn()}
          onClearSnapshots={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(onRestoreRecoverySnapshot).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /restore all/i }));

    expect(onRestoreRecoverySnapshot).toHaveBeenCalledWith('snapshot-1');
  });
});