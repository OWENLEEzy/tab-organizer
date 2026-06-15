/**
 * Popup-local string dictionary. The popup is a separate, lightweight surface; it
 * carries only the ~15 strings it renders instead of importing the full app locale
 * bundle. Keep these values in sync with the matching keys in
 * `src/lib/i18n/locales.ts` — `popup-i18n.test.ts` enforces parity.
 */

import { makeTranslator, type Locale } from '../lib/i18n/translate-core';

export const POPUP_STRINGS = {
  en: {
    popupLoading: 'Loading…',
    popupWindowCount: '{count} windows',
    metricTabs: 'tabs',
    metricGroups: 'groups',
    metricDuplicates: 'duplicates',
    popupUnassigned: 'Unassigned',
    popupUnassignedCount: '{count} groups',
    popupDuplicateWarning: '{count} duplicate tabs found',
    popupOrganize: 'Organize',
    popupOrganizing: 'Organizing…',
    popupOrganized: 'Organized',
    popupOrganizeDone: 'Organized',
    popupOrganizeError: 'Organize failed, please retry',
    popupOrganizePartial: 'Partly organized — open the dashboard for details',
    popupConfirmLead: 'Organize will:',
    popupConfirmSort: 'Sort & group tabs by section',
    popupConfirmAssign: 'Groups to assign: {count}',
    popupConfirmDedupe: 'Duplicates to close: {count}',
    popupConfirm: 'Confirm',
    popupCancel: 'Cancel',
    popupRetry: 'Retry',
    popupOpenDashboard: 'Open dashboard',
  },
  zh: {
    popupLoading: '加载中…',
    popupWindowCount: '{count} 个窗口',
    metricTabs: '页面',
    metricGroups: '区域',
    metricDuplicates: '重复项',
    popupUnassigned: '未分配',
    popupUnassignedCount: '{count} 个区域',
    popupDuplicateWarning: '检测到 {count} 个重复页面',
    popupOrganize: '一键整理',
    popupOrganizing: '整理中…',
    popupOrganized: '已整理',
    popupOrganizeDone: '整理完成',
    popupOrganizeError: '整理失败，请重试',
    popupOrganizePartial: '部分整理完成 — 详情请打开管理界面',
    popupConfirmLead: '整理将：',
    popupConfirmSort: '按分区排序并建组',
    popupConfirmAssign: '待归类区域：{count}',
    popupConfirmDedupe: '待关闭重复：{count}',
    popupConfirm: '确认整理',
    popupCancel: '取消',
    popupRetry: '重试',
    popupOpenDashboard: '打开管理界面',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type PopupStringKey = keyof typeof POPUP_STRINGS.en;
export type PopupTranslate = (key: PopupStringKey, params?: Record<string, string | number>) => string;

export function createPopupTranslator(locale: Locale): PopupTranslate {
  return makeTranslator<PopupStringKey>(POPUP_STRINGS[locale], POPUP_STRINGS.en);
}
