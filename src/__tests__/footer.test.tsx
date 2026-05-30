import { I18nProvider } from '../dashboard/providers/I18nProvider';
import { render, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Footer } from '../dashboard/components/layout/Footer';

const footerSource = readFileSync(
  join(process.cwd(), 'src/dashboard/components/layout/Footer.tsx'),
  'utf8',
);

function renderFooter(props: {
  tabCount: number;
  duplicateCount: number;
  groupCount?: number;
  sectionCount?: number;
  alerts?: { id: string; label: string; actionLabel?: string; onAction?: () => void }[];
}) {
  const result = render(
    <I18nProvider>
      <Footer {...props} />
    </I18nProvider>,
  );
  const footer = result.container.querySelector('footer')!;
  return { ...result, footer };
}

describe('Footer', () => {
  it('links to the bare feedback form without local runtime metadata', () => {
    const { footer } = renderFooter({ tabCount: 42, duplicateCount: 0 });

    const feedback = within(footer).getByRole('link', { name: 'Feedback' });
    const href = feedback.getAttribute('href') ?? '';

    expect(href).toBe('https://docs.google.com/forms/d/e/1FAIpQLSfXJ6osy2J84TLpyLE-DYA-NcWMcjRAZbcTHBOZV9RnQ7WEfA/viewform');
    expect(href).not.toContain('entry.');
    expect(href).not.toContain('42');
  });

  it('links to the GitHub repository', () => {
    const { footer } = renderFooter({ tabCount: 0, duplicateCount: 0 });

    const github = within(footer).getByRole('link', { name: 'GitHub' });
    expect(github.getAttribute('href')).toBe('https://github.com/OWENLEEzy/tab-organizer');
  });

  it('renders all metric counts with labels', () => {
    const { footer } = renderFooter({ tabCount: 15, duplicateCount: 0, groupCount: 5, sectionCount: 3 });

    expect(within(footer).getByText('15')).toBeInTheDocument();
    expect(within(footer).getByText('tabs')).toBeInTheDocument();
    expect(within(footer).getByText('5')).toBeInTheDocument();
    expect(within(footer).getByText('groups')).toBeInTheDocument();
    expect(within(footer).getByText('3')).toBeInTheDocument();
    expect(within(footer).getByText('sections')).toBeInTheDocument();
  });

  it('hides the duplicate metric when count is zero', () => {
    const { footer } = renderFooter({ tabCount: 10, duplicateCount: 0 });

    expect(within(footer).queryByText('duplicates')).not.toBeInTheDocument();
  });

  it('shows the duplicate metric when count is positive', () => {
    const { footer } = renderFooter({ tabCount: 10, duplicateCount: 4 });

    expect(within(footer).getByText('4')).toBeInTheDocument();
    expect(within(footer).getByText('duplicates')).toBeInTheDocument();
  });

  it('renders alerts with action buttons', () => {
    const { footer } = renderFooter({
      tabCount: 10,
      duplicateCount: 0,
      alerts: [{ id: 'warn-1', label: 'Storage full', actionLabel: 'Clear', onAction: () => {} }],
    });

    expect(within(footer).getByText('Storage full')).toBeInTheDocument();
    expect(within(footer).getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('provides accessible title attributes on metric pills', () => {
    const { footer } = renderFooter({ tabCount: 7, duplicateCount: 2, groupCount: 3, sectionCount: 1 });

    expect(within(footer).getByTitle('7 tabs')).toBeInTheDocument();
    expect(within(footer).getByTitle('3 groups')).toBeInTheDocument();
    expect(within(footer).getByTitle('1 sections')).toBeInTheDocument();
    expect(within(footer).getByTitle('2 duplicates')).toBeInTheDocument();
  });

  it('has accessible footer landmark', () => {
    const { footer } = renderFooter({ tabCount: 0, duplicateCount: 0 });

    expect(footer.tagName.toLowerCase()).toBe('footer');
    expect(footer.getAttribute('aria-label')).toBe('Dashboard footer');
  });
});

describe('Footer source invariants', () => {
  it('declares URL constants at module scope, not inside the component', () => {
    const lines = footerSource.split('\n');

    let githubLine = -1;
    let feedbackLine = -1;
    let componentStart = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes("GITHUB_URL = '")) githubLine = i;
      if (line.includes("FEEDBACK_URL = '")) feedbackLine = i;
      if (line.includes('export function Footer')) componentStart = i;
    }

    expect(githubLine).toBeGreaterThan(-1);
    expect(feedbackLine).toBeGreaterThan(-1);
    expect(componentStart).toBeGreaterThan(-1);
    expect(githubLine).toBeLessThan(componentStart);
    expect(feedbackLine).toBeLessThan(componentStart);
  });
});
