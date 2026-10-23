import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import { chromium } from '@playwright/test';

// Exercise the source adapter against real Chrome APIs in an isolated profile.
// Run: node scripts/check-native-groups.mjs
// Reproduce the pre-fix failure: node scripts/check-native-groups.mjs --baseline
const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(path.join(tmpdir(), 'tab-organizer-native-'));
const extension = path.join(temporary, 'extension');
let context;
try {
  await mkdir(extension);
  await writeFile(path.join(extension, 'manifest.json'), JSON.stringify({
    manifest_version: 3,
    name: 'Tab Organizer native group regression',
    version: '1.0.0',
    permissions: ['tabs', 'tabGroups', 'storage'],
    background: { service_worker: 'worker.js' },
  }));
  await build({
    stdin: {
      contents: "import { sortAndGroupTabs } from './src/utils/sort-and-group-tabs'; globalThis.runSort = sortAndGroupTabs;",
      resolveDir: root,
    },
    bundle: true,
    outfile: path.join(extension, 'worker.js'),
    platform: 'browser',
    plugins: process.argv.includes('--baseline') ? [{
      name: 'baseline-adapter',
      setup(builder) {
        builder.onLoad({ filter: /\/sort-and-group-tabs\.ts$/ }, () => ({
          contents: execFileSync('git', ['show', '7036a675e5e7a01ca802c185723a37c01dd713a3:src/utils/sort-and-group-tabs.ts'], {
            cwd: root, encoding: 'utf8',
          }),
          loader: 'ts',
          resolveDir: path.join(root, 'src/utils'),
        }));
      },
    }] : [],
  });
  context = await chromium.launchPersistentContext(path.join(temporary, 'profile'), {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  await context.route('https://**/*', (route) => route.fulfill({
    contentType: 'text/html', body: '<title>Native group fixture</title>',
  }));
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
  const result = await worker.evaluate(async () => {
    const first = await chrome.tabs.create({ url: 'https://alpha.invalid/', active: false });
    const internal = await chrome.tabs.create({ url: 'chrome://newtab/', active: false });
    const second = await chrome.tabs.create({ url: 'https://beta.invalid/', active: false });
    const feishu = await chrome.tabs.create({ url: 'https://feishu.cn/', active: false });
    for (const tab of [first, second, feishu]) {
      for (let attempt = 0; ; attempt++) {
        const current = await chrome.tabs.get(tab.id);
        if (current.status === 'complete' && current.url === tab.pendingUrl) break;
        if (current.status === 'complete' && current.url?.startsWith('https://')) break;
        if (attempt === 200) throw new Error('Fixture navigation did not finish');
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }
    const originalGroupId = await chrome.tabs.group({ tabIds: [first.id, internal.id, feishu.id] });
    await chrome.tabGroups.update(originalGroupId, { title: '💼 Work', color: 'blue' });
    const products = ['alpha.invalid', 'beta.invalid'].map((productKey) => ({ productKey }));
    const options = {
      sectionByProductKey: new Map(products.map(({ productKey }) => [
        productKey, { sectionId: 'work', name: 'Work', emoji: '💼' },
      ])),
    };
    const results = [];
    const groupIds = [];
    for (let attempt = 0; attempt < 3; attempt++) {
      results.push(await globalThis.runSort(products, options));
      groupIds.push((await chrome.tabGroups.query({ windowId: first.windowId }))
        .filter((group) => group.title === '💼 Work').map((group) => group.id));
    }
    const tabs = await Promise.all([first, internal, second, feishu].map((tab) => chrome.tabs.get(tab.id)));
    return { originalGroupId, results, groupIds, tabGroupIds: tabs.map((tab) => tab.groupId) };
  });
  assert.deepEqual(result.results, Array(3).fill({ moveFailures: 0, groupFailures: 0 }));
  assert.deepEqual(result.groupIds, Array(3).fill([result.originalGroupId]));
  assert.deepEqual(result.tabGroupIds, Array(4).fill(result.originalGroupId));
  console.log('PASS: three organize runs preserve one Work group and its original Chrome group ID.');
} finally {
  await context?.close();
  await rm(temporary, { recursive: true, force: true });
}
