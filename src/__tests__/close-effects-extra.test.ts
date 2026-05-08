import { describe, it, expect, vi, beforeEach } from 'vitest';
import { playCloseEffects } from '../lib/close-effects';
import { playCloseSound } from '../lib/sound';
import { shootConfetti } from '../lib/confetti';

vi.mock('../lib/sound', () => ({
  playCloseSound: vi.fn(),
}));

vi.mock('../lib/confetti', () => ({
  shootConfetti: vi.fn(),
}));

describe('playCloseEffects extra', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('plays sound only if enabled and requested', () => {
    playCloseEffects({ soundEnabled: true, confettiEnabled: true }, { sound: true });
    expect(playCloseSound).toHaveBeenCalled();

    vi.clearAllMocks();
    playCloseEffects({ soundEnabled: false, confettiEnabled: true }, { sound: true });
    expect(playCloseSound).not.toHaveBeenCalled();

    vi.clearAllMocks();
    playCloseEffects({ soundEnabled: true, confettiEnabled: true }, { sound: false });
    expect(playCloseSound).not.toHaveBeenCalled();
  });

  it('shoots confetti only if enabled and origin provided', () => {
    playCloseEffects({ soundEnabled: true, confettiEnabled: true }, { confettiOrigin: { x: 0.5, y: 0.5 } });
    expect(shootConfetti).toHaveBeenCalledWith(0.5, 0.5);

    vi.clearAllMocks();
    playCloseEffects({ soundEnabled: true, confettiEnabled: false }, { confettiOrigin: { x: 0.5, y: 0.5 } });
    expect(shootConfetti).not.toHaveBeenCalled();

    vi.clearAllMocks();
    playCloseEffects({ soundEnabled: true, confettiEnabled: true }, {});
    expect(shootConfetti).not.toHaveBeenCalled();
  });
});
