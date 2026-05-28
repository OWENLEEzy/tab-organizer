import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../newtab/providers/I18nProvider';
import { HistoryPanel } from '../newtab/components/history/HistoryPanel';
import type { HistorySnapshot } from '../types';

function makeSnapshot(): HistorySnapshot {
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

describe('HistoryPanel', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders summaries first and expands tab details on demand', async () => {
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <HistoryPanel
          snapshots={[makeSnapshot()]}
          onRestoreSnapshot={vi.fn()}
          onRestoreProduct={vi.fn()}
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
    const onRestoreSnapshot = vi.fn();

    render(
      <I18nProvider>
        <HistoryPanel
          snapshots={[makeSnapshot()]}
          onRestoreSnapshot={onRestoreSnapshot}
          onRestoreProduct={vi.fn()}
          onDeleteSnapshot={vi.fn()}
          onClearSnapshots={vi.fn()}
        />
      </I18nProvider>,
    );

    expect(onRestoreSnapshot).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /restore all/i }));

    expect(onRestoreSnapshot).toHaveBeenCalledWith('snapshot-1');
  });
});