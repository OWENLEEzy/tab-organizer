import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { TabGroup } from '../types';
import { classifyProductGroup } from '../dashboard/lib/product-group-source';
import { ProductGroupRulesSection } from '../dashboard/components/settings/ProductGroupRulesSection';
import { I18nProvider } from '../dashboard/providers/I18nProvider';

function group(domain: string, productKey: string, friendlyName: string, hostname = domain): TabGroup {
  return {
    id: productKey, domain, friendlyName, productKey,
    tabs: [{ domain: hostname, url: `https://${hostname}/`, title: '', favIconUrl: '' } as TabGroup['tabs'][number]], collapsed: false, order: 0, color: '#000',
    hasDuplicates: false, duplicateCount: 0,
  };
}

const LABELS: Record<string, string> = { 'figma-com': 'My designs' };

describe('classifyProductGroup', () => {
  it('marks a group the user renamed as custom', () => {
    expect(classifyProductGroup(group('figma.com', 'figma-com', 'My designs'), LABELS)).toBe('custom');
  });

  it('does not treat a built-in default hostname rule as a user rename', () => {
    // e.g. the shipped `.substack.com` rule: nothing for the user to revert.
    expect(classifyProductGroup(group('substack', 'substack', "Author's Substack", 'author.substack.com'), {}))
      .toBe('built-in');
  });

  it('marks an unrecognized site grouped by its hostname as a domain fallback', () => {
    // Real fallback groups carry a prettified label, not the raw hostname.
    expect(classifyProductGroup(group('example.com', 'example.com', 'Example', 'www.example.com'), {}))
      .toBe('domain-fallback');
  });

  it('does not mistake an inherited object property for a rename', () => {
    expect(classifyProductGroup(group('constructor', 'constructor', 'Constructor'), {})).not.toBe('custom');
  });

  it('marks everything else as built-in', () => {
    expect(classifyProductGroup(group('github', 'github', 'GitHub', 'github.com'), {})).toBe('built-in');
  });
});

describe('ProductGroupRulesSection', () => {
  afterEach(() => {
    cleanup();
  });

  it('lists real open groups instead of blank inputs', () => {
    render(
      <I18nProvider>
        <ProductGroupRulesSection
          products={[group('github', 'github', 'GitHub', 'github.com')]}
          productLabels={{}}
          onRename={vi.fn()}
          onRevert={vi.fn()}
        />
      </I18nProvider>,
    );
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Built-in')).toBeInTheDocument();
  });

  it('highlights domain-fallback groups with a call to name them', () => {
    render(
      <I18nProvider>
        <ProductGroupRulesSection
          products={[group('example.com', 'example.com', 'Example')]}
          productLabels={{}}
          onRename={vi.fn()}
          onRevert={vi.fn()}
        />
      </I18nProvider>,
    );
    expect(screen.getByText('Give it a good name')).toBeInTheDocument();
  });

  it('offers Revert only for groups the user renamed', () => {
    render(
      <I18nProvider>
        <ProductGroupRulesSection
          products={[group('figma.com', 'figma-com', 'My designs')]}
          productLabels={LABELS}
          onRename={vi.fn()}
          onRevert={vi.fn()}
        />
      </I18nProvider>,
    );
    expect(screen.getByRole('button', { name: /Revert/ })).toBeInTheDocument();
  });

  it('renames by product key, never by the group\'s display domain', () => {
    const onRename = vi.fn();
    render(
      <I18nProvider>
        <ProductGroupRulesSection
          products={[group('youtube', 'youtube', 'YouTube')]}
          productLabels={{}}
          onRename={onRename}
          onRevert={vi.fn()}
        />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
    const input = screen.getByRole('textbox', { name: 'Rename' });
    fireEvent.change(input, { target: { value: 'Videos' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onRename).toHaveBeenCalledWith('youtube', 'Videos');
  });

  it('reverts by product key', () => {
    const onRevert = vi.fn();
    render(
      <I18nProvider>
        <ProductGroupRulesSection
          products={[group('figma.com', 'figma-com', 'My designs')]}
          productLabels={LABELS}
          onRename={vi.fn()}
          onRevert={onRevert}
        />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Revert' }));

    expect(onRevert).toHaveBeenCalledWith('figma-com');
  });
});
