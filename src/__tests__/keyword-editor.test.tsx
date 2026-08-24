import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { I18nProvider } from '../dashboard/providers/I18nProvider';
import { KeywordEditor } from '../dashboard/components/settings/KeywordEditor';

afterEach(() => {
  cleanup();
});

function renderEditor(props: { keywords: readonly string[]; onChange: (next: string[]) => void; inputId?: string }) {
  return render(
    <I18nProvider>
      <KeywordEditor keywords={props.keywords} onChange={props.onChange} inputId={props.inputId ?? 'k'} />
    </I18nProvider>,
  );
}

describe('KeywordEditor', () => {
  it('renders one chip per keyword', () => {
    renderEditor({ keywords: ['github', 'gitlab'], onChange: () => {} });
    expect(screen.getByText('github')).toBeInTheDocument();
    expect(screen.getByText('gitlab')).toBeInTheDocument();
  });

  it('normalizes on add', () => {
    const onChange = vi.fn();
    renderEditor({ keywords: ['github'], onChange });

    fireEvent.change(screen.getByLabelText('Keywords'), { target: { value: 'WWW.Figma.com/file' } });
    fireEvent.keyDown(screen.getByLabelText('Keywords'), { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(['github', 'figma.com']);
  });

  it('shows an error and does not add when the word has a space', () => {
    const onChange = vi.fn();
    renderEditor({ keywords: [], onChange });

    fireEvent.change(screen.getByLabelText('Keywords'), { target: { value: 'git hub' } });
    fireEvent.keyDown(screen.getByLabelText('Keywords'), { key: 'Enter' });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Cannot contain spaces');
  });

  it('rejects a duplicate case-insensitively', () => {
    const onChange = vi.fn();
    renderEditor({ keywords: ['github'], onChange });

    fireEvent.change(screen.getByLabelText('Keywords'), { target: { value: 'GitHub' } });
    fireEvent.keyDown(screen.getByLabelText('Keywords'), { key: 'Enter' });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('already has that word');
  });

  it('removes a keyword', () => {
    const onChange = vi.fn();
    renderEditor({ keywords: ['github', 'gitlab'], onChange });

    fireEvent.click(screen.getByLabelText('Remove keyword github'));

    expect(onChange).toHaveBeenCalledWith(['gitlab']);
  });
});
