import { useLayoutEffect, type RefObject } from 'react';

/**
 * Focus an element that may not have rendered yet — after a store update the
 * target can be mid-remount. Retries every 50ms, then gives up quietly.
 */
export function focusWhenReady(
  find: () => HTMLElement | null | undefined,
  attempts = 12,
): void {
  const target = find();
  if (target) {
    target.focus({ preventScroll: false });
    target.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    return;
  }

  if (attempts > 0) {
    window.setTimeout(() => focusWhenReady(find, attempts - 1), 50);
  }
}

function isFocusLost(): boolean {
  return !document.activeElement || document.activeElement === document.body;
}

/**
 * When the element held focus as it unmounted — e.g. its card remounted under
 * another section — hand focus to its replacement, found by `selector`. Only
 * the element that actually had focus follows, so a mouse drag never moves
 * focus, and focus is never stolen back from wherever the user has gone since.
 */
export function useFocusFollow(ref: RefObject<HTMLElement | null>, selector: string): void {
  useLayoutEffect(() => {
    const element = ref.current;
    return () => {
      // Layout cleanup runs before React detaches the DOM, so focus is still here.
      if (!element || element !== document.activeElement) return;
      focusWhenReady(() => (isFocusLost() ? document.querySelector<HTMLElement>(selector) : null));
    };
  }, [ref, selector]);
}
