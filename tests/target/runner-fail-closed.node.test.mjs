import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';

const runner = path.resolve('scripts', 'run-node-tests.mjs');
const emptyCategory = 'fixtures/empty-node-class';

test('HARNESS-NODE-DISCOVERY-001 empty classes fail unless explicitly allowed', () => {
  const rejected = spawnSync(process.execPath, [runner, emptyCategory], {
    encoding: 'utf8'
  });
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /refusing to pass an empty test class/);

  const allowed = spawnSync(
    process.execPath,
    [runner, '--allow-empty', emptyCategory],
    { encoding: 'utf8' }
  );
  assert.equal(allowed.status, 0);
  assert.match(allowed.stdout, /explicitly allowed/);
});
