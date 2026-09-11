import { spawn } from 'node:child_process';
import process from 'node:process';
import { startTestServer, stopTestServer } from '../tests/support/test-server.mjs';

const server = await startTestServer({ port: 4173, root: '.' });

try {
  const child = spawn(
    process.execPath,
    ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)],
    { stdio: 'inherit' }
  );
  const exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => resolve(code ?? 1));
  });
  process.exitCode = exitCode;
} finally {
  await stopTestServer(server);
}
