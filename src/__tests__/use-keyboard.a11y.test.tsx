import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useKeyboard } from '../newtab/hooks/useKeyboard';
import { I18nProvider } from '../newtab/providers/I18nProvider';
import { SectionSwitcher } from '../newtab/components/organizer/SectionSwitcher';

afterEach(() => {
  cleanup();
});

function KeyboardHarness(): React.ReactElement {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [closeCount, setCloseCount] = useState(0);
  const [enterCount, setEnterCount] = useState(0);
  const [arrowUpCount, setArrowUpCount] = useState(0);
  const [arrowDownCount, setArrowDownCount] = useState(0);
  const [cyclePrevCount, setCyclePrevCount] = useState(0);
  const [cycleNextCount, setCycleNextCount] = useState(0);
  const [switchCount, setSwitchCount] = useState(0);
  const [clearFilterCount, setClearFilterCount] = useState(0);

  useKeyboard({
    onSearch: () => {},
    onEscape: () => false,
    onArrowUp: () => setArrowUpCount((count) => count + 1),
    onArrowDown: () => setArrowDownCount((count) => count + 1),
    onEnter: () => setEnterCount((count) => count + 1),
    onDClose: () => setCloseCount((count) => count + 1),
    onSwitchSectionN: () => setSwitchCount((count) => count + 1),
    onCycleSectionPrev: () => setCyclePrevCount((count) => count + 1),
    onCycleSectionNext: () => setCycleNextCount((count) => count + 1),
    onClearFilter: () => setClearFilterCount((count) => count + 1),
  }, {
    switchSectionN: 'Meta+{n}',
    switchSectionAll: 'Meta+0',
    cyclePrev: 'ArrowLeft',
    cycleNext: 'ArrowRight',
    focusSearch: '/',
    clearFilter: 'Escape',
  });

  return (
    <div>
      <button type="button" onClick={() => setDialogOpen((open) => !open)}>
        Toggle dialog
      </button>
      <button type="button">Regular action</button>
      <a href="https://example.com">Regular link</a>
      <input aria-label="Editable field" />
      <div role="switch" aria-checked="false" tabIndex={0}>Switch control</div>
      <output data-testid="close-count">{closeCount}</output>
      <output data-testid="enter-count">{enterCount}</output>
      <output data-testid="arrow-up-count">{arrowUpCount}</output>
      <output data-testid="arrow-down-count">{arrowDownCount}</output>
      <output data-testid="cycle-prev-count">{cyclePrevCount}</output>
      <output data-testid="cycle-next-count">{cycleNextCount}</output>
      <output data-testid="switch-count">{switchCount}</output>
      <output data-testid="clear-filter-count">{clearFilterCount}</output>
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
    expect(screen.getByTestId('close-count')).toHaveTextContent('0');
  });

  it('does not cycle or switch sections from inputs and interactive controls', async () => {
    const user = userEvent.setup();

    render(<KeyboardHarness />);

    const field = screen.getByRole('textbox', { name: 'Editable field' });
    await user.click(field);
    await user.keyboard('{ArrowLeft}{ArrowRight}{Meta>}1{/Meta}');

    const link = screen.getByRole('link', { name: 'Regular link' });
    link.focus();
    await user.keyboard('{ArrowLeft}{ArrowRight}{Meta>}1{/Meta}');

    const switchControl = screen.getByRole('switch', { name: 'Switch control' });
    switchControl.focus();
    await user.keyboard('{ArrowLeft}{ArrowRight}{Meta>}1{/Meta}');

    expect(screen.getByTestId('cycle-prev-count')).toHaveTextContent('0');
    expect(screen.getByTestId('cycle-next-count')).toHaveTextContent('0');
    expect(screen.getByTestId('switch-count')).toHaveTextContent('0');
  });

  it('does not treat Cmd/Ctrl+D as the close shortcut', async () => {
    const user = userEvent.setup();

    render(<KeyboardHarness />);

    await user.keyboard('{Meta>}d{/Meta}');
    expect(screen.getByTestId('close-count')).toHaveTextContent('0');

    await user.keyboard('{Control>}d{/Control}');
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

  it('honors a custom non-Escape clear filter shortcut outside inputs', async () => {
    const user = userEvent.setup();

    function CustomClearFilterHarness(): React.ReactElement {
      const [clearFilterCount, setClearFilterCount] = useState(0);

      useKeyboard({
        onSearch: () => {},
        onEscape: () => false,
        onArrowUp: () => {},
        onArrowDown: () => {},
        onEnter: () => {},
        onDClose: () => {},
        onClearFilter: () => setClearFilterCount((count) => count + 1),
      }, {
        switchSectionN: 'Meta+{n}',
        switchSectionAll: 'Meta+0',
        cyclePrev: 'ArrowLeft',
        cycleNext: 'ArrowRight',
        focusSearch: '/',
        clearFilter: 'Control+L',
      });

      return (
        <div>
          <input aria-label="Editable field" />
          <output data-testid="clear-filter-count">{clearFilterCount}</output>
        </div>
      );
    }

    render(<CustomClearFilterHarness />);

    await user.keyboard('{Control>}l{/Control}');

    expect(screen.getByTestId('clear-filter-count')).toHaveTextContent('1');
  });

  it('does not run custom clear filter shortcut from editable fields', async () => {
    const user = userEvent.setup();

    function CustomClearFilterHarness(): React.ReactElement {
      const [clearFilterCount, setClearFilterCount] = useState(0);

      useKeyboard({
        onSearch: () => {},
        onEscape: () => false,
        onArrowUp: () => {},
        onArrowDown: () => {},
        onEnter: () => {},
        onDClose: () => {},
        onClearFilter: () => setClearFilterCount((count) => count + 1),
      }, {
        switchSectionN: 'Meta+{n}',
        switchSectionAll: 'Meta+0',
        cyclePrev: 'ArrowLeft',
        cycleNext: 'ArrowRight',
        focusSearch: '/',
        clearFilter: 'Control+L',
      });

      return (
        <div>
          <input aria-label="Editable field" />
          <output data-testid="clear-filter-count">{clearFilterCount}</output>
        </div>
      );
    }

    render(<CustomClearFilterHarness />);

    await user.click(screen.getByRole('textbox', { name: 'Editable field' }));
    await user.keyboard('{Control>}l{/Control}');

    expect(screen.getByTestId('clear-filter-count')).toHaveTextContent('0');
  });
});

describe('SectionSwitcher', () => {
  it('keeps the new section button keyboard reachable', async () => {
    const user = userEvent.setup();
    const onCreateSection = vi.fn();

    render(
      <I18nProvider>
        <SectionSwitcher
          sections={[{ id: 'section-dev', name: 'Dev', order: 0 }]}
          activeSectionId={null}
          onChange={() => {}}
          onCreateSection={onCreateSection}
        />
      </I18nProvider>,
    );

    await user.tab();
    await user.tab();
    await user.tab();
    await user.keyboard('{Enter}');

    expect(onCreateSection).toHaveBeenCalledTimes(1);
  });
});
