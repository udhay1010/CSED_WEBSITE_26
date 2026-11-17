import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';

const phase = process.argv[2] || 'after';
const output = 'docs/verification/earth-reference';
await mkdir(`${output}/${phase}`, { recursive: true });
const baseline = phase === 'before' ? null : JSON.parse(await readFile(`${output}/before/results.json`, 'utf8'));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [], errors = [];
try {
  for (const [name, width, height] of [['desktop', 1536, 1024], ['tablet', 768, 1024], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource:')) errors.push(m.text()); });
    await page.goto('http://127.0.0.1:5173');
    await page.waitForTimeout(1200);
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      const url = performance.getEntriesByType('resource').find(e => e.name.includes('/@react-three_fiber.js')).name;
      const { _roots } = await import(url);
      window.referenceCanvas = document.querySelector('[data-globe-stage] canvas');
      window.referenceRoot = _roots.get(window.referenceCanvas).store;
      window.referenceRoot.getState().scene.traverse(o => { if (o.isPoints && o.geometry.getAttribute('aSize')) window.referencePoints = o; });
      window.referenceGeometry = window.referencePoints.geometry.uuid;
    });
    const ui = await page.evaluate(() => {
      const r = selector => { const e = document.querySelector(selector); return { html: e.innerHTML, rect: e.getBoundingClientRect().toJSON(), style: getComputedStyle(e).cssText, font: getComputedStyle(e).font, color: getComputedStyle(e).color }; };
      return { heading: r('h1'), copy: r('.hero-copy'), cta: r('.hero-actions'), navbar: r('nav'), heroHeight: document.querySelector('#home').getBoundingClientRect().height, scrollWidth: document.documentElement.scrollWidth, yaw: window.referencePoints.parent.rotation.y };
    });
    if (baseline) assert.deepEqual(ui, baseline.results.find(r => r.name === name).ui, 'unrelated HTML, layout, styles, orientation and page flow stay unchanged');
    await page.screenshot({ path: `${output}/${phase}/${name}-top.png` });
    let comparison;
    if (name === 'desktop') {
      const crop = await page.screenshot({ clip: { x: 0, y: 650, width: 1536, height: 374 } });
      comparison = await page.evaluate(async data => {
        const inspect = async source => {
          const image = new Image(); image.src = source; await image.decode();
          const canvas = document.createElement('canvas'); canvas.width = 1043; canvas.height = 253;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          context.drawImage(image, 0, 0, 1043, 253);
          const pixels = context.getImageData(0, 0, 1043, 253).data;
          let white = 0, red = 0, luminance = 0, firstHorizonRow = -1;
          for (let y = 0; y < 253; y++) {
            let centerBright = 0;
            for (let x = 0; x < 1043; x++) {
              const k = (y * 1043 + x) * 4, r = pixels[k], g = pixels[k + 1], b = pixels[k + 2];
              if (r > 85 && g > r * 0.65 && b > r * 0.65) white++;
              if (r > 45 && r > g * 1.7 && r > b * 1.4) red++;
              luminance += 0.2126 * r + 0.7152 * g + 0.0722 * b;
              if (x > 350 && x < 693 && r > 85) centerBright++;
            }
            if (firstHorizonRow < 0 && centerBright > 18) firstHorizonRow = y;
          }
          return { image: canvas.toDataURL('image/png').split(',')[1], metrics: { white, red, meanLuminance: luminance / (1043 * 253), firstHorizonRow } };
        };
        const actual = await inspect(`data:image/png;base64,${data}`);
        const target = await inspect('/earth-target.png');
        return { image: actual.image, actual: actual.metrics, target: target.metrics };
      }, crop.toString('base64'));
      await writeFile(`${output}/${phase}/globe-1043x253.png`, Buffer.from(comparison.image, 'base64'));
      delete comparison.image;
      console.log(phase, comparison);
    }
    const about = await page.locator('#about').evaluate(e => e.getBoundingClientRect().top + scrollY);
    let finalPose;
    for (const [state, progress] of [['middle', 0.5], ['left', 1], ['reverse', 0]]) {
      await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), progress ? about - height + progress * (height - 80) : 0);
      await page.waitForTimeout(250);
      const pose = await page.evaluate(() => {
        const globe = window.referenceRoot.getState().scene.children[0];
        return { position: globe.position.toArray(), scale: globe.scale.toArray(), yaw: window.referencePoints.parent.rotation.y, persistent: document.querySelector('[data-globe-stage] canvas') === window.referenceCanvas && window.referencePoints.geometry.uuid === window.referenceGeometry };
      });
      assert.ok(pose.persistent); assert.equal(pose.yaw, ui.yaw);
      if (state === 'left') {
        finalPose = pose;
        if (baseline) {
          const old = baseline.results.find(r => r.name === name).finalPose;
          for (const key of ['position', 'scale']) pose[key].forEach((v, i) => assert.ok(Math.abs(v - old[key][i]) < 0.00001, 'final pose is preserved within native scroll subpixels'));
        }
      }
      await page.screenshot({ path: `${output}/${phase}/${name}-${state}.png` });
    }
    if (name === 'desktop') {
      for (const [state, angle] of [['asia', -3.34], ['pacific', 1.6]]) {
        await page.evaluate(angle => {
          const r = window.referenceRoot.getState(); r.setFrameloop('never');
          window.referencePoints.parent.rotation.y = angle;
          r.scene.updateMatrixWorld(true); r.gl.render(r.scene, r.camera);
        }, angle);
        await page.screenshot({ path: `${output}/${phase}/${state}-hero.png` });
      }
    }
    results.push({ name, ui, comparison, finalPose });
    await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(`${output}/${phase}/results.json`, JSON.stringify({ results, errors }, null, 2));
  console.log(`PASS: ${phase} visual captures, exact UI preservation, stable canvas/geometry, scroll reversal and final pose.`);
} finally { await browser.close(); }
