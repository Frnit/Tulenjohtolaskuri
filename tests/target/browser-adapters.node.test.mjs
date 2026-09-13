import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function loadAdapters() {
  const sandbox = {window: {}};
  vm.createContext(sandbox);
  for (const file of [
    'src/app/errors.js',
    'src/adapters/camera.js',
    'src/adapters/geolocation.js',
    'src/adapters/orientation.js'
  ]) {
    vm.runInContext(await readFile(file, 'utf8'), sandbox, {filename: file});
  }
  return sandbox.window.TJL;
}

function lifecycleEnvironment(api) {
  const listeners = new Map();
  return Object.assign({
    isSecureContext: true,
    navigator: {},
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type);
    },
    listeners
  }, api);
}

test('ACC-SENSOR-LIFECYCLE-001 camera start, freeze and stop own the acquired stream', async () => {
  const TJL = await loadAdapters();
  let stopCount = 0;
  let pauseCount = 0;
  const stream = {getTracks: () => [{stop: () => { stopCount += 1; }}]};
  const video = {
    srcObject: null,
    pause() { pauseCount += 1; },
    play: async () => undefined
  };
  const environment = lifecycleEnvironment({
    navigator: {mediaDevices: {getUserMedia: async () => stream}}
  });
  const adapter = TJL.createCameraAdapter({environment, video});

  assert.equal((await adapter.start()).ok, true);
  assert.equal(adapter.capability().status, 'active');
  assert.equal(video.srcObject, stream);
  assert.equal((await adapter.freeze(true)).ok, true);
  assert.equal(pauseCount, 1);
  assert.equal(stopCount, 0);

  adapter.stop();
  assert.equal(stopCount, 1);
  assert.equal(video.srcObject, null);
  assert.equal(adapter.capability().status, 'stopped');
});

test('ACC-SENSOR-DIAGNOSTICS-001 camera exposes browser-reported active video settings', async () => {
  const TJL = await loadAdapters();
  const track = {
    getSettings: () => ({width: 1280, height: 720, frameRate: 30})
  };
  const stream = {
    getTracks: () => [{stop() {}}],
    getVideoTracks: () => [track]
  };
  const video = {srcObject: null, videoWidth: 640, videoHeight: 480};
  const environment = lifecycleEnvironment({
    navigator: {mediaDevices: {getUserMedia: async () => stream}}
  });
  const adapter = TJL.createCameraAdapter({environment, video});

  assert.equal((await adapter.start()).ok, true);
  assert.deepEqual(
    JSON.parse(JSON.stringify(adapter.capability().diagnostics)),
    {resolution: {width: 1280, height: 720}, frameRate: 30}
  );
  track.getSettings = () => ({width: 1920, height: 1080, frameRate: 60});
  adapter.refreshDiagnostics();
  assert.deepEqual(
    JSON.parse(JSON.stringify(adapter.capability().diagnostics.resolution)),
    {width: 1920, height: 1080}
  );
  assert.equal(adapter.capability().diagnostics.frameRate, 60);
  adapter.stop();
  assert.deepEqual(
    JSON.parse(JSON.stringify(adapter.capability().diagnostics.resolution)),
    {width: null, height: null}
  );
});

test('ACC-SENSOR-LIFECYCLE-001 camera releases an acquired stream when attachment fails', async () => {
  const TJL = await loadAdapters();
  let stopCount = 0;
  const stream = {getTracks: () => [{stop: () => { stopCount += 1; }}]};
  const video = {};
  Object.defineProperty(video, 'srcObject', {
    set() { throw new Error('attachment failed'); }
  });
  const environment = lifecycleEnvironment({
    navigator: {mediaDevices: {getUserMedia: async () => stream}}
  });
  const adapter = TJL.createCameraAdapter({environment, video});

  const result = await adapter.start();
  assert.equal(result.ok, false);
  assert.equal(stopCount, 1);
  assert.equal(adapter.capability().status, 'error');
});

test('ACC-SENSOR-LIFECYCLE-001 geolocation publishes samples and clears its watch', async () => {
  const TJL = await loadAdapters();
  let success;
  const cleared = [];
  const environment = lifecycleEnvironment({
    navigator: {geolocation: {
      watchPosition(onSuccess) { success = onSuccess; return 42; },
      clearWatch(id) { cleared.push(id); }
    }}
  });
  const adapter = TJL.createGeolocationAdapter({environment});

  assert.equal((await adapter.start()).ok, true);
  success({coords: {latitude: 60.1, longitude: 24.9, accuracy: 5}, timestamp: 1000});
  assert.equal(adapter.capability().status, 'active');
  assert.deepEqual(
    JSON.parse(JSON.stringify(adapter.capability().value)),
    {latitude: 60.1, longitude: 24.9, accuracy: 5}
  );

  environment.listeners.get('pagehide')();
  assert.deepEqual(cleared, [42]);
  assert.equal(adapter.capability().status, 'stopped');
});

test('ACC-SENSOR-LIFECYCLE-001 orientation requests permission only after an explicit request', async () => {
  const TJL = await loadAdapters();
  let permissionRequests = 0;
  const sensorListeners = new Map();
  function DeviceOrientationEvent() {}
  DeviceOrientationEvent.requestPermission = async () => {
    permissionRequests += 1;
    return 'granted';
  };
  const environment = lifecycleEnvironment({
    DeviceOrientationEvent,
    addEventListener(type, listener) { sensorListeners.set(type, listener); },
    removeEventListener(type, listener) {
      if (sensorListeners.get(type) === listener) sensorListeners.delete(type);
    }
  });
  const adapter = TJL.createOrientationAdapter({environment});

  const automatic = await adapter.start({requestPermission: false});
  assert.equal(automatic.ok, false);
  assert.equal(automatic.needsUserAction, true);
  assert.equal(permissionRequests, 0);

  assert.equal((await adapter.start({requestPermission: true})).ok, true);
  assert.equal(permissionRequests, 1);
  sensorListeners.get('deviceorientation')({alpha: 90, beta: 90, gamma: 0});
  assert.equal(adapter.capability().value.headingDegrees, 270);
  assert.ok(Math.abs(adapter.capability().value.elevationDegrees) < 0.000001);

  sensorListeners.get('deviceorientation')({alpha: 90, beta: 120, gamma: 0});
  assert.ok(Math.abs(adapter.capability().value.elevationDegrees - 30) < 0.000001);

  sensorListeners.get('deviceorientation')({alpha: 90, beta: 60, gamma: 0});
  assert.ok(Math.abs(adapter.capability().value.elevationDegrees + 30) < 0.000001);

  sensorListeners.get('deviceorientation')({beta: 120, gamma: 0});
  assert.equal(adapter.capability().value.headingDegrees, null);
  assert.ok(Math.abs(adapter.capability().value.elevationDegrees - 30) < 0.000001);
  adapter.stop();
  assert.equal(sensorListeners.has('deviceorientation'), false);
});
