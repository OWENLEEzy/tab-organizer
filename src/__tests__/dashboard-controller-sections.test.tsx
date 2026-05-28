import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { App } from '../newtab/App';
import { I18nProvider } from '../newtab/providers/I18nProvider';
import { useTabStore } from '../stores/tab-store';
import { useSettingsStore } from '../stores/settings-store';

const chromeStorageData: Record<string, unknown> = {};

function makeChromeTab(id: number, url: string, title = url): chrome.tabs.Tab {
  return {
    id,
    index: id,
    windowId: 1,
    highlighted: false,
    active: false,
    pinned: false,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    groupId: -1,
    url,
    title,
    status: 'complete',
    frozen: false,
  } as chrome.tabs.Tab;
}

function renderApp(): void {
  render(
    <I18nProvider>
      <App />
    </I18nProvider>,
  );
}

beforeEach(() => {
  for (const key of Object.keys(chromeStorageData)) delete chromeStorageData[key];
  useTabStore.setState(useTabStore.getInitialState(), true);
  useSettingsStore.setState(useSettingsStore.getInitialState(), true);

  vi.stubGlobal('chrome', {
    runtime: {
      getManifest: () => ({ version: '2.0.0' }),
      onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    storage: {
      local: {
        get: vi.fn(async (keys?: string[] | Record<string, unknown> | null) => {
          if (Array.isArray(keys)) {
            return Object.fromEntries(keys.map((key) => [key, chromeStorageData[key]]));
          }
          if (keys && typeof keys === 'object') {
            return Object.fromEntries(
              Object.entries(keys).map(([key, fallback]) => [
                key,
                chromeStorageData[key] ?? fallback,
              ]),
            );
          }
          return { ...chromeStorageData };
        }),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.assign(chromeStorageData, items);
        }),
        remove: vi.fn(async (keys: string | string[]) => {
          for (const key of Array.isArray(keys) ? keys : [keys]) delete chromeStorageData[key];
        }),
      },
    },
    tabs: {
      query: vi.fn(),
      onCreated: { addListener: vi.fn(), removeListener: vi.fn() },
      onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
      onUpdated: { addListener: vi.fn(), removeListener: vi.fn() },
    },
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('dashboard section semantics', () => {
  it('counts only sections that currently contain product groups', async () => {
    chromeStorageData.sections = [
      { id: 'work', name: 'Work', order: 0 },
      { id: 'empty', name: 'Empty', order: 1 },
    ];
    chromeStorageData.sectionAssignments = [
      { productKey: 'github', sectionId: 'work', order: 0 },
    ];
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeChromeTab(1, 'https://github.com/OWENLEEzy/tab-organizer', 'Repo'),
      makeChromeTab(2, 'https://example.com/docs', 'Docs'),
    ]);

    renderApp();

    await waitFor(() => expect(screen.getByText('1 sections')).toBeInTheDocument());
    expect(screen.queryByText('2 sections')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Work' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Empty' })).not.toBeInTheDocument();
  });

  it('does not count Unsorted as a section', async () => {
    chromeStorageData.sections = [{ id: 'later', name: 'Later', order: 0 }];
    chromeStorageData.sectionAssignments = [];
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeChromeTab(1, 'https://example.com/docs', 'Docs'),
    ]);

    renderApp();

    await waitFor(() => expect(screen.getByText('0 sections')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Later' })).not.toBeInTheDocument();
  });

  it('keeps empty sections available in table assignment targets', async () => {
    chromeStorageData.viewMode = 'table';
    chromeStorageData.sections = [
      { id: 'later', name: 'Later', order: 0 },
      { id: 'empty', name: 'Empty', order: 1 },
    ];
    chromeStorageData.sectionAssignments = [];
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeChromeTab(1, 'https://example.com/docs', 'Docs'),
    ]);

    renderApp();

    const row = await screen.findByRole('row', { name: /Example/ });
    const select = within(row).getByRole('combobox');
    expect(within(select).getByRole('option', { name: 'Later' })).toBeInTheDocument();
    expect(within(select).getByRole('option', { name: 'Empty' })).toBeInTheDocument();
  });
});