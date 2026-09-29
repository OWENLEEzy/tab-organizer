import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { I18nProvider } from '../dashboard/providers/I18nProvider';
import { SectionRulesWorkbench } from '../dashboard/components/settings/SectionRulesWorkbench';
import type { Section, TabGroup } from '../types';

afterEach(() => {
  cleanup();
});

function group(domain: string, productKey: string, tabCount = 1): TabGroup {
  return {
    id: productKey, domain, friendlyName: domain, productKey,
    tabs: Array.from({ length: tabCount }, (_, i) => ({
      id: i, url: `https://${domain}/`, title: domain, favIconUrl: '', domain,
      windowId: 1, active: false, isDashboard: false, isDuplicate: false,
      isLandingPage: false, duplicateCount: 0,
    })),
    collapsed: false, order: 0, color: '#000', hasDuplicates: false, duplicateCount: 0,
  };
}

const SECTIONS: Section[] = [
  { id: 'dev', name: 'Dev', order: 0, emoji: '💻', autoRules: [{ kind: 'keyword', value: 'github' }] },
  { id: 'design', name: 'Design', order: 1, emoji: '🎨', autoRules: [{ kind: 'keyword', value: 'figma' }] },
];

function renderWorkbench(overrides: Partial<React.ComponentProps<typeof SectionRulesWorkbench>> = {}) {
  const props = {
    sections: SECTIONS,
    products: [group('github.com', 'github', 7), group('figma.com', 'figma', 3)],
    hostnamesByProductKey: new Map<string, readonly string[]>([
      ['github', ['github.com']],
      ['figma', ['figma.com']],
    ]),
    assignments: [{ productKey: 'figma', sectionId: 'design' }],
    unsectionedProductKeys: [],
    productCountBySectionId: new Map([['dev', 1], ['design', 1]]),
    onUpdateSection: vi.fn(),
    onCreateSection: vi.fn(),
    onDeleteSection: vi.fn(),
    onAssignProducts: vi.fn(),
    ...overrides,
  };
  const { rerender } = render(
    <I18nProvider>
      <SectionRulesWorkbench {...props} />
    </I18nProvider>,
  );
  return {
    ...props,
    rerender: (nextOverrides: Partial<React.ComponentProps<typeof SectionRulesWorkbench>>) => {
      const nextProps = { ...props, ...nextOverrides };
      rerender(
        <I18nProvider>
          <SectionRulesWorkbench {...nextProps} />
        </I18nProvider>,
      );
      return nextProps;
    },
  };
}

