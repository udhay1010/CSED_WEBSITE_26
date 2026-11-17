import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const output = 'docs/verification/globe-events-fade';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [], errors = [];
try {
  for (const [name, width, height] of [['desktop', 1536, 1024], ['tablet', 768, 1024], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:5173'); await page.waitForTimeout(1500);
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      const url = performance.getEntriesByType('resource').find(e => e.name.includes('/@react-three_fiber.js')).name;
      const { _roots } = await import(url);
      window.fadeCanvas = document.querySelector('[data-globe-stage] canvas');
      window.fadeRoot = _roots.get(window.fadeCanvas).store;
      window.fadeRoot.getState().scene.traverse(o => {
        if (o.isPoints && o.geometry.getAttribute('aSize') && o.material.uniforms.uHalo.value === 0) {
          window.fadeSurface = o; window.fadeGeometry = o.geometry.uuid;
        }
      });
    });
    const sample = () => page.evaluate(() => {
      const stage = document.querySelector('[data-globe-stage]'), rect = document.querySelector('#events').getBoundingClientRect();
      const navbarBottom = document.querySelector('nav').getBoundingClientRect().bottom;
      const coverage = Math.max(0, Math.min(1, (Math.min(rect.bottom, innerHeight) - Math.max(rect.top, navbarBottom)) / (innerHeight - navbarBottom)));
      const outer = window.fadeSurface.parent.parent.parent;
      return { coverage, opacity: Number(stage.style.opacity), clip: getComputedStyle(stage).clipPath,
        sameCanvas: stage.querySelector('canvas') === window.fadeCanvas, sameGeometry: window.fadeSurface.geometry.uuid === window.fadeGeometry,
        pose: [...outer.position.toArray(), ...outer.scale.toArray()], yaw: window.fadeSurface.parent.rotation.y,
        frameloop: window.fadeRoot.getState().frameloop, top: rect.top, navbarBottom };
    });
    const seek = async coverage => {
      await page.evaluate(coverage => {
        const rect = document.querySelector('#events').getBoundingClientRect();
        const bottom = document.querySelector('nav').getBoundingClientRect().bottom;
        scrollTo({ top: Math.ceil(rect.top + scrollY - innerHeight + coverage * (innerHeight - bottom)), behavior: 'instant' });
      }, coverage);
      await page.waitForTimeout(150);
      return sample();
    };
    let pose;
    for (const [direction, targets] of [['forward', [0, 0.15, 0.3, 0.45, 0.55, 0.6]], ['reverse', [0.6, 0.55, 0.45, 0.3, 0.15, 0]]]) {
      for (const target of targets) {
        const data = await seek(target);
        assert.ok(Math.abs(data.coverage - target) < 0.002);
        const expected = 1 - Math.min(1, data.coverage / 0.6) ** 2;
        assert.ok(Math.abs(data.opacity - expected) < 1e-6, `${name}/${direction}/${target}: ${data.opacity}`);
        assert.ok(data.sameCanvas && data.sameGeometry); assert.equal(data.clip, 'none');
        if (target < 0.6) assert.ok(data.opacity > 0); else assert.equal(data.opacity, 0);
        if (!pose) pose = data.pose; else assert.deepEqual(data.pose, pose, 'left-side transform stays unchanged through the fade');
        if (target === 0.3) {
          await page.waitForTimeout(300); const held = await sample();
          assert.equal(held.opacity, data.opacity, 'fade stops at the current scroll position');
          assert.ok(held.yaw > data.yaw, 'rotation continues during partial opacity');
        }
        await page.screenshot({ path: `${output}/${name}-${direction}-${Math.round(target * 100)}.png` });
        results.push({ name, direction, target, ...data });
      }
    }
    assert.ok((await seek(0.59)).opacity > 0, '59% coverage remains nonzero');
    assert.equal((await seek(0.6)).opacity, 0);
    await page.evaluate(() => scrollTo({ top: document.querySelector('#blogs').getBoundingClientRect().top + scrollY, behavior: 'instant' }));
    await page.waitForTimeout(150); assert.equal((await sample()).opacity, 0, 'globe stays hidden after Events leaves');
    assert.equal((await seek(0)).opacity, 1, 'reverse from later sections fully restores the globe');
    if (width < 1024) {
      await seek(0.3); await page.getByRole('button', { name: 'Toggle navigation' }).click(); await page.waitForTimeout(150);
      const menu = await sample(); assert.ok(menu.navbarBottom > 81);
      assert.ok(Math.abs(menu.opacity - (1 - Math.min(1, menu.coverage / 0.6) ** 2)) < 1e-6, 'open menu uses actual navbar bottom');
      await page.getByRole('button', { name: 'Toggle navigation' }).click();
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth));
    await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify({ results, errors }, null, 2));
  console.log('PASS: 36 forward/reverse fade states, exact zero at 60%, nonzero at 59%, held scroll, continuous rotation, persistent canvas/geometry, unchanged pose, menu height and no later reappearance.');
} finally { await browser.close(); }
