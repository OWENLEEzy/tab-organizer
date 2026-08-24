import { afterEach, describe, it, expect, vi } from 'vitest';
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

  it('Escape closes the menu and returns focus to the trigger button', () => {
    render(
      <I18nProvider>
        <MoveToSectionMenu
          sections={SECTIONS}
          currentSectionId={null}
          onMoveToSection={vi.fn()}
          onMoveToNoSection={vi.fn()}
          groupName="GitHub"
        />
      </I18nProvider>,
    );
    const trigger = screen.getByRole('button', { name: /Move GitHub to a section/ });
    fireEvent.click(trigger);

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });
});
