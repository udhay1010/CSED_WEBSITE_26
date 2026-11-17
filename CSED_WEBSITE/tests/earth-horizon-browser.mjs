import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const phase = process.argv[2] || 'after';
const output = 'docs/verification/earth-horizon';
await mkdir(`${output}/${phase}`, { recursive: true });
const baseline = phase === 'before' ? null : JSON.parse(await readFile(`${output}/before/results.json`, 'utf8'));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [], errors = [];
try {
  for (const [name, width, height] of [['desktop', 1536, 1024], ['laptop', 1366, 768], ['tablet', 768, 1024], ['mobile', 390, 844], ['small-mobile', 320, 568]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(message.text()); });
    await page.goto('http://127.0.0.1:5173');
    await page.waitForTimeout(1000);
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      const url = performance.getEntriesByType('resource').find(e => e.name.includes('/@react-three_fiber.js')).name;
      const { _roots } = await import(url);
      window.horizonCanvas = document.querySelector('[data-globe-stage] canvas');
      window.horizonRoot = _roots.get(window.horizonCanvas).store;
      window.horizonRoot.getState().scene.traverse(o => { if (o.isPoints && o.geometry.getAttribute('aSize')) window.horizonPoints = o; });
      window.horizonGeometry = window.horizonPoints.geometry.uuid;
    });
    const top = await page.evaluate(() => {
      const root = window.horizonRoot.getState(), globe = root.scene.children[0];
      const d = root.camera.position.z, r = globe.scale.x, y = globe.position.y;
      const a = d * d - r * r, b = 2 * y * d, c = y * y - r * r;
      const q = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
      const horizon = (1 + q / Math.tan(root.camera.fov * Math.PI / 360)) * innerHeight / 2;
      const style = selector => { const s = getComputedStyle(document.querySelector(selector)); return Object.fromEntries(['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'color', 'textShadow', 'border', 'borderRadius', 'padding'].map(key => [key, s[key]])); };
      return { horizon, radius: r, yaw: window.horizonPoints.parent.rotation.y, heroHeight: document.querySelector('#home').getBoundingClientRect().height, ctaBottom: document.querySelector('.hero-actions').getBoundingClientRect().bottom, headingTop: document.querySelector('h1').getBoundingClientRect().top, heading: document.querySelector('h1').textContent, tagline: document.querySelector('.hero-tagline').textContent, headingStyle: style('h1'), secondaryStyle: style('.hero-secondary'), taglineStyle: style('.hero-tagline'), goldStyle: style('.hero-tagline > span'), ctaStyle: style('.hero-action'), navbarStyle: style('nav'), points: window.horizonPoints.geometry.getAttribute('position').count, drawCalls: root.gl.info.render.calls, scrollWidth: document.documentElement.scrollWidth };
    });
    await page.screenshot({ path: `${output}/${phase}/${name}-top.png` });
    const previous = baseline?.results.find(r => r.name === name);
    if (previous) {
      for (const key of ['headingStyle', 'secondaryStyle', 'taglineStyle', 'goldStyle', 'ctaStyle', 'navbarStyle', 'heading', 'tagline', 'heroHeight', 'radius', 'yaw']) assert.deepEqual(top[key], previous.top[key], `${name}: preserved ${key}`);
      assert.ok(top.horizon < previous.top.horizon - height * 0.03);
      assert.ok(Math.abs(top.horizon / height - (width < 768 ? 0.64 : 0.62)) < 0.001);
      assert.ok(top.horizon - top.ctaBottom > 24, `${name}: CTA gap ${top.horizon - top.ctaBottom}px`);
      assert.ok(top.headingTop >= 80);
      assert.equal(top.scrollWidth, width);
      assert.ok(top.points < previous.top.points * 1.05, 'no brute-force density increase');
      assert.ok(top.drawCalls <= previous.top.drawCalls);
    }
    const about = await page.locator('#about').evaluate(el => el.getBoundingClientRect().top + scrollY);
    let finalPose;
    for (const [state, progress] of [['middle', 0.5], ['left', 1], ['reverse', 0]]) {
      await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), progress === 0 ? 0 : about - height + progress * (height - 80));
      await page.waitForTimeout(250);
      const pose = await page.evaluate(() => {
        const globe = window.horizonRoot.getState().scene.children[0];
        return { position: globe.position.toArray(), scale: globe.scale.toArray(), yaw: window.horizonPoints.parent.rotation.y, persistent: document.querySelector('[data-globe-stage] canvas') === window.horizonCanvas && window.horizonPoints.geometry.uuid === window.horizonGeometry };
      });
      assert.ok(pose.persistent);
      assert.equal(pose.yaw, top.yaw, 'reduced motion and scroll never reset the orientation');
      if (state === 'left') {
        finalPose = pose;
        if (previous) {
          for (const key of ['position', 'scale']) pose[key].forEach((value, i) => assert.ok(Math.abs(value - previous.finalPose[key][i]) < 0.00001, 'final half-visible pose is unchanged within native scroll subpixels'));
          assert.equal(pose.yaw, previous.finalPose.yaw);
        }
      }
      await page.screenshot({ path: `${output}/${phase}/${name}-${state}.png` });
    }
    if (name === 'desktop') {
      await page.evaluate(() => {
        const root = window.horizonRoot.getState();
        root.setFrameloop('never');
        window.horizonPoints.parent.rotation.y += 1.8;
        root.scene.updateMatrixWorld(true); root.gl.render(root.scene, root.camera);
      });
      await page.screenshot({ path: `${output}/${phase}/desktop-alternate-longitude.png` });
    }
    results.push({ name, top, finalPose });
    await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(`${output}/${phase}/results.json`, JSON.stringify({ results, errors }, null, 2));
  console.log(`PASS: ${phase} horizon captures; five viewports, forward/reverse scroll, alternate longitude${baseline ? ', preserved final pose/type/buttons/navigation/hero footprint' : ''}.`);
} finally { await browser.close(); }
