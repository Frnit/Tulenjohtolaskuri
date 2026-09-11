import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const argumentsList = process.argv.slice(2);
const allowEmpty = argumentsList.includes('--allow-empty');
const requested = argumentsList.filter((argument) => argument !== '--allow-empty');
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
const emptyCategories = [];
for (const category of categories) {
  const categoryFiles = await collect(path.resolve('tests', category));
  files.push(...categoryFiles);
  if (categoryFiles.length === 0) emptyCategories.push(category);
}

if (emptyCategories.length > 0) {
  const message = `No Node tests in categories: ${emptyCategories.join(', ')}`;
  if (allowEmpty) {
    console.log(`${message} (explicitly allowed)`);
  } else {
    console.error(`${message}; refusing to pass an empty test class`);
    process.exit(1);
  }
}

if (files.length === 0) process.exit(0);

const result = spawnSync(
  process.execPath,
  ['--test', '--test-reporter=spec', ...files.sort()],
  { stdio: 'inherit' }
);

process.exit(result.status ?? 1);
