import { buildRecoverySnapshot } from '../lib/recovery-snapshots';
import { promoteRecoverySnapshot } from './storage';
import { chromeTabToAppTab } from './tab-mapping';

/**
 * Capture a recovery snapshot of the current tabs BEFORE closing any of them, so
 * every closed tab (including organize's duplicate cleanup) can be restored.
 *
 * Shared by the dashboard store and the toolbar popup — the popup previously
 * closed tabs with no such protection, which is exactly the divergence this fixes.
 */
export async function protectRecoveryBeforeClosing(
  chromeTabs: chrome.tabs.Tab[],
): Promise<void> {
  try {
    const snapshot = buildRecoverySnapshot(chromeTabs.map(chromeTabToAppTab));
    await promoteRecoverySnapshot(snapshot);
  } catch (err: unknown) {
    console.warn('[Tab Organizer] Failed to protect recovery before closing tabs:', err);
  }
}
