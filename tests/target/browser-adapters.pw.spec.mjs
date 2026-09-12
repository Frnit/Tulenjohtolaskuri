import {test, expect} from '@playwright/test';
import {collectPageErrors, pageErrorDetails} from '../support/browser-fixtures.mjs';

test('@target ACC-SENSOR-FALLBACK-001 [CHG-P2-5-BROWSER-ADAPTERS-001] keeps Core usable when sensor APIs are missing', async ({page}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {configurable: true, value: undefined});
    Object.defineProperty(navigator, 'geolocation', {configurable: true, value: undefined});
    Object.defineProperty(window, 'DeviceOrientationEvent', {configurable: true, value: undefined});
  });
  const errors = collectPageErrors(page);

  await page.goto('/index.html');
  await expect(page.locator('#btnGps')).toBeDisabled();
  await expect(page.locator('#btnGps')).toHaveText('GPS: MANUAALI');
  await expect(page.locator('#btnCompass')).toBeDisabled();
  await expect(page.locator('#btnCompass')).toHaveText('KOMPASSI: MANUAALI');
  await page.locator('#fov').fill('45');
  await page.locator('#tPx').fill('50');
  await page.locator('#tReal').fill('1.8');
  await expect(page.locator('#rGround')).not.toHaveText('---');

  await page.goto('/ar.html');
  await expect(page.locator('#sensorStatus')).toContainText('Kamera ei ole käytettävissä.');
  await expect(page.locator('#sensorStatus')).toContainText('GPS ei ole käytettävissä.');
  await expect(page.locator('#targetSelect option')).toHaveCount(4);
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});

test('@target ACC-SENSOR-DENIED-001 [CHG-P2-5-BROWSER-ADAPTERS-001] reports denied permissions without an automatic request loop', async ({page}) => {
  await page.addInitScript(() => {
    window.__permissionEvidence = {camera: 0, orientation: 0, geolocation: 0};
    Object.defineProperty(navigator, 'mediaDevices', {configurable: true, value: {
      async getUserMedia() {
        window.__permissionEvidence.camera += 1;
        throw new DOMException('private camera detail', 'NotAllowedError');
      }
    }});
    Object.defineProperty(navigator, 'geolocation', {configurable: true, value: {
      watchPosition(_success, failure) {
        window.__permissionEvidence.geolocation += 1;
        queueMicrotask(() => failure({code: 1, message: 'private location detail'}));
        return 7;
      },
      clearWatch() {}
    }});
    function DeviceOrientationEvent() {}
    DeviceOrientationEvent.requestPermission = async () => {
      window.__permissionEvidence.orientation += 1;
      return 'denied';
    };
    Object.defineProperty(window, 'DeviceOrientationEvent', {configurable: true, value: DeviceOrientationEvent});
  });
  const errors = collectPageErrors(page);

  await page.goto('/ar.html');
  await expect(page.locator('#sensorStatus')).toContainText('Kamera ei ole käytettävissä.');
  await expect(page.locator('#sensorStatus')).toContainText('GPS ei ole käytettävissä.');
  await expect(page.locator('#sensorStatus')).toContainText('Suunta-anturi vaatii käynnistyspainikkeen.');
  expect(await page.evaluate(() => window.__permissionEvidence)).toEqual({camera: 1, orientation: 0, geolocation: 1});

  await page.locator('#btnSensors').click();
  await expect(page.locator('#sensorStatus')).toContainText('Suunta-anturi ei ole käytettävissä.');
  expect(await page.evaluate(() => window.__permissionEvidence)).toEqual({camera: 2, orientation: 1, geolocation: 2});
  await expect(page.locator('body')).not.toContainText('private camera detail');
  await expect(page.locator('body')).not.toContainText('private location detail');
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});

test('@target ACC-SENSOR-LIFECYCLE-001 [CHG-P2-5-BROWSER-ADAPTERS-001] releases camera, watch and listener resources on pagehide', async ({page}) => {
  await page.addInitScript(() => {
    window.__resourceEvidence = {trackStops: 0, clearWatch: [], orientationAdds: 0, orientationRemoves: 0};
    const stream = {getTracks: () => [{stop: () => { window.__resourceEvidence.trackStops += 1; }}]};
    Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', {
      configurable: true,
      get() { return this.__testStream || null; },
      set(value) { this.__testStream = value; }
    });
    Object.defineProperty(navigator, 'mediaDevices', {configurable: true, value: {
      getUserMedia: async () => stream
    }});
    Object.defineProperty(navigator, 'geolocation', {configurable: true, value: {
      watchPosition(success) {
        queueMicrotask(() => success({coords: {latitude: 60.1, longitude: 24.9, accuracy: 4}, timestamp: Date.now()}));
        return 42;
      },
      clearWatch(id) { window.__resourceEvidence.clearWatch.push(id); }
    }});
    function DeviceOrientationEvent() {}
    Object.defineProperty(window, 'DeviceOrientationEvent', {configurable: true, value: DeviceOrientationEvent});
    const originalAdd = window.addEventListener.bind(window);
    const originalRemove = window.removeEventListener.bind(window);
    window.addEventListener = function(type, listener, options) {
      if (type === 'deviceorientation') window.__resourceEvidence.orientationAdds += 1;
      return originalAdd(type, listener, options);
    };
    window.removeEventListener = function(type, listener, options) {
      if (type === 'deviceorientation') window.__resourceEvidence.orientationRemoves += 1;
      return originalRemove(type, listener, options);
    };
  });
  const errors = collectPageErrors(page);

  await page.goto('/ar.html');
  await expect.poll(() => page.evaluate(() => appState.sensors.camera.status)).toBe('active');
  await expect.poll(() => page.evaluate(() => appState.sensors.geolocation.status)).toBe('active');
  await expect.poll(() => page.evaluate(() => appState.sensors.orientation.status)).toBe('active');

  await page.locator('#btnFreeze').click();
  expect(await page.evaluate(() => window.__resourceEvidence.trackStops)).toBe(0);
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));

  await expect.poll(() => page.evaluate(() => ({
    evidence: window.__resourceEvidence,
    camera: appState.sensors.camera.status,
    geolocation: appState.sensors.geolocation.status,
    orientation: appState.sensors.orientation.status,
    streamCleared: document.getElementById('video').srcObject === null
  }))).toEqual({
    evidence: {trackStops: 1, clearWatch: [42], orientationAdds: 1, orientationRemoves: 1},
    camera: 'stopped',
    geolocation: 'stopped',
    orientation: 'stopped',
    streamCleared: true
  });
  await expect.poll(() => pageErrorDetails(errors)).toEqual([]);
});
