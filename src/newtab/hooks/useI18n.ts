import { useMemo } from 'react';
import { useSettingsStore } from '../../stores/settings-store';
import { locales } from '../../lib/i18n/locales';

export type TranslationKey = keyof typeof locales.en;

export function useI18n() {
  const settings = useSettingsStore((state) => state.settings);

  // Resolve setting language ('system' | 'en' | 'zh') to actual active locale
  const activeLang = useMemo<'en' | 'zh'>(() => {
    const pref = settings.language ?? 'system';
    if (pref === 'system') {
      const sys = typeof navigator !== 'undefined' ? navigator.language : 'en';
      return sys.startsWith('zh') ? 'zh' : 'en';
    }
    return pref;
  }, [settings.language]);

  // Translate with simple string interpolation
  const t = useMemo(() => {
    return (key: TranslationKey, params?: Record<string, string | number>): string => {
      const dict = locales[activeLang] as Record<string, string>;
      const enDict = locales.en as Record<string, string>;
      let text = dict[key] || enDict[key] || String(key);

      if (params) {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
        });
      }
      return text;
    };
  }, [activeLang]);

  // Resolve target locale for native Javascript formatting functions (like Intl.DateTimeFormat)
  const locale = useMemo(() => {
    return activeLang === 'zh' ? 'zh-CN' : 'en-US';
  }, [activeLang]);

  return { t, locale, lang: activeLang };
}
