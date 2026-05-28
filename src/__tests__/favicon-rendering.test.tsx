import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { I18nProvider } from '../newtab/providers/I18nProvider';
import { DomainCard } from '../newtab/components/tabs/DomainCard';
import { ProductTable } from '../newtab/components/tabs/ProductTable';
import { TabChip } from '../newtab/components/tabs/TabChip';
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
    isDashboard: false,
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
      <I18nProvider>
        <TabChip
          url="https://api-docs.deepseek.com/quick_start/token_usage"
          title="Token Usage - Api Docs"
          favIconUrl={favicon}
          duplicateCount={1}
          onFocus={() => {}}
          onClose={() => {}}
        />
      </I18nProvider>,
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
      <I18nProvider>
        <DomainCard
          group={group}
          onCloseDomain={() => {}}
          onCloseDuplicates={() => {}}
          onCloseTab={() => {}}
          onFocusTab={() => {}}
        />
      </I18nProvider>,
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
      <I18nProvider>
        <ProductTable
          items={[group]}
          sections={[]}
          assignmentByItemId={new Map()}
          onMoveItem={() => {}}
          onCloseProduct={() => {}}
          onCloseDuplicates={() => {}}
          onFocusTab={() => {}}
          expandedDomains={new Set()}
          onToggleExpanded={() => {}}
          onCloseTab={() => {}}
          onChipClick={() => {}}
          selectedUrls={new Set()}
          closingUrls={new Set()}
          focusedUrl={null}
        />
      </I18nProvider>,
    );

    expect(container.querySelector('.table-icon')?.getAttribute('src')).toBe(favicon);
  });

  it('keeps product table row order provided by the caller', () => {
    const first = {
      ...makeGroup([makeTab({ id: 1, url: 'https://b.example.com/a', favIconUrl: '' })]),
      id: 'b.example.com',
      domain: 'b.example.com',
      friendlyName: 'B Product',
      order: 10,
    };
    const second = {
      ...makeGroup([makeTab({ id: 2, url: 'https://a.example.com/a', favIconUrl: '' })]),
      id: 'a.example.com',
      domain: 'a.example.com',
      friendlyName: 'A Product',
      order: 0,
    };

    const { container } = render(
      <I18nProvider>
        <ProductTable
          items={[first, second]}
          sections={[]}
          assignmentByItemId={new Map()}
          onMoveItem={() => {}}
          onCloseProduct={() => {}}
          onCloseDuplicates={() => {}}
          onFocusTab={() => {}}
        />
      </I18nProvider>,
    );

    expect([...container.querySelectorAll('.product-table-name > span:last-child')]
      .map((node) => node.textContent)).toEqual(['B Product', 'A Product']);
  });

  it('falls back to initials when favicon is missing or fails to load', () => {
    const { container, getAllByText } = render(
      <I18nProvider>
        <DomainCard
          group={makeGroup([makeTab({ url: 'https://api-docs.deepseek.com/a', favIconUrl: '' })])}
          onCloseDomain={() => {}}
          onCloseDuplicates={() => {}}
          onCloseTab={() => {}}
          onFocusTab={() => {}}
        />
      </I18nProvider>,
    );

    expect(container.querySelector('img')).toBeNull();
    expect(getAllByText('D').length).toBeGreaterThan(0);
  });

  it('falls back to a tab initial when a tab favicon image fails', () => {
    const { container, getByText } = render(
      <I18nProvider>
        <TabChip
          url="https://api-docs.deepseek.com/quick_start/token_usage"
          title="DeepSeek usage"
          favIconUrl="https://api-docs.deepseek.com/missing.ico"
          duplicateCount={1}
          onFocus={() => {}}
          onClose={() => {}}
        />
      </I18nProvider>,
    );

    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    fireEvent.error(img!);
    expect(getByText('D')).toBeInTheDocument();
  });
});