describe('SectionRulesWorkbench', () => {
  it('shows a create-one prompt, not the pick-a-section prompt, when there are zero sections', () => {
    renderWorkbench({
      sections: [],
      products: [],
      hostnamesByProductKey: new Map(),
      assignments: [],
      productCountBySectionId: new Map(),
    });

    expect(screen.getByText('No sections yet — create one on the left to get started')).toBeInTheDocument();
    expect(screen.queryByText('Pick a section on the left')).not.toBeInTheDocument();
  });

  it('lists every section including empty ones', () => {
    renderWorkbench({ productCountBySectionId: new Map([['dev', 0], ['design', 0]]) });
    expect(screen.getByRole('button', { name: /Dev/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Design/ })).toBeInTheDocument();
  });

  it('selects the first section and previews its matches', () => {
    renderWorkbench();
    expect(screen.getByText('github.com')).toBeInTheDocument();
  });

  it('adding a keyword writes a normalized keyword rule', () => {
    const props = renderWorkbench();

    fireEvent.change(screen.getByLabelText('Keywords'), { target: { value: 'GitLab' } });
    fireEvent.keyDown(screen.getByLabelText('Keywords'), { key: 'Enter' });

    expect(props.onUpdateSection).toHaveBeenCalledWith('dev', {
      autoRules: [
        { kind: 'keyword', value: 'github' },
        { kind: 'keyword', value: 'gitlab' },
      ],
    });
  });

  it('does not promise a will-take match when the typed keyword collides with another section (call shape)', () => {
    const props = renderWorkbench();

    fireEvent.change(screen.getByLabelText('Keywords'), { target: { value: 'figma' } });
    fireEvent.keyDown(screen.getByLabelText('Keywords'), { key: 'Enter' });

    // The parent re-renders with the new rules in the real app; assert the call shape.
    expect(props.onUpdateSection).toHaveBeenCalledWith('dev', {
      autoRules: [
        { kind: 'keyword', value: 'github' },
        { kind: 'keyword', value: 'figma' },
      ],
    });
  });

  it('shows a group owned by another section as blocked, not as will-take', () => {
    // Render with the collision already present in `dev`'s rules (not produced by
    // simulated typing) so the blocked state is asserted from a real render, not
    // just inferred from the onUpdateSection call shape above.
    const sectionsWithCollision: Section[] = [
      {
        id: 'dev', name: 'Dev', order: 0, emoji: '💻',
        autoRules: [{ kind: 'keyword', value: 'github' }, { kind: 'keyword', value: 'figma' }],
      },
      { id: 'design', name: 'Design', order: 1, emoji: '🎨', autoRules: [{ kind: 'keyword', value: 'figma' }] },
    ];

    renderWorkbench({ sections: sectionsWithCollision });

    // `dev` is selected by default (first section). Figma is explicitly assigned to
    // `design`, so even though `dev`'s rules now also match figma.com, the preview
    // must show it held by Design rather than promising a will-take move.
    expect(screen.getByText('figma.com')).toBeInTheDocument();
    expect(
      screen.getByText('"Design" claims it — rules here will not move it'),
    ).toBeInTheDocument();

    // github.com still genuinely will-take under dev's rules.
    expect(screen.getByText('github.com')).toBeInTheDocument();
    expect(screen.getByText('Will move here')).toBeInTheDocument();
  });

  it('"move them here too" moves only the blocked group, never a group the user pinned to unsectioned', () => {
    // `dev`'s rules match both figma.com (owned by `design`, i.e. blocked)
    // and gist.github.com (explicitly pinned to unsectioned by the user).
    const sectionsWithCollision: Section[] = [
      {
        id: 'dev', name: 'Dev', order: 0, emoji: '💻',
        autoRules: [{ kind: 'keyword', value: 'github' }, { kind: 'keyword', value: 'figma' }, { kind: 'keyword', value: 'gist' }],
      },
      { id: 'design', name: 'Design', order: 1, emoji: '🎨', autoRules: [{ kind: 'keyword', value: 'figma' }] },
    ];

    const props = renderWorkbench({
      sections: sectionsWithCollision,
      products: [
        group('github.com', 'github', 7),
        group('figma.com', 'figma', 3),
        group('gist.github.com', 'gist', 1),
      ],
      hostnamesByProductKey: new Map<string, readonly string[]>([
        ['github', ['github.com']],
        ['figma', ['figma.com']],
        ['gist', ['gist.github.com']],
      ]),
      unsectionedProductKeys: ['gist'],
    });

    const button = screen.getByRole('button', { name: 'Move it here too' });
    fireEvent.click(button);

    expect(props.onAssignProducts).toHaveBeenCalledWith(['figma'], 'dev');
  });

  it('creating a section trims the name', () => {
    const props = renderWorkbench();

    fireEvent.change(screen.getByPlaceholderText('New section'), { target: { value: '  Side  ' } });
    fireEvent.keyDown(screen.getByPlaceholderText('New section'), { key: 'Enter' });

    expect(props.onCreateSection).toHaveBeenCalledWith('Side');
  });

  it('selects a newly created section once it appears in `sections`, instead of leaving the previous selection in place', () => {
    const props = renderWorkbench();

    // `Dev` (the first section) is selected by default.
    expect(screen.getByText('github.com')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('New section'), { target: { value: 'Reading' } });
    fireEvent.keyDown(screen.getByPlaceholderText('New section'), { key: 'Enter' });
    expect(props.onCreateSection).toHaveBeenCalledWith('Reading');

    // `onCreateSection` is fire-and-forget; the real app round-trips through
    // the store and re-renders with the new section appended to `sections`.
    const newSection: Section = { id: 'reading-id', name: 'Reading', order: 2 };
    props.rerender({ sections: [...SECTIONS, newSection] });

    // The editor pane now shows the newly created section, not the one that
    // was selected before, and not the pick-a-section prompt.
    expect(screen.getByRole('button', { name: /Reading/ })).toHaveClass('text-accent-blue');
    expect(screen.queryByText('Pick a section on the left')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Reading')).toBeInTheDocument();
  });

  it('rejects a duplicate section name, case- and whitespace-insensitively', () => {
    const props = renderWorkbench();

    fireEvent.change(screen.getByPlaceholderText('New section'), { target: { value: '  DEV  ' } });
    fireEvent.keyDown(screen.getByPlaceholderText('New section'), { key: 'Enter' });

    expect(props.onCreateSection).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('A section with this name already exists.');
  });

  describe('advanced regex editor', () => {
    function regexBox(): HTMLTextAreaElement {
      return screen.getByRole('textbox', { name: 'Advanced: use a regex' }) as HTMLTextAreaElement;
    }

    it('keeps an incomplete pattern in the box while the user is still typing it', () => {
      renderWorkbench();

      fireEvent.focus(regexBox());
      fireEvent.change(regexBox(), { target: { value: '(' } });
      expect(regexBox().value).toBe('(');
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid regular expression');

      fireEvent.change(regexBox(), { target: { value: '(foo)' } });
      expect(regexBox().value).toBe('(foo)');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('saves only the finished text on blur, never a half-typed prefix', () => {
      const props = renderWorkbench();

      fireEvent.focus(regexBox());
      // `.` alone is valid and would claim every open product if it were saved.
      fireEvent.change(regexBox(), { target: { value: '.' } });
      fireEvent.change(regexBox(), { target: { value: '.docs' } });
      expect(props.onUpdateSection).not.toHaveBeenCalled();

      fireEvent.blur(regexBox());
      expect(props.onUpdateSection).toHaveBeenCalledTimes(1);
      expect(props.onUpdateSection).toHaveBeenCalledWith('dev', {
        autoRules: [
          { kind: 'keyword', value: 'github' },
          { kind: 'regex', pattern: '.docs' },
        ],
      });
    });

    it('keeps an invalid draft and its error after blur instead of saving or discarding it', () => {
      const props = renderWorkbench();

      fireEvent.focus(regexBox());
      fireEvent.change(regexBox(), { target: { value: 'ok\n(' } });
      fireEvent.blur(regexBox());

      expect(props.onUpdateSection).not.toHaveBeenCalled();
      expect(regexBox().value).toBe('ok\n(');
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('keeps a trailing blank line so Enter can start the next pattern', () => {
      renderWorkbench();

      fireEvent.focus(regexBox());
      fireEvent.change(regexBox(), { target: { value: 'foo\n' } });
      expect(regexBox().value).toBe('foo\n');
    });

    it('does not write when the finished text parses to the saved patterns', () => {
      const props = renderWorkbench({
        sections: SECTIONS.map((s) => (s.id === 'dev'
          ? { ...s, autoRules: [...(s.autoRules ?? []), { kind: 'regex', pattern: 'foo' }] }
          : s)),
      });

      fireEvent.focus(regexBox());
      fireEvent.change(regexBox(), { target: { value: 'foo\n\n' } });
      fireEvent.blur(regexBox());

      expect(props.onUpdateSection).not.toHaveBeenCalled();
    });

    it('shows rules saved elsewhere, e.g. by a backup import, when not editing', () => {
      const props = renderWorkbench();
      expect(regexBox().value).toBe('');

      props.rerender({
        sections: SECTIONS.map((s) => (s.id === 'dev'
          ? { ...s, autoRules: [...(s.autoRules ?? []), { kind: 'regex', pattern: 'imported' }] }
          : s)),
      });

      expect(regexBox().value).toBe('imported');
    });

    it('clears the draft and its error when another section is selected', () => {
      renderWorkbench();

      fireEvent.focus(regexBox());
      fireEvent.change(regexBox(), { target: { value: '(' } });
      expect(screen.getByRole('alert')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Design/ }));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(regexBox().value).toBe('');
    });
  });
  describe('section list and editor', () => {
    it('marks the selected section as pressed and labels its group count', () => {
      renderWorkbench({ productCountBySectionId: new Map([['dev', 1], ['design', 4]]) });

      expect(screen.getByRole('button', { name: /Dev/ })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: /Design/ })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: /Dev.*1 group$/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Design.*4 groups$/ })).toBeInTheDocument();
    });

    it('moves focus off the delete button so a second Enter cannot delete the next section', () => {
      const { onDeleteSection } = renderWorkbench();
      const del = screen.getByRole('button', { name: 'Delete Section' });
      del.focus();
      fireEvent.click(del);

      expect(onDeleteSection).toHaveBeenCalledWith('dev');
      expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'New section' }));
    });

    it('drops a half-typed keyword and its error when another section is selected', () => {
      renderWorkbench();
      const input = screen.getByLabelText(/keyword/i, { selector: 'input' }) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'half' } });
      fireEvent.click(screen.getByRole('button', { name: /Design/ }));

      expect((screen.getByLabelText(/keyword/i, { selector: 'input' }) as HTMLInputElement).value).toBe('');
    });

    it('saves a renamed section once, trimmed, on blur — not on every keystroke', () => {
      const { onUpdateSection } = renderWorkbench();
      const name = screen.getByRole('textbox', { name: 'Section name' });
      fireEvent.change(name, { target: { value: '  Code ' } });
      expect(onUpdateSection).not.toHaveBeenCalled();

      fireEvent.blur(name);
      expect(onUpdateSection).toHaveBeenCalledTimes(1);
      expect(onUpdateSection).toHaveBeenCalledWith('dev', { name: 'Code' });
    });

    it('rejects an empty or duplicate section name and restores the saved one', () => {
      const { onUpdateSection } = renderWorkbench();
      const name = screen.getByRole('textbox', { name: 'Section name' }) as HTMLInputElement;

      fireEvent.change(name, { target: { value: '   ' } });
      fireEvent.blur(name);
      expect(name.value).toBe('Dev');

      fireEvent.change(name, { target: { value: ' design ' } });
      fireEvent.blur(name);
      expect(name.value).toBe('Dev');
      expect(screen.getByRole('alert')).toHaveTextContent('A section with this name already exists.');
      expect(onUpdateSection).not.toHaveBeenCalled();
    });

    it('accepts a multi-codepoint emoji and keeps only the newest one', () => {
      const { onUpdateSection } = renderWorkbench();
      const emoji = screen.getByRole('textbox', { name: /emoji/i });
      fireEvent.change(emoji, { target: { value: '💻👩‍💻' } });

      expect(onUpdateSection).toHaveBeenCalledWith('dev', { emoji: '👩‍💻' });
    });
  });
});
