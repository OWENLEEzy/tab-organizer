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

    it('does not classify arbitrary dotted suffixes as owned products', () => {
      expect(productForHostname('google.evil.example').key).not.toBe('google');
      expect(productForHostname('www.google.attacker.test').key).not.toBe('google');
      expect(productForHostname('amazon.evil.example').key).not.toBe('amazon');
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
      expect(product.key).toBe('stackoverflow.com');
    });

    it('keeps keys separate for different TLDs to prevent over-consolidation', () => {
      const com = fallbackProductForHostname('example.com');
      const org = fallbackProductForHostname('example.org');

      // Labels can be the same
      expect(com.label).toBe('Example');
      expect(org.label).toBe('Example');

      // But keys MUST be different for technical identity
      expect(com.key).toBe('example.com');
      expect(org.key).toBe('example.org');
    });

    it('handles localized TLDs while keeping unique keys', () => {
      const hk = fallbackProductForHostname('google.com.hk');
      const tw = fallbackProductForHostname('google.com.tw');
      const uk = fallbackProductForHostname('google.co.uk');
      const jp = fallbackProductForHostname('google.co.jp');

      // Each gets its own key in fallback mode
      expect(hk.key).toBe('google.com.hk');
      expect(tw.key).toBe('google.com.tw');
      expect(uk.key).toBe('google.co.uk');
      expect(jp.key).toBe('google.co.jp');
      
      expect(hk.label).toBe('Google');
    });

    it('handles complex subdomains in unknown products', () => {
      const product = fallbackProductForHostname('sub.deep.example.io');
      expect(product.label).toBe('Sub Deep Example');
      expect(product.key).toBe('sub.deep.example.io');
    });

    it('strips www and m prefixes from labels and keys', () => {
      const product = fallbackProductForHostname('www.my-site.net');
      expect(product.label).toBe('My Site');
      expect(product.key).toBe('my-site.net');
    });

    it('handles domains with dashes', () => {
      const product = fallbackProductForHostname('my-cool-app.dev');
      expect(product.label).toBe('My Cool App');
      expect(product.key).toBe('my-cool-app.dev');
    });
  });
});
