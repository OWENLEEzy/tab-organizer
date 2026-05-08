/// <reference types="node" />

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import packageJson from '../../package.json';

const repoRoot = process.cwd();

describe('tooling gates', () => {
  it('keeps generated coverage output outside ESLint', () => {
    const eslintConfig = fs.readFileSync(path.join(repoRoot, 'eslint.config.js'), 'utf8');

    expect(eslintConfig).toContain("globalIgnores(['dist', 'extension', 'coverage'");
  });

  it('treats lint warnings as release blockers', () => {
    expect(packageJson.scripts.lint).toBe('eslint . --max-warnings=0');
  });

  it('keeps the full release gate wired through npm run check', () => {
    const check = packageJson.scripts.check;

    expect(check).toContain('npm run lint');
    expect(check).toContain('npm run lint:css');
    expect(check).toContain('npm run test');
    expect(check).toContain('npm run build');
    expect(check).toContain('npm run check:bundle');
    expect(check).toContain('npm run check:startup');
    expect(check).toContain('npm run test:e2e');
  });

  it('enforces store storage imports through the architecture rule', () => {
    const eslintConfig = fs.readFileSync(path.join(repoRoot, 'eslint.config.js'), 'utf8');

    expect(eslintConfig).toContain("files: ['src/stores/**/*.ts']");
    expect(eslintConfig).toContain("group: ['**/utils/storage']");
    expect(eslintConfig).toContain("importNames: ['readStorage', 'updateStorage']");
  });

  it('lets e2e checks avoid unrelated local port conflicts', () => {
    const runner = fs.readFileSync(path.join(repoRoot, 'scripts/run-a11y-e2e.mjs'), 'utf8');
    const config = fs.readFileSync(path.join(repoRoot, 'playwright.config.ts'), 'utf8');

    expect(runner).toContain('findAvailablePort(4173)');
    expect(runner).toContain('PLAYWRIGHT_BASE_URL');
    expect(config).toContain('process.env.PLAYWRIGHT_BASE_URL');
  });
});
