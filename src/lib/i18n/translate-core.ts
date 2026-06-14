/**
 * Locale-free translation primitives. This module deliberately imports no string
 * dictionary, so surfaces that only need a small slice of strings (e.g. the popup)
 * can build a translator without pulling the whole app locale bundle.
 */

export type Locale = 'en' | 'zh';

/**
 * Resolve the effective locale from a user preference. `navigatorLanguage` is passed in
 * by callers (kept pure — this module never touches DOM globals directly).
 */
export function resolveLocale(
  language: 'en' | 'zh' | 'system' | undefined,
  navigatorLanguage?: string,
): Locale {
  if (language === 'en' || language === 'zh') return language;
  if (navigatorLanguage && navigatorLanguage.toLowerCase().startsWith('zh')) return 'zh';
  return 'en';
}

/** Replace `{param}` placeholders in a template. */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce<string>(
    (text, [paramKey, paramValue]) => text.replaceAll(`{${paramKey}}`, String(paramValue)),
    template,
  );
}

/** Build a translator over a provided dictionary. Falls back to the fallback dict, then the raw key. */
export function makeTranslator<K extends string>(
  dictionary: Record<string, string>,
  fallback: Record<string, string>,
): (key: K, params?: Record<string, string | number>) => string {
  return (key, params) => interpolate(dictionary[key] ?? fallback[key] ?? String(key), params);
}
