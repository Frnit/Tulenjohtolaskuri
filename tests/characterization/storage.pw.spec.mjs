import fs from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import {
  collectPageErrors,
  seedStorage,
  stubArSensors
} from '../support/browser-fixtures.mjs';

const fixture = async (name) => fs.readFile(
  new URL(`../fixtures/storage/${name}`, import.meta.url),
  'utf8'
);

test('@characterization CHAR-STORAGE-CORRUPT-001 malformed tj_targets stops main script evaluation', async ({ page }) => {
  await seedStorage(page, { tj_targets: await fixture('malformed-tj_targets.txt') });
  const errors = collectPageErrors(page);

  await page.goto('/index.html');

  await expect.poll(() => errors.some((error) => error.name === 'SyntaxError')).toBe(true);
  await expect(page.locator('#targetSelect option')).toHaveCount(1);
  expect(await page.evaluate(() => typeof window.resetAll)).toBe('function');
});

test('@characterization CHAR-STORAGE-CORRUPT-001 malformed tj_profs_v2 is reported before normal startup completes', async ({ page }) => {
  await seedStorage(page, { tj_profs_v2: await fixture('malformed-tj_profs_v2.txt') });
  const errors = collectPageErrors(page);

  await page.goto('/index.html');

  await expect.poll(() => errors.some((error) => error.name === 'SyntaxError')).toBe(true);
  expect(await page.evaluate(() => typeof window.resetAll)).toBe('function');
});

test('@characterization CHAR-STORAGE-EMPTY-001 main accepts an empty target collection then reaches the startup defect', async ({ page }) => {
  await seedStorage(page, { tj_targets: await fixture('empty-tj_targets.json') });
  const errors = collectPageErrors(page);

  await page.goto('/index.html');

  await expect(page.locator('#targetSelect option')).toHaveCount(1);
  await expect.poll(() => errors.map((error) => error.message)).toContain(
    'updateSel is not defined'
  );
});

test('@characterization CHAR-STORAGE-EMPTY-001 AR dereferences a missing selection for an empty target collection', async ({ page }) => {
  await stubArSensors(page);
  await seedStorage(page, { tj_targets: await fixture('empty-tj_targets.json') });
  const errors = collectPageErrors(page);

  await page.goto('/ar.html');

  await expect(page.locator('#targetSelect option')).toHaveCount(0);
  expect(await page.locator('#targetSelect').evaluate((select) => select.selectedIndex)).toBe(-1);
  await expect.poll(() => errors.some((error) => /text/.test(error.message))).toBe(true);
});
