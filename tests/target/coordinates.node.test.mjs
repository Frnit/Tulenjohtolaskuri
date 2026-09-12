import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function loadCoordinates() {
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(await readFile('src/domain/coordinates.js', 'utf8'), sandbox, {
    filename: 'src/domain/coordinates.js'
  });
  return sandbox.TJL.coordinates;
}

test('ACC-POSITION-INPUT-001 converts published MGRS grid centres to UTM', async () => {
  const coordinates = await loadCoordinates();
  const vectors = [
    ['38SMB', 450000, 3650000, 100000],
    ['38SMB4484', 444500, 3684500, 1000],
    ['38SMB44148470', 444145, 3684705, 10]
  ];

  for (const [mgrs, easting, northing, precisionMeters] of vectors) {
    const result = coordinates.parseMgrs(mgrs);
    assert.equal(result.ok, true, mgrs);
    assert.equal(result.easting, easting, mgrs);
    assert.equal(result.northing, northing, mgrs);
    assert.equal(result.precisionMeters, precisionMeters, mgrs);
  }
});

test('ACC-POSITION-INPUT-001 resolves a published MGRS location to WGS84', async () => {
  const coordinates = await loadCoordinates();
  const result = coordinates.mgrsToWgs84('38SLC3918701405');

  assert.equal(result.ok, true);
  assert.ok(Math.abs(result.latitude - 33.44) < 0.01, result.latitude);
  assert.ok(Math.abs(result.longitude - 43.27) < 0.01, result.longitude);
  assert.equal(result.normalized, '38S LC 39187 01405');
  assert.equal(coordinates.wgs84ToMgrs(33.44, 43.27, 5), '38S LC 39187 01405');
});

test('ACC-POSITION-INPUT-001 rejects malformed and inconsistent MGRS values', async () => {
  const coordinates = await loadCoordinates();
  const invalid = ['0VLM12341234', '35ILM12341234', '35VIM12341234', '35VLM123', '35V AA 00000 00000', '38XMB'];

  for (const value of invalid) assert.equal(coordinates.mgrsToWgs84(value).ok, false, value);
});

test('ACC-POSITION-INPUT-001 round trips a Finnish WGS84 coordinate within one metre', async () => {
  const coordinates = await loadCoordinates();
  const latitude = 60.1699;
  const longitude = 24.9384;
  const mgrs = coordinates.wgs84ToMgrs(latitude, longitude, 5);
  const result = coordinates.mgrsToWgs84(mgrs);

  assert.equal(result.ok, true, mgrs);
  assert.ok(Math.abs(result.latitude - latitude) < 0.00001, `${mgrs}: ${result.latitude}`);
  assert.ok(Math.abs(result.longitude - longitude) < 0.00002, `${mgrs}: ${result.longitude}`);
});
