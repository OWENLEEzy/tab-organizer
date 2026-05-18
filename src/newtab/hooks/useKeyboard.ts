import { useEffect, useRef } from 'react';
import type { AppSettings } from '../../types';

// ─── Types ───────────────────────────────────────────────────────────

interface KeyboardActions {
  onSearch: () => void;
  onEscape: () => boolean;
  onArrowUp: () => void;
  onArrowDown: () => void;
  onEnter: () => void;
  onDClose: () => void;
  onSwitchSpaceN?: (n: number) => void;
  onSwitchSpaceAll?: () => void;
  onCycleSpacePrev?: () => void;
  onCycleSpaceNext?: () => void;
  onClearFilter?: () => void;
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

function matchesKeyBinding(e: KeyboardEvent, binding: string, nPlaceholder?: string): boolean {
  if (!binding) return false;
  
  let targetBinding = binding;
  if (nPlaceholder && binding.includes('{n}')) {
    targetBinding = binding.replace('{n}', nPlaceholder);
  }
  
  const parts = targetBinding.split('+');
  const key = parts.pop();
  if (!key) return false;
  
  const meta = parts.includes('Meta') || parts.includes('Cmd') || parts.includes('Command');
  const ctrl = parts.includes('Control') || parts.includes('Ctrl');
  const alt = parts.includes('Alt');
  const shift = parts.includes('Shift');
  
  if (e.metaKey !== meta && e.key !== 'Meta') return false;
  if (e.ctrlKey !== ctrl && e.key !== 'Control') return false;
  if (e.altKey !== alt && e.key !== 'Alt') return false;
  if (e.shiftKey !== shift && e.key !== 'Shift') return false;
  
  let eventKey = e.key.toLowerCase();
  if (eventKey === ' ') eventKey = 'space';
  
  return eventKey === key.toLowerCase();
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
 *   Escape                                   -> onEscape
 *   ArrowUp                                  -> onArrowUp
 *   ArrowDown                                -> onArrowDown
 *   Enter                                    -> onEnter
 */
export function useKeyboard(
  actions: KeyboardActions,
  keyBindings?: AppSettings['keyBindings'],
  disabled?: boolean
): void {
  const callbackRef = useRef<KeyboardActions>(actions);

  useEffect(() => {
    callbackRef.current = actions;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) {
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;
      const target = getTargetElement(e.target);
      const targetIsInput = isInputField(target);
      const targetIsTabChip = isTabChipElement(target);
      const targetIsBlockedInteractive = isBlockedInteractiveElement(target);

      if (isInsideDialog(target)) {
        return;
      }

      // Escape -> clears search / blurs input, or clears filter
      if (e.key === 'Escape') {
        const handled = callbackRef.current.onEscape();
        if (!handled && keyBindings && matchesKeyBinding(e, keyBindings.clearFilter)) {
          e.preventDefault();
          callbackRef.current.onClearFilter?.();
        }
        return;
      }

      // Custom bindings
      if (keyBindings) {
        // switchSpaceN
        if (e.key >= '1' && e.key <= '9' && matchesKeyBinding(e, keyBindings.switchSpaceN, e.key)) {
          e.preventDefault();
          callbackRef.current.onSwitchSpaceN?.(Number(e.key));
          return;
        }

        // switchSpaceAll
        if (matchesKeyBinding(e, keyBindings.switchSpaceAll)) {
          e.preventDefault();
          callbackRef.current.onSwitchSpaceAll?.();
          return;
        }

        // cyclePrev
        if (matchesKeyBinding(e, keyBindings.cyclePrev)) {
          e.preventDefault();
          callbackRef.current.onCycleSpacePrev?.();
          return;
        }

        // cycleNext
        if (matchesKeyBinding(e, keyBindings.cycleNext)) {
          e.preventDefault();
          callbackRef.current.onCycleSpaceNext?.();
          return;
        }

        // focusSearch
        if (matchesKeyBinding(e, keyBindings.focusSearch) && !targetIsInput && !targetIsBlockedInteractive) {
          e.preventDefault();
          callbackRef.current.onSearch();
          return;
        }
      }

      // Default hardcoded fallbacks if no keyBindings defined
      if (!keyBindings) {
        // Cmd/Ctrl + K -> onSearch
        if (isMod && e.key === 'k') {
          e.preventDefault();
          callbackRef.current.onSearch();
          return;
        }

        // / -> onSearch (only when not typing in an input field)
        if (e.key === '/' && !targetIsInput && !targetIsBlockedInteractive) {
          e.preventDefault();
          callbackRef.current.onSearch();
          return;
        }

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

      // d -> onDClose (only unmodified, outside input fields)
      if (e.key === 'd' && !isMod && !targetIsInput && !targetIsBlockedInteractive) {
        callbackRef.current.onDClose();
        return;
      }

    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [keyBindings, disabled]);
}
