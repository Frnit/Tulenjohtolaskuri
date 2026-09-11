export async function seedStorage(page, entries) {
  await page.addInitScript((values) => {
    for (const [key, value] of Object.entries(values)) {
      localStorage.setItem(key, value);
    }
  }, entries);
}

export async function stubArSensors(page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => ({ getTracks: () => [] })
      }
    });

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        watchPosition: () => 1,
        clearWatch: () => undefined
      }
    });

    Object.defineProperty(window, 'DeviceOrientationEvent', {
      configurable: true,
      value: undefined
    });
  });
}

export async function installStorageScenario(page, scenario) {
  await page.addInitScript((settings) => {
    const originalGetItem = Storage.prototype.getItem;
    const originalSetItem = Storage.prototype.setItem;

    Storage.prototype.getItem = function getItem(key) {
      if (settings.missingKeys.includes(key)) return null;
      if (settings.readErrorKeys.includes(key)) {
        throw new DOMException('Simulated storage read failure', 'SecurityError');
      }
      return originalGetItem.call(this, key);
    };

    Storage.prototype.setItem = function setItem(key, value) {
      if (settings.quotaErrorKeys.includes(key)) {
        throw new DOMException('Simulated quota failure', 'QuotaExceededError');
      }
      if (settings.writeErrorKeys.includes(key)) {
        throw new Error('Simulated storage write failure');
      }
      return originalSetItem.call(this, key, value);
    };
  }, {
    missingKeys: scenario.missingKeys || [],
    readErrorKeys: scenario.readErrorKeys || [],
    writeErrorKeys: scenario.writeErrorKeys || [],
    quotaErrorKeys: scenario.quotaErrorKeys || []
  });
}

export function collectPageErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error));
  return errors;
}

export const BASELINE_MAIN_STARTUP_ERROR = Object.freeze({
  name: 'ReferenceError',
  message: 'updateSel is not defined'
});

export function pageErrorDetails(errors) {
  return errors.map((error) => ({ name: error.name, message: error.message }));
}
