import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../dashboard/providers/I18nProvider';
import { SectionActionsDropdown } from '../dashboard/components/sections/SectionActionsDropdown';

afterEach(cleanup);

describe('section actions', () => {
  it('keeps only Manage visible and deletes the chosen empty section through its menu', () => {
    const onDeleteSection = vi.fn();
    const populated = { id: 'other-populated', name: 'Other', order: 0 };
    const empty = { id: 'other-empty', name: 'Other', order: 1 };
    render(
      <I18nProvider>
        {[populated, empty].map((section, index) => (
          <SectionActionsDropdown key={section.id} section={section}
            title={section.name} tabCount={index === 0 ? 1 : 0}
            items={[]} onDeleteSection={onDeleteSection} onCloseSection={vi.fn()} />
        ))}
      </I18nProvider>,
    );
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
    fireEvent.click(screen.getAllByRole('button', { name: 'Manage Other' })[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDeleteSection).toHaveBeenCalledExactlyOnceWith(empty);
  });

  it('exposes rename and delete through a visible Manage button for populated sections', () => {
    const onDeleteSection = vi.fn();
    const onCloseSection = vi.fn();
    const section = { id: 'work', name: 'Work', order: 0 };
    render(
      <I18nProvider>
        <SectionActionsDropdown section={section} title="Work" tabCount={2}
          items={[]} onDeleteSection={onDeleteSection} onCloseSection={onCloseSection} />
      </I18nProvider>,
    );
    const manage = screen.getByRole('button', { name: 'Manage Work' });
    expect(manage).toHaveTextContent('Manage');
    fireEvent.click(manage);
    expect(screen.getByRole('button', { name: 'Rename' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDeleteSection).toHaveBeenCalledExactlyOnceWith(section);
    expect(onCloseSection).not.toHaveBeenCalled();
  });

  it('does not offer section deletion for the unsectioned container', () => {
    render(
      <I18nProvider>
        <SectionActionsDropdown title="No section" tabCount={1}
          items={[]} onDeleteSection={vi.fn()} onCloseSection={vi.fn()} />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Manage No section' }));
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close all' })).toBeVisible();
  });
});
