import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('ACC-PERSISTENCE-BOUNDARY-001 application storage operations use the adapter boundary', async () => {
  for (const file of ['index.html', 'ar.html']) {
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem|clear)\s*\(/, file);
    assert.match(source, /src\/adapters\/storage\.js/, file);
    assert.match(source, /src\/persistence\/repository\.js/, file);
    assert.match(source, /src\/app\/state\.js/, file);
  }
});

test('ACC-PERSISTENCE-RESET-001 production code does not clear origin-wide storage', async () => {
  for (const file of [
    'index.html',
    'ar.html',
    'src/adapters/storage.js',
    'src/persistence/repository.js',
    'src/app/state.js'
  ]) {
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /\.clear\s*\(/, file);
  }
});
