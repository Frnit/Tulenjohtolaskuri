import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function loadRuntime(files) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  for (const file of files) {
    vm.runInContext(await readFile(file, 'utf8'), sandbox, { filename: file });
  }
  return sandbox.window.TJL;
}

test('ACC-RESULT-FRESHNESS-001 accepts results only for the current input revision', async () => {
  const TJL = await loadRuntime(['src/app/state.js']);
  const state = TJL.createAppState({targets: [], profiles: {}, settings: {}, warnings: []});
  const firstRevision = TJL.beginInputRevision(state);
  const secondRevision = TJL.beginInputRevision(state);

  assert.equal(TJL.acceptResult(state, firstRevision, {ground: 100}), false);
  assert.equal(state.result.status, 'empty');
  assert.equal(TJL.acceptResult(state, secondRevision, {ground: 200}), true);
  assert.equal(state.result.status, 'fresh');
  assert.equal(state.result.basedOnRevision, secondRevision);
  assert.equal(state.result.value.ground, 200);
});

test('ACC-ERROR-ISOLATION-001 creates a stable recoverable error shape', async () => {
  const TJL = await loadRuntime(['src/app/errors.js']);
  const cause = new Error('diagnostic only');
  const error = TJL.createAppError({
    kind: 'domain-error',
    code: 'ERR-CALC-001',
    source: 'calculation',
    field: 'distance',
    messageKey: 'invalid-distance',
    cause
  });

  assert.deepEqual(
    {
      kind: error.kind,
      code: error.code,
      source: error.source,
      recoverable: error.recoverable,
      field: error.field,
      messageKey: error.messageKey,
      cause: error.cause
    },
    {
      kind: 'domain-error',
      code: 'ERR-CALC-001',
      source: 'calculation',
      recoverable: true,
      field: 'distance',
      messageKey: 'invalid-distance',
      cause
    }
  );
  assert.equal(TJL.isRecoverable(error), true);
  assert.equal(Object.isFrozen(error), true);
});
