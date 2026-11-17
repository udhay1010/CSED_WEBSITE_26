import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const phase = process.argv[2] || 'after';
const directory = 'docs/verification/precision-refinement';
await mkdir(`${directory}/${phase}`, { recursive: true });
const baseline = phase === 'before' ? null : JSON.parse(await readFile(`${directory}/before/measurements.json`, 'utf8'));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const measurements = [];
const errors = [];
try {
  for (const [device, width, height] of [['desktop', 1536, 1024], ['laptop', 1366, 768], ['tablet', 768, 1024], ['mobile', 390, 844], ['small-mobile', 320, 568]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.addInitScript(() => {
      const scale = CanvasRenderingContext2D.prototype.scale;
      const fill = CanvasRenderingContext2D.prototype.fillRect;
      CanvasRenderingContext2D.prototype.scale = function(...args) {
        if (this.canvas.classList.contains('hero-dust')) this.canvas.refinementStars = [];
        return scale.apply(this, args);
      };
      CanvasRenderingContext2D.prototype.fillRect = function(x, y, width, height) {
        if (this.canvas.refinementStars) this.canvas.refinementStars.push([width, height]);
        return fill.call(this, x, y, width, height);
      };
    });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource:')) errors.push(m.text()); });
    await page.goto('http://127.0.0.1:5173');
    await page.waitForTimeout(1400);
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      const url = performance.getEntriesByType('resource').find(e => e.name.includes('/@react-three_fiber.js')).name;
      const { _roots } = await import(url);
      const canvas = document.querySelector('[data-globe-stage] canvas');
      window.refinementRoot = _roots.get(canvas).store;
      canvas.refinementMarker = true;
    });
    const top = await page.evaluate(() => {
      const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height }; };
      const style = selector => { const s = getComputedStyle(document.querySelector(selector)); return Object.fromEntries(['fontFamily','fontSize','letterSpacing','fontWeight','color','border','borderRadius','padding','minWidth','minHeight'].map(k => [k, s[k]])); };
      return { deviceWidth: innerWidth, heading: document.querySelector('h1').textContent.trim(), headingRect: rect('h1'), nav: rect('nav'), navStyle: style('nav'), buttonStyle: style('.hero-action'), button: rect('.hero-action'), actions: rect('.hero-actions'), tagline: document.querySelector('.hero-tagline').textContent.replace(/\s+/g, ' ').trim(), taglineRect: rect('.hero-tagline'), home: rect('#home'), about: rect('#about'), scrollWidth: document.documentElement.scrollWidth, stars: document.querySelector('.hero-dust').refinementStars };
    });
    await page.screenshot({ path: `${directory}/${phase}/${device}-top.png` });
    if (phase !== 'before') {
      const previous = baseline.find(item => item.device === device).top;
      assert.equal(top.heading, 'CSED');
      assert.equal(top.tagline, 'Building Bridges to a Better World Through Social Entrepreneurship');
      assert.ok(top.headingRect.top >= top.nav.bottom, `${device}: heading below navbar`);
      assert.ok(top.headingRect.left >= 0 && top.headingRect.right <= width, `${device}: heading fits`);
      assert.ok(top.actions.bottom < height * 0.68 - 25, `${device}: CTA clearance ${height * 0.68 - top.actions.bottom}px`);
      assert.ok(top.button.top > top.taglineRect.bottom, 'buttons follow the tagline');
      assert.deepEqual(top.buttonStyle, previous.buttonStyle, 'button styling is unchanged');
      assert.deepEqual(top.nav, previous.nav, 'navbar layout is unchanged');
      assert.deepEqual(top.navStyle, previous.navStyle, 'navbar styling is unchanged');
      assert.ok(Math.abs(top.about.top - previous.about.top) < 0.15, 'section entry/scroll timing is unchanged within subpixel font rounding');
      assert.ok(Math.abs(top.home.height - previous.home.height) < 0.15, 'hero scroll distance is unchanged within subpixel font rounding');
      assert.equal(top.scrollWidth, width);
      assert.equal(top.stars.length, width < 768 ? 188 : 610, 'modest star density increase');
      for (const [x, y] of top.stars) {
        assert.equal(x, y);
        assert.ok(Math.abs(x - 0.8 * 1.025) < 1e-9 || Math.abs(x - 1.3 * 1.025) < 1e-9, 'star size increases by 2.5%');
      }
      const hierarchy = await page.locator('.hero-secondary').innerText();
      assert.equal(hierarchy.replace(/\s+/g, ' '), 'CENTER FOR SOCIAL ENTREPRENEURSHIP & DEVELOPMENT');
      if (width >= 1024) {
        const lines = await page.locator('.hero-tagline').evaluate(el => el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight));
        assert.ok(lines < 1.2, 'desktop tagline remains one line');
        assert.ok(await page.locator('.hero-secondary > span').last().evaluate(el => el.getBoundingClientRect().height < parseFloat(getComputedStyle(el).lineHeight) * 1.2), 'desktop organisation heading remains one line');
      }
    }
    const poses = [];
    for (const [label, progress] of [['middle', 0.5], ['final', 1]]) {
      await page.evaluate(({ height, progress, aboutTop }) => scrollTo({ top: aboutTop - height + progress * (height - 80), behavior: 'instant' }), { height, progress, aboutTop: top.about.top });
      await page.waitForTimeout(label === 'final' ? 900 : 350);
      const pose = await page.evaluate(() => {
        const group = window.refinementRoot.getState().scene.children[0];
        return { position: group.position.toArray(), scale: group.scale.toArray(), persistent: document.querySelector('[data-globe-stage] canvas').refinementMarker === true };
      });
      assert.ok(pose.persistent);
      poses.push({ label, ...pose });
      if (baseline) {
        const previous = baseline.find(item => item.device === device).poses.find(p => p.label === label);
        for (const key of ['position', 'scale']) pose[key].forEach((value, i) => assert.ok(Math.abs(value - previous[key][i]) < 0.01, `${device}: ${label} globe ${key} is unchanged`));
      }
      await page.screenshot({ path: `${directory}/${phase}/${device}-${label}.png` });
    }
    if (device === 'desktop') {
      for (const [name, longitude] of [['americas', -95], ['atlantic', -35], ['europe-africa', 20], ['asia', 110], ['pacific', -160]]) {
        await page.evaluate(longitude => {
          const root = window.refinementRoot.getState();
          root.setFrameloop('never');
          let particles;
          root.scene.traverse(o => { if (o.isPoints && o.geometry.getAttribute('aSize')) particles = o; });
          const spin = particles.parent;
          const direction = root.camera.position.clone().sub(spin.getWorldPosition(root.camera.position.clone()));
          direction.applyQuaternion(spin.parent.getWorldQuaternion(root.camera.quaternion.clone()).invert());
          direction.applyAxisAngle(direction.clone().set(1, 0, 0), -spin.rotation.x);
          spin.rotation.y = Math.atan2(direction.x, direction.z) - (longitude + 90) * Math.PI / 180;
          root.scene.updateMatrixWorld(true);
          root.gl.render(root.scene, root.camera);
        }, longitude);
        await page.screenshot({ path: `${directory}/${phase}/side-${name}.png` });
      }
      await page.evaluate(() => window.refinementRoot.getState().setFrameloop('always'));
    }
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${directory}/${phase}/${device}-reverse.png` });
    measurements.push({ device, top, poses });
    await page.close();
  }
  assert.deepEqual(errors, [], 'no rendering or JavaScript errors');
  await writeFile(`${directory}/${phase}/measurements.json`, JSON.stringify(measurements, null, 2));
  console.log(`PASS: ${phase} capture, five responsive layouts and five globe longitudes${baseline ? ', original transforms/navbar/CTA styles preserved' : ''}.`);
} finally { await browser.close(); }
