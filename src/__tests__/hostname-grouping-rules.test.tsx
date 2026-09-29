import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { CustomGroup } from '../types';
import { HostnameGroupingRules } from '../dashboard/components/settings/HostnameGroupingRules';
import { I18nProvider } from '../dashboard/providers/I18nProvider';

const GROUPS: CustomGroup[] = [
  { hostnameEndsWith: '.substack.com', groupKey: 'substack', groupLabel: "Author's Substack" },
  { hostname: 'wiki.corp.example', groupKey: 'wiki-corp-example', groupLabel: 'Wiki' },
];

function renderRules(groups: CustomGroup[], onRemove = vi.fn()) {
  render(
    <I18nProvider>
      <HostnameGroupingRules groups={groups} onRemove={onRemove} />
    </I18nProvider>,
  );
  return onRemove;
}

describe('HostnameGroupingRules', () => {
  afterEach(cleanup);

  it('lists every hostname rule still applied to grouping', () => {
    renderRules(GROUPS);

    expect(screen.getByText("Author's Substack")).toBeTruthy();
    expect(screen.getByText('*.substack.com')).toBeTruthy();
    expect(screen.getByText('Wiki')).toBeTruthy();
    expect(screen.getByText('wiki.corp.example')).toBeTruthy();
  });

  it('removes a rule by its group key', () => {
    const onRemove = renderRules(GROUPS);

    fireEvent.click(screen.getByRole('button', { name: 'Remove rule Wiki' }));

    expect(onRemove).toHaveBeenCalledWith('wiki-corp-example');
  });

  it('renders nothing when there are no rules', () => {
    renderRules([]);

    expect(screen.queryByRole('list')).toBeNull();
  });
});
