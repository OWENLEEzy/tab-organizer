import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { DomainCard } from '../newtab/components/DomainCard';
import { ProductTable } from '../newtab/components/ProductTable';
import { TabChip } from '../newtab/components/TabChip';
import type { Tab, TabGroup } from '../types';

afterEach(() => {
  cleanup();
});

function makeTab(overrides: Partial<Tab> & Pick<Tab, 'url'>): Tab {
  return {
    id: 1,
    title: 'DeepSeek usage',
    favIconUrl: '',
    domain: 'api-docs.deepseek.com',
    windowId: 1,
    active: false,
    isTabOut: false,
    isDuplicate: false,
    isLandingPage: false,
    duplicateCount: 0,
    ...overrides,
  };
}

function makeGroup(tabs: Tab[]): TabGroup {
  return {
    id: 'api-docs.deepseek.com',
    domain: 'api-docs.deepseek.com',
    friendlyName: 'DeepSeek',
    itemType: 'product',
    itemKey: 'api-docs.deepseek.com',
    productKey: 'api-docs.deepseek.com',
    iconDomain: 'api-docs.deepseek.com',
    tabs,
    collapsed: false,
    order: 0,
    color: '#4DAB9A',
    hasDuplicates: false,
    duplicateCount: 0,
  };
}

describe('Chrome favicon rendering', () => {
  it('renders a tab chip with the Chrome-provided favicon URL', () => {
    const favicon = 'https://api-docs.deepseek.com/favicon.ico';
    const { container } = render(
      <TabChip
        url="https://api-docs.deepseek.com/quick_start/token_usage"
        title="Token Usage - Api Docs"
        favIconUrl={favicon}
        duplicateCount={1}
        onFocus={() => {}}
        onClose={() => {}}
      />,
    );

    expect(container.querySelector('img')?.getAttribute('src')).toBe(favicon);
  });

  it('renders a group card with the first Chrome-provided favicon URL in the group', () => {
    const favicon = 'https://api-docs.deepseek.com/assets/favicon.svg';
    const group = makeGroup([
      makeTab({ id: 1, url: 'https://api-docs.deepseek.com/a', favIconUrl: '' }),
      makeTab({ id: 2, url: 'https://api-docs.deepseek.com/b', favIconUrl: favicon }),
    ]);

    const { container } = render(
      <DomainCard
        group={group}
        onCloseDomain={() => {}}
        onCloseDuplicates={() => {}}
        onCloseTab={() => {}}
        onFocusTab={() => {}}
      />,
    );

    expect(container.querySelector('img')?.getAttribute('src')).toBe(favicon);
  });

  it('renders a product table row with the first Chrome-provided favicon URL in the group', () => {
    const favicon = 'https://api-docs.deepseek.com/favicon.png';
    const group = makeGroup([
      makeTab({ id: 1, url: 'https://api-docs.deepseek.com/a', favIconUrl: '' }),
      makeTab({ id: 2, url: 'https://api-docs.deepseek.com/b', favIconUrl: favicon }),
    ]);

    const { container } = render(
      <ProductTable
        items={[group]}
        sections={[]}
        assignmentByItemId={new Map()}
        onMoveItem={() => {}}
        onCloseDomain={() => {}}
        onCloseDuplicates={() => {}}
        onFocusTab={() => {}}
      />,
    );

    expect(container.querySelector('.table-icon')?.getAttribute('src')).toBe(favicon);
  });

  it('falls back to initials when favicon is missing or fails to load', () => {
    const { container, getAllByText } = render(
      <DomainCard
        group={makeGroup([makeTab({ url: 'https://api-docs.deepseek.com/a', favIconUrl: '' })])}
        onCloseDomain={() => {}}
        onCloseDuplicates={() => {}}
        onCloseTab={() => {}}
        onFocusTab={() => {}}
      />,
    );

    expect(container.querySelector('img')).toBeNull();
    expect(getAllByText('D').length).toBeGreaterThan(0);
  });

  it('falls back to a tab initial when a tab favicon image fails', () => {
    const { container, getByText } = render(
      <TabChip
        url="https://api-docs.deepseek.com/quick_start/token_usage"
        title="DeepSeek usage"
        favIconUrl="https://api-docs.deepseek.com/missing.ico"
        duplicateCount={1}
        onFocus={() => {}}
        onClose={() => {}}
      />,
    );

    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    fireEvent.error(img!);
    expect(getByText('D')).toBeInTheDocument();
  });
});
