import { spawn } from 'node:child_process';
import process from 'node:process';
import { createServer } from 'vite';

const PLAYWRIGHT_BIN = process.platform === 'win32'
  ? 'node_modules/.bin/playwright.cmd'
  : 'node_modules/.bin/playwright';

async function runPlaywright() {
  const childEnv = {
    ...process.env,
    PLAYWRIGHT_DISABLE_WEBSERVER: '1',
  };

  delete childEnv.NO_COLOR;

  return await new Promise((resolve, reject) => {
    const child = spawn(
      PLAYWRIGHT_BIN,
      ['test', '--config', 'playwright.config.ts'],
      {
        stdio: 'inherit',
        env: childEnv,
      },
    );

    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

const server = await createServer({
  configFile: 'vite.a11y.config.ts',
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
});

await server.listen();

try {
  const exitCode = await runPlaywright();
  process.exitCode = exitCode;
} finally {
  await server.close();
}
