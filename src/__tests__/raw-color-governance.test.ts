import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const EXEMPT_PATTERNS = [
  // Theme registry is the source of truth
  /src\/config\/themes\.ts/,
  // Browser API colors (badge, badge-background)
  /src\/utils\/badge\.ts/,
  // Confetti is decorative particle colors, not UI theme tokens
  /src\/lib\/constants\.ts/,
  // Product grouper uses neutral defaults for product grouping, not UI theming
  /src\/lib\/product-groups\.ts/,
  // Fonts.css is font-face declarations only
  /src\/dashboard\/styles\/fonts\.css/,
];

// Raw hex or rgb(...) values in UI components that are NOT allowed

function findRawColors(content: string): { line: number; value: string }[] {
  const results: { line: number; value: string }[] = [];
  const lines = content.split('\n');
  const hexPattern = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
  const commaRgbPattern = /rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/g;
  const whitespaceRgbPattern = /rgba?\s*\(\s*\d+\s+\d+\s+\d+(?:\s*\/\s*[\d.]+%?)?\s*\)/g;

  lines.forEach((line, idx) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

    let match;
    while ((match = hexPattern.exec(line)) !== null) {
      results.push({ line: idx + 1, value: match[0] });
    }
    hexPattern.lastIndex = 0;
    while ((match = commaRgbPattern.exec(line)) !== null) {
      results.push({ line: idx + 1, value: match[0] });
    }
    commaRgbPattern.lastIndex = 0;
    while ((match = whitespaceRgbPattern.exec(line)) !== null) {
      results.push({ line: idx + 1, value: match[0] });
    }
    whitespaceRgbPattern.lastIndex = 0;
  });

  return results;
}

function themeTokenLines(content: string): Set<number> {
  const allowed = new Set<number>();
  const lines = content.split('\n');
  let inTheme = false;
  let depth = 0;

  lines.forEach((line, index) => {
    if (!inTheme && line.includes('@theme')) {
      inTheme = true;
    }

    if (inTheme) {
      allowed.add(index + 1);
      depth += (line.match(/{/g) ?? []).length;
      depth -= (line.match(/}/g) ?? []).length;
      if (depth <= 0 && line.includes('}')) {
        inTheme = false;
        depth = 0;
      }
    }
  });

  return allowed;
}

function isExempt(filePath: string): boolean {
  return EXEMPT_PATTERNS.some((re) => re.test(filePath));
}

describe('raw color governance', () => {
  const files = readdirSync('.', { recursive: true, encoding: 'utf-8' })
    .filter((f): f is string => typeof f === 'string' && (f.endsWith('.tsx') || f.endsWith('.css')))
    .filter((f) => f.startsWith('src/dashboard/') && !f.includes('__tests__'))
    .map((f) => ({ path: f, content: readFileSync(join('.', f), 'utf-8') }));

  for (const { path, content } of files) {
    if (isExempt(path)) continue;

    describe(path, () => {
      const tokenLines = path === 'src/dashboard/styles/global.css' ? themeTokenLines(content) : new Set<number>();
      const findings = findRawColors(content).filter((finding) => !tokenLines.has(finding.line));

      it('contains no raw hex or rgb() color values', () => {
        expect(findings, `Found raw colors at: ${JSON.stringify(findings)}`).toHaveLength(0);
      });
    });
  }
});
