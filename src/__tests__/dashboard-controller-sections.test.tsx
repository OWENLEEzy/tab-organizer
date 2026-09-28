import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../dashboard/App';
import { I18nProvider } from '../dashboard/providers/I18nProvider';
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
  chromeStorageData.schemaVersion = 6;
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
      onMoved: { addListener: vi.fn(), removeListener: vi.fn() },
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

    await waitFor(() => expect(screen.getByRole('button', { name: 'Work' })).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Empty' })).not.toBeInTheDocument();
  });

  it('does not count Unsorted as a section', async () => {
    chromeStorageData.sections = [{ id: 'later', name: 'Later', order: 0 }];
    chromeStorageData.sectionAssignments = [];
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeChromeTab(1, 'https://example.com/docs', 'Docs'),
    ]);

    renderApp();

    await waitFor(() => expect(screen.getByRole('button', { name: 'All sections' })).toBeInTheDocument());
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

  it('keeps other populated sections navigable after switching to one section', async () => {
    const user = userEvent.setup();
    chromeStorageData.sections = [
      { id: 'work', name: 'Work', order: 0 },
      { id: 'personal', name: 'Personal', order: 1 },
    ];
    chromeStorageData.sectionAssignments = [
      { productKey: 'github', sectionId: 'work', order: 0 },
      { productKey: 'example.com', sectionId: 'personal', order: 0 },
    ];
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeChromeTab(1, 'https://github.com/OWENLEEzy/tab-organizer', 'Repo'),
      makeChromeTab(2, 'https://example.com/docs', 'Example Docs'),
    ]);

    renderApp();

    await user.click(await screen.findByRole('button', { name: 'Work' }));

    expect(screen.getByRole('button', { name: 'Work' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Personal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All sections' })).toBeInTheDocument();
  });

  it('keeps section projections consistent after filtering and navigation', async () => {
    chromeStorageData.sections = [
      { id: 'section-dev', name: 'Dev', order: 0 },
      { id: 'section-empty', name: 'Empty', order: 1 },
    ];
    chromeStorageData.sectionAssignments = [
      { productKey: 'github', sectionId: 'section-dev', order: 0 },
    ];
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeChromeTab(1, 'https://github.com/OWENLEEzy/tab-organizer', 'Repo'),
      makeChromeTab(2, 'https://example.com/docs', 'Docs'),
    ]);

    renderApp();

    await waitFor(() => expect(screen.getByRole('button', { name: 'All sections' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Dev' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Empty' })).not.toBeInTheDocument();
  });

  it('renders empty sections as cards drop zones without listing them in section navigation', async () => {
    chromeStorageData.sections = [
      { id: 'section-dev', name: 'Dev', order: 0 },
      { id: 'custom-empty', name: 'Custom Empty', order: 1 },
    ];
    chromeStorageData.sectionAssignments = [
      { productKey: 'github', sectionId: 'section-dev', order: 0 },
    ];
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeChromeTab(1, 'https://github.com/OWENLEEzy/tab-organizer', 'Repo'),
      makeChromeTab(2, 'https://example.com/docs', 'Docs'),
    ]);

    renderApp();

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Dev' })).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Custom Empty' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Custom Empty' })).not.toBeInTheDocument();
  });

  it('renders a section with no products in Cards view', async () => {
    // An empty section whose id is a built-in template id (as created by onboarding)
    // must still render in Cards view — it is a drop target the user deliberately
    // created, not stale scaffolding to hide.
    chromeStorageData.sections = [
      { id: 'section-dev', name: 'Dev', order: 0 },
      { id: 'section-shopping', name: 'Shopping', order: 1 },
    ];
    chromeStorageData.sectionAssignments = [
      { productKey: 'github', sectionId: 'section-dev', order: 0 },
    ];
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeChromeTab(1, 'https://github.com/OWENLEEzy/tab-organizer', 'Repo'),
    ]);

    renderApp();

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Dev' })).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Shopping' })).toBeInTheDocument();
  });

  it('hides sections with no search matches instead of calling them empty', async () => {
    const user = userEvent.setup();
    chromeStorageData.onboardingDone = true;
    chromeStorageData.sections = [
      { id: 'section-dev', name: 'Dev', order: 0 },
      { id: 'section-docs', name: 'Docs', order: 1 },
    ];
    chromeStorageData.sectionAssignments = [
      { productKey: 'github', sectionId: 'section-dev', order: 0 },
      { productKey: 'example.com', sectionId: 'section-docs', order: 0 },
    ];
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeChromeTab(1, 'https://github.com/OWENLEEzy/tab-organizer', 'Repo'),
      makeChromeTab(2, 'https://example.com/docs', 'Docs'),
    ]);

    renderApp();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Docs' })).toBeInTheDocument());

    await user.type(screen.getByRole('searchbox'), 'github');

    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Docs' })).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Dev' })).toBeInTheDocument();
    expect(screen.queryByText('Empty — drag a product group here')).not.toBeInTheDocument();
  });

  it('tells the user when unpinning a group could not be saved', async () => {
    const user = userEvent.setup();
    chromeStorageData.onboardingDone = true;
    chromeStorageData.sections = [{ id: 'section-dev', name: 'Dev', order: 0 }];
    chromeStorageData.unsectionedProductKeys = ['github'];
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeChromeTab(1, 'https://github.com/OWENLEEzy/tab-organizer', 'Repo'),
    ]);

    renderApp();
    const unpin = await screen.findByRole('button', { name: /Unpin GitHub/ });
    (chrome.storage.local.set as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('disk full'));

    await user.click(unpin);

    expect(await screen.findByText(/Could not save that change/)).toBeInTheDocument();
  });

  it('tells the user when a settings change could not be saved', async () => {
    const user = userEvent.setup();
    chromeStorageData.onboardingDone = true;
    chromeStorageData.sections = [{ id: 'section-dev', name: 'Dev', order: 0 }];
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeChromeTab(1, 'https://github.com/OWENLEEzy/tab-organizer', 'Repo'),
    ]);

    renderApp();
    await user.click(await screen.findByRole('button', { name: 'Settings' }));
    await user.click(await screen.findByRole('button', { name: 'Behavior' }));
    (chrome.storage.local.set as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('disk full'));
    await user.click(screen.getByRole('switch', { name: /sound/i }));

    expect(await screen.findByText(/Could not save that change/)).toBeInTheDocument();
  });

  it('tells the user when a section edit could not be saved', async () => {
    const user = userEvent.setup();
    chromeStorageData.onboardingDone = true;
    chromeStorageData.sections = [{ id: 'section-dev', name: 'Dev', order: 0 }];
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeChromeTab(1, 'https://github.com/OWENLEEzy/tab-organizer', 'Repo'),
    ]);

    renderApp();
    await user.click(await screen.findByRole('button', { name: 'Settings' }));
    await user.click(await screen.findByRole('button', { name: 'Sections & Rules' }));
    (chrome.storage.local.set as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('disk full'));
    await user.click(screen.getByRole('button', { name: 'Delete Section' }));

    expect(await screen.findByText(/Could not save that change/)).toBeInTheDocument();
  });
});

