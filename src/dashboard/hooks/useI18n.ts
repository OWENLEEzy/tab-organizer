import { useContext } from 'react';
import { I18nContextForHook } from '../providers/I18nProvider';

export type { TranslationKey } from '../../lib/i18n/translate';

export function useI18n() {
  const value = useContext(I18nContextForHook);
  if (!value) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return value;
}