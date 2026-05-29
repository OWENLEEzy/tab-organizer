import React, { createContext, useMemo } from 'react';
import { useSettingsStore } from '../../stores/settings-store';
import { locales } from '../../lib/i18n/locales';
import type { TranslationKey } from '../hooks/useI18n';

interface I18nContextValue {
  locale: 'en' | 'zh';
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveLocale(language: 'en' | 'zh' | 'system' | undefined): 'en' | 'zh' {
  if (language === 'en' || language === 'zh') return language;
  if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh')) return 'zh';
  return 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const language = useSettingsStore((state) => state.settings.language);
  const locale = useMemo(() => resolveLocale(language), [language]);

  const value = useMemo<I18nContextValue>(() => {
    const dictionary = locales[locale] as Record<string, string>;
    return {
      locale,
      t: (key, params) => {
        const template = dictionary[key] ?? locales.en[key] ?? String(key);
        if (!params) return template;
        return Object.entries(params).reduce<string>(
          (text, [paramKey, paramValue]) => text.replaceAll(`{${paramKey}}`, String(paramValue)),
          template,
        );
      },
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

const I18nContextForHook = I18nContext;

export { I18nContextForHook };