export const ACCENT_KEYS = ['clay', 'sage', 'frost', 'ochre', 'lavender', 'rosewood', 'seagrass', 'obsidian', 'pine', 'amethyst', 'ember'] as const;

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
    accentPrimary: '#A8522E',
    accentPrimaryRgb: '168, 82, 46',
    bgHeader: 'rgba(250, 247, 242, 0.95)',
    warningHex: '#7A5A0D',
    warningRgb: '122, 90, 13',
    bgDuplicate: 'rgba(197, 133, 20, 0.08)',
    borderDuplicate: 'rgba(197, 133, 20, 0.25)',
    shadowCard: '0 4px 12px rgba(51, 42, 36, 0.04), 0 1px 3px rgba(51, 42, 36, 0.02)',
    shadowCardHover: '0 10px 24px rgba(51, 42, 36, 0.08), 0 3px 8px rgba(51, 42, 36, 0.04)',
    accentRed: '#C2473D',
    accentRedRgb: '194, 71, 61',
    accentSage: '#6A9977',
    accentSageRgb: '106, 153, 119'
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
    accentRed: '#B34F4F',
    accentRedRgb: '179, 79, 79',
    accentSage: '#4A8A6A',
    accentSageRgb: '74, 138, 106'
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
    accentRed: '#C73E5B',
    accentRedRgb: '199, 62, 91',
    accentSage: '#4B9B8E',
    accentSageRgb: '75, 155, 142'
  },
  ochre: {
    label: 'Chalk Ochre (白垩赭石)',
    isDark: false,
    color: '#8A6513',
    bgPage: '#FAF6EE',
    bgSurface: '#F1ECD8',
    bgCard: '#FFFCF5',
    borderColor: '#DCCCAE',
    textPrimary: '#3A301A',
    textSecondary: '#756441',
    textMuted: '#AFA184',
    accentPrimary: '#8A6513',
    accentPrimaryRgb: '138, 101, 19',
    bgHeader: 'rgba(250, 246, 238, 0.95)',
    warningHex: '#8E6D0D',
    warningRgb: '142, 109, 13',
    bgDuplicate: 'rgba(193, 155, 26, 0.08)',
    borderDuplicate: 'rgba(193, 155, 26, 0.25)',
    shadowCard: '0 4px 12px rgba(58, 48, 26, 0.04), 0 1px 3px rgba(58, 48, 26, 0.02)',
    shadowCardHover: '0 10px 24px rgba(58, 48, 26, 0.08), 0 3px 8px rgba(58, 48, 26, 0.04)',
    accentRed: '#BC4B33',
    accentRedRgb: '188, 75, 51',
    accentSage: '#739158',
    accentSageRgb: '115, 145, 88'
  },
  lavender: {
    label: 'Lavender Haze (薰衣草紫)',
    isDark: false,
    color: '#7B6880',
    bgPage: '#F7F5F8',
    bgSurface: '#EBE8EF',
    bgCard: '#FBFAFE',
    borderColor: '#D4CEE0',
    textPrimary: '#383040',
    textSecondary: '#6A6070',
    textMuted: '#9B93A8',
    accentPrimary: '#7B6880',
    accentPrimaryRgb: '123, 104, 128',
    bgHeader: 'rgba(247, 245, 248, 0.95)',
    warningHex: '#8B6914',
    warningRgb: '139, 105, 20',
    bgDuplicate: 'rgba(178, 141, 52, 0.08)',
    borderDuplicate: 'rgba(178, 141, 52, 0.25)',
    shadowCard: '0 4px 12px rgba(56, 48, 64, 0.04), 0 1px 3px rgba(56, 48, 64, 0.02)',
    shadowCardHover: '0 10px 24px rgba(56, 48, 64, 0.08), 0 3px 8px rgba(56, 48, 64, 0.04)',
    accentRed: '#B3476E',
    accentRedRgb: '179, 71, 110',
    accentSage: '#688C94',
    accentSageRgb: '104, 140, 148'
  },
  rosewood: {
    label: 'Rosewood Blush (玫瑰木粉)',
    isDark: false,
    color: '#A0676B',
    bgPage: '#FAF5F5',
    bgSurface: '#F0EAEA',
    bgCard: '#FFFAFA',
    borderColor: '#DDD4D4',
    textPrimary: '#3D2C2E',
    textSecondary: '#7A6466',
    textMuted: '#B09698',
    accentPrimary: '#965D61',
    accentPrimaryRgb: '150, 93, 97',
    bgHeader: 'rgba(250, 245, 245, 0.95)',
    warningHex: '#8A5A12',
    warningRgb: '138, 90, 18',
    bgDuplicate: 'rgba(184, 138, 46, 0.08)',
    borderDuplicate: 'rgba(184, 138, 46, 0.25)',
    shadowCard: '0 4px 12px rgba(61, 44, 46, 0.04), 0 1px 3px rgba(61, 44, 46, 0.02)',
    shadowCardHover: '0 10px 24px rgba(61, 44, 46, 0.08), 0 3px 8px rgba(61, 44, 46, 0.04)',
    accentRed: '#B84B52',
    accentRedRgb: '184, 75, 82',
    accentSage: '#738C71',
    accentSageRgb: '115, 140, 113'
  },
  seagrass: {
    label: 'Sea Glass (海草青)',
    isDark: false,
    color: '#5B8A7E',
    bgPage: '#F4F7F6',
    bgSurface: '#E6EDEB',
    bgCard: '#F8FCFB',
    borderColor: '#C4D4CE',
    textPrimary: '#2C3834',
    textSecondary: '#5F706A',
    textMuted: '#98ADA6',
    accentPrimary: '#4B7A6E',
    accentPrimaryRgb: '75, 122, 110',
    bgHeader: 'rgba(244, 247, 246, 0.95)',
    warningHex: '#8A6A10',
    warningRgb: '138, 106, 16',
    bgDuplicate: 'rgba(179, 141, 42, 0.08)',
    borderDuplicate: 'rgba(179, 141, 42, 0.25)',
    shadowCard: '0 4px 12px rgba(44, 56, 52, 0.04), 0 1px 3px rgba(44, 56, 52, 0.02)',
    shadowCardHover: '0 10px 24px rgba(44, 56, 52, 0.08), 0 3px 8px rgba(44, 56, 52, 0.04)',
    accentRed: '#B34F59',
    accentRedRgb: '179, 79, 89',
    accentSage: '#479482',
    accentSageRgb: '71, 148, 130'
  },
  obsidian: {
    label: 'Obsidian Ink (黑曜石墨)',
    isDark: true,
    color: '#282828',
    bgPage: '#141312',
    bgSurface: '#1C1A19',
    bgCard: '#242120',
    borderColor: '#3D3633',
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
    shadowCard: 'inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 4px 12px rgba(0, 0, 0, 0.4)',
    shadowCardHover: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 10px 24px rgba(0, 0, 0, 0.6)',
    accentRed: '#D15C49',
    accentRedRgb: '209, 92, 73',
    accentSage: '#6C9C7B',
    accentSageRgb: '108, 156, 123'
  },
  pine: {
    label: 'Deep Pine (暗针长青)',
    isDark: true,
    color: '#151B1B',
    bgPage: '#111413',
    bgSurface: '#181C1B',
    bgCard: '#1F2523',
    borderColor: '#323D3A',
    textPrimary: '#e6edea',
    textSecondary: '#9db0a9',
    textMuted: '#748a82',
    accentPrimary: '#56A3A1',
    accentPrimaryRgb: '86, 163, 161',
    bgHeader: 'rgba(18, 17, 16, 0.95)',
    warningHex: '#D4B85E',
    warningRgb: '212, 184, 94',
    bgDuplicate: 'rgba(212, 184, 94, 0.12)',
    borderDuplicate: 'rgba(212, 184, 94, 0.3)',
    shadowCard: 'inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 4px 12px rgba(0, 0, 0, 0.4)',
    shadowCardHover: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 10px 24px rgba(0, 0, 0, 0.6)',
    accentRed: '#D65C62',
    accentRedRgb: '214, 92, 98',
    accentSage: '#52A38A',
    accentSageRgb: '82, 163, 138'
  },
  amethyst: {
    label: 'Amethyst Night (紫曜晚霞)',
    isDark: true,
    color: '#1B1520',
    bgPage: '#151318',
    bgSurface: '#1D1A22',
    bgCard: '#241F29',
    borderColor: '#3B3142',
    textPrimary: '#e8e4ed',
    textSecondary: '#afa6b8',
    textMuted: '#82798c',
    accentPrimary: '#A887CE',
    accentPrimaryRgb: '168, 135, 206',
    bgHeader: 'rgba(18, 17, 16, 0.95)',
    warningHex: '#E0BD5D',
    warningRgb: '224, 189, 93',
    bgDuplicate: 'rgba(224, 189, 93, 0.12)',
    borderDuplicate: 'rgba(224, 189, 93, 0.3)',
    shadowCard: 'inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 4px 12px rgba(0, 0, 0, 0.4)',
    shadowCardHover: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 10px 24px rgba(0, 0, 0, 0.6)',
    accentRed: '#C95A7A',
    accentRedRgb: '201, 90, 122',
    accentSage: '#6A94A8',
    accentSageRgb: '106, 148, 168'
  },
  ember: {
    label: 'Roast Ember (焦糖暗火)',
    isDark: true,
    color: '#C47257',
    bgPage: '#1A1614',
    bgSurface: '#241E1C',
    bgCard: '#2D2523',
    borderColor: '#423835',
    textPrimary: '#E8DFD8',
    textSecondary: '#B0A198',
    textMuted: '#85756C',
    accentPrimary: '#C47257',
    accentPrimaryRgb: '196, 114, 87',
    bgHeader: 'rgba(26, 22, 20, 0.95)',
    warningHex: '#CE965F',
    warningRgb: '206, 150, 95',
    bgDuplicate: 'rgba(206, 150, 95, 0.12)',
    borderDuplicate: 'rgba(206, 150, 95, 0.3)',
    shadowCard: 'inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 4px 12px rgba(0, 0, 0, 0.4)',
    shadowCardHover: 'inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 10px 24px rgba(0, 0, 0, 0.6)',
    accentRed: '#D95A4C',
    accentRedRgb: '217, 90, 76',
    accentSage: '#789975',
    accentSageRgb: '120, 153, 117'
  }
};

export const ACCENT_OPTIONS: { key: AccentKey; labelKey: AccentLabelKey }[] = ACCENT_KEYS.map((key) => ({
  key,
  labelKey: `theme${key[0].toUpperCase()}${key.slice(1)}` as AccentLabelKey,
}));

export function isAccentKey(value: unknown): value is AccentKey {
  return typeof value === 'string' && Object.hasOwn(ACCENTS, value);
}
