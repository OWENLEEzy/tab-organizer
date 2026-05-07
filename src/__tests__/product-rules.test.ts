import { describe, it, expect } from 'vitest';
import { productForHostname, fallbackProductForHostname } from '../config/products';

describe('Product Rules Configuration', () => {
  describe('productForHostname', () => {
    it('matches known products by exact hostname', () => {
      expect(productForHostname('mail.google.com').key).toBe('gmail');
      expect(productForHostname('github.com').key).toBe('github');
    });

    it('matches known products by suffix', () => {
      expect(productForHostname('my-app.vercel.app').key).toBe('vercel');
      expect(productForHostname('some-repo.github.com').key).toBe('github');
    });

    it('matches known products by regex patterns', () => {
      expect(productForHostname('google.co.uk').key).toBe('google');
      expect(productForHostname('www.google.com').key).toBe('google');
      expect(productForHostname('m.google.com').key).toBe('google');
      expect(productForHostname('amazon.co.jp').key).toBe('amazon');
      expect(productForHostname('www.amazon.com').key).toBe('amazon');
    });

    it('handles localized Wikipedia domains', () => {
      expect(productForHostname('en.wikipedia.org').key).toBe('wikipedia');
      expect(productForHostname('zh.wikipedia.org').key).toBe('wikipedia');
    });
  });

  describe('fallbackProductForHostname', () => {
    it('extracts clean labels from common domains', () => {
      const product = fallbackProductForHostname('stackoverflow.com');
      expect(product.label).toBe('Stackoverflow');
      expect(product.key).toBe('stackoverflow');
    });

    it('handles localized TLDs by consolidating to the base name', () => {
      // Both should map to 'google' key for consistency
      const hk = fallbackProductForHostname('google.com.hk');
      const tw = fallbackProductForHostname('google.com.tw');
      const uk = fallbackProductForHostname('google.co.uk');
      const jp = fallbackProductForHostname('google.co.jp');

      expect(hk.key).toBe('google');
      expect(tw.key).toBe('google');
      expect(uk.key).toBe('google');
      expect(jp.key).toBe('google');
      
      expect(hk.label).toBe('Google');
    });

    it('handles complex subdomains in unknown products', () => {
      const product = fallbackProductForHostname('sub.deep.example.io');
      expect(product.label).toBe('Sub Deep Example');
      expect(product.key).toBe('sub.deep.example');
    });

    it('strips www and m prefixes from labels and keys', () => {
      const product = fallbackProductForHostname('www.my-site.net');
      expect(product.label).toBe('My Site');
      expect(product.key).toBe('my-site');
    });

    it('handles domains with dashes', () => {
      const product = fallbackProductForHostname('my-cool-app.dev');
      expect(product.label).toBe('My Cool App');
      expect(product.key).toBe('my-cool-app');
    });
  });
});
