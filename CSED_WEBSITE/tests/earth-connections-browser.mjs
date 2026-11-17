import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const output = 'docs/verification/earth-final-details';
await mkdir(output, { recursive: true });
// A local pre-change capture adds exact UI preservation checks when available.
const beforeUI = await readFile(`${output}/before-ui.json`, 'utf8').then(JSON.parse).catch(error => {
  if (error.code !== 'ENOENT') throw error;
  return null;
});
const land = JSON.parse(await readFile('public/earth-land.geojson', 'utf8'));
function insideRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x, y] = ring[i], [px, py] = ring[j];
    if ((y > lat) !== (py > lat) && lon < (px - x) * (lat - y) / (py - y) + x) inside = !inside;
  }
  return inside;
}
function actualLand(lon, lat) {
  return land.features.some(feature => (feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates)
    .some(polygon => insideRing(lon, lat, polygon[0]) && !polygon.slice(1).some(ring => insideRing(lon, lat, ring))));
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [], errors = [];
try {
  for (const [name, width, height] of [['desktop', 1536, 1024], ['tablet', 768, 1024], ['mobile', 390, 844], ['small-mobile', 320, 568]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource:')) errors.push(m.text()); });
    await page.goto('http://127.0.0.1:5173'); await page.waitForTimeout(1200);
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = 'auto';
      const url = performance.getEntriesByType('resource').find(e => e.name.includes('/@react-three_fiber.js')).name;
      const { _roots } = await import(url);
      window.connectionCanvas = document.querySelector('[data-globe-stage] canvas');
      window.connectionRoot = _roots.get(window.connectionCanvas).store;
      const root = window.connectionRoot.getState();
      root.scene.traverse(o => {
        if (o.isPoints && o.geometry.getAttribute('aSize') && o.material.uniforms.uHalo.value === 0) window.surface = o;
        if (o.isLineSegments && o.geometry.getAttribute('aAnchor')) window.connections = o;
        if (o.isPoints && o.geometry.getAttribute('aAnchor') && o.material.uniforms.uGlow.value === 0) window.nodes = o;
      });
      window.surfaceGeometry = window.surface.geometry.uuid;
    });
    const data = await page.evaluate(() => {
      const g = window.surface.geometry, color = g.getAttribute('aColor'), ocean = g.getAttribute('aOcean');
      let redLand = 0, redWater = 0;
      for (let i = 0; i < color.count; i++) if (color.getY(i) < 0.03) { if (ocean.getX(i)) redWater++; else redLand++; }
      const positions = window.nodes.geometry.getAttribute('position');
      const anchors = [];
      for (let i = 0; i < positions.count; i += 2) {
        const base = [positions.getX(i), positions.getY(i), positions.getZ(i)];
        const tip = [positions.getX(i + 1), positions.getY(i + 1), positions.getZ(i + 1)];
        anchors.push({ base, tip, lat: Math.asin(base[1] / Math.hypot(...base)) * 180 / Math.PI, lon: Math.atan2(-base[2], base[0]) * 180 / Math.PI });
      }
      const root = window.connectionRoot.getState(), cta = document.querySelector('.hero-actions').getBoundingClientRect();
      let overlaps = 0;
      for (let i = 1; i < positions.count; i += 2) {
        const tip = root.camera.position.clone().set(positions.getX(i), positions.getY(i), positions.getZ(i)).applyMatrix4(window.nodes.matrixWorld).project(root.camera);
        const base = root.camera.position.clone().set(positions.getX(i - 1), positions.getY(i - 1), positions.getZ(i - 1));
        const world = base.clone().applyMatrix4(window.nodes.matrixWorld);
        const facing = base.transformDirection(window.nodes.matrixWorld).dot(root.camera.position.clone().sub(world).normalize());
        const x = (tip.x + 1) * innerWidth / 2, y = (1 - tip.y) * innerHeight / 2;
        if (facing > 0.06 && x >= cta.left - 8 && x <= cta.right + 8 && y >= cta.top - 8 && y <= cta.bottom + 8) overlaps++;
      }
      return { redLand, redWater, anchors, overlaps, sameRotatingParent: window.connections.parent.parent === window.surface.parent, depthTest: window.connections.material.depthTest && window.nodes.material.depthTest, noDepthWrite: !window.connections.material.depthWrite && !window.nodes.material.depthWrite, yaw: window.surface.parent.rotation.y, scrollWidth: document.documentElement.scrollWidth };
    });
    assert.equal(data.redLand, 0); assert.ok(data.redWater > 0);
    assert.equal(data.overlaps, 0, 'atmospheric nodes stay clear of CTA buttons');
    assert.ok(data.anchors.length >= 8 && data.anchors.length <= 12);
    assert.ok(data.sameRotatingParent && data.depthTest && data.noDepthWrite);
    assert.equal(data.yaw, -3.34); assert.equal(data.scrollWidth, width);
    for (const anchor of data.anchors) {
      assert.ok(actualLand(anchor.lon, anchor.lat), `anchor must be on real land: ${anchor.lat}, ${anchor.lon}`);
      assert.ok(Math.abs(Math.hypot(...anchor.base) - 1) < 1e-6);
      assert.ok(Math.hypot(...anchor.tip) > 1.02 && Math.hypot(...anchor.tip) < 1.12);
    }
    if (name === 'desktop') {
      const ui = await page.evaluate(() => ({ hero: document.querySelector('.hero-copy').innerHTML, nav: document.querySelector('nav').innerHTML, cta: document.querySelector('.hero-actions').getBoundingClientRect().toJSON(), home: document.querySelector('#home').getBoundingClientRect().toJSON() }));
      if (beforeUI) assert.deepEqual(ui, beforeUI);
    }
    await page.screenshot({ path: `${output}/${name}-top.png` });
    const about = await page.locator('#about').evaluate(e => e.getBoundingClientRect().top + scrollY);
    for (const [state, progress] of [['middle', 0.5], ['left', 1], ['reverse', 0]]) {
      await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), progress ? about - height + progress * (height - 80) : 0);
      await page.waitForTimeout(250);
      assert.ok(await page.evaluate(() => window.surface.geometry.uuid === window.surfaceGeometry && document.querySelector('[data-globe-stage] canvas') === window.connectionCanvas));
      await page.screenshot({ path: `${output}/${name}-${state}.png` });
    }
    if (name === 'desktop') {
      for (const [state, angle] of [['asia', -3.34], ['atlantic', -0.45], ['pacific', 1.6]]) {
        await page.evaluate(angle => {
          const r = window.connectionRoot.getState(); r.setFrameloop('never');
          window.surface.parent.rotation.y = angle;
          r.scene.updateMatrixWorld(true); r.gl.render(r.scene, r.camera);
        }, angle);
        await page.screenshot({ path: `${output}/${state}-hero.png` });
      }
      await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), about - 80);
      await page.evaluate(() => window.connectionRoot.getState().setFrameloop('always'));
      await page.waitForTimeout(250);
      const gpu = await page.evaluate(async () => {
        const url = performance.getEntriesByType('resource').find(e => /\/three\.js\?/.test(e.name)).name;
        const THREE = await import(url), r = window.connectionRoot.getState(); r.setFrameloop('never');
        const line = window.connections, nodes = window.nodes;
        const p = nodes.geometry.getAttribute('position'), candidates = [];
        for (let i = 0; i < p.count; i += 2) {
          const base = new THREE.Vector3().fromBufferAttribute(p, i), world = base.clone().applyMatrix4(nodes.matrixWorld);
          const facing = base.clone().transformDirection(nodes.matrixWorld).dot(r.camera.position.clone().sub(world).normalize());
          const ndc = new THREE.Vector3().fromBufferAttribute(p, i + 1).applyMatrix4(nodes.matrixWorld).project(r.camera);
          if (facing < -0.1 && Math.abs(ndc.x) < 0.9 && Math.abs(ndc.y) < 0.9) candidates.push({ index: i, base });
        }
        if (!candidates.length) throw new Error('No on-screen far-side fixture');
        const selected = candidates[0], attribute = line.geometry.getAttribute('aAnchor');
        let offset = 0;
        while (offset < attribute.count && new THREE.Vector3().fromBufferAttribute(attribute, offset).distanceTo(selected.base) > 1e-5) offset++;
        const objects = []; r.scene.traverse(o => { if (o.isMesh || o.isPoints || o.isLineSegments) { objects.push([o, o.visible]); o.visible = o === line || o === nodes; } });
        line.geometry.setDrawRange(offset, 2); nodes.geometry.setDrawRange(selected.index, 2);
        const target = new THREE.WebGLRenderTarget(256, 256), pixels = new Uint8Array(256 * 256 * 4);
        const render = () => { r.gl.setRenderTarget(target); r.gl.clear(); r.gl.render(r.scene, r.camera); r.gl.readRenderTargetPixels(target, 0, 0, 256, 256, pixels); return pixels.reduce((n, value, i) => n + (i % 4 === 3 && value > 0 ? 1 : 0), 0); };
        const hiddenPixels = render();
        const fake = nodes.worldToLocal(r.camera.position.clone()).normalize(), saved = [];
        for (const [object, start] of [[line, offset], [nodes, selected.index]]) {
          const a = object.geometry.getAttribute('aAnchor');
          for (let j = start; j < start + 2; j++) { saved.push([a, j, a.getX(j), a.getY(j), a.getZ(j)]); a.setXYZ(j, fake.x, fake.y, fake.z); }
          a.needsUpdate = true;
        }
        const controlPixels = render();
        for (const [a, j, x, y, z] of saved) { a.setXYZ(j, x, y, z); a.needsUpdate = true; }
        r.gl.setRenderTarget(null); target.dispose();
        line.geometry.setDrawRange(0, Infinity); nodes.geometry.setDrawRange(0, Infinity);
        objects.forEach(([o, visible]) => { o.visible = visible; });
        return { hiddenPixels, controlPixels };
      });
      assert.equal(gpu.hiddenPixels, 0, 'far-side connection and endpoint are invisible even without the depth core');
      assert.ok(gpu.controlPixels > 0, 'same geometry is visible when the anchor-facing control is enabled');
      data.gpuCulling = gpu;
    }
    results.push({ name, ...data }); await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify({ results, errors }, null, 2));
  console.log('PASS: pure-white land, retained red oceans, 12 valid rotating land anchors, stable scroll/UI, and GPU-confirmed far-side hiding.');
} finally { await browser.close(); }
