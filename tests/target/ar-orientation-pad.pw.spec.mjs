import { test, expect } from '@playwright/test';
import {
  collectPageErrors,
  pageErrorDetails,
  stubArSensors
} from '../support/browser-fixtures.mjs';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({width: 390, height: 844});
  await stubArSensors(page);
});

test('@target ACC-AR-ORIENTATION-001 rotates the centered measurement frame in bounded five-degree steps', async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto('/ar.html');
  const initialDistance = await page.locator('#distOutput').textContent();

  await page.getByRole('button', {name: 'Kierrä kehystä viisi astetta myötäpäivään'}).click({clickCount: 3});

  await expect(page.locator('#orientationStatus')).toContainText('KIERTO +15°');
  await expect(page.locator('#bracketBox')).toHaveCSS('transform', /matrix\(0\.9659/);
  await expect(page.locator('#distOutput')).toHaveText(initialDistance);

  await page.evaluate(() => { for (let i = 0; i < 30; i += 1) adjustFrameRotation(-5); });
  await expect(page.locator('#orientationStatus')).toContainText('KIERTO -90°');
  await page.getByRole('button', {name: 'NOLLAA'}).click();
  await expect(page.locator('#orientationStatus')).toContainText('KIERTO 0°');
  await expect(page.locator('#bracketBox')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});

test('@target ACC-AR-ELEVATION-001 adjusts elevation manually and transfers the AR result to the main workflow', async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto('/ar.html');

  await page.getByRole('button', {name: 'Nosta korkokulmaa yksi aste'}).click({clickCount: 4});
  await page.getByRole('button', {name: 'Laske korkokulmaa yksi aste'}).click();
  await expect(page.locator('#orientationStatus')).toContainText('KORO +3°');
  await expect(page.locator('#hudElev')).toHaveText('3');

  const distance = await page.locator('#distOutput').textContent();
  await page.getByRole('button', {name: /KÄYTÄ/}).click();

  await expect(page).toHaveURL(/\/index\.html$/);
  await expect(page.locator('#knownDist')).toHaveValue(distance);
  await expect(page.locator('#elev')).toHaveValue('3');
  await expect(page.locator('#tabSize')).toHaveClass(/active/);
  await expect.poll(() => page.evaluate(() => ({
    handoff: sessionStorage.getItem('tjl.handoff'),
    legacy: localStorage.getItem('tj_incoming_dist')
  }))).toEqual({handoff: null, legacy: null});
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});
