import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../newtab/providers/I18nProvider';
import { TabChip } from '../newtab/components/tabs/TabChip';
import { SearchBar } from '../newtab/components/search/SearchBar';
import { useKeyboard } from '../newtab/hooks/useKeyboard';

afterEach(() => {
  cleanup();
});

describe('TabChip Focus Stealing Prevention', () => {
  it('does not natively focus tab chip when an input field is currently active', () => {
    const onFocus = vi.fn();

    const { container } = render(
      <I18nProvider>
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
      </I18nProvider>,
    );

    const input = screen.getByTestId('search-input') as HTMLInputElement;
    input.focus();
    expect(document.activeElement).toBe(input);

    render(
      <I18nProvider>
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
      </I18nProvider>,
      { container }
    );

    expect(document.activeElement).toBe(input);
  });

  it('natively focuses tab chip when no input field is currently active', () => {
    const onFocus = vi.fn();

    render(
      <I18nProvider>
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
      </I18nProvider>,
    );

    const tabButton = screen.getByRole('button', { name: /^GitHub Tab/ });
    expect(document.activeElement).toBe(tabButton);
  });

  it('uses the configured stale threshold for chip stale styling', () => {
    const now = new Date('2026-05-05T00:00:00Z').getTime();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    try {
      const { rerender } = render(
        <I18nProvider>
          <TabChip
            url="https://github.com"
            title="GitHub Tab"
            duplicateCount={1}
            lastAccessed={now - 4 * 24 * 60 * 60 * 1000}
            staleThresholdDays={7}
            onFocus={() => {}}
            onClose={() => {}}
          />
        </I18nProvider>,
      );

      expect(screen.getByRole('button', { name: /^GitHub Tab/ }).className).not.toContain('opacity-55');

      rerender(
        <I18nProvider>
          <TabChip
            url="https://github.com"
            title="GitHub Tab"
            duplicateCount={1}
            lastAccessed={now - 4 * 24 * 60 * 60 * 1000}
            staleThresholdDays={3}
            onFocus={() => {}}
            onClose={() => {}}
          />
        </I18nProvider>,
      );

      expect(screen.getByRole('button', { name: /^GitHub Tab/ }).className).toContain('opacity-55');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('SearchBar Commands Menu', () => {
  it('automatically opens command menu when focused and value is empty', () => {
    const onChange = vi.fn();

    render(
      <I18nProvider>
        <SearchBar
          value=""
          onChange={onChange}
          resultCount={0}
          totalCount={0}
        />
      </I18nProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Search tabs' });

    expect(screen.queryByText('Quick Commands (type / or choose below)')).not.toBeInTheDocument();

    fireEvent.focus(input);

    expect(screen.getByText('Quick Commands (type / or choose below)')).toBeInTheDocument();
    expect(screen.getByText('/dupes')).toBeInTheDocument();
    expect(screen.getByText('/stale')).toBeInTheDocument();
    expect(screen.getByText('/section:')).toBeInTheDocument();
  });

  it('automatically closes command menu when search value matches exactly a complete command', () => {
    const onChange = vi.fn();

    render(
      <I18nProvider>
        <SearchBar
          value="/dupes"
          onChange={onChange}
          resultCount={0}
          totalCount={0}
        />
      </I18nProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Search tabs' });
    fireEvent.focus(input);

    expect(screen.queryByText('Quick Commands')).not.toBeInTheDocument();
  });

  it('appends a trailing space when /dupes or /stale is chosen', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <I18nProvider>
        <SearchBar
          value=""
          onChange={onChange}
          resultCount={0}
          totalCount={0}
        />
      </I18nProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Search tabs' });
    await user.click(input);

    const dupesBtn = screen.getByRole('button', { name: /dupes/ });
    await user.click(dupesBtn);

    expect(onChange).toHaveBeenCalledWith('/dupes ');
  });

  it('does NOT append a trailing space when /section: is chosen', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <I18nProvider>
        <SearchBar
          value=""
          onChange={onChange}
          resultCount={0}
          totalCount={0}
        />
      </I18nProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Search tabs' });
    await user.click(input);

    const sectionBtn = screen.getByRole('button', { name: /section:/ });
    await user.click(sectionBtn);

    expect(onChange).toHaveBeenCalledWith('/section:');
  });

  it('suggests only sections passed by the controller', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <I18nProvider>
        <SearchBar
          value="/section:"
          onChange={onChange}
          resultCount={0}
          totalCount={0}
          sections={[{ id: 'section-dev', name: 'Dev' }]}
        />
      </I18nProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Search tabs' });
    fireEvent.focus(input);

    expect(screen.getByText('/section:section-dev')).toBeInTheDocument();
    expect(screen.queryByText('/section:section-empty')).not.toBeInTheDocument();

    const devBtn = screen.getByRole('button', { name: /\/section:section-dev/ });
    await user.click(devBtn);

    expect(onChange).toHaveBeenCalledWith('/section:section-dev ');
  });

  it('shows manual sections list as suggestions when /section: or /s: is typed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const sections = [
      { id: 'w1', name: 'Work' },
      { id: 'w2', name: 'Social' },
    ];

    render(
      <I18nProvider>
        <SearchBar
          value="/sec:"
          onChange={onChange}
          resultCount={0}
          totalCount={0}
          sections={sections}
        />
      </I18nProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Search tabs' });
    fireEvent.focus(input);

    expect(screen.getByText('/section:w1')).toBeInTheDocument();
    expect(screen.getByText('/section:w2')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Social')).toBeInTheDocument();

    const workBtn = screen.getByRole('button', { name: /\/section:w1/ });
    await user.click(workBtn);

    expect(onChange).toHaveBeenCalledWith('/section:w1 ');
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
    <I18nProvider>
      <div>
        <input aria-label="Search tabs" data-testid="search-input" />
        <output data-testid="arrow-down-count">{arrowDownCount}</output>
      </div>
    </I18nProvider>
  );
}

describe('useKeyboard ArrowDown Blur Behavior', () => {
  it('blurs the search input on ArrowDown to transfer focus to the tab chips', async () => {
    const user = userEvent.setup();
    render(<KeyboardBlurHarness />);

    const input = screen.getByTestId('search-input') as HTMLInputElement;
    input.focus();
    expect(document.activeElement).toBe(input);

    await user.keyboard('{ArrowDown}');

    expect(document.activeElement).not.toBe(input);
    expect(screen.getByTestId('arrow-down-count')).toHaveTextContent('1');
  });
});