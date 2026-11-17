import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const output = 'docs/verification/footer-semantic-hover';
const baseline = process.argv.includes('--baseline');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [], errors = [];
try {
  for (const [name, width, height] of [['desktop', 1536, 1024], ['tablet', 768, 1024], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:5173'); await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo({ top: document.querySelector('#site-footer').offsetTop, behavior: 'instant' }); });
    await page.waitForTimeout(1200);
    const layout = await page.locator('#site-footer').evaluate(footer => {
      const origin = footer.getBoundingClientRect();
      return [...footer.querySelectorAll('.brand-logo, .brand-desc, h4, a, small')].map(e => {
        const r = e.getBoundingClientRect();
        return { text: e.textContent.replace(/\s+/g, ' ').trim(), href: e.getAttribute('href'), x: r.x, y: r.y - origin.y, width: r.width, height: r.height };
      });
    });
    if (baseline) {
      await writeFile(`${output}/before-${name}.json`, JSON.stringify(layout));
      await page.screenshot({ path: `${output}/before-${name}.png` });
      await page.close(); continue;
    }
    const before = await readFile(`${output}/before-${name}.json`, 'utf8').then(JSON.parse).catch(e => { if (e.code !== 'ENOENT') throw e; return null; });
    if (before) for (const [i, item] of layout.entries()) {
      assert.equal(item.text, before[i].text); assert.equal(item.href, before[i].href);
      // Inline-block links include line-height leading; prior inline anchors measured the text box.
      for (const key of ['x', 'y', 'width', 'height']) {
        const tolerance = item.href && key === 'height' ? 3 : item.href && key === 'y' ? 1.1 : 0.5;
        assert.ok(Math.abs(item[key] - before[i][key]) < tolerance, `${name}/${item.text}/${key} layout preserved`);
      }
    }
    const footer = page.locator('#site-footer');
    assert.equal(await footer.locator('.footer-word').count(), 0, 'footer text is not split into arbitrary word spans');
    const read = selector => page.locator(selector).evaluateAll(elements => elements.map(e => {
      const css = getComputedStyle(e), m = new DOMMatrix(css.transform);
      return { text: e.textContent, color: css.color, scale: m.a, x: e.offsetLeft, y: e.offsetTop, width: e.offsetWidth, height: e.offsetHeight };
    }));
    const letters = '#site-footer .brand-logo span';
    for (const index of [0, 2, 4, 6]) {
      const initial = await read(letters);
      await page.locator(letters).nth(index).hover(); await page.waitForTimeout(280);
      const hovered = await read(letters);
      for (let i = 0; i < hovered.length; i++) {
        if (i === index) { assert.equal(hovered[i].color, 'rgb(225, 29, 46)'); assert.ok(hovered[i].scale > 1.04 && hovered[i].scale < 1.09); }
        else assert.deepEqual(hovered[i], initial[i], 'adjacent letters and periods remain untouched');
      }
      await page.mouse.move(width - 1, 100); await page.waitForTimeout(280);
      assert.deepEqual(await read(letters), initial, 'letter reverses completely');
    }
    const links = '#site-footer a';
    for (const href of ['#about', '#team', '#join', '#top', '#instagram', '#linkedin', '#whatsapp', 'mailto:csed@vit.ac.in']) {
      const initial = await read(links);
      const index = await page.locator(links).evaluateAll((es, href) => es.findIndex(e => e.getAttribute('href') === href), href);
      const link = page.locator(links).nth(index);
      assert.equal(await link.locator('span').count(), 0, 'whole clickable label is the animation target');
      await link.hover(); await page.waitForTimeout(280);
      const hovered = await read(links);
      assert.equal(hovered[index].color, 'rgb(225, 29, 46)'); assert.ok(Math.abs(hovered[index].scale - 1.05) < 0.001);
      for (let i = 0; i < initial.length; i++) if (i !== index) assert.deepEqual(hovered[i], initial[i], 'other links stay unchanged');
      for (let i = 0; i < initial.length; i++) for (const key of ['x', 'y', 'width', 'height']) assert.equal(hovered[i][key], initial[i][key], 'no layout reflow');
      await page.mouse.move(width - 1, 100); await page.waitForTimeout(280);
      assert.deepEqual(await read(links), initial, 'link reverses completely');
    }
    for (const selector of ['#site-footer .brand-desc', '#site-footer .col h4', '#site-footer .legal small']) {
      const initial = await read(selector);
      for (const element of await page.locator(selector).all()) {
        await element.hover(); await page.waitForTimeout(280);
        assert.deepEqual(await read(selector), initial, 'non-interactive text remains static');
        assert.notEqual(await element.evaluate(e => getComputedStyle(e).cursor), 'pointer');
      }
    }
    await footer.getByRole('link', { name: 'About Us', exact: true }).hover(); await page.waitForTimeout(280);
    await page.screenshot({ path: `${output}/${name}-about-hover.png` });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await footer.getByRole('link', { name: 'About Us', exact: true }).evaluate(e => new DOMMatrix(getComputedStyle(e).transform).a), 1);
    await page.locator(letters).first().hover();
    assert.equal((await read(letters))[0].scale, 1, 'reduced motion disables text scaling');
    await page.mouse.move(width - 1, 100);
    const about = footer.getByRole('link', { name: 'About Us', exact: true });
    await about.focus(); assert.ok(await about.evaluate(e => e === document.activeElement));
    await about.click(); await page.waitForTimeout(200);
    assert.ok(await page.locator('#about').evaluate(e => Math.abs(e.getBoundingClientRect().top - 80) < 2), 'original footer link still navigates');
    // The historical large SVG heading already has individual handlers; verify them without replacing its animation.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => {
      const root = document.querySelector('.hero-root');
      scrollTo({ top: root.getBoundingClientRect().top + scrollY + 1400, behavior: 'instant' });
    });
    await page.waitForTimeout(1600);
    let visibleGlyphs = 0;
    for (const index of [0, 2, 4, 6]) {
      const glyph = page.locator('.svg-glyph').nth(index), rect = await glyph.boundingBox();
      if (!rect || rect.x < 0 || rect.x + rect.width > width) continue;
      const initial = await page.locator('.svg-glyph').evaluateAll(es => es.map(e => ({ fill: getComputedStyle(e).fill, transform: e.getAttribute('transform') })));
      await glyph.hover(); await page.waitForTimeout(500);
      const hovered = await page.locator('.svg-glyph').evaluateAll(es => es.map(e => ({ fill: getComputedStyle(e).fill, transform: e.getAttribute('transform') })));
      assert.equal(hovered[index].fill, 'rgb(225, 29, 46)'); assert.ok(hovered[index].transform.includes('scale(1.18)'));
      for (let i = 0; i < initial.length; i++) if (i !== index) assert.deepEqual(hovered[i], initial[i]);
      if (name === 'desktop' && index === 0) await page.screenshot({ path: `${output}/desktop-large-C-hover.png` });
      await page.mouse.move(width - 1, 100); await page.waitForTimeout(500);
      assert.equal(await glyph.evaluate(e => getComputedStyle(e).fill), 'rgb(245, 245, 245)');
      visibleGlyphs++;
    }
    if (name === 'desktop') assert.equal(visibleGlyphs, 4);
    if (name === 'desktop') {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const glyph = page.locator('.svg-glyph').first();
      await glyph.hover();
      assert.equal(await glyph.evaluate(e => getComputedStyle(e).fill), 'rgb(225, 29, 46)');
      assert.ok(await glyph.evaluate(e => e.getAttribute('transform').includes('scale(1)')));
      await page.mouse.move(width - 1, 100);
      assert.equal(await glyph.evaluate(e => getComputedStyle(e).fill), 'rgb(245, 245, 245)');
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth));
    results.push({ name, stableLayout: true, independentLetters: true, completeLinkHover: true, staticInformationalText: true, svgLettersChecked: visibleGlyphs });
    await page.close();
  }
  assert.deepEqual(errors, []);
  if (!baseline) await writeFile(`${output}/results.json`, JSON.stringify({ results, errors }, null, 2));
  console.log(baseline ? 'Captured footer layout/text/link baselines.' : 'PASS: independent letters, complete clickable labels, static informational text, smooth reset, unchanged layout/content/links, original SVG hover and reduced motion.');
} finally { await browser.close(); }
