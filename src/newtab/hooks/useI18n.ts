import { useContext } from 'react';
import { locales } from '../../lib/i18n/locales';
import { I18nContextForHook } from '../providers/I18nProvider';

export type TranslationKey = keyof typeof locales.en;

export function useI18n() {
  const value = useContext(I18nContextForHook);
  if (!value) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return value;
}