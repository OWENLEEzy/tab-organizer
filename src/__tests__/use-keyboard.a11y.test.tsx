import React, { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useKeyboard } from '../newtab/hooks/useKeyboard';

afterEach(() => {
  cleanup();
});

function KeyboardHarness(): React.ReactElement {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [closeCount, setCloseCount] = useState(0);
  const [enterCount, setEnterCount] = useState(0);
  const [arrowUpCount, setArrowUpCount] = useState(0);
  const [arrowDownCount, setArrowDownCount] = useState(0);

  useKeyboard({
    onSearch: () => {},
    onSave: () => {},
    onEscape: () => {},
    onArrowUp: () => setArrowUpCount((count) => count + 1),
    onArrowDown: () => setArrowDownCount((count) => count + 1),
    onEnter: () => setEnterCount((count) => count + 1),
    onDClose: () => setCloseCount((count) => count + 1),
    onDSave: () => setSaveCount((count) => count + 1),
  });

  return (
    <div>
      <button type="button" onClick={() => setDialogOpen((open) => !open)}>
        Toggle dialog
      </button>
      <button type="button">Regular action</button>
      <output data-testid="save-count">{saveCount}</output>
      <output data-testid="close-count">{closeCount}</output>
      <output data-testid="enter-count">{enterCount}</output>
      <output data-testid="arrow-up-count">{arrowUpCount}</output>
      <output data-testid="arrow-down-count">{arrowDownCount}</output>
      {dialogOpen && (
        <div role="dialog" aria-modal="true" aria-label="Keyboard test dialog">
          <button type="button">Dialog action</button>
        </div>
      )}
    </div>
  );
}

describe('useKeyboard', () => {
  it('does not fire global single-key shortcuts while focus is inside a dialog', async () => {
    const user = userEvent.setup();

    render(<KeyboardHarness />);

    await user.click(screen.getByRole('button', { name: 'Toggle dialog' }));

    const dialogButton = screen.getByRole('button', { name: 'Dialog action' });
    dialogButton.focus();

    await user.keyboard('s');
    await user.keyboard('d');

    expect(screen.getByTestId('save-count')).toHaveTextContent('0');
    expect(screen.getByTestId('close-count')).toHaveTextContent('0');
  });

  it('does not hijack buttons outside the tab grid', async () => {
    const user = userEvent.setup();

    render(<KeyboardHarness />);

    const regularButton = screen.getByRole('button', { name: 'Regular action' });
    regularButton.focus();

    await user.keyboard('{Enter}{ArrowUp}{ArrowDown}sd');

    expect(screen.getByTestId('enter-count')).toHaveTextContent('0');
    expect(screen.getByTestId('arrow-up-count')).toHaveTextContent('0');
    expect(screen.getByTestId('arrow-down-count')).toHaveTextContent('0');
    expect(screen.getByTestId('save-count')).toHaveTextContent('0');
    expect(screen.getByTestId('close-count')).toHaveTextContent('0');
  });

  it('prevents page scrolling when arrow navigation is handled globally', () => {
    render(<KeyboardHarness />);

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    });

    act(() => {
      document.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
    expect(screen.getByTestId('arrow-down-count')).toHaveTextContent('1');
  });
});
