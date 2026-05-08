import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateBadge } from '../utils/badge';

const chromeAction = {
  setBadgeText: vi.fn(),
  setBadgeBackgroundColor: vi.fn(),
};

vi.stubGlobal('chrome', {
  action: chromeAction,
});

describe('updateBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets empty text when count is 0', async () => {
    await updateBadge(0);
    expect(chromeAction.setBadgeText).toHaveBeenCalledWith({ text: '' });
    expect(chromeAction.setBadgeBackgroundColor).not.toHaveBeenCalled();
  });

  it('sets count text and color when count > 0', async () => {
    await updateBadge(5);
    expect(chromeAction.setBadgeText).toHaveBeenCalledWith({ text: '5' });
    expect(chromeAction.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#4DAB9A' });

    await updateBadge(15);
    expect(chromeAction.setBadgeText).toHaveBeenCalledWith({ text: '15' });
    expect(chromeAction.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#DFAB01' });

    await updateBadge(25);
    expect(chromeAction.setBadgeText).toHaveBeenCalledWith({ text: '25' });
    expect(chromeAction.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#EB5757' });
  });

  it('handles errors gracefully', async () => {
    chromeAction.setBadgeText.mockRejectedValueOnce(new Error('API Error'));
    await updateBadge(5);
    // Should attempt to clear badge on error
    expect(chromeAction.setBadgeText).toHaveBeenCalledWith({ text: '' });
  });

  it('handles errors during error cleanup gracefully', async () => {
    chromeAction.setBadgeText.mockRejectedValue(new Error('API Error'));
    // Should not throw even if second attempt fails
    await expect(updateBadge(5)).resolves.not.toThrow();
  });
});
