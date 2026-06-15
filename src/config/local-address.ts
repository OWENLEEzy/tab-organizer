/**
 * Identity for local / loopback dev addresses.
 *
 * A developer running several local servers wants each app to be its own group,
 * distinguished by PORT (localhost:3000 vs localhost:8080), while the different
 * ways of naming the same machine (localhost, 127.0.0.1, ::1) collapse into one.
 *
 * The produced `key` doubles as the display string, so `localhost:3000` shows as
 * `localhost:3000` instead of the old, mangled `127 0 0 1`.
 */

export interface LocalAddress {
  /** Canonical host: loopback names collapse to `localhost`; other IPs kept as-is. */
  host: string;
  /** Port, or '' when none was specified. */
  port: string;
  /** Grouping + display identity, e.g. `localhost:3000`. */
  key: string;
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

function isIpv4(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

function isIpv6(host: string): boolean {
  // URL hostnames never contain ':' except for IPv6 literals.
  return host.includes(':');
}

/**
 * Parse a URL into a canonical local-address identity, or null when the URL is
 * not a local/loopback/IP address (i.e. a normal public hostname).
 */
export function parseLocalAddress(url: string): LocalAddress | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  // WHATWG URL keeps IPv6 literals bracketed (e.g. `[::1]`); unwrap for matching.
  const rawHost = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!rawHost) return null;

  const isLocal = LOOPBACK_HOSTS.has(rawHost) || isIpv4(rawHost) || isIpv6(rawHost);
  if (!isLocal) return null;

  const host = LOOPBACK_HOSTS.has(rawHost) ? 'localhost' : rawHost;
  const port = parsed.port;
  const key = formatKey(host, port);

  return { host, port, key };
}

function formatKey(host: string, port: string): string {
  // Always bracket IPv6 (even without a port) so the host/port boundary stays
  // unambiguous and the same machine never yields both a bracketed and an
  // unbracketed key.
  const bracketed = isIpv6(host) ? `[${host}]` : host;
  return port ? `${bracketed}:${port}` : bracketed;
}

function stripPort(key: string): string {
  if (key.startsWith('[')) {
    return key.slice(1, key.indexOf(']') === -1 ? undefined : key.indexOf(']'));
  }
  return key.replace(/:\d+$/, '');
}

/**
 * Whether a grouping key (as produced by getTabDomain) is a local-address key.
 * Used by display helpers to render it verbatim instead of TLD-stripping it.
 */
export function isLocalAddressKey(key: string): boolean {
  if (!key) return false;
  const host = stripPort(key);
  return host === 'localhost' || LOOPBACK_HOSTS.has(host) || isIpv4(host) || isIpv6(host);
}
