import { useEffect } from 'react';
import { ACCENTS, isAccentKey, type AccentKey } from '../../config/themes';

export function useTheme(accent: AccentKey) {
  useEffect(() => {
    if (!isAccentKey(accent)) {
      throw new Error(`Unknown accent theme: ${String(accent)}`);
    }

    const config = ACCENTS[accent];
    const root = document.documentElement;

    // Toggle dark mode class on root for CSS media queries and native elements
    root.classList.toggle('dark', config.isDark);

    // Dynamic theme tokens
    root.style.setProperty('--bg-page', config.bgPage);
    root.style.setProperty('--bg-surface', config.bgSurface);
    root.style.setProperty('--bg-card', config.bgCard);
    root.style.setProperty('--border-color', config.borderColor);
    root.style.setProperty('--text-primary', config.textPrimary);
    root.style.setProperty('--text-secondary', config.textSecondary);
    root.style.setProperty('--text-muted', config.textMuted);
    root.style.setProperty('--accent-primary', config.accentPrimary);
    root.style.setProperty('--accent-primary-rgb', config.accentPrimaryRgb);
    root.style.setProperty('--bg-header', config.bgHeader);
    root.style.setProperty('--accent-amber', config.warningHex);
    root.style.setProperty('--accent-amber-rgb', config.warningRgb);
    root.style.setProperty('--bg-duplicate', config.bgDuplicate);
    root.style.setProperty('--border-duplicate', config.borderDuplicate);
    root.style.setProperty('--bg-stale', `rgba(${config.accentPrimaryRgb}, 0.05)`);
    root.style.setProperty('--border-stale', `rgba(${config.accentPrimaryRgb}, 0.2)`);
    root.style.setProperty('--accent-stale', config.accentPrimary);
    root.style.setProperty('--accent-stale-rgb', config.accentPrimaryRgb);
    root.style.setProperty('--bg-stale-icon', `rgba(${config.accentPrimaryRgb}, 0.1)`);
    root.style.setProperty('--shadow-card', config.shadowCard);
    root.style.setProperty('--shadow-card-hover', config.shadowCardHover);

    // Dynamic semantic red and sage colors
    root.style.setProperty('--accent-red', config.accentRed);
    root.style.setProperty('--accent-red-rgb', config.accentRedRgb);
    root.style.setProperty('--accent-sage', config.accentSage);
    root.style.setProperty('--accent-sage-rgb', config.accentSageRgb);
  }, [accent]);
}
