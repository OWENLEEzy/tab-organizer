import type { Tab } from '../types';

/**
 * Determines if a tab is considered stale (idle for more than a threshold).
 * Active, pinned, and audible tabs are never considered stale.
 */
export function isTabStale(tab: Tab, now: number, thresholdDays = 3): boolean {
  if (tab.active || tab.pinned || tab.audible) return false;
  const msThreshold = thresholdDays * 24 * 60 * 60 * 1000;
  const lastAccess = tab.lastAccessed ?? now;
  return now - lastAccess > msThreshold;
}