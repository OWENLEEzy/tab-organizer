import type { Tab } from '../../../types';
import { getGroupFaviconSource } from '../../../lib/group-favicon';
import { getFaviconUrl } from '../../../utils/favicon';

export function getTabGroupIconUrl(tabs: readonly Tab[]): string {
  const source = getGroupFaviconSource(tabs);
  if (!source) return '';

  const isChromeProvidedFavicon = tabs.some(
    (tab) => tab.favIconUrl.trim() !== '' && tab.favIconUrl.trim() === source,
  );

  return isChromeProvidedFavicon ? source : getFaviconUrl(source);
}
