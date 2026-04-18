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
