import { describe, it, expect } from 'vitest';
import { fallbackProductForHostname } from '../config/products';

describe('Fallback Identity Rigorous Isolation', () => {
  it('strictly isolates unrelated TLDs sharing the same label', () => {
    const domains = ['test.com', 'test.net', 'test.org', 'test.io', 'test.ai', 'test.app'];
    const products = domains.map(fallbackProductForHostname);

    // All should have the same pretty label
    products.forEach(p => expect(p.label).toBe('Test'));
    
    // But every single key MUST be unique
    const keys = new Set(products.map(p => p.key));
    expect(keys.size).toBe(domains.length);
    domains.forEach(d => expect(keys.has(d)).toBe(true));
  });

  it('isolates subdomains for unknown products to prevent accidental merging', () => {
    const subdomains = ['dev.internal.site', 'prod.internal.site', 'staging.internal.site'];
    const products = subdomains.map(fallbackProductForHostname);

    expect(new Set(products.map(p => p.key)).size).toBe(3);
    expect(products[0].label).toBe('Dev Internal Site');
  });

  it('handles public suffix subdomains (e.g. github.io) as distinct entities', () => {
    const userA = fallbackProductForHostname('user-a.github.io');
    const userB = fallbackProductForHostname('user-b.github.io');

    expect(userA.key).toBe('user-a.github.io');
    expect(userB.key).toBe('user-b.github.io');
    expect(userA.label).toBe('User A Github');
  });

  it('preserves regional identity for unmapped brands', () => {
    // Unmapped brand should not consolidate across countries
    const cn = fallbackProductForHostname('unmapped-brand.cn');
    const jp = fallbackProductForHostname('unmapped-brand.jp');

    expect(cn.key).toBe('unmapped-brand.cn');
    expect(jp.key).toBe('unmapped-brand.jp');
  });

  it('handles IP addresses and localhost correctly', () => {
    const ip = fallbackProductForHostname('127.0.0.1');
    const local = fallbackProductForHostname('localhost');

    expect(ip.key).toBe('127.0.0.1');
    expect(local.key).toBe('localhost');
    expect(ip.label).toBe('127 0 0 1');
  });

  it('properly handles complex hyphenated and dotted domains', () => {
    const complex = fallbackProductForHostname('my-very-long-brand-name.co.uk');
    expect(complex.key).toBe('my-very-long-brand-name.co.uk');
    expect(complex.label).toBe('My Very Long Brand Name');
  });
});
