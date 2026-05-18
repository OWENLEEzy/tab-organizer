import { useCallback } from 'react';
import type { Dispatch } from 'react';
import { useTabStore } from '../../stores/tab-store';
import { duplicateTabIdsToClose } from '../../lib/duplicate-tabs';
import { isTabStale, getProductKey } from '../../lib/tab-utils';
import { clearGroupOrder } from '../../utils/storage';
import { playCloseEffects } from '../../lib/close-effects';
import { getChipCloseDelay, userPrefersReducedMotion } from '../lib/motion';
import type { TabGroup, AppSettings } from '../../types';
import type { UIAction } from './useUIState';

interface HandlerDeps {
  settings: AppSettings;
  dispatch: Dispatch<UIAction>;
  showToast: (msg: string) => void;
  flatChips: { url: string }[];
  selectedUrls: Set<string>;
  selectedTabIds: Set<number>;
  lastClickedIndex: number | null;
}

export function useTabHandlers({
  settings,
  dispatch,
  showToast,
  flatChips,
  selectedUrls,
  selectedTabIds,
  lastClickedIndex,
}: HandlerDeps) {
  const tabStore = useTabStore();

  const performBatchClose = useCallback(
    async (urls: string[], toastMessage: string) => {
      if (urls.length === 0) return;
      playCloseEffects(settings);
      await tabStore.closeTabsExact(urls);
      showToast(toastMessage);
      playCloseEffects(settings, {
        sound: false,
        confettiOrigin: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      });
    },
    [settings, tabStore, showToast],
  );

  const handleCloseProduct = useCallback(
    (p: TabGroup) => {
      dispatch({
        type: 'SET_CONFIRM_DIALOG',
        dialog: {
          id: crypto.randomUUID(),
          open: true,
          title: `Close all ${p.friendlyName || p.domain} tabs`,
          message: `This will close all ${p.tabs.length} tabs for this product.`,
          confirmLabel: 'Close all',
          onConfirm: () => {
            const urls = p.tabs.map((t) => t.url);
            performBatchClose(urls, `Closed all ${p.tabs.length} ${p.friendlyName || p.domain} tabs`);
            dispatch({ type: 'CLOSE_CONFIRM_DIALOG' });
          },
        },
      });
    },
    [dispatch, performBatchClose],
  );

  const handleCloseManualGroup = useCallback(
    (groups: TabGroup[], title: string) => {
      const urls = groups.flatMap((p) => p.tabs.map((t) => t.url));
      dispatch({
        type: 'SET_CONFIRM_DIALOG',
        dialog: {
          id: crypto.randomUUID(),
          open: true,
          title: `Close all tabs in ${title}`,
          message: `This will close all ${urls.length} tabs in this section.`,
          confirmLabel: 'Close all',
          onConfirm: () => {
            performBatchClose(urls, `Closed all ${urls.length} tabs in ${title}`);
            dispatch({ type: 'CLOSE_CONFIRM_DIALOG' });
          },
        },
      });
    },
    [dispatch, performBatchClose],
  );

  const handleCloseDuplicates = useCallback(
    (urls: string[]) => {
      dispatch({
        type: 'SET_CONFIRM_DIALOG',
        dialog: {
          id: crypto.randomUUID(),
          open: true,
          title: 'Close duplicates',
          message: `This will close all ${urls.length} duplicate tabs, keeping one of each.`,
          confirmLabel: 'Close Duplicates',
          onConfirm: () => {
            playCloseEffects(settings);
            tabStore.closeDuplicates(urls, true).then(() => {
              showToast('Duplicates closed');
            });
            dispatch({ type: 'CLOSE_CONFIRM_DIALOG' });
          },
        },
      });
    },
    [dispatch, settings, tabStore, showToast],
  );

  const handleCloseTabAnimated = useCallback(
    (url: string) => {
      const closeDelay = getChipCloseDelay(userPrefersReducedMotion());
      playCloseEffects(settings);

      if (closeDelay === 0) {
        tabStore.closeTabByUrl(url).then(() => {
          showToast('Tab closed');
        });
        return;
      }

      dispatch({ type: 'SET_CLOSING_URLS', urls: (prev) => new Set([...prev, url]) });
      setTimeout(() => {
        tabStore.closeTabByUrl(url).then(() => {
          showToast('Tab closed');
          dispatch({
            type: 'SET_CLOSING_URLS',
            urls: (prev) => {
              const next = new Set(prev);
              next.delete(url);
              return next;
            },
          });
        });
      }, closeDelay);
    },
    [dispatch, settings, tabStore, showToast],
  );

  const handleFocusTab = useCallback(
    (url: string) => {
      tabStore.focusTab(url);
    },
    [tabStore],
  );

  const handleResetSortOrder = useCallback(async () => {
    await clearGroupOrder();
    await tabStore.fetchTabs();
    showToast('Sort order reset');
    dispatch({ type: 'SET_SETTINGS_OPEN', open: false });
  }, [tabStore, showToast, dispatch]);

  const handleChipClick = useCallback(
    (url: string, event: React.MouseEvent) => {
      const chipIndex = flatChips.findIndex((c) => c.url === url);
      if (chipIndex === -1) return;

      if (event.shiftKey && lastClickedIndex !== null) {
        const start = Math.min(lastClickedIndex, chipIndex);
        const end = Math.max(lastClickedIndex, chipIndex);
        const rangeUrls = flatChips.slice(start, end + 1).map((c) => c.url);
        dispatch({
          type: 'SET_SELECTED_URLS',
          urls: (prev) => new Set([...prev, ...rangeUrls]),
        });
        dispatch({ type: 'SET_SELECTED_TAB_IDS', tabIds: new Set() });
      } else if (event.metaKey || event.ctrlKey || selectedUrls.size > 0) {
        dispatch({
          type: 'SET_SELECTED_URLS',
          urls: (prev) => {
            const next = new Set(prev);
            if (next.has(url)) {
              next.delete(url);
            } else {
              next.add(url);
            }
            return next;
          },
        });
        dispatch({ type: 'SET_SELECTED_TAB_IDS', tabIds: new Set() });
      }
      dispatch({ type: 'SET_LAST_CLICKED_INDEX', index: chipIndex });
    },
    [dispatch, flatChips, lastClickedIndex, selectedUrls],
  );

  const handleClearSelection = useCallback(() => {
    dispatch({ type: 'SET_SELECTED_URLS', urls: new Set() });
    dispatch({ type: 'SET_SELECTED_TAB_IDS', tabIds: new Set() });
    dispatch({ type: 'SET_LAST_CLICKED_INDEX', index: null });
  }, [dispatch]);

  const handleToggleExpanded = useCallback((domain: string) => {
    dispatch({
      type: 'SET_EXPANDED_DOMAINS',
      domains: (prev) => {
        const next = new Set(prev);
        if (next.has(domain)) {
          next.delete(domain);
        } else {
          next.add(domain);
        }
        return next;
      },
    });
  }, [dispatch]);

  const handleCloseSelected = useCallback(() => {
    const urls = [...selectedUrls];
    const tabIds = [...selectedTabIds];
    const count = tabIds.length > 0 ? tabIds.length : urls.length;
    
    const performClose = () => {
      playCloseEffects(settings);
      const closePromise = tabIds.length > 0
        ? tabStore.closeTabsByIds(tabIds)
        : tabStore.closeOneTabPerUrl(urls);

      closePromise.then(() => {
        showToast(`Closed ${count} tab${count !== 1 ? 's' : ''}`);
        dispatch({ type: 'SET_SELECTED_URLS', urls: new Set() });
        dispatch({ type: 'SET_SELECTED_TAB_IDS', tabIds: new Set() });
        dispatch({ type: 'SET_LAST_CLICKED_INDEX', index: null });
      });
    };

    if (count > 2) {
      dispatch({
        type: 'SET_CONFIRM_DIALOG',
        dialog: {
          id: crypto.randomUUID(),
          open: true,
          title: `Close ${count} selected tabs`,
          message: `Are you sure you want to close these ${count} tabs?`,
          confirmLabel: 'Close Selected',
          onConfirm: () => {
            performClose();
            dispatch({ type: 'CLOSE_CONFIRM_DIALOG' });
          },
        },
      });
    } else {
      performClose();
    }
  }, [dispatch, selectedTabIds, selectedUrls, settings, tabStore, showToast]);

  const handleCloseAll = useCallback(() => {
    const tabs = tabStore.tabs;
    dispatch({
      type: 'SET_CONFIRM_DIALOG',
      dialog: {
        id: crypto.randomUUID(),
        open: true,
        title: 'Close all tabs',
        message: `This will close all ${tabs.length} open tabs. This cannot be undone.`,
        confirmLabel: 'Close All',
        onConfirm: () => {
          const allUrls = tabs.map((t) => t.url);
          performBatchClose(allUrls, `Closed ${tabs.length} tabs`);
          dispatch({ type: 'CLOSE_CONFIRM_DIALOG' });
        },
      },
    });
  }, [dispatch, tabStore.tabs, performBatchClose]);

  const handleCreateGroup = useCallback(() => {
    dispatch({
      type: 'SET_PROMPT_DIALOG',
      dialog: {
        id: crypto.randomUUID(),
        open: true,
        title: 'New Section',
        label: 'Section Name',
        initialValue: 'Work',
        confirmLabel: 'Create Section',
        onConfirm: (name) => {
          tabStore.createGroup(name).then(() => {
            showToast('Group created');
          });
          dispatch({ type: 'CLOSE_PROMPT_DIALOG' });
        },
      },
    });
  }, [dispatch, tabStore, showToast]);

  const handleRenameGroup = useCallback((group: { id: string; name: string }) => {
    dispatch({
      type: 'SET_PROMPT_DIALOG',
      dialog: {
        id: crypto.randomUUID(),
        open: true,
        title: 'Rename Section',
        label: 'Section Name',
        initialValue: group.name,
        confirmLabel: 'Save Changes',
        onConfirm: (name) => {
          tabStore.renameGroup(group.id, name).then(() => {
            showToast('Group renamed');
          });
          dispatch({ type: 'CLOSE_PROMPT_DIALOG' });
        },
      },
    });
  }, [dispatch, tabStore, showToast]);

  const handleDeleteGroup = useCallback((group: { id: string; name: string }) => {
    dispatch({
      type: 'SET_CONFIRM_DIALOG',
      dialog: {
        id: crypto.randomUUID(),
        open: true,
        title: `Delete ${group.name}`,
        message: 'Items in this group will return to Unsorted. No tabs will be closed.',
        confirmLabel: 'Delete group',
        onConfirm: () => {
          tabStore.deleteGroup(group.id).then(() => {
            showToast('Group deleted');
          });
          dispatch({ type: 'CLOSE_CONFIRM_DIALOG' });
        },
      },
    });
  }, [dispatch, tabStore, showToast]);

  const handleSetViewMode = useCallback((mode: 'cards' | 'table') => {
    tabStore.setViewMode(mode).then(() => {
      showToast(mode === 'cards' ? 'Cards view' : 'Table view');
    });
  }, [tabStore, showToast]);

  const handleRefresh = useCallback(async () => {
    await tabStore.fetchTabs();
    showToast('Refreshed');
  }, [tabStore, showToast]);

  const handleMoveTableItem = useCallback((p: TabGroup, groupId: string) => {
    const productKey = getProductKey(p);
    const move = groupId
      ? tabStore.moveProductToGroup(productKey, groupId)
      : tabStore.moveProductToMain(productKey);

    move.then(() => {
      showToast(groupId ? 'Moved to group' : 'Moved to Unsorted');
    });
  }, [tabStore, showToast]);

  const handleMoveProductToMain = useCallback((productKey: string) => {
    tabStore.moveProductToMain(productKey).then(() => {
      showToast('Moved to Unsorted');
    });
  }, [tabStore, showToast]);

  const handleMoveProductToGroup = useCallback((productKey: string, groupId: string) => {
    tabStore.moveProductToGroup(productKey, groupId).then(() => {
      showToast('Moved to group');
    });
  }, [tabStore, showToast]);

  const handleSelectStaleTabs = useCallback((days = 3) => {
    const now = Date.now();
    
    const staleUrls = tabStore.tabs
      .filter((t) => isTabStale(t, now, days))
      .map((t) => t.url);

    if (staleUrls.length > 0) {
      dispatch({
        type: 'SET_SELECTED_URLS',
        urls: new Set(staleUrls),
      });
      dispatch({ type: 'SET_SELECTED_TAB_IDS', tabIds: new Set() });
      showToast(`Selected ${staleUrls.length} stale tab${staleUrls.length !== 1 ? 's' : ''}. Press close to clear.`);
    } else {
      showToast("No stale tabs found 🧹");
    }
  }, [tabStore, dispatch, showToast]);

  const handleSelectDuplicateTabs = useCallback(() => {
    const duplicateTabIds = duplicateTabIdsToClose(tabStore.tabs);

    if (duplicateTabIds.length > 0) {
      dispatch({
        type: 'SET_SELECTED_URLS',
        urls: new Set(),
      });
      dispatch({
        type: 'SET_SELECTED_TAB_IDS',
        tabIds: new Set(duplicateTabIds),
      });
      showToast(`Selected ${duplicateTabIds.length} duplicate tab${duplicateTabIds.length !== 1 ? 's' : ''}. Press close to clear.`);
    } else {
      showToast("No duplicate tabs found 🧹");
    }
  }, [tabStore, dispatch, showToast]);

  return {
    handleCloseProduct,
    handleCloseManualGroup,
    handleCloseDuplicates,
    handleCloseTabAnimated,
    handleFocusTab,
    handleResetSortOrder,
    handleChipClick,
    handleClearSelection,
    handleToggleExpanded,
    handleCloseSelected,
    handleCloseAll,
    handleCreateGroup,
    handleRenameGroup,
    handleDeleteGroup,
    handleSetViewMode,
    handleRefresh,
    handleMoveTableItem,
    handleMoveProductToMain,
    handleMoveProductToGroup,
    handleSelectStaleTabs,
    handleSelectDuplicateTabs,
  };
}
