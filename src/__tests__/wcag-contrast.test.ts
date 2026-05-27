import { describe, expect, it } from 'vitest';
import { ACCENTS } from '../config/themes';

/**
 * Calculate the relative luminance of a color.
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function getLuminance(hex: string): number {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  const rgb = parseInt(hex, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calculate the contrast ratio between two colors.
 * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
function getContrast(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (lightest + 0.05) / (darkest + 0.05);
}

describe('WCAG Color Contrast Governance', () => {
  const themes = Object.values(ACCENTS);

  describe.each(themes)('Theme: $label', (theme) => {
    it('textPrimary meets WCAG AA (4.5:1) against bgPage', () => {
      const contrast = getContrast(theme.textPrimary, theme.bgPage);
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    it('textSecondary meets WCAG AA Large Text (3.0:1) against bgPage', () => {
      // Secondary text is often used for less critical UI or larger elements.
      // We enforce at least 3.0:1 (WCAG AA for large text / UI components).
      const contrast = getContrast(theme.textSecondary, theme.bgPage);
      expect(contrast).toBeGreaterThanOrEqual(3.0);
    });

    it('accentPrimary meets WCAG AA (4.5:1) against bgPage', () => {
      const contrast = getContrast(theme.accentPrimary, theme.bgPage);
      // To ensure icons and highlighted text are fully readable.
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });
    
    it('accentRed meets WCAG AA (4.5:1) against bgPage', () => {
      const contrast = getContrast(theme.accentRed, theme.bgPage);
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    it('accentSage meets WCAG AA Large Text (3.0:1) against bgPage', () => {
      // Sage is often used as a subtle success indicator, we enforce at least 3.0:1
      const contrast = getContrast(theme.accentSage, theme.bgPage);
      expect(contrast).toBeGreaterThanOrEqual(3.0);
    });
  });
});
