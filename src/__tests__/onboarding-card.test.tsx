import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { SectionTemplate } from '../config/sections';
import type { TabGroup } from '../types';
import { I18nProvider } from '../dashboard/providers/I18nProvider';
import { OnboardingCard } from '../dashboard/components/onboarding/OnboardingCard';

afterEach(() => {
  cleanup();
});

const TEMPLATES: SectionTemplate[] = [
  { id: 'section-dev', name: 'Dev', emoji: '💻', keywords: ['github'] },
  { id: 'section-shopping', name: 'Shopping', emoji: '🛒', keywords: ['amazon'] },
];

const PRODUCTS: TabGroup[] = [{
  id: 'github', domain: 'github.com', friendlyName: 'GitHub', productKey: 'github',
  tabs: [], collapsed: false, order: 0, color: '#000', hasDuplicates: false, duplicateCount: 0,
}];

const HOSTNAMES = new Map<string, readonly string[]>([['github', ['github.com']]]);

function setup() {
  const onConfirm = vi.fn();
  const onSkip = vi.fn();
  render(
    <I18nProvider>
      <OnboardingCard
        templates={TEMPLATES}
        products={PRODUCTS}
        hostnamesByProductKey={HOSTNAMES}
        onConfirm={onConfirm}
        onSkip={onSkip}
      />
    </I18nProvider>,
  );
  return { onConfirm, onSkip };
}

describe('OnboardingCard', () => {
  it('preselects templates that match open groups and leaves non-matching ones selectable', () => {
    setup();
    expect(screen.getByRole('checkbox', { name: /Dev/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Shopping/ })).not.toBeChecked();
    expect(screen.getByText('No groups matched')).toBeInTheDocument();
  });

  it('persists only checked templates, with their keywords as rules and matches as assignments', () => {
    const { onConfirm } = setup();

    fireEvent.click(screen.getByRole('button', { name: /Create these/ }));

    expect(onConfirm).toHaveBeenCalledWith(
      [expect.objectContaining({
        id: 'section-dev',
        name: 'Dev',
        emoji: '💻',
        order: 0,
        autoRules: [{ kind: 'keyword', value: 'github' }],
      })],
      [{ productKey: 'github', sectionId: 'section-dev' }],
    );
  });

  it('lets the user add a keyword before confirming', () => {
    const { onConfirm } = setup();

    fireEvent.click(screen.getByRole('button', { name: /Show keywords for Dev/ }));
    fireEvent.change(screen.getByLabelText('Keywords'), { target: { value: 'GitLab' } });
    fireEvent.keyDown(screen.getByLabelText('Keywords'), { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: /Create these/ }));

    expect(onConfirm.mock.calls[0][0][0].autoRules).toEqual([
      { kind: 'keyword', value: 'github' },
      { kind: 'keyword', value: 'gitlab' },
    ]);
  });

  it('keeps a checked template with no matches, creating an empty section', () => {
    const { onConfirm } = setup();

    fireEvent.click(screen.getByRole('checkbox', { name: /Shopping/ }));
    fireEvent.click(screen.getByRole('button', { name: /Create these/ }));

    expect(onConfirm.mock.calls[0][0]).toHaveLength(2);
  });

  it('skipping persists nothing', () => {
    const { onSkip, onConfirm } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Start empty/ }));
    expect(onSkip).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('carries a template extra rules into the confirmed section autoRules', () => {
    const onConfirm = vi.fn();
    const onSkip = vi.fn();
    const templates: SectionTemplate[] = [
      {
        id: 'section-social',
        name: 'Social',
        emoji: '💬',
        keywords: ['discord'],
        extraRules: [{ kind: 'regex', pattern: 'reddit\\.com/message' }],
      },
    ];
    render(
      <I18nProvider>
        <OnboardingCard
          templates={templates}
          products={[]}
          hostnamesByProductKey={new Map()}
          onConfirm={onConfirm}
          onSkip={onSkip}
        />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: /Social/ }));
    fireEvent.click(screen.getByRole('button', { name: /Create these/ }));

    expect(onConfirm.mock.calls[0][0][0].autoRules).toEqual([
      { kind: 'keyword', value: 'discord' },
      { kind: 'regex', pattern: 'reddit\\.com/message' },
    ]);
  });

  it('never shows the same group as a match for two checked templates at once', () => {
    // 'git' label-prefix-matches github.com, same as 'github' — a real overlap.
    const templates: SectionTemplate[] = [
      { id: 'section-dev', name: 'Dev', emoji: '💻', keywords: ['github'] },
      { id: 'section-broad', name: 'Broad', emoji: '🌐', keywords: ['git'] },
    ];
    const products = [{
      id: 'github', domain: 'github.com', friendlyName: 'GitHub', productKey: 'github',
      tabs: [], collapsed: false, order: 0, color: '#000', hasDuplicates: false, duplicateCount: 0,
    }];
    const hostnames = new Map<string, readonly string[]>([['github', ['github.com']]]);

    render(
      <I18nProvider>
        <OnboardingCard
          templates={templates}
          products={products}
          hostnamesByProductKey={hostnames}
          onConfirm={vi.fn()}
          onSkip={vi.fn()}
        />
      </I18nProvider>,
    );

    // Both templates independently match github.com, so both preselect checked.
    expect(screen.getByRole('checkbox', { name: /Dev/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Broad/ })).toBeChecked();

    // Dev comes first in template order and wins the real arbitration; Broad
    // must not also claim it in the preview shown next to its checkbox.
    expect(screen.getByText('collects 1 groups')).toBeInTheDocument();
    expect(screen.getByText('No groups matched')).toBeInTheDocument();
  });

  it('traps focus inside the dialog on open', () => {
    setup();

    const dialog = screen.getByRole('dialog');
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    expect(focusable.length).toBeGreaterThan(0);
    expect(document.activeElement).toBe(focusable[0]);
  });

  it('does not skip or confirm on Escape — the card is non-cancelable except via its two buttons', () => {
    const { onSkip, onConfirm } = setup();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onSkip).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
