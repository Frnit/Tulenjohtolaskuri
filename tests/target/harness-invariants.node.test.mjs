import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const requiredDirectories = [
  'tests/characterization',
  'tests/defects',
  'tests/target',
  'tests/browser',
  'tests/pwa',
  'tests/fixtures',
  'docs/evidence'
];

test('HARNESS-TAXONOMY-001 evidence classes have separate repository paths', async () => {
  for (const directory of requiredDirectories) {
    const info = await stat(directory);
    assert.equal(info.isDirectory(), true, directory);
  }
});

test('REQ-OFFLINE-CORE-001 [Phase 1 REQ-003] production HTML has no external runtime assets', async () => {
  for (const file of ['index.html', 'ar.html']) {
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /<(?:script|link)\b[^>]*(?:src|href)\s*=\s*['"]https?:\/\//i, file);
  }
});
