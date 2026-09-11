import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import { startTestServer, stopTestServer } from '../support/test-server.mjs';

function requestStatus(port, requestPath) {
  return new Promise((resolve, reject) => {
    const request = http.request({
      host: '127.0.0.1',
      method: 'GET',
      path: requestPath,
      port
    }, (response) => {
      response.resume();
      response.on('end', () => resolve(response.statusCode));
    });
    request.on('error', reject);
    request.end();
  });
}

test('HARNESS-SERVER-PATHS-001 test server blocks private and traversal paths', async () => {
  const server = await startTestServer({ port: 0, root: '.' });
  const address = server.address();
  assert(address && typeof address === 'object');

  try {
    assert.equal(await requestStatus(address.port, '/index.html'), 200);
    for (const blockedPath of [
      '/.git/config',
      '/.github/workflows/p2-1-tests.yml',
      '/%2egit/config',
      '/..%2fpackage.json',
      '/%2e%2e/%2e%2e/Windows/win.ini',
      '/%E0%A4%A'
    ]) {
      assert.equal(await requestStatus(address.port, blockedPath), 403, blockedPath);
    }
  } finally {
    await stopTestServer(server);
  }
});
