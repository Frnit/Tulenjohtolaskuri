import { test, expect } from '@playwright/test';
import { installStorageScenario, seedStorage } from '../support/browser-fixtures.mjs';

test('@target HARNESS-STORAGE-FAULTS-001 harness simulates a missing value', async ({ page }) => {
  await seedStorage(page, { 'evidence-key': 'present-before-override' });
  await page.goto('/index.html');
  expect(await page.evaluate(() => localStorage.getItem('evidence-key')))
    .toBe('present-before-override');

  await installStorageScenario(page, { missingKeys: ['evidence-key'] });
  await page.reload();
  expect(await page.evaluate(() => localStorage.getItem('evidence-key'))).toBeNull();
});

test('@target HARNESS-STORAGE-FAULTS-001 harness simulates a read error', async ({ page }) => {
  await installStorageScenario(page, { readErrorKeys: ['evidence-key'] });
  await page.goto('/index.html');
  const result = await page.evaluate(() => {
    try {
      localStorage.getItem('evidence-key');
      return null;
    } catch (error) {
      return { name: error.name, message: error.message };
    }
  });
  expect(result).toEqual({ name: 'SecurityError', message: 'Simulated storage read failure' });
});

test('@target HARNESS-STORAGE-FAULTS-001 harness simulates a write error', async ({ page }) => {
  await installStorageScenario(page, { writeErrorKeys: ['evidence-key'] });
  await page.goto('/index.html');
  const result = await page.evaluate(() => {
    try {
      localStorage.setItem('evidence-key', 'value');
      return null;
    } catch (error) {
      return { name: error.name, message: error.message };
    }
  });
  expect(result).toEqual({ name: 'Error', message: 'Simulated storage write failure' });
});

test('@target HARNESS-STORAGE-FAULTS-001 harness simulates quota or unavailable storage', async ({ page }) => {
  await installStorageScenario(page, { quotaErrorKeys: ['evidence-key'] });
  await page.goto('/index.html');
  const result = await page.evaluate(() => {
    try {
      localStorage.setItem('evidence-key', 'value');
      return null;
    } catch (error) {
      return { name: error.name, message: error.message };
    }
  });
  expect(result).toEqual({ name: 'QuotaExceededError', message: 'Simulated quota failure' });
});
