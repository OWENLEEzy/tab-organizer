import type { AppSettings } from '../types';
import { shootConfetti } from './confetti';
import { playCloseSound } from './sound';

interface CloseEffectsOptions {
  sound?: boolean;
  confettiOrigin?: {
    x: number;
    y: number;
  };
}

export function playCloseEffects(
  settings: Pick<AppSettings, 'soundEnabled' | 'confettiEnabled'>,
  options: CloseEffectsOptions = {},
): void {
  const { sound = true, confettiOrigin } = options;

  if (sound && settings.soundEnabled) {
    playCloseSound();
  }

  if (confettiOrigin && settings.confettiEnabled) {
    shootConfetti(confettiOrigin.x, confettiOrigin.y);
  }
}
