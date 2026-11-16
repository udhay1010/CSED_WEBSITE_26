import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const output = 'docs/verification/particle-earth';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [];
const errors = [];
const externalFailures = [];
try {
  for (const [name, width, height] of [['desktop', 1536, 1024], ['tablet', 768, 1024], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on('pageerror', e => errors.push(`${name}: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource:')) errors.push(`${name}: ${m.text()}`); });
    page.on('requestfailed', request => {
      if (request.failure().errorText === 'net::ERR_ABORTED') return;
      const entry = `${request.url()}: ${request.failure().errorText}`;
      if (request.url().startsWith('http://127.0.0.1:5173')) errors.push(entry);
      else externalFailures.push(entry);
    });
    page.on('response', response => { if (response.status() >= 400 && response.url().startsWith('http://127.0.0.1:5173')) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto('http://127.0.0.1:5173');
    await page.waitForTimeout(2000);
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      const canvas = document.querySelector('[data-globe-stage] canvas');
      canvas.testMarker = 'persistent';
      const url = performance.getEntriesByType('resource').find(e => e.name.includes('/@react-three_fiber.js')).name;
      const { _roots } = await import(url);
      window.earthTestRoot = _roots.get(canvas).store;
      const points = [];
      window.earthTestRoot.getState().scene.traverse(o => { if (o.isPoints) points.push(o.geometry.uuid); });
      window.earthTestGeometry = points;
    });
    const aboutTop = await page.locator('#about').evaluate(el => el.getBoundingClientRect().top + scrollY);
    let lastAngle;
    for (const [state, p] of [['top', 0], ['early', 0.2], ['middle', 0.5], ['near', 0.85], ['final', 1], ['reverse', 0]]) {
      const y = p === 0 ? 0 : aboutTop - height + p * (height - 80);
      await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y);
      await page.waitForTimeout(state === 'final' ? 14000 : 450);
      const data = await page.evaluate(async () => {
        const storeUrl = performance.getEntriesByType('resource').find(e => e.name.includes('/src/store/introStore.js')).name;
        const { useIntroStore } = await import(storeUrl);
        const stage = document.querySelector('[data-globe-stage]');
        const canvas = stage.querySelector('canvas');
        const root = window.earthTestRoot.getState();
        const geometries = [], rotations = [];
        root.scene.traverse(o => { if (o.isPoints) { geometries.push(o.geometry.uuid); rotations.push(o.parent.rotation.y); } });
        const nestedScrollers = [...document.querySelectorAll('body *')].filter(el => /^(auto|scroll)$/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1).length;
        return { progress: useIntroStore.getState().scrollProgress, opacity: Number(stage.style.opacity), persistent: canvas.testMarker === 'persistent', sameGeometry: JSON.stringify(geometries) === JSON.stringify(window.earthTestGeometry), rotations, calls: root.gl.info.render.calls, points: root.gl.info.render.points, nestedScrollers, width: innerWidth, scrollWidth: document.documentElement.scrollWidth, scrollbar: getComputedStyle(document.documentElement).scrollbarWidth, webgl: !!canvas.getContext('webgl2'), scrollY };
      });
      assert.ok(Math.abs(data.progress - p) < 0.01, `${name}/${state}: scroll progress ${data.progress}`);
      assert.ok(data.persistent && data.webgl && data.sameGeometry, 'one persistent WebGL canvas and unchanged particle geometry');
      assert.equal(data.width, data.scrollWidth, 'no horizontal overflow');
      assert.equal(data.scrollbar, 'none');
      assert.equal(data.nestedScrollers, 0, 'single native document scroll container');
      if (lastAngle !== undefined) assert.ok(data.rotations[0] > lastAngle, 'planet rotates at every scroll state');
      lastAngle = data.rotations[0];
      await page.screenshot({ path: `${output}/${name}-${state}.png` });
      results.push({ name, state, ...data });
    }
    if (width < 1024) await page.getByRole('button', { name: 'Toggle navigation' }).click();
    await page.locator('nav').getByRole('button', { name: 'About', exact: true }).click();
    await page.waitForTimeout(1500);
    assert.ok(Math.abs(await page.locator('#about').evaluate(el => el.getBoundingClientRect().top) - 80) < 2);
    if (width < 1024) assert.equal(await page.getByRole('button', { name: 'Toggle navigation' }).getAttribute('aria-expanded'), 'false');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.getByRole('link', { name: 'Our initiatives' }).click();
    await page.waitForTimeout(1500);
    assert.ok(Math.abs(await page.locator('#events').evaluate(el => el.getBoundingClientRect().top) - 80) < 2);
    assert.equal(await page.locator('[data-globe-stage]').evaluate(el => Number(el.style.opacity)), 0, 'globe releases after About');
    if (name === 'desktop') {
      for (const [label, id] of [['Blog', 'blogs'], ['Board', 'board'], ['Contact', 'site-footer'], ['Home', 'home']]) {
        await page.locator('nav').getByRole('button', { name: label, exact: true }).click();
        await page.waitForTimeout(1500);
        const top = await page.locator(`#${id}`).evaluate(el => el.getBoundingClientRect().top);
        assert.ok(label === 'Home' ? top === 0 : label === 'Contact' ? top < height : Math.abs(top - 80) < 2, `${label} navigation`);
      }
      await page.mouse.wheel(0, 220);
      await page.waitForTimeout(250);
      assert.ok(await page.evaluate(() => scrollY > 100), 'native mouse-wheel scrolling');
      const previous = await page.evaluate(() => scrollY);
      await page.locator('body').click({ position: { x: 4, y: 150 } });
      await page.keyboard.press('PageDown');
      await page.waitForTimeout(400);
      assert.ok(await page.evaluate(() => scrollY) > previous, 'native keyboard scrolling');
    }
    await page.close();
  }
  const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await reduced.goto('http://127.0.0.1:5173');
  await reduced.waitForTimeout(1800);
  const rotation = () => reduced.evaluate(async () => {
    const url = performance.getEntriesByType('resource').find(e => e.name.includes('/@react-three_fiber.js')).name;
    const { _roots } = await import(url);
    let angle;
    _roots.get(document.querySelector('[data-globe-stage] canvas')).store.getState().scene.traverse(o => { if (o.isPoints && angle === undefined) angle = o.parent.rotation.y; });
    return angle;
  });
  const before = await rotation();
  await reduced.waitForTimeout(500);
  assert.equal(await rotation(), before, 'reduced motion freezes the planetary rotation');
  await reduced.screenshot({ path: `${output}/mobile-reduced.png` });
  await reduced.close();
  const fallback = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await fallback.addInitScript(() => { const get = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.startsWith('webgl') ? null : get.call(this, type, ...args); }; });
  await fallback.goto('http://127.0.0.1:5173');
  await fallback.waitForTimeout(1500);
  assert.ok(await fallback.getByRole('heading', { level: 1 }).isVisible());
  await fallback.getByRole('link', { name: 'Explore more' }).click();
  await fallback.waitForTimeout(1300);
  assert.ok(await fallback.locator('#about').evaluate(el => el.getBoundingClientRect().top < 130));
  await fallback.screenshot({ path: `${output}/mobile-no-webgl.png` });
  await fallback.close();
  assert.deepEqual(errors, [], 'no browser or shader errors');
  await writeFile(`${output}/results.json`, JSON.stringify({ results, errors, externalFailures }, null, 2));
  console.log(`PASS: ${results.length} viewport/scroll states, persistent WebGL, reverse scroll, navigation, CTAs, reduced motion and WebGL fallback.`);
} finally { await browser.close(); }
