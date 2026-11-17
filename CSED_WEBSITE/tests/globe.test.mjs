import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as framing from '../src/scene/Particles/particleConfig.js';
import { createParticleGeometry } from '../src/scene/Particles/ParticleGeometry.js';

test('camera framing preserves the horizon and half-clipped final globe at every size', () => {
  assert.equal(typeof framing.getGlobePose, 'function', 'one shared camera-aware globe pose is required');
  for (const [width, height] of [[1536, 1024], [1024, 768], [768, 1024], [390, 844]]) {
    const d = framing.CAMERA_DISTANCE;
    const halfHeight = d * Math.tan(framing.CAMERA_FOV * Math.PI / 360);
    const home = framing.getGlobePose(width, height, 0);
    const q = (width < 768 ? 0.28 : 0.36) * halfHeight / d;
    // The target's globe crop starts just above a horizon at 68% desktop / 64% mobile.
    assert.ok(Math.abs((home.y + q * d) / Math.sqrt(1 + q * q) + home.radius) < 1e-7);
    assert.ok(Math.abs(home.radius - halfHeight * 1.25) < 1e-7, 'initial curvature follows the target crop');
    const end = framing.getGlobePose(width, height, 1);
    const projectedCentreX = end.x * d / (d * d - end.radius * end.radius);
    assert.ok(Math.abs(projectedCentreX + halfHeight * width / height / d) < 1e-7);
    let last = home.radius;
    for (let i = 1; i <= 100; i++) {
      const pose = framing.getGlobePose(width, height, i / 100);
      assert.ok(pose.radius <= last && Number.isFinite(pose.x + pose.y));
      last = pose.radius;
    }
    assert.deepEqual(framing.getGlobePose(width, height, 0), home, 'reverse scroll is deterministic');
  }
});

test('particles are unique, stable, spherical and retain sparse oceans', () => {
  const geometry = createParticleGeometry(lat => lat > 0, 10000);
  const again = createParticleGeometry(lat => lat > 0, 10000);
  const points = geometry.getAttribute('position');
  assert.ok(points.count > 5000 && points.count < 7500);
  assert.deepEqual(points.array, again.getAttribute('position').array);
  const unique = new Set();
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i), y = points.getY(i), z = points.getZ(i);
    assert.ok(Math.abs(Math.hypot(x, y, z) - 1) < 0.00101);
    unique.add(`${x},${y},${z}`);
  }
  assert.equal(unique.size, points.count, 'no duplicate points creating white continental sheets');
  geometry.dispose(); again.dispose();
});

test('rotation preserves the current speed', () => {
  assert.equal(framing.GLOBE_ROTATION_SPEED, 0.028);
});

test('every ordinary land particle is white without removing or moving surface samples', () => {
  const geometry = createParticleGeometry(() => true, 60000);
  const positions = geometry.getAttribute('position'), colors = geometry.getAttribute('aColor');
  assert.equal(positions.count, 60000);
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    assert.ok(Math.abs(Math.hypot(x, y, z) - 1) < 0.00101);
    const r = colors.getX(i), g = colors.getY(i), b = colors.getZ(i);
    assert.ok(g > 0.7 && b > 0.7 && Math.abs(r - g) < 0.02 && Math.abs(r - b) < 0.05, 'land surface is white at every geographic position');
  }
  geometry.dispose();
});

test('ocean structure is neutral-dominant and remains sparser than land', () => {
  const ocean = createParticleGeometry(() => false, 10000);
  const land = createParticleGeometry(() => true, 10000);
  const colors = ocean.getAttribute('aColor');
  const surface = ocean.getAttribute('aOcean');
  assert.ok(surface, 'ocean particles need a selective material treatment');
  let red = 0, neutral = 0;
  for (let i = 0; i < colors.count; i++) {
    assert.equal(surface.getX(i), 1);
    if (colors.getY(i) < 0.03) red++; else neutral++;
  }
  assert.ok(red / 10000 > 0.18 && red / 10000 < 0.22, 'restore the earlier visible ocean accents without inventing land');
  assert.ok(neutral / 10000 > 0.2, 'neutral samples preserve water structure');
  assert.ok(colors.count < land.getAttribute('position').count / 2, 'land remains geographically denser');
  assert.ok(neutral > red);
  assert.equal(land.getAttribute('aOcean').array.some(value => value !== 0), false);
  ocean.dispose(); land.dispose();
});
