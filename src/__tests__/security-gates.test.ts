/// <reference types="node" />

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '../../manifest.json';

const repoRoot = process.cwd();

function readSourceFiles(dir: string): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...readSourceFiles(fullPath));
    } else if (/\.(ts|tsx|js|jsx|html)$/.test(entry.name)) {
      result.push(fullPath);
    }
  }
  return result;
}

describe('security gates', () => {
  it('does not introduce dangerous HTML injection APIs in app source', () => {
    const offenders = readSourceFiles(path.join(repoRoot, 'src'))
      .filter((file) => !file.endsWith('security-gates.test.ts'))
      .flatMap((file) => {
        const text = fs.readFileSync(file, 'utf8');
        return ['dangerouslySetInnerHTML', 'innerHTML', 'insertAdjacentHTML']
          .filter((pattern) => text.includes(pattern))
          .map((pattern) => `${path.relative(repoRoot, file)}:${pattern}`);
      });

    expect(offenders).toEqual([]);
  });

  it('keeps extension CSP free of inline script allowance', () => {
    const csp = manifest.content_security_policy.extension_pages;
    const scriptSrc = csp.split(';').find((part) => part.trim().startsWith('script-src')) ?? '';

    expect(scriptSrc).toContain("script-src 'self'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });
});
