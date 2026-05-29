export const MOTION_DURATIONS_MS = {
  instant: 100,
  fast: 150,
  standard: 200,
  chipExit: 250,
  enter: 300,
  countPop: 300,
  toast: 400,
  banner: 500,
} as const;

export const MOTION_EASINGS = {
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.1)',
  toast: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

export const CHIP_CLOSE_ANIMATION_MS = 350;

export function getChipCloseDelay(prefersReducedMotion: boolean): number {
  return prefersReducedMotion ? 0 : CHIP_CLOSE_ANIMATION_MS;
}

export function userPrefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
