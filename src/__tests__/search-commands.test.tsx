import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabChip } from '../newtab/components/TabChip';
import { SearchBar } from '../newtab/components/SearchBar';
import { useKeyboard } from '../newtab/hooks/useKeyboard';

afterEach(() => {
  cleanup();
});

describe('TabChip Focus Stealing Prevention', () => {
  it('does not natively focus tab chip when an input field is currently active', () => {
    const onFocus = vi.fn();

    // Create a container with an input and the tab chip
    const { container } = render(
      <div>
        <input aria-label="Mock search bar" data-testid="search-input" />
        <TabChip
          url="https://github.com"
          title="GitHub Tab"
          duplicateCount={1}
          isFocused={true}
          onFocus={onFocus}
          onClose={() => {}}
        />
      </div>
    );

    const input = screen.getByTestId('search-input') as HTMLInputElement;
    input.focus();
    expect(document.activeElement).toBe(input);

    // Force re-render of TabChip to trigger the isFocused useEffect
    render(
      <div>
        <input aria-label="Mock search bar" data-testid="search-input" />
        <TabChip
          url="https://github.com"
          title="GitHub Tab"
          duplicateCount={1}
          isFocused={true}
          onFocus={onFocus}
          onClose={() => {}}
        />
      </div>,
      { container }
    );

    // The focus should still remain in the input and not have been stolen by the TabChip
    expect(document.activeElement).toBe(input);
  });

  it('natively focuses tab chip when no input field is currently active', () => {
    const onFocus = vi.fn();

    render(
      <div>
        <button data-testid="non-input">Some Button</button>
        <TabChip
          url="https://github.com"
          title="GitHub Tab"
          duplicateCount={1}
          isFocused={true}
          onFocus={onFocus}
          onClose={() => {}}
        />
      </div>
    );

    // The tab chip button should get native DOM focus
    const tabButton = screen.getByRole('button', { name: /^GitHub Tab/ });
    expect(document.activeElement).toBe(tabButton);
  });
});

describe('SearchBar Commands Menu', () => {
  it('automatically opens command menu when focused and value is empty', () => {
    const onChange = vi.fn();

    render(
      <SearchBar
        value=""
        onChange={onChange}
        resultCount={0}
        totalCount={0}
      />
    );

    const input = screen.getByRole('searchbox', { name: 'Search tabs' });
    
    // Suggestion panel should be absent initially
    expect(screen.queryByText('Quick Commands (type / or choose below)')).not.toBeInTheDocument();

    // Focus input
    fireEvent.focus(input);

    // Suggestion panel should appear automatically
    expect(screen.getByText('Quick Commands (type / or choose below)')).toBeInTheDocument();
    expect(screen.getByText('/dupes')).toBeInTheDocument();
    expect(screen.getByText('/stale')).toBeInTheDocument();
    expect(screen.getByText('/space:')).toBeInTheDocument();
  });

  it('automatically closes command menu when search value matches exactly a complete command', () => {
    const onChange = vi.fn();

    render(
      <SearchBar
        value="/dupes"
        onChange={onChange}
        resultCount={0}
        totalCount={0}
      />
    );

    const input = screen.getByRole('searchbox', { name: 'Search tabs' });
    fireEvent.focus(input);

    // Suggestion panel should NOT be visible because "/dupes" is an exact match
    expect(screen.queryByText('Quick Commands')).not.toBeInTheDocument();
  });

  it('appends a trailing space when /dupes or /stale is chosen', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SearchBar
        value=""
        onChange={onChange}
        resultCount={0}
        totalCount={0}
      />
    );

    const input = screen.getByRole('searchbox', { name: 'Search tabs' });
    await user.click(input); // Focuses input and opens menu

    const dupesBtn = screen.getByRole('button', { name: /dupes/ });
    await user.click(dupesBtn);

    expect(onChange).toHaveBeenCalledWith('/dupes ');
  });

  it('does NOT append a trailing space when /space: is chosen', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SearchBar
        value=""
        onChange={onChange}
        resultCount={0}
        totalCount={0}
      />
    );

    const input = screen.getByRole('searchbox', { name: 'Search tabs' });
    await user.click(input); // Focuses input and opens menu

    const spaceBtn = screen.getByRole('button', { name: /space:/ });
    await user.click(spaceBtn);

    expect(onChange).toHaveBeenCalledWith('/space:');
  });

  it('shows manual spaces list as suggestions when /space: or /s: is typed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const spaces = [
      { id: 'w1', name: 'Work' },
      { id: 'w2', name: 'Social' },
    ];

    render(
      <SearchBar
        value="/s:"
        onChange={onChange}
        resultCount={0}
        totalCount={0}
        spaces={spaces}
      />
    );

    const input = screen.getByRole('searchbox', { name: 'Search tabs' });
    fireEvent.focus(input);

    // Should display stable space-id commands while keeping readable names visible.
    expect(screen.getByText('/space:w1')).toBeInTheDocument();
    expect(screen.getByText('/space:w2')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Social')).toBeInTheDocument();

    const workBtn = screen.getByRole('button', { name: /\/space:w1/ });
    await user.click(workBtn);

    // Selecting a completed space command appends a space
    expect(onChange).toHaveBeenCalledWith('/space:w1 ');
  });
});

function KeyboardBlurHarness(): React.ReactElement {
  const [arrowDownCount, setArrowDownCount] = useState(0);

  useKeyboard({
    onSearch: () => {},
    onEscape: () => false,
    onArrowUp: () => {},
    onArrowDown: () => setArrowDownCount((c) => c + 1),
    onEnter: () => {},
    onDClose: () => {},
  });

  return (
    <div>
      <input aria-label="Search tabs" data-testid="search-input" />
      <output data-testid="arrow-down-count">{arrowDownCount}</output>
    </div>
  );
}

describe('useKeyboard ArrowDown Blur Behavior', () => {
  it('blurs the search input on ArrowDown to transfer focus to the tab chips', async () => {
    const user = userEvent.setup();
    render(<KeyboardBlurHarness />);

    const input = screen.getByTestId('search-input') as HTMLInputElement;
    input.focus();
    expect(document.activeElement).toBe(input);

    // Send ArrowDown inside the input
    await user.keyboard('{ArrowDown}');

    // Expect the input to have been blurred (activeElement is no longer the input)
    expect(document.activeElement).not.toBe(input);
    expect(screen.getByTestId('arrow-down-count')).toHaveTextContent('1');
  });
});
