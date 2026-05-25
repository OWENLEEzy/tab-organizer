import { useEffect } from 'react';
import { ACCENTS, type AccentKey } from '../../config/themes';

export function useTheme(accent: AccentKey) {
  useEffect(() => {
    const config = ACCENTS[accent];
    const root = document.documentElement;

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

    // Legacy color aliases (also referenced by components)
    root.style.setProperty('--color-bg-light', config.bgPage);
    root.style.setProperty('--color-card-light', config.bgCard);
    root.style.setProperty('--color-surface-light', config.bgSurface);
    root.style.setProperty('--color-text-primary-light', config.textPrimary);
    root.style.setProperty('--color-text-secondary', config.textSecondary);
    root.style.setProperty('--color-text-muted', config.textMuted);
    root.style.setProperty('--color-border-light', config.borderColor);
    root.style.setProperty('--color-accent-amber', config.warningHex);
    root.style.setProperty('--color-accent-blue', config.accentPrimary);
  }, [accent]);
}