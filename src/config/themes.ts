export const ACCENT_KEYS = ['clay', 'sage', 'frost', 'ochre', 'obsidian', 'pine', 'amethyst'] as const;

export type AccentKey = typeof ACCENT_KEYS[number];
export type AccentLabelKey = `theme${Capitalize<AccentKey>}`;

export const DEFAULT_ACCENT: AccentKey = 'clay';

export interface AccentConfig {
  label: string;
  isDark: boolean;
  color: string;
  bgPage: string;
  bgSurface: string;
  bgCard: string;
  borderColor: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentPrimary: string;
  accentPrimaryRgb: string;
  bgHeader: string;
  warningHex: string;
  warningRgb: string;
  bgDuplicate: string;
  borderDuplicate: string;
  shadowCard: string;
  shadowCardHover: string;
  accentRed: string;
  accentRedRgb: string;
  accentSage: string;
  accentSageRgb: string;
}

export const ACCENTS: Record<AccentKey, AccentConfig> = {
  clay: {
    label: 'Clay Paper (暖沙陶土)',
    isDark: false,
    color: '#B25C38',
    bgPage: '#FAF7F2',
    bgSurface: '#F1EDE4',
    bgCard: '#FFFCF7',
    borderColor: '#DCD3C7',
    textPrimary: '#332A24',
    textSecondary: '#7C6C60',
    textMuted: '#B5A596',
    accentPrimary: '#B25C38',
    accentPrimaryRgb: '178, 92, 56',
    bgHeader: 'rgba(250, 247, 242, 0.95)',
    warningHex: '#7A5A0D',
    warningRgb: '122, 90, 13',
    bgDuplicate: 'rgba(197, 133, 20, 0.08)',
    borderDuplicate: 'rgba(197, 133, 20, 0.25)',
    shadowCard: '0 4px 12px rgba(51, 42, 36, 0.04), 0 1px 3px rgba(51, 42, 36, 0.02)',
    shadowCardHover: '0 10px 24px rgba(51, 42, 36, 0.08), 0 3px 8px rgba(51, 42, 36, 0.04)',
    accentRed: '#c94a4a',
    accentRedRgb: '201, 74, 74',
    accentSage: '#5e806b',
    accentSageRgb: '94, 128, 107'
  },
  sage: {
    label: 'Sage Herb (草本鼠尾草)',
    isDark: false,
    color: '#4C725B',
    bgPage: '#F5F7F4',
    bgSurface: '#EAEDE7',
    bgCard: '#FAFCF9',
    borderColor: '#CCD2C6',
    textPrimary: '#262E28',
    textSecondary: '#5F6D62',
    textMuted: '#9CAAA0',
    accentPrimary: '#4C725B',
    accentPrimaryRgb: '76, 114, 91',
    bgHeader: 'rgba(245, 247, 244, 0.95)',
    warningHex: '#8A6715',
    warningRgb: '138, 103, 21',
    bgDuplicate: 'rgba(181, 142, 42, 0.08)',
    borderDuplicate: 'rgba(181, 142, 42, 0.25)',
    shadowCard: '0 4px 12px rgba(38, 46, 40, 0.04), 0 1px 3px rgba(38, 46, 40, 0.02)',
    shadowCardHover: '0 10px 24px rgba(38, 46, 40, 0.08), 0 3px 8px rgba(38, 46, 40, 0.04)',
    accentRed: '#c94a4a',
    accentRedRgb: '201, 74, 74',
    accentSage: '#5e806b',
    accentSageRgb: '94, 128, 107'
  },
  frost: {
    label: 'Ice Frost (冰川冷蓝)',
    isDark: false,
    color: '#2F65D6',
    bgPage: '#F3F6FA',
    bgSurface: '#E6EDF5',
    bgCard: '#FAFCFF',
    borderColor: '#CCD7E5',
    textPrimary: '#232B38',
    textSecondary: '#5B687C',
    textMuted: '#93A5BE',
    accentPrimary: '#2F65D6',
    accentPrimaryRgb: '47, 101, 214',
    bgHeader: 'rgba(243, 246, 250, 0.95)',
    warningHex: '#946114',
    warningRgb: '148, 97, 20',
    bgDuplicate: 'rgba(192, 129, 33, 0.08)',
    borderDuplicate: 'rgba(192, 129, 33, 0.25)',
    shadowCard: '0 4px 12px rgba(35, 43, 56, 0.04), 0 1px 3px rgba(35, 43, 56, 0.02)',
    shadowCardHover: '0 10px 24px rgba(35, 43, 56, 0.08), 0 3px 8px rgba(35, 43, 56, 0.04)',
    accentRed: '#c94a4a',
    accentRedRgb: '201, 74, 74',
    accentSage: '#5e806b',
    accentSageRgb: '94, 128, 107'
  },
  ochre: {
    label: 'Chalk Ochre (白垩赭石)',
    isDark: false,
    color: '#A0781A',
    bgPage: '#FAF6EE',
    bgSurface: '#F1ECD8',
    bgCard: '#FFFCF5',
    borderColor: '#DCCCAE',
    textPrimary: '#3A301A',
    textSecondary: '#756441',
    textMuted: '#AFA184',
    accentPrimary: '#A0781A',
    accentPrimaryRgb: '160, 120, 26',
    bgHeader: 'rgba(250, 246, 238, 0.95)',
    warningHex: '#8E6D0D',
    warningRgb: '142, 109, 13',
    bgDuplicate: 'rgba(193, 155, 26, 0.08)',
    borderDuplicate: 'rgba(193, 155, 26, 0.25)',
    shadowCard: '0 4px 12px rgba(58, 48, 26, 0.04), 0 1px 3px rgba(58, 48, 26, 0.02)',
    shadowCardHover: '0 10px 24px rgba(58, 48, 26, 0.08), 0 3px 8px rgba(58, 48, 26, 0.04)',
    accentRed: '#c94a4a',
    accentRedRgb: '201, 74, 74',
    accentSage: '#5e806b',
    accentSageRgb: '94, 128, 107'
  },
  obsidian: {
    label: 'Obsidian Ink (黑曜石墨)',
    isDark: true,
    color: '#282828',
    bgPage: '#121110',
    bgSurface: '#1b1918',
    bgCard: '#22201f',
    borderColor: '#3d3734',
    textPrimary: '#e6e1dc',
    textSecondary: '#b0a8a4',
    textMuted: '#7d7571',
    accentPrimary: '#A3A19E',
    accentPrimaryRgb: '163, 161, 158',
    bgHeader: 'rgba(18, 17, 16, 0.95)',
    warningHex: '#CEAC74',
    warningRgb: '206, 172, 116',
    bgDuplicate: 'rgba(206, 172, 116, 0.12)',
    borderDuplicate: 'rgba(206, 172, 116, 0.3)',
    shadowCard: '0 4px 12px rgba(0, 0, 0, 0.4)',
    shadowCardHover: '0 10px 24px rgba(0, 0, 0, 0.6)',
    accentRed: '#e76f51',
    accentRedRgb: '231, 111, 81',
    accentSage: '#81b29a',
    accentSageRgb: '129, 178, 154'
  },
  pine: {
    label: 'Deep Pine (暗针长青)',
    isDark: true,
    color: '#151B1B',
    bgPage: '#121110',
    bgSurface: '#1b1918',
    bgCard: '#22201f',
    borderColor: '#3d3734',
    textPrimary: '#e6e1dc',
    textSecondary: '#b0a8a4',
    textMuted: '#7d7571',
    accentPrimary: '#56A3A1',
    accentPrimaryRgb: '86, 163, 161',
    bgHeader: 'rgba(18, 17, 16, 0.95)',
    warningHex: '#D4B85E',
    warningRgb: '212, 184, 94',
    bgDuplicate: 'rgba(212, 184, 94, 0.12)',
    borderDuplicate: 'rgba(212, 184, 94, 0.3)',
    shadowCard: '0 4px 12px rgba(0, 0, 0, 0.4)',
    shadowCardHover: '0 10px 24px rgba(0, 0, 0, 0.6)',
    accentRed: '#e76f51',
    accentRedRgb: '231, 111, 81',
    accentSage: '#81b29a',
    accentSageRgb: '129, 178, 154'
  },
  amethyst: {
    label: 'Amethyst Night (紫曜晚霞)',
    isDark: true,
    color: '#1B1520',
    bgPage: '#121110',
    bgSurface: '#1b1918',
    bgCard: '#22201f',
    borderColor: '#3d3734',
    textPrimary: '#e6e1dc',
    textSecondary: '#b0a8a4',
    textMuted: '#7d7571',
    accentPrimary: '#A887CE',
    accentPrimaryRgb: '168, 135, 206',
    bgHeader: 'rgba(18, 17, 16, 0.95)',
    warningHex: '#E0BD5D',
    warningRgb: '224, 189, 93',
    bgDuplicate: 'rgba(224, 189, 93, 0.12)',
    borderDuplicate: 'rgba(224, 189, 93, 0.3)',
    shadowCard: '0 4px 12px rgba(0, 0, 0, 0.4)',
    shadowCardHover: '0 10px 24px rgba(0, 0, 0, 0.6)',
    accentRed: '#e76f51',
    accentRedRgb: '231, 111, 81',
    accentSage: '#81b29a',
    accentSageRgb: '129, 178, 154'
  }
};

export const ACCENT_OPTIONS: { key: AccentKey; labelKey: AccentLabelKey }[] = ACCENT_KEYS.map((key) => ({
  key,
  labelKey: `theme${key[0].toUpperCase()}${key.slice(1)}` as AccentLabelKey,
}));

export function isAccentKey(value: unknown): value is AccentKey {
  return typeof value === 'string' && Object.hasOwn(ACCENTS, value);
}
