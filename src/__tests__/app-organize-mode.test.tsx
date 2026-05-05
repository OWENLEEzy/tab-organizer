import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../newtab/App';
import { useSettingsStore } from '../stores/settings-store';
import { useTabStore } from '../stores/tab-store';
import { DEFAULT_SETTINGS } from '../utils/storage';
import type { Tab, TabGroup } from '../types';

const chromeTabs = {
  getCurrent: vi.fn(),
  query: vi.fn(),
  remove: vi.fn(),
  create: vi.fn(),
  onCreated: { addListener: vi.fn(), removeListener: vi.fn() },
  onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
  onUpdated: { addListener: vi.fn(), removeListener: vi.fn() },
  onMoved: { addListener: vi.fn(), removeListener: vi.fn() },
  onActivated: { addListener: vi.fn(), removeListener: vi.fn() },
};

const chromeStorage = {
  data: {} as Record<string, unknown>,
  get: vi.fn((keys: string[] | string) => {
    const result: Record<string, unknown> = {};
    for (const key of Array.isArray(keys) ? keys : [keys]) {
      if (key in chromeStorage.data) result[key] = chromeStorage.data[key];
    }
    return Promise.resolve(result);
  }),
  set: vi.fn((items: Record<string, unknown>) => {
    Object.assign(chromeStorage.data, items);
    return Promise.resolve();
  }),
};

vi.stubGlobal('chrome', {
  tabs: chromeTabs,
  storage: {
    local: chromeStorage,
    onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
  },
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://fake-id/${path}`),
  },
  windows: {
    getCurrent: vi.fn(),
    update: vi.fn(),
  },
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});

function seedDashboard(): void {
  const tabs: Tab[] = [
    {
      id: 11,
      url: 'https://github.com/OWENLEEzy/tab-out',
      title: 'Repo',
      favIconUrl: '',
      domain: 'github.com',
      windowId: 1,
      active: true,
      isTabOut: false,
      isDuplicate: false,
      isLandingPage: false,
      duplicateCount: 0,
    },
    {
      id: 12,
      url: 'https://vercel.com/dashboard',
      title: 'Vercel',
      favIconUrl: '',
      domain: 'vercel.com',
      windowId: 1,
      active: false,
      isTabOut: false,
      isDuplicate: false,
      isLandingPage: false,
      duplicateCount: 0,
    },
  ];
  const groups: TabGroup[] = [
    {
      id: 'github',
      domain: 'github',
      friendlyName: 'GitHub',
      itemType: 'product',
      itemKey: 'github',
      productKey: 'github',
      iconDomain: 'github.com',
      tabs: [tabs[0]],
      collapsed: false,
      order: 0,
      color: '#4DAB9A',
      hasDuplicates: false,
      duplicateCount: 0,
    },
    {
      id: 'vercel',
      domain: 'vercel',
      friendlyName: 'Vercel',
      itemType: 'product',
      itemKey: 'vercel',
      productKey: 'vercel',
      iconDomain: 'vercel.com',
      tabs: [tabs[1]],
      collapsed: false,
      order: 1,
      color: '#2383E2',
      hasDuplicates: false,
      duplicateCount: 0,
    },
  ];

  chromeStorage.data = {
    schemaVersion: 3,
    deferred: [],
    workspaces: [],
    settings: DEFAULT_SETTINGS,
    groupOrder: {},
    sections: [{ id: 'later', name: 'Later', order: 0 }],
    sectionAssignments: [{ productKey: 'github', sectionId: 'later', order: 0 }],
    viewMode: 'cards',
    recoveryCandidate: null,
    recoveryHistory: [],
  };
  chromeTabs.query.mockResolvedValue([]);
  chromeTabs.getCurrent.mockResolvedValue({ id: 99 });

  useTabStore.setState({
    ...useTabStore.getInitialState(),
    tabs,
    groups,
    sections: [{ id: 'later', name: 'Later', order: 0 }],
    sectionAssignments: [{ productKey: 'github', sectionId: 'later', order: 0 }],
    viewMode: 'cards',
    loading: false,
    fetchTabs: vi.fn().mockResolvedValue(undefined),
    startListeners: vi.fn(() => () => {}),
  }, true);
  useSettingsStore.setState({
    ...useSettingsStore.getInitialState(),
    settings: DEFAULT_SETTINGS,
    fetchSettings: vi.fn().mockResolvedValue(undefined),
  }, true);
}

describe('App organize mode', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    seedDashboard();
  });

  it('renders product sections without DND handles by default', async () => {
    render(<App />);

    expect(await screen.findByText('Later')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.queryByLabelText(/drag github group/i)).not.toBeInTheDocument();
  });

  it('loads product group DND only after the visible Organize toggle is enabled', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText('Later');
    expect(screen.queryByLabelText(/drag github group/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /organize/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/drag github group/i)).toBeInTheDocument();
    });
  });
});
