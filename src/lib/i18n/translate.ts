import { locales } from './locales';
import { makeTranslator, type Locale } from './translate-core';

export { resolveLocale } from './translate-core';
export type { Locale } from './translate-core';

export type TranslationKey = keyof typeof locales.en;
export type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string;

/** Build a translator bound to a locale over the full app dictionary. */
export function createTranslator(locale: Locale): Translate {
  return makeTranslator<TranslationKey>(locales[locale] as Record<string, string>, locales.en);
}
