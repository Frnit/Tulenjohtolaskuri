import { test, expect } from '@playwright/test';
import {
  collectPageErrors,
  pageErrorDetails
} from '../support/browser-fixtures.mjs';

async function enterCoordinateInputs(page) {
  await page.locator('#latD').fill('60');
  await page.locator('#latM').fill('10');
  await page.locator('#lonD').fill('24');
  await page.locator('#lonM').fill('56');
  await page.locator('#azUnit').selectOption('deg');
  await page.locator('#azimuth').fill('90');
}

test('@target ACC-RESULT-FRESHNESS-001 [CHG-P2-4-SAFE-UI-001] removes MGRS output when its position input becomes unavailable', async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto('/index.html');
  await enterCoordinateInputs(page);
  await page.locator('#fov').fill('45');
  await page.locator('#res').fill('1920');
  await page.locator('#tPx').fill('50');
  await page.locator('#tReal').fill('1.8');

  await expect(page.locator('#rMgrs')).not.toHaveText('---');
  await page.locator('#latD').fill('');

  await expect(page.locator('#rMgrs')).toHaveText('---');
  await expect.poll(() => page.evaluate(() => ({
    revision: appState.inputRevision,
    basedOnRevision: appState.result.basedOnRevision,
    mgrs: appState.result.value?.coordinates?.mgrs ?? null
  }))).toMatchObject({mgrs: null});
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});

test('@target ACC-RESULT-FRESHNESS-001 [CHG-P2-4-SAFE-UI-001] removes a size result when known distance is cleared', async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto('/index.html');
  await page.locator('#tabSize').click();
  await page.evaluate(() => {
    document.getElementById('knownDist').value = '300';
    document.getElementById('fov').value = '45';
    document.getElementById('res').value = '1920';
    document.getElementById('tPx').value = '50';
    calc();
  });

  await expect(page.locator('#rSize')).not.toHaveText('---');
  await page.locator('#knownDist').fill('');

  await expect(page.locator('#rSize')).toHaveText('---');
  await expect(page.locator('#rShift')).toHaveText('---');
  await expect(page.locator('#rMgrs')).toHaveText('---');
  await expect.poll(() => page.evaluate(() => appState.result.status)).toBe('empty');
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});

test('@target ACC-ERROR-ISOLATION-001 [CHG-P2-4-SAFE-UI-001] contains an unexpected UI failure and keeps other controls usable', async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto('/index.html');

  await page.evaluate(() => runUiAction('target-test', () => {
    throw new Error('sensitive fixture value');
  }));

  await expect(page.locator('#appNotices')).toBeVisible();
  await expect(page.locator('#appNotices')).toHaveText(
    'Laskenta epäonnistui. Tarkista syötteet ja yritä uudelleen.'
  );
  await expect(page.locator('body')).not.toContainText('sensitive fixture value');
  await expect.poll(() => page.evaluate(() => ({
    status: appState.result.status,
    code: appState.result.error?.code,
    recoverable: TJL.isRecoverable(appState.result.error)
  }))).toEqual({status: 'error', code: 'ERR-UI-ACTION-001', recoverable: true});

  await page.locator('#tabSize').click();
  await expect(page.locator('#tabSize')).toHaveClass(/active/);
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});
