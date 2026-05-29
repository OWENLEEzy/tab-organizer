import { describe, it, expect } from 'vitest';
import { getProductKey } from '../lib/product-key';

describe('getProductKey', () => {
  it('resolves productKey from the standard priority chain', () => {
    expect(getProductKey({ productKey: 'product', itemKey: 'item', domain: 'domain' })).toBe('product');
    expect(getProductKey({ itemKey: 'item', domain: 'domain' })).toBe('item');
    expect(getProductKey({ domain: 'domain' })).toBe('domain');
  });
});
