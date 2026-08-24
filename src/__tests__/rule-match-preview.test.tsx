import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { I18nProvider } from '../dashboard/providers/I18nProvider';
import { RuleMatchPreview } from '../dashboard/components/settings/RuleMatchPreview';
import type { RulePreviewRow } from '../lib/rule-preview';
import { makeTabGroup } from './factories';

afterEach(() => {
  cleanup();
});

function renderPreview(props: {
  rows: readonly RulePreviewRow[];
  sectionNameById?: ReadonlyMap<string, string>;
  onMoveBlockedHere?: () => void;
}) {
  return render(
    <I18nProvider>
      <RuleMatchPreview
        rows={props.rows}
        sectionNameById={props.sectionNameById ?? new Map()}
        onMoveBlockedHere={props.onMoveBlockedHere}
      />
    </I18nProvider>,
  );
}

const GITHUB = makeTabGroup({
  id: 'github',
  domain: 'github.com',
  friendlyName: 'GitHub',
  tabs: [{ id: 1, url: 'https://github.com', title: 'a', favIconUrl: '', domain: 'github.com', windowId: 1, active: false, isDashboard: false, isDuplicate: false, isLandingPage: false, duplicateCount: 0 }, { id: 2, url: 'https://github.com/b', title: 'b', favIconUrl: '', domain: 'github.com', windowId: 1, active: false, isDashboard: false, isDuplicate: false, isLandingPage: false, duplicateCount: 0 }],
});

const FIGMA = makeTabGroup({ id: 'figma', domain: 'figma.com', friendlyName: 'Figma' });
const GIST = makeTabGroup({ id: 'gist', domain: 'gist.github.com', friendlyName: 'Gist' });

describe('RuleMatchPreview', () => {
  it('renders a will-take row with the product name, its tab count, and a text status (not color alone)', () => {
    renderPreview({ rows: [{ product: GITHUB, status: 'will-take', blockedBySectionId: null }] });

    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('2 tabs')).toBeInTheDocument();
    expect(screen.getByText('Will move here')).toBeInTheDocument();
  });

  it('renders a blocked row with the blocking section name resolved through sectionNameById', () => {
    renderPreview({
      rows: [{ product: FIGMA, status: 'blocked', blockedBySectionId: 'design' }],
      sectionNameById: new Map([['design', 'Design']]),
    });

    expect(screen.getByText('Figma')).toBeInTheDocument();
    expect(screen.getByText('"Design" claims it — rules here will not move it')).toBeInTheDocument();
  });

  it('renders a pinned row with the pinned message', () => {
    renderPreview({ rows: [{ product: GIST, status: 'pinned', blockedBySectionId: null }] });

    expect(screen.getByText('Gist')).toBeInTheDocument();
    expect(screen.getByText('Pinned out of sections — rules will not collect it')).toBeInTheDocument();
  });

  it('renders the empty-state message when rows is empty', () => {
    renderPreview({ rows: [] });

    expect(screen.getByText('No groups match yet')).toBeInTheDocument();
  });

  it('does not offer "move blocked here" when every row already will-take', () => {
    renderPreview({
      rows: [{ product: GITHUB, status: 'will-take', blockedBySectionId: null }],
      onMoveBlockedHere: vi.fn(),
    });

    expect(screen.queryByRole('button', { name: /Move these/ })).not.toBeInTheDocument();
  });

  it('does not offer "move blocked here" when the callback is absent, even with blocked rows', () => {
    renderPreview({
      rows: [{ product: FIGMA, status: 'blocked', blockedBySectionId: 'design' }],
      sectionNameById: new Map([['design', 'Design']]),
    });

    expect(screen.queryByRole('button', { name: /Move these/ })).not.toBeInTheDocument();
  });

  it('offers "move blocked here" when at least one row is blocked, and fires with no arguments', () => {
    const onMoveBlockedHere = vi.fn();
    renderPreview({
      rows: [
        { product: GITHUB, status: 'will-take', blockedBySectionId: null },
        { product: FIGMA, status: 'blocked', blockedBySectionId: 'design' },
        { product: GIST, status: 'pinned', blockedBySectionId: null },
      ],
      sectionNameById: new Map([['design', 'Design']]),
      onMoveBlockedHere,
    });

    const button = screen.getByRole('button', { name: 'Move this 1 here too' });
    button.click();

    expect(onMoveBlockedHere).toHaveBeenCalledTimes(1);
    expect(onMoveBlockedHere).toHaveBeenCalledWith();
  });

  it('counts only blocked rows in the button, not pinned ones, when both are present', () => {
    renderPreview({
      rows: [
        { product: FIGMA, status: 'blocked', blockedBySectionId: 'design' },
        { product: GIST, status: 'pinned', blockedBySectionId: null },
      ],
      sectionNameById: new Map([['design', 'Design']]),
      onMoveBlockedHere: vi.fn(),
    });

    expect(screen.getByRole('button', { name: 'Move this 1 here too' })).toBeInTheDocument();
    // Both rows are still listed with their own distinct status text.
    expect(screen.getByText('"Design" claims it — rules here will not move it')).toBeInTheDocument();
    expect(screen.getByText('Pinned out of sections — rules will not collect it')).toBeInTheDocument();
  });

  it('does not offer "move blocked here" when every held row is pinned, even with the callback present', () => {
    renderPreview({
      rows: [{ product: GIST, status: 'pinned', blockedBySectionId: null }],
      onMoveBlockedHere: vi.fn(),
    });

    expect(screen.queryByRole('button', { name: /Move these/ })).not.toBeInTheDocument();
  });
});
