import { spawn } from 'node:child_process';
import net from 'node:net';
import process from 'node:process';
import { createServer } from 'vite';

const PLAYWRIGHT_BIN = process.platform === 'win32'
  ? 'node_modules/.bin/playwright.cmd'
  : 'node_modules/.bin/playwright';

function canListen(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', () => resolve(false));
    probe.once('listening', () => {
      probe.close(() => resolve(true));
    });
    probe.listen(port, '127.0.0.1');
  });
}

async function findAvailablePort(preferredPort) {
  for (let port = preferredPort; port < preferredPort + 20; port += 1) {
    if (await canListen(port)) return port;
  }
  throw new Error(`No available localhost port found from ${preferredPort} to ${preferredPort + 19}`);
}

async function runPlaywright(port) {
  const childEnv = {
    ...process.env,
    PLAYWRIGHT_DISABLE_WEBSERVER: '1',
    PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${port}`,
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

const port = await findAvailablePort(4173);

const server = await createServer({
  configFile: 'vite.a11y.config.ts',
  server: {
    host: '127.0.0.1',
    port,
    strictPort: true,
  },
});

await server.listen();

try {
  const exitCode = await runPlaywright(port);
  process.exitCode = exitCode;
} finally {
  await server.close();
}
