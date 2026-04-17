import { useEffect, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────────────

interface KeyboardActions {
  onSearch: () => void;
  onSave: () => void;
  onEscape: () => void;
  onArrowUp: () => void;
  onArrowDown: () => void;
  onEnter: () => void;
  onDClose: () => void;
  onDSave: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────────

/**
 * Register global keyboard shortcuts for the new tab page.
 *
 * Uses a ref-based callback pattern (same as useChromeStorage) to avoid
 * stale closures — the listener is registered once and always calls the
 * latest action callbacks without re-subscribing.
 *
 * Shortcuts:
 *   Cmd/Ctrl + K  or  /  (outside inputs)  -> onSearch
 *   Cmd/Ctrl + S                             -> onSave  (prevents default)
 *   Escape                                   -> onEscape
 *   ArrowUp                                  -> onArrowUp
 *   ArrowDown                                -> onArrowDown
 *   Enter                                    -> onEnter
 */
export function useKeyboard(actions: KeyboardActions): void {
  const callbackRef = useRef<KeyboardActions>(actions);

  useEffect(() => {
    callbackRef.current = actions;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;
      const activeElement = document.activeElement as HTMLElement | null;
      const isInputField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable === true;
      const isInsideDialog = Boolean(
        activeElement?.closest('[role="dialog"][aria-modal="true"]'),
      );

      if (isInsideDialog) {
        return;
      }

      // Cmd/Ctrl + K -> onSearch
      if (isMod && e.key === 'k') {
        e.preventDefault();
        callbackRef.current.onSearch();
        return;
      }

      // Cmd/Ctrl + S -> onSave (prevent browser save dialog)
      if (isMod && e.key === 's') {
        e.preventDefault();
        callbackRef.current.onSave();
        return;
      }

      // / -> onSearch (only when not typing in an input field)
      if (e.key === '/' && !isInputField) {
        e.preventDefault();
        callbackRef.current.onSearch();
        return;
      }

      // Escape -> onEscape
      if (e.key === 'Escape') {
        callbackRef.current.onEscape();
        return;
      }

      // ArrowUp -> onArrowUp
      if (e.key === 'ArrowUp') {
        callbackRef.current.onArrowUp();
        return;
      }

      // ArrowDown -> onArrowDown
      if (e.key === 'ArrowDown') {
        callbackRef.current.onArrowDown();
        return;
      }

      // Enter -> onEnter
      if (e.key === 'Enter') {
        callbackRef.current.onEnter();
        return;
      }

      // d -> onDClose (only outside input fields)
      if (e.key === 'd' && !isInputField) {
        callbackRef.current.onDClose();
        return;
      }

      // s -> onDSave (only outside input fields — Cmd+S still works in inputs)
      if (e.key === 's' && !isInputField) {
        e.preventDefault();
        callbackRef.current.onDSave();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
