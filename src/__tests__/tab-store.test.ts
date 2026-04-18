import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTabStore } from '../stores/tab-store';

const chromeTabs = {
  query: vi.fn(),
  remove: vi.fn(),
};

vi.stubGlobal('chrome', {
  tabs: chromeTabs,
});

describe('useTabStore', () => {
  beforeEach(() => {
    chromeTabs.query.mockReset();
    chromeTabs.remove.mockReset();
    useTabStore.setState({
      tabs: [],
      groups: [],
      loading: false,
      error: null,
      fetchTabs: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('closes only one underlying tab per selected chip URL', async () => {
    chromeTabs.query.mockResolvedValue([
      { id: 11, url: 'https://github.com/zarazhangrui/tab-out' },
      { id: 12, url: 'https://github.com/zarazhangrui/tab-out' },
      { id: 13, url: 'https://vercel.com' },
    ]);
    chromeTabs.remove.mockResolvedValue(undefined);

    await useTabStore.getState().closeOneTabPerUrl([
      'https://github.com/zarazhangrui/tab-out',
    ]);

    expect(chromeTabs.remove).toHaveBeenCalledWith([11]);
    expect(useTabStore.getState().fetchTabs).toHaveBeenCalledTimes(1);
  });
});
