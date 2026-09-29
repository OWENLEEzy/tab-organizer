import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { focusWhenReady } from '../dashboard/hooks/useFocusFollow';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

function addButton(): HTMLButtonElement {
  const button = document.createElement('button');
  document.body.append(button);
  return button;
}

describe('focusWhenReady', () => {
  it('focuses the element as soon as it exists', () => {
    const button = addButton();
    focusWhenReady(() => button);
    expect(document.activeElement).toBe(button);
  });

  it('retries until the element renders', () => {
    let button: HTMLButtonElement | null = null;
    focusWhenReady(() => button);

    button = addButton();
    vi.advanceTimersByTime(50);

    expect(document.activeElement).toBe(button);
  });

  it('gives up after the retry budget', () => {
    const find = vi.fn(() => null);
    focusWhenReady(find, 2);
    vi.advanceTimersByTime(1000);
    expect(find).toHaveBeenCalledTimes(3);
  });
});
