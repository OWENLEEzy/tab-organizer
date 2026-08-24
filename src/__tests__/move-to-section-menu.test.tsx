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
});
