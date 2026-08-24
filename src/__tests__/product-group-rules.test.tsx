import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { CustomGroup, TabGroup } from '../types';
import { classifyProductGroup } from '../dashboard/lib/product-group-source';
import { ProductGroupRulesSection } from '../dashboard/components/settings/ProductGroupRulesSection';
import { I18nProvider } from '../dashboard/providers/I18nProvider';

function group(domain: string, productKey: string, friendlyName: string): TabGroup {
  return {
    id: productKey, domain, friendlyName, productKey,
    tabs: [], collapsed: false, order: 0, color: '#000',
    hasDuplicates: false, duplicateCount: 0,
  };
}

const CUSTOM: CustomGroup[] = [{ hostname: 'figma.com', groupKey: 'figma-com', groupLabel: 'My designs' }];

describe('classifyProductGroup', () => {
  it('marks a group whose key matches a custom rule as custom', () => {
    expect(classifyProductGroup(group('figma.com', 'figma-com', 'My designs'), CUSTOM)).toBe('custom');
  });

  it('marks a group whose friendly name equals its raw domain as a domain fallback', () => {
    expect(classifyProductGroup(group('notion-static.com', 'notion-static.com', 'notion-static.com'), []))
      .toBe('domain-fallback');
  });

  it('marks everything else as built-in', () => {
    expect(classifyProductGroup(group('github.com', 'github', 'GitHub'), [])).toBe('built-in');
  });
});

describe('ProductGroupRulesSection', () => {
  it('lists real open groups instead of blank inputs', () => {
    render(
      <I18nProvider>
        <ProductGroupRulesSection
          products={[group('github.com', 'github', 'GitHub')]}
          customGroups={[]}
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
          products={[group('notion-static.com', 'notion-static.com', 'notion-static.com')]}
          customGroups={[]}
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
          customGroups={CUSTOM}
          onRename={vi.fn()}
          onRevert={vi.fn()}
        />
      </I18nProvider>,
    );
    expect(screen.getByRole('button', { name: /Revert/ })).toBeInTheDocument();
  });
});
