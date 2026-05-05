import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppSettings } from '../types';
import { playCloseEffects } from '../lib/close-effects';
import { playCloseSound } from '../lib/sound';
import { shootConfetti } from '../lib/confetti';

vi.mock('../lib/sound', () => ({
  playCloseSound: vi.fn(),
}));

vi.mock('../lib/confetti', () => ({
  shootConfetti: vi.fn(),
}));

const BASE_SETTINGS: AppSettings = {
  theme: 'system',
  soundEnabled: true,
  confettiEnabled: true,
  maxChipsVisible: 8,
  customGroups: [],
  landingPagePatterns: [],
};

describe('playCloseEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('plays sound and confetti when both are enabled', () => {
    playCloseEffects(BASE_SETTINGS, { confettiOrigin: { x: 320, y: 180 } });

    expect(playCloseSound).toHaveBeenCalledTimes(1);
    expect(shootConfetti).toHaveBeenCalledWith(320, 180);
  });

  it('skips sound when sound effects are disabled', () => {
    playCloseEffects({ ...BASE_SETTINGS, soundEnabled: false }, { confettiOrigin: { x: 320, y: 180 } });

    expect(playCloseSound).not.toHaveBeenCalled();
    expect(shootConfetti).toHaveBeenCalledWith(320, 180);
  });

  it('skips confetti when confetti is disabled', () => {
    playCloseEffects({ ...BASE_SETTINGS, confettiEnabled: false }, { confettiOrigin: { x: 320, y: 180 } });

    expect(playCloseSound).toHaveBeenCalledTimes(1);
    expect(shootConfetti).not.toHaveBeenCalled();
  });

  it('does not shoot confetti when no origin is provided', () => {
    playCloseEffects(BASE_SETTINGS);

    expect(playCloseSound).toHaveBeenCalledTimes(1);
    expect(shootConfetti).not.toHaveBeenCalled();
  });
});
