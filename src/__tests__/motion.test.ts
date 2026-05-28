import { describe, expect, it } from 'vitest';
import {
  CHIP_CLOSE_ANIMATION_MS,
  MOTION_DURATIONS_MS,
  MOTION_EASINGS,
  getChipCloseDelay,
} from '../newtab/lib/motion';

describe('getChipCloseDelay', () => {
  it('skips the close delay when reduced motion is enabled', () => {
    expect(getChipCloseDelay(true)).toBe(0);
  });

  it('keeps the animation delay when reduced motion is disabled', () => {
    expect(getChipCloseDelay(false)).toBe(CHIP_CLOSE_ANIMATION_MS);
  });

  it('exposes semantic motion tokens for JS and CSS callers', () => {
    expect(MOTION_DURATIONS_MS).toMatchObject({
      fast: 150,
      standard: 200,
      chipExit: 250,
      enter: 300,
      toast: 400,
      banner: 500,
    });
    expect(MOTION_EASINGS.exit).toContain('cubic-bezier');
  });
});
