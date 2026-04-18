import { describe, expect, it } from 'vitest';
import { CHIP_CLOSE_ANIMATION_MS, getChipCloseDelay } from '../newtab/lib/motion';

describe('getChipCloseDelay', () => {
  it('skips the close delay when reduced motion is enabled', () => {
    expect(getChipCloseDelay(true)).toBe(0);
  });

  it('keeps the animation delay when reduced motion is disabled', () => {
    expect(getChipCloseDelay(false)).toBe(CHIP_CLOSE_ANIMATION_MS);
  });
});
