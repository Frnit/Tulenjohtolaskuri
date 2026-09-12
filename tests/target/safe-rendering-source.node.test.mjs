import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('ACC-SAFE-RENDER-001 production UI does not use HTML-string rendering APIs', async () => {
  for (const file of ['index.html', 'ar.html', 'src/ui/safe-dom.js']) {
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /\.innerHTML\s*=|insertAdjacentHTML\s*\(/, file);
  }
});

test('ACC-ERROR-ISOLATION-001 error notices do not render the original cause', async () => {
  const source = await readFile('index.html', 'utf8');
  assert.match(source, /TJL\.createAppError\s*\(/);
  assert.match(source, /TJL\.rejectResult\s*\(/);
  assert.doesNotMatch(source, /setText\([^\n]*cause/);
  assert.doesNotMatch(source, /console\.error\([^\n]*cause/);
});
