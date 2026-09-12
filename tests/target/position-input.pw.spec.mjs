import { test, expect } from '@playwright/test';
import { collectPageErrors, pageErrorDetails } from '../support/browser-fixtures.mjs';

async function enterCalculationInputs(page) {
  await page.locator('#knownDist').fill('1000');
  await page.locator('#azimuth').fill('1600');
}

test('@target ACC-POSITION-INPUT-001 accepts MGRS own position and calculates a target coordinate', async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto('/index.html');
  await page.locator('#tabSize').click();
  await enterCalculationInputs(page);
  await page.getByText('MGRS', { exact: true }).click();
  await page.locator('#observerMgrs').fill('35V LH 91955 72118');

  await expect(page.locator('#positionFeedback')).toContainText('Hyväksytty 35V LH 91955 72118');
  await expect(page.locator('#rMgrs')).toHaveText(/^35V /);
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});

test('@target ACC-POSITION-INPUT-001 rejects invalid MGRS without retaining a result', async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto('/index.html');
  await page.locator('#tabSize').click();
  await enterCalculationInputs(page);
  await page.getByText('MGRS', { exact: true }).click();
  await page.locator('#observerMgrs').fill('35V IO 123 456');

  await expect(page.locator('#positionFeedback')).toHaveClass(/invalid/);
  await expect(page.locator('#positionFeedback')).toContainText('ei ole kelvollinen');
  await expect(page.locator('#rMgrs')).toHaveText('---');
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});

test('@target ACC-POSITION-INPUT-001 retains WGS84 and GPS selects it', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        watchPosition(success) {
          success({coords: {latitude: 60.1699, longitude: 24.9384, accuracy: 5}});
          return 42;
        },
        clearWatch() {}
      }
    });
  });
  await page.goto('/index.html');
  await page.getByText('MGRS', { exact: true }).click();
  await page.locator('#btnGps').click();

  await expect(page.locator('input[name="positionFormat"][value="wgs84"]')).toBeChecked();
  await expect(page.locator('#wgs84PositionFields')).toBeVisible();
  await expect(page.locator('#latD')).toHaveValue('60');
  await expect(page.locator('#lonD')).toHaveValue('24');
});
