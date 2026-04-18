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

function getTargetElement(target: EventTarget | null): HTMLElement | null {
  return target instanceof HTMLElement ? target : null;
}

function isInputField(target: HTMLElement | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target?.isContentEditable === true
  );
}

function isTabChipElement(target: HTMLElement | null): boolean {
  return Boolean(target?.closest('[data-tab-url]'));
}

function isBlockedInteractiveElement(target: HTMLElement | null): boolean {
  if (!target) {
    return false;
  }

  const interactiveSelector = [
    'button',
    'a[href]',
    'input',
    'select',
    'textarea',
    'summary',
    '[role="button"]',
    '[role="link"]',
    '[role="switch"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="tab"]',
  ].join(', ');

  return Boolean(target.closest(interactiveSelector)) && !isTabChipElement(target);
}

function isInsideDialog(target: HTMLElement | null): boolean {
  return Boolean(target?.closest('[role="dialog"][aria-modal="true"]'));
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
      const target = getTargetElement(e.target);
      const targetIsInput = isInputField(target);
      const targetIsTabChip = isTabChipElement(target);
      const targetIsBlockedInteractive = isBlockedInteractiveElement(target);

      if (isInsideDialog(target)) {
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
      if (e.key === '/' && !targetIsInput && !targetIsBlockedInteractive) {
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
        if (targetIsInput || targetIsBlockedInteractive) return;
        e.preventDefault();
        callbackRef.current.onArrowUp();
        return;
      }

      // ArrowDown -> onArrowDown
      if (e.key === 'ArrowDown') {
        if (targetIsInput || targetIsBlockedInteractive) return;
        e.preventDefault();
        callbackRef.current.onArrowDown();
        return;
      }

      // Enter -> onEnter
      if (e.key === 'Enter') {
        if (targetIsBlockedInteractive || targetIsTabChip) return;
        callbackRef.current.onEnter();
        return;
      }

      // d -> onDClose (only outside input fields)
      if (e.key === 'd' && !targetIsInput && !targetIsBlockedInteractive) {
        callbackRef.current.onDClose();
        return;
      }

      // s -> onDSave (only outside input fields — Cmd+S still works in inputs)
      if (e.key === 's' && !targetIsInput && !targetIsBlockedInteractive) {
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
