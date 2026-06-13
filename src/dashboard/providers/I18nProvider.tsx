import React, { createContext, useMemo } from 'react';
import { useSettingsStore } from '../../stores/settings-store';
import { createTranslator, resolveLocale, type Locale, type Translate } from '../../lib/i18n/translate';

interface I18nContextValue {
  locale: Locale;
  t: Translate;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const language = useSettingsStore((state) => state.settings.language);
  const navigatorLanguage = typeof navigator !== 'undefined' ? navigator.language : undefined;
  const locale = useMemo(() => resolveLocale(language, navigatorLanguage), [language, navigatorLanguage]);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, t: createTranslator(locale) }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

const I18nContextForHook = I18nContext;

export { I18nContextForHook };