import { useCallback } from 'react';
import type { Dispatch } from 'react';
import { useTabStore } from '../../stores/tab-store';
import { duplicateTabIdsToClose } from '../../lib/duplicate-tabs';
import { isTabStale } from '../../lib/staleness';
import { getProductKey } from '../../lib/product-key';
import { clearGroupOrder } from '../../utils/storage';
import { playCloseEffects } from '../../lib/close-effects';
import { getChipCloseDelay, userPrefersReducedMotion } from '../lib/motion';
import type { TabGroup, AppSettings } from '../../types';
import type { UIAction } from '../hooks/useUIState';
import type { TranslationKey } from '../hooks/useI18n';

interface HandlerDeps {
  settings: AppSettings;
  dispatch: Dispatch<UIAction>;
  showToast: (msg: string) => void;
  flatChips: { url: string }[];
  visibleProducts: TabGroup[];
  sectionOrderedProducts: TabGroup[];
  selectedUrls: Set<string>;
  selectedTabIds: Set<number>;
  lastClickedIndex: number | null;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export function duplicateTabIdsForProducts(products: readonly TabGroup[]): number[] {
  return duplicateTabIdsToClose(products.flatMap((product) => product.tabs));
}

export function staleTabUrlsForProducts(
  products: readonly TabGroup[],
  days: number,
  now = Date.now(),
): string[] {
  return products
    .flatMap((product) => product.tabs)
    .filter((tab) => isTabStale(tab, now, days))
    .map((tab) => tab.url);
}

export function useTabActions({
  settings,
  dispatch,
  showToast,
  flatChips,
  visibleProducts,
  sectionOrderedProducts,
  selectedUrls,
  selectedTabIds,
  lastClickedIndex,
  t,
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
      const name = p.friendlyName || p.domain;
      dispatch({
        type: 'SET_CONFIRM_DIALOG',
        dialog: {
          id: crypto.randomUUID(),
          open: true,
          title: t('confirmCloseProductTitle', { name }),
          message: t('confirmCloseProductMsg', { count: p.tabs.length }),
          confirmLabel: t('confirmCloseProductBtn'),
          onConfirm: () => {
            const urls = p.tabs.map((tab) => tab.url);
            performBatchClose(urls, t('toastClosedProductTabs', { count: p.tabs.length, name }));
            dispatch({ type: 'CLOSE_CONFIRM_DIALOG' });
          },
        },
      });
    },
    [dispatch, performBatchClose, t],
  );

  const handleCloseSection = useCallback(
    (groups: TabGroup[], title: string) => {
      const urls = groups.flatMap((p) => p.tabs.map((tab) => tab.url));
      dispatch({
        type: 'SET_CONFIRM_DIALOG',
        dialog: {
          id: crypto.randomUUID(),
          open: true,
          title: t('confirmCloseSectionTitle', { title }),
          message: t('confirmCloseSectionMsg', { count: urls.length }),
          confirmLabel: t('confirmCloseSectionBtn'),
          onConfirm: () => {
            performBatchClose(urls, t('toastClosedSectionTabs', { count: urls.length, title }));
            dispatch({ type: 'CLOSE_CONFIRM_DIALOG' });
          },
        },
      });
    },
    [dispatch, performBatchClose, t],
  );

  const handleCloseDuplicates = useCallback(
    (urls: string[]) => {
      dispatch({
        type: 'SET_CONFIRM_DIALOG',
        dialog: {
          id: crypto.randomUUID(),
          open: true,
          title: t('confirmCloseDupesTitle'),
          message: t('confirmCloseDupesMsg', { count: urls.length }),
          confirmLabel: t('confirmCloseDupesBtn'),
          onConfirm: () => {
            playCloseEffects(settings);
            tabStore.closeDuplicates(urls, true).then(() => {
              showToast(t('toastDuplicatesClosed'));
            });
            dispatch({ type: 'CLOSE_CONFIRM_DIALOG' });
          },
        },
      });
    },
    [dispatch, settings, tabStore, showToast, t],
  );

