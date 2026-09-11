import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const requested = process.argv.slice(2);
const categories = requested.length > 0
  ? requested
  : ['characterization', 'defects', 'target'];

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(entryPath));
    if (entry.isFile() && entry.name.endsWith('.node.test.mjs')) {
      files.push(entryPath);
    }
  }

  return files;
}

const files = [];
for (const category of categories) {
  files.push(...await collect(path.resolve('tests', category)));
}

if (files.length === 0) {
  console.log(`No Node tests in categories: ${categories.join(', ')}`);
  process.exit(0);
}

const result = spawnSync(
  process.execPath,
  ['--test', '--test-reporter=spec', ...files.sort()],
  { stdio: 'inherit' }
);

process.exit(result.status ?? 1);

