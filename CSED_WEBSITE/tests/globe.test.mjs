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
    const q = 0.36 * halfHeight / d;
    // Distance from the globe centre to the ray at 68% viewport height.
    assert.ok(Math.abs((home.y + q * d) / Math.sqrt(1 + q * q) + home.radius) < 1e-7);
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
  assert.ok(points.count > 5000 && points.count < 6500);
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