  const handleCloseTabAnimated = useCallback(
    (url: string) => {
      const closeDelay = getChipCloseDelay(userPrefersReducedMotion());
      playCloseEffects(settings);

      if (closeDelay === 0) {
        tabStore.closeTabByUrl(url).then(() => {
          showToast(t('toastTabClosed'));
        });
        return;
      }

      dispatch({ type: 'SET_CLOSING_URLS', urls: (prev) => new Set([...prev, url]) });
      setTimeout(() => {
        tabStore.closeTabByUrl(url).then(() => {
          showToast(t('toastTabClosed'));
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
    [dispatch, settings, tabStore, showToast, t],
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
    showToast(t('toastSortOrderReset'));
    dispatch({ type: 'SET_SETTINGS_OPEN', open: false });
  }, [tabStore, showToast, dispatch, t]);

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
      type: 'SET_EXPANDED_PRODUCT_GROUPS',
      productGroups: (prev) => {
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
        showToast(count === 1 ? t('toastClosedSelectedSingle') : t('toastClosedSelectedPlural', { count }));
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
          title: t('confirmCloseSelectedTitle', { count }),
          message: t('confirmCloseSelectedMsg', { count }),
          confirmLabel: t('confirmCloseSelectedBtn'),
          onConfirm: () => {
            performClose();
            dispatch({ type: 'CLOSE_CONFIRM_DIALOG' });
          },
        },
      });
    } else {
      performClose();
    }
  }, [dispatch, selectedTabIds, selectedUrls, settings, tabStore, showToast, t]);

  const handleCloseAll = useCallback(() => {
    const tabs = tabStore.tabs;
    dispatch({
      type: 'SET_CONFIRM_DIALOG',
      dialog: {
        id: crypto.randomUUID(),
        open: true,
        title: t('confirmCloseAllTitle'),
        message: t('confirmCloseAllMsg', { count: tabs.length }),
        confirmLabel: t('confirmCloseAllBtn'),
        onConfirm: () => {
          const allUrls = tabs.map((tab) => tab.url);
          performBatchClose(allUrls, t('toastClosedSelectedPlural', { count: tabs.length }));
          dispatch({ type: 'CLOSE_CONFIRM_DIALOG' });
        },
      },
    });
  }, [dispatch, tabStore.tabs, performBatchClose, t]);

  const handleCreateSection = useCallback(() => {
    dispatch({
      type: 'SET_PROMPT_DIALOG',
      dialog: {
        id: crypto.randomUUID(),
        open: true,
        title: t('promptCreateGroupTitle'),
        label: t('promptCreateGroupLabel'),
        initialValue: t('promptCreateGroupValue'),
        confirmLabel: t('promptCreateGroupBtn'),
        onConfirm: (name) => {
          tabStore.createSection(name).then(() => {
            showToast(t('toastGroupCreated'));
          });
          dispatch({ type: 'CLOSE_PROMPT_DIALOG' });
        },
      },
    });
  }, [dispatch, tabStore, showToast, t]);

  const handleRenameSection = useCallback((group: { id: string; name: string }) => {
    dispatch({
      type: 'SET_PROMPT_DIALOG',
      dialog: {
        id: crypto.randomUUID(),
        open: true,
        title: t('promptRenameGroupTitle'),
        label: t('promptRenameGroupLabel'),
        initialValue: group.name,
        confirmLabel: t('promptRenameGroupBtn'),
        onConfirm: (name) => {
          tabStore.renameSection(group.id, name).then(() => {
            showToast(t('toastGroupRenamed'));
          });
          dispatch({ type: 'CLOSE_PROMPT_DIALOG' });
        },
      },
    });
  }, [dispatch, tabStore, showToast, t]);

  const handleDeleteSection = useCallback((group: { id: string; name: string }) => {
    dispatch({
      type: 'SET_CONFIRM_DIALOG',
      dialog: {
        id: crypto.randomUUID(),
        open: true,
        title: t('confirmDeleteGroupTitle', { name: group.name }),
        message: t('confirmDeleteGroupMsg'),
        confirmLabel: t('confirmDeleteGroupBtn'),
        onConfirm: () => {
          tabStore.deleteSection(group.id).then(() => {
            showToast(t('toastGroupDeleted'));
          });
          dispatch({ type: 'CLOSE_CONFIRM_DIALOG' });
        },
      },
    });
  }, [dispatch, tabStore, showToast, t]);

  const handleSetViewMode = useCallback((mode: 'cards' | 'table') => {
    tabStore.setViewMode(mode).then(() => {
      showToast(mode === 'cards' ? t('toastViewModeCards') : t('toastViewModeTable'));
    });
  }, [tabStore, showToast, t]);

  const handleRefresh = useCallback(async () => {
    await tabStore.fetchTabs();
    showToast(t('toastRefreshed'));
  }, [tabStore, showToast, t]);

  const handleMoveTableItem = useCallback((p: TabGroup, sectionId: string) => {
    const productKey = getProductKey(p);
    const move = sectionId
      ? tabStore.moveProductGroupToSection(productKey, sectionId)
      : tabStore.moveProductToUnsectioned(productKey);

    move.then(() => {
      showToast(sectionId ? t('toastMovedToGroup') : t('toastMovedToUnsorted'));
    });
  }, [tabStore, showToast, t]);

  const handleMoveProductToNoSection = useCallback((productKey: string) => {
    tabStore.moveProductToUnsectioned(productKey).then(() => {
      showToast(t('toastMovedToUnsorted'));
    });
  }, [tabStore, showToast, t]);

  const handleMoveProductToSection = useCallback((productKey: string, sectionId: string) => {
    tabStore.moveProductGroupToSection(productKey, sectionId).then(() => {
      showToast(t('toastMovedToGroup'));
    });
  }, [tabStore, showToast, t]);

  const handleSelectStaleTabs = useCallback((days = settings.staleThresholdDays ?? 3) => {
    const now = Date.now();

    const staleUrls = staleTabUrlsForProducts(visibleProducts, days, now);

    if (staleUrls.length > 0) {
      dispatch({
        type: 'SET_SELECTED_URLS',
        urls: new Set(staleUrls),
      });
      dispatch({ type: 'SET_SELECTED_TAB_IDS', tabIds: new Set() });
      showToast(
        staleUrls.length === 1
          ? t('toastSelectedStaleSingle')
          : t('toastSelectedStalePlural', { count: staleUrls.length })
      );
    } else {
      showToast(t('toastNoStaleTabs'));
    }
  }, [visibleProducts, dispatch, showToast, settings.staleThresholdDays, t]);

  const handleSelectDuplicateTabs = useCallback(() => {
    const duplicateTabIds = duplicateTabIdsForProducts(visibleProducts);

    if (duplicateTabIds.length > 0) {
      dispatch({
        type: 'SET_SELECTED_URLS',
        urls: new Set(),
      });
      dispatch({
        type: 'SET_SELECTED_TAB_IDS',
        tabIds: new Set(duplicateTabIds),
      });
      showToast(
        duplicateTabIds.length === 1
          ? t('toastSelectedDuplicatesSingle')
          : t('toastSelectedDuplicatesPlural', { count: duplicateTabIds.length })
      );
    } else {
      showToast(t('toastNoDuplicates'));
    }
  }, [visibleProducts, dispatch, showToast, t]);

  const handleSortWindow = useCallback(() => {
    dispatch({
      type: 'SET_CONFIRM_DIALOG',
      dialog: {
        id: crypto.randomUUID(),
        open: true,
        title: t('confirmSortTitle'),
        message: t('confirmSortMessage'),
        confirmLabel: t('confirmSortBtn'),
        onConfirm: () => {
          tabStore.sortCurrentWindowTabsByDashboardOrder(sectionOrderedProducts).then(() => {
            showToast(t('toastSortComplete'));
          }).catch((err) => {
            console.error('[Tab Organizer] sortCurrentWindowTabsByDashboardOrder failed:', err);
            showToast(t('toastSortNoTabs'));
          });
          dispatch({ type: 'CLOSE_CONFIRM_DIALOG' });
        },
      },
    });
  }, [dispatch, tabStore, sectionOrderedProducts, showToast, t]);

  return {
    handleCloseProduct,
    handleCloseSection,
    handleCloseDuplicates,
    handleCloseTabAnimated,
    handleFocusTab,
    handleResetSortOrder,
    handleChipClick,
    handleClearSelection,
    handleToggleExpanded,
    handleCloseSelected,
    handleCloseAll,
    handleCreateSection,
    handleRenameSection,
    handleDeleteSection,
    handleSetViewMode,
    handleRefresh,
    handleMoveTableItem,
    handleMoveProductToNoSection,
    handleMoveProductToSection,
    handleSelectStaleTabs,
    handleSelectDuplicateTabs,
    handleSortWindow,
  };
}
