import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../dashboard/providers/I18nProvider';
import type { Section } from '../types';
import { MoveToSectionMenu } from '../dashboard/components/product-groups/MoveToSectionMenu';

const SECTIONS: Section[] = [
  { id: 'dev', name: 'Dev', order: 0, emoji: '💻' },
  { id: 'design', name: 'Design', order: 1, emoji: '🎨' },
];

afterEach(() => {
  cleanup();
});

describe('MoveToSectionMenu', () => {
  it('renders nothing when there are no sections and the group has none to remove from', () => {
    render(
      <I18nProvider>
        <MoveToSectionMenu
          sections={[]}
          currentSectionId={null}
          onMoveToSection={vi.fn()}
          onMoveToNoSection={vi.fn()}
          groupName="GitHub"
          productKey="github"
        />
      </I18nProvider>,
    );
    expect(screen.queryByRole('button', { name: /Move GitHub to a section/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('lists every section including empty ones', () => {
    render(
      <I18nProvider>
        <MoveToSectionMenu
          sections={SECTIONS}
          currentSectionId={null}
          onMoveToSection={vi.fn()}
          onMoveToNoSection={vi.fn()}
          groupName="GitHub"
          productKey="github"
        />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Move GitHub to a section/ }));
    expect(screen.getByRole('menuitem', { name: /Dev/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Design/ })).toBeInTheDocument();
  });

  it('assigns on click', () => {
    const onMoveToSection = vi.fn();
    render(
      <I18nProvider>
        <MoveToSectionMenu
          sections={SECTIONS}
          currentSectionId={null}
          onMoveToSection={onMoveToSection}
          onMoveToNoSection={vi.fn()}
          groupName="GitHub"
          productKey="github"
        />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Move GitHub to a section/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Dev/ }));
    expect(onMoveToSection).toHaveBeenCalledWith('dev');
  });

  it('offers Remove from section only when the group is in one', () => {
    render(
      <I18nProvider>
        <MoveToSectionMenu
          sections={SECTIONS}
          currentSectionId="dev"
          onMoveToSection={vi.fn()}
          onMoveToNoSection={vi.fn()}
          groupName="GitHub"
          productKey="github"
        />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Move GitHub to a section/ }));
    expect(screen.getByRole('menuitem', { name: /Remove from section/ })).toBeInTheDocument();
  });

  it('moves focus onto the first item when opened, and links trigger to menu via aria-controls', () => {
    render(
      <I18nProvider>
        <MoveToSectionMenu
          sections={SECTIONS}
          currentSectionId={null}
          onMoveToSection={vi.fn()}
          onMoveToNoSection={vi.fn()}
          groupName="GitHub"
          productKey="github"
        />
      </I18nProvider>,
    );
    const trigger = screen.getByRole('button', { name: /Move GitHub to a section/ });
    fireEvent.click(trigger);

    const menu = screen.getByRole('menu');
    const items = screen.getAllByRole('menuitem');
    expect(document.activeElement).toBe(items[0]);
    expect(trigger).toHaveAttribute('aria-controls', menu.id);
  });

  it('ArrowDown/ArrowUp rove focus between items, wrapping at both ends', () => {
    render(
      <I18nProvider>
        <MoveToSectionMenu
          sections={SECTIONS}
          currentSectionId={null}
          onMoveToSection={vi.fn()}
          onMoveToNoSection={vi.fn()}
          groupName="GitHub"
          productKey="github"
        />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Move GitHub to a section/ }));
    const menu = screen.getByRole('menu');
    const items = screen.getAllByRole('menuitem');

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[1]);

    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[0]);

    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(items[1]);
  });

  it('renders the open menu outside its clipping ancestor so a card cannot cut it off', () => {
    render(
      <I18nProvider>
        <div data-testid="card" className="overflow-hidden">
          <MoveToSectionMenu
            sections={SECTIONS}
            currentSectionId={null}
            onMoveToSection={vi.fn()}
            onMoveToNoSection={vi.fn()}
            groupName="GitHub"
            productKey="github"
          />
        </div>
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Move GitHub to a section/ }));

    expect(screen.getByTestId('card')).not.toContainElement(screen.getByRole('menu'));
  });

  it('still assigns when the menu item is clicked from outside the trigger subtree', () => {
    const onMoveToSection = vi.fn();
    render(
      <I18nProvider>
        <MoveToSectionMenu
          sections={SECTIONS}
          currentSectionId={null}
          onMoveToSection={onMoveToSection}
          onMoveToNoSection={vi.fn()}
          groupName="GitHub"
          productKey="github"
        />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Move GitHub to a section/ }));

    const item = screen.getByRole('menuitem', { name: /Design/ });
    fireEvent.mouseDown(item);
    fireEvent.click(item);

    expect(onMoveToSection).toHaveBeenCalledWith('design');
  });

  it('Escape closes the menu and returns focus to the trigger button', () => {
    render(
      <I18nProvider>
        <MoveToSectionMenu
          sections={SECTIONS}
          currentSectionId={null}
          onMoveToSection={vi.fn()}
          onMoveToNoSection={vi.fn()}
          groupName="GitHub"
          productKey="github"
        />
      </I18nProvider>,
    );
    const trigger = screen.getByRole('button', { name: /Move GitHub to a section/ });
    fireEvent.click(trigger);

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  describe('focus after closing', () => {
    function renderMenu(overrides: Partial<React.ComponentProps<typeof MoveToSectionMenu>> = {}) {
      render(
        <I18nProvider>
          <MoveToSectionMenu
            sections={SECTIONS}
            currentSectionId="dev"
            onMoveToSection={vi.fn()}
            onMoveToNoSection={vi.fn()}
            groupName="GitHub"
            productKey="github"
            {...overrides}
          />
        </I18nProvider>,
      );
      const trigger = screen.getByRole('button', { name: /Move GitHub to a section/ });
      fireEvent.click(trigger);
      return trigger;
    }

    it('returns focus to the trigger after choosing a section', () => {
      const onMoveToSection = vi.fn();
      const trigger = renderMenu({ onMoveToSection });

      fireEvent.click(screen.getByRole('menuitem', { name: /Design/ }));

      expect(onMoveToSection).toHaveBeenCalledWith('design');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(document.activeElement).toBe(trigger);
    });

    it('returns focus to the trigger after choosing "Remove from section"', () => {
      const onMoveToNoSection = vi.fn();
      const trigger = renderMenu({ onMoveToNoSection });

      fireEvent.click(screen.getByRole('menuitem', { name: /Remove from section/ }));

      expect(onMoveToNoSection).toHaveBeenCalled();
      expect(document.activeElement).toBe(trigger);
    });

    it('keeps Escape to itself, so it does not also clear the dashboard search or section filter', () => {
      const documentListener = vi.fn();
      document.addEventListener('keydown', documentListener);
      const trigger = renderMenu();

      fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });

      document.removeEventListener('keydown', documentListener);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(document.activeElement).toBe(trigger);
      expect(documentListener).not.toHaveBeenCalled();
    });

    it('choosing the section the group is already in just closes the menu', () => {
      const onMoveToSection = vi.fn();
      const trigger = renderMenu({ onMoveToSection });

      fireEvent.click(screen.getByRole('menuitem', { name: /Dev/ }));

      expect(onMoveToSection).not.toHaveBeenCalled();
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(document.activeElement).toBe(trigger);
    });

    it('does not pull focus back to the trigger when the user clicks elsewhere', () => {
      const trigger = renderMenu();

      fireEvent.mouseDown(document.body);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(document.activeElement).not.toBe(trigger);
    });

    it('closes on Tab from the trigger, so Tab moves on from the card and not from the end of the page', () => {
      const trigger = renderMenu();

      fireEvent.keyDown(screen.getByRole('menu'), { key: 'Tab' });

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(document.activeElement).toBe(trigger);
    });

    it('returns focus to the trigger when scrolling closes the menu while an item is focused', () => {
      const trigger = renderMenu();
      expect(screen.getAllByRole('menuitem')).toContain(document.activeElement);

      fireEvent.scroll(window);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(document.activeElement).toBe(trigger);
    });

    it('tags the trigger with its product key so focus can find it after the card moves', () => {
      const trigger = renderMenu();

      expect(trigger).toHaveAttribute('data-move-menu-trigger', 'github');
    });
  });

  describe('focus when the card moves to another section', () => {
    // A product card remounts under its new section, taking the trigger with it.
    function Board({ sectionId, onMove = vi.fn() }: { sectionId: string; onMove?: (id: string) => void }) {
      const menu = (
        <MoveToSectionMenu
          sections={SECTIONS}
          currentSectionId={sectionId}
          onMoveToSection={onMove}
          onMoveToNoSection={vi.fn()}
          groupName="GitHub"
          productKey="github"
        />
      );
      return (
        <I18nProvider>
          <button type="button">elsewhere</button>
          {sectionId === 'dev' ? <div key="dev">{menu}</div> : <section key="design">{menu}</section>}
        </I18nProvider>
      );
    }

    function trigger(): HTMLElement {
      return screen.getByRole('button', { name: /Move GitHub to a section/ });
    }

    afterEach(() => {
      vi.useRealTimers();
    });

    it('follows the card to its new trigger after choosing a section', () => {
      vi.useFakeTimers();
      const { rerender } = render(<Board sectionId="dev" />);
      fireEvent.click(trigger());
      fireEvent.click(screen.getByRole('menuitem', { name: /Design/ }));
      const oldTrigger = trigger();

      rerender(<Board sectionId="design" />);
      act(() => { vi.advanceTimersByTime(1000); });

      expect(trigger()).not.toBe(oldTrigger);
      expect(document.activeElement).toBe(trigger());
    });

    it('does not take focus when the card moved by mouse drag, with the trigger never focused', () => {
      vi.useFakeTimers();
      const { rerender } = render(<Board sectionId="dev" />);

      rerender(<Board sectionId="design" />);
      act(() => { vi.advanceTimersByTime(1000); });

      expect(document.activeElement).toBe(document.body);
    });

    it('does not steal focus back once the user has moved on', () => {
      vi.useFakeTimers();
      const { rerender } = render(<Board sectionId="dev" />);
      fireEvent.click(trigger());
      fireEvent.click(screen.getByRole('menuitem', { name: /Design/ }));

      rerender(<Board sectionId="design" />);
      const elsewhere = screen.getByRole('button', { name: 'elsewhere' });
      elsewhere.focus();
      act(() => { vi.advanceTimersByTime(1000); });

      expect(document.activeElement).toBe(elsewhere);
    });
  });
});
