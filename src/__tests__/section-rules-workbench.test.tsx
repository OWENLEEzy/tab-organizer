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
  render(
    <I18nProvider>
      <SectionRulesWorkbench {...props} />
    </I18nProvider>,
  );
  return props;
}

describe('SectionRulesWorkbench', () => {
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

  it('creating a section trims the name', () => {
    const props = renderWorkbench();

    fireEvent.change(screen.getByPlaceholderText('New section'), { target: { value: '  Side  ' } });
    fireEvent.keyDown(screen.getByPlaceholderText('New section'), { key: 'Enter' });

    expect(props.onCreateSection).toHaveBeenCalledWith('Side');
  });
});
