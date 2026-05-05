import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const distDir = path.resolve(process.cwd(), 'dist');
const assetsDir = path.join(distDir, 'assets');
const dashboardHtmlPath = path.join(distDir, 'src', 'newtab', 'index.html');
const maxEntryParsedBytes = 285 * 1024;
const maxTotalParsedBytes = 350 * 1024;

if (!fs.existsSync(assetsDir)) {
  console.error('[bundle-budget] dist/assets not found. Run npm run build first.');
  process.exit(1);
}

const jsFiles = fs.readdirSync(assetsDir)
  .filter((file) => file.endsWith('.js'))
  .map((file) => path.join(assetsDir, file));

if (jsFiles.length === 0) {
  console.error('[bundle-budget] No JavaScript assets found in dist/assets.');
  process.exit(1);
}

let totalParsedBytes = 0;
let totalGzipBytes = 0;

for (const file of jsFiles) {
  const content = fs.readFileSync(file);
  totalParsedBytes += content.length;
  totalGzipBytes += zlib.gzipSync(content).length;
}

if (!fs.existsSync(dashboardHtmlPath)) {
  console.error('[bundle-budget] Dashboard HTML not found. Run npm run build first.');
  process.exit(1);
}

const dashboardHtml = fs.readFileSync(dashboardHtmlPath, 'utf8');
const entryMatch = dashboardHtml.match(/<script[^>]+src="\/assets\/([^"]+\.js)"/);

if (!entryMatch) {
  console.error('[bundle-budget] Could not find dashboard entry script in built HTML.');
  process.exit(1);
}

const entryPath = path.join(assetsDir, entryMatch[1]);

if (!fs.existsSync(entryPath)) {
  console.error(`[bundle-budget] Dashboard entry script missing: ${entryMatch[1]}`);
  process.exit(1);
}

const entryContent = fs.readFileSync(entryPath);
const entryParsedBytes = entryContent.length;
const entryGzipBytes = zlib.gzipSync(entryContent).length;

console.log(
  `[bundle-budget] entryParsed=${entryParsedBytes} entryGzip=${entryGzipBytes} totalParsed=${totalParsedBytes} totalGzip=${totalGzipBytes} files=${jsFiles.length}`,
);

if (entryParsedBytes > maxEntryParsedBytes) {
  console.error(`[bundle-budget] Entry JS exceeds ${maxEntryParsedBytes} bytes.`);
  process.exit(1);
}

if (totalParsedBytes > maxTotalParsedBytes) {
  console.error(`[bundle-budget] Total parsed JS exceeds ${maxTotalParsedBytes} bytes.`);
  process.exit(1);
}
