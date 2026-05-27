import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { shootConfetti } from '../lib/confetti';
import { playCloseSound } from '../lib/sound';

describe('playCloseSound', () => {
  const originalAudioContext = window.AudioContext;

  afterEach(() => {
    window.AudioContext = originalAudioContext;
    vi.useRealTimers();
  });

  it('builds and cleans up a synthesized close sound', () => {
    vi.useFakeTimers();
    const close = vi.fn();
    const connect = vi.fn(function connectTarget(this: unknown) {
      return this;
    });
    const start = vi.fn();
    const frequency = {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    };
    const gain = {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    };

    class MockAudioContext {
      currentTime = 1;
      sampleRate = 100;
      destination = {};
      createBuffer = vi.fn(() => ({
        getChannelData: () => new Float32Array(10),
      }));
      createBufferSource = vi.fn(() => ({ buffer: null, connect, start }));
      createBiquadFilter = vi.fn(() => ({ type: '', Q: { value: 0 }, frequency, connect }));
      createGain = vi.fn(() => ({ gain, connect }));
      close = close;
    }

    window.AudioContext = MockAudioContext as unknown as typeof AudioContext;

    playCloseSound();
    vi.runAllTimers();

    expect(start).toHaveBeenCalled();
    expect(frequency.exponentialRampToValueAtTime).toHaveBeenCalled();
    expect(gain.exponentialRampToValueAtTime).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it('silently ignores missing audio support', () => {
    window.AudioContext = undefined as unknown as typeof AudioContext;

    expect(() => playCloseSound()).not.toThrow();
  });
});

describe('shootConfetti', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates particles and removes them after animation completes', () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callbacks.push(callback);
      return callbacks.length;
    });

    shootConfetti(100, 120);

    expect(document.body.children.length).toBeGreaterThan(0);
    const firstParticle = document.body.children[0] as HTMLElement;
    callbacks[0](performance.now() + 1);
    expect(firstParticle.style.transform).toContain('translate');

    const queued = [...callbacks];
    for (const callback of queued) {
      callback(performance.now() + 2000);
    }

    expect(document.body.children.length).toBe(0);
    vi.unstubAllGlobals();
  });
});
