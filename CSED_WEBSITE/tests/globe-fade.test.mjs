import assert from 'node:assert/strict';
import test from 'node:test';
import { getEventsGlobeOpacity } from '../src/utils/globeFade.js';

test('Events coverage excludes the navbar and closely follows all requested opacity targets', () => {
  for (const [viewport, navbar] of [[1024, 81], [844, 81], [900, 90], [844, 401]]) {
    const usable = viewport - navbar;
    for (const [coverage, target] of [[0, 1], [0.15, 0.95], [0.3, 0.75], [0.45, 0.4], [0.55, 0.15], [0.6, 0], [1, 0]]) {
      const rect = { top: viewport - coverage * usable, bottom: viewport * 2 - coverage * usable };
      const opacity = getEventsGlobeOpacity(rect, navbar, viewport);
      assert.ok(Math.abs(opacity - target) < 0.04, `${viewport}/${navbar}/${coverage}: ${opacity}`);
      if (coverage >= 0.6) assert.equal(opacity, 0);
    }
  }
});
test('fade is continuous, monotonic, positive until 60%, and deterministic in reverse', () => {
  const sample = coverage => getEventsGlobeOpacity({ top: 900 - coverage * 810, bottom: 1800 - coverage * 810 }, 90, 900);
  const forward = [];
  for (let i = 0; i <= 600; i++) {
    const opacity = sample(i / 1000); forward.push(opacity);
    if (i > 0) assert.ok(opacity <= forward[i - 1]);
    if (i < 600) assert.ok(opacity > 0);
    if (i > 0) assert.ok(forward[i - 1] - opacity < 0.004);
  }
  for (let i = 600; i >= 0; i--) assert.equal(sample(i / 1000), forward[i]);
});
test('actual intersection handles short sections and the globe stays released past Events', () => {
  assert.equal(getEventsGlobeOpacity({ top: 1000, bottom: 1200 }, 90, 900), 1);
  assert.ok(getEventsGlobeOpacity({ top: 700, bottom: 800 }, 90, 900) > 0.95);
  assert.equal(getEventsGlobeOpacity({ top: -1000, bottom: -100 }, 90, 900), 0);
  assert.equal(getEventsGlobeOpacity({ top: -500, bottom: 100 }, 90, 900), 0);
});
