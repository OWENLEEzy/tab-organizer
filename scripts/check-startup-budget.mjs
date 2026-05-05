import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(process.cwd(), 'dist');
const indexPath = path.join(distDir, 'src', 'newtab', 'index.html');
const fallbackIndexPath = path.join(distDir, 'index.html');
const maxHtmlBytes = 25 * 1024;

const htmlPath = fs.existsSync(indexPath) ? indexPath : fallbackIndexPath;

if (!fs.existsSync(htmlPath)) {
  console.error('[startup-budget] Dashboard HTML not found. Run npm run build first.');
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const htmlBytes = Buffer.byteLength(html);

console.log(`[startup-budget] dashboard-html=${htmlBytes} bytes`);

if (htmlBytes > maxHtmlBytes) {
  console.error(`[startup-budget] Dashboard HTML exceeds ${maxHtmlBytes} bytes.`);
  process.exit(1);
}

if (/Recent sessions[\s\S]*Repo/.test(html)) {
  console.error('[startup-budget] Recovery details appear to be eagerly rendered into HTML.');
  process.exit(1);
}
