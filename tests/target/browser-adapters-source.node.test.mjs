import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('ACC-BROWSER-ADAPTER-BOUNDARY-001 production pages use browser APIs through adapters', async () => {
  for (const file of ['index.html', 'ar.html']) {
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /getUserMedia\s*\(|watchPosition\s*\(|clearWatch\s*\(/, file);
    assert.doesNotMatch(source, /addEventListener\s*\(\s*['"]deviceorientation/, file);
    assert.match(source, /src\/adapters\/geolocation\.js/, file);
    assert.match(source, /src\/adapters\/orientation\.js/, file);
  }
  assert.match(await readFile('ar.html', 'utf8'), /src\/adapters\/camera\.js/);
});

test('ACC-SENSOR-LIFECYCLE-001 every continuous sensor adapter owns a pagehide stop hook', async () => {
  for (const file of [
    'src/adapters/camera.js',
    'src/adapters/geolocation.js',
    'src/adapters/orientation.js'
  ]) {
    const source = await readFile(file, 'utf8');
    assert.match(source, /addEventListener\(['"]pagehide['"], pagehide\)/, file);
    assert.match(source, /const pagehide = \(\) => stop\(\)/, file);
  }
});
