import { locales } from '../../lib/i18n/locales';
import { useI18nContext } from '../providers/I18nProvider';

export type TranslationKey = keyof typeof locales.en;

export function useI18n() {
  return useI18nContext();
}