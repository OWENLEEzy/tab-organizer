import { buildRecoverySnapshot } from '../lib/recovery-snapshots';
import { promoteRecoverySnapshot, readSettings } from './storage';
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
    const { customGroups, productLabels } = await readSettings();
    const snapshot = buildRecoverySnapshot(chromeTabs.map(chromeTabToAppTab), undefined, { customGroups, productLabels });
    await promoteRecoverySnapshot(snapshot);
  } catch (err: unknown) {
    console.warn('[Tab Organizer] Failed to protect recovery before closing tabs:', err);
  }
}
