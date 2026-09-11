import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const manifest = JSON.parse(await readFile(
  new URL('../fixtures/baseline/source-hashes.json', import.meta.url),
  'utf8'
));

test('BASE-001 audited production sources remain recoverable by exact SHA', () => {
  for (const [file, expectedHash] of Object.entries(manifest.files)) {
    const content = execFileSync('git', [
      'show',
      `${manifest.baselineSha}:${file}`
    ]);
    const actualHash = createHash('sha256').update(content).digest('hex');
    assert.equal(actualHash, expectedHash, file);
  }
});

test('CHAR-PWA-001 static service-worker baseline contract', () => {
  const source = execFileSync('git', [
    'show',
    `${manifest.baselineSha}:sw.js`
  ], { encoding: 'utf8' });

  assert.match(source, /const CACHE_NAME = 'tj-laskuri-v1'/);
  assert.match(source, /'\.\/'/);
  assert.match(source, /'\.\/index\.html'/);
  assert.match(source, /'\.\/manifest\.json'/);
  assert.doesNotMatch(source, /['"]\.\/ar\.html['"]/);
  assert.doesNotMatch(source, /['"]\.\/icon\.png['"]/);
  assert.match(source, /caches\.match\(e\.request\)/);
  assert.match(source, /response \|\| fetch\(e\.request\)/);
  assert.doesNotMatch(source, /addEventListener\(['"]activate['"]/);
  assert.doesNotMatch(source, /cache\.put\(/);
});
