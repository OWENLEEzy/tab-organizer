import { describe, it, expect } from 'vitest';
import { parseLocalAddress, isLocalAddressKey } from '../config/local-address';

describe('parseLocalAddress', () => {
  it('returns null for non-local hostnames', () => {
    expect(parseLocalAddress('https://example.com/path')).toBeNull();
    expect(parseLocalAddress('https://github.com')).toBeNull();
  });

  it('returns null for empty or unparseable input', () => {
    expect(parseLocalAddress('')).toBeNull();
    expect(parseLocalAddress('not a url')).toBeNull();
  });

  it('canonicalizes localhost with its port', () => {
    expect(parseLocalAddress('http://localhost:3000/foo')).toEqual({
      host: 'localhost',
      port: '3000',
      key: 'localhost:3000',
    });
  });

  it('treats 127.0.0.1 as the same machine as localhost', () => {
    expect(parseLocalAddress('http://127.0.0.1:3000/')).toEqual({
      host: 'localhost',
      port: '3000',
      key: 'localhost:3000',
    });
  });

  it('keeps different ports as different local apps', () => {
    expect(parseLocalAddress('http://localhost:8080/')?.key).toBe('localhost:8080');
    expect(parseLocalAddress('http://localhost:3000/')?.key).toBe('localhost:3000');
  });

  it('omits the port when there is no explicit port', () => {
    expect(parseLocalAddress('http://localhost/')).toEqual({
      host: 'localhost',
      port: '',
      key: 'localhost',
    });
  });

  it('keeps a private IP as its own machine, with port', () => {
    expect(parseLocalAddress('http://192.168.1.5:5000/dash')).toEqual({
      host: '192.168.1.5',
      port: '5000',
      key: '192.168.1.5:5000',
    });
  });

  it('treats IPv6 loopback ::1 as localhost', () => {
    expect(parseLocalAddress('http://[::1]:3000/')).toEqual({
      host: 'localhost',
      port: '3000',
      key: 'localhost:3000',
    });
  });

  it('keeps non-loopback IPv6 bracketed in the key — with a port', () => {
    expect(parseLocalAddress('http://[2001:db8::1]:8080/')).toEqual({
      host: '2001:db8::1',
      port: '8080',
      key: '[2001:db8::1]:8080',
    });
  });

  it('keeps non-loopback IPv6 bracketed in the key — without a port', () => {
    // The portless key must stay bracketed so the same machine never yields both a
    // bracketed and an unbracketed key (which would split one app into two groups).
    expect(parseLocalAddress('http://[2001:db8::1]/')).toEqual({
      host: '2001:db8::1',
      port: '',
      key: '[2001:db8::1]',
    });
  });
});

describe('isLocalAddressKey', () => {
  it('recognizes local-address keys', () => {
    expect(isLocalAddressKey('localhost')).toBe(true);
    expect(isLocalAddressKey('localhost:3000')).toBe(true);
    expect(isLocalAddressKey('127.0.0.1')).toBe(true);
    expect(isLocalAddressKey('192.168.1.5:5000')).toBe(true);
    expect(isLocalAddressKey('[2001:db8::1]')).toBe(true);
    expect(isLocalAddressKey('[2001:db8::1]:8080')).toBe(true);
  });

  it('rejects normal hostnames and empty input', () => {
    expect(isLocalAddressKey('example.com')).toBe(false);
    expect(isLocalAddressKey('github')).toBe(false);
    expect(isLocalAddressKey('')).toBe(false);
  });
});
