import { describe, it, expect } from 'vitest';
import { resolveProduct } from '../lib/resolve-product';
import type { CustomGroup } from '../types';

describe('resolveProduct', () => {
  it('falls back to the built-in product identity when no override matches', () => {
    expect(resolveProduct('github.com').key).toBe('github');
    expect(resolveProduct('mail.google.com').key).toBe('gmail');
  });

  it('applies an exact-hostname custom override', () => {
    const custom: CustomGroup[] = [
      { groupKey: 'work', groupLabel: 'Work', hostname: 'intranet.acme.com' },
    ];
    const product = resolveProduct('intranet.acme.com', custom);
    expect(product.key).toBe('work');
    expect(product.label).toBe('Work');
  });

  it('applies a suffix custom override', () => {
    const custom: CustomGroup[] = [
      { groupKey: 'work', groupLabel: 'Work', hostnameEndsWith: '.acme.com' },
    ];
    expect(resolveProduct('git.acme.com', custom).key).toBe('work');
  });

  it('keeps local-address identity (host+port) through resolution', () => {
    expect(resolveProduct('localhost:3000').key).toBe('localhost:3000');
    expect(resolveProduct('localhost:3000').label).toBe('localhost:3000');
  });
});
