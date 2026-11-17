import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const output = 'docs/verification/navbar-direction';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [], errors = [];
try {
  for (const [name, width, height] of [['desktop', 1536, 1024], ['tablet', 768, 1024], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: 0 });
    await page.goto('http://127.0.0.1:5173');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.originalCanvas = document.querySelector('[data-globe-stage] canvas'); });
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
    const boundary = async (id, y) => {
      await page.evaluate(({ id, y }) => {
        scrollTo({ top: document.getElementById(id).getBoundingClientRect().top + scrollY - y, behavior: 'instant' });
        window.dispatchEvent(new Event('scroll'));
      }, { id, y });
      await page.clock.runFor(32);
    };
    const state = () => page.locator('nav').evaluate(nav => ({
      theme: nav.dataset.theme, incoming: nav.dataset.incomingTheme, transition: nav.dataset.transition,
      cut: parseFloat(nav.style.getPropertyValue('--nav-cut')), ink: nav.style.getPropertyValue('--nav-ink'),
      background: getComputedStyle(nav).backgroundColor, overlay: getComputedStyle(nav, '::before').backgroundColor,
      clip: getComputedStyle(nav, '::before').clipPath, height: nav.getBoundingClientRect().height,
    }));
    const isolated = async label => {
      const before = await page.screenshot({ clip: { x: 0, y: 0, width, height: 81 } });
      await page.evaluate(() => {
        const probe = document.createElement('div'); probe.id = 'bleed-probe';
        probe.style.cssText = 'position:fixed;inset:0 0 auto;height:100px;background:#ff00ff;color:#00ff00;font-size:90px;z-index:59;pointer-events:none';
        probe.textContent = 'ABOUT CONTENT BLEED TEST'; document.body.append(probe);
      });
      const after = await page.screenshot({ clip: { x: 0, y: 0, width, height: 81 } });
      assert.ok(before.equals(after), `${name}/${label}: navbar completely occludes content at z-index 59`);
      await page.locator('#bleed-probe').evaluate(e => e.remove());
    };
    await isolated('home'); await page.screenshot({ path: `${output}/${name}-home.png` });
    await boundary('about', 83); await page.clock.runFor(700);
    assert.equal((await state()).theme, 'dark'); assert.equal((await state()).transition, 'idle');
    await page.evaluate(() => {
      const heading = [...document.getElementById('about').children].find(e => e.className.includes('top-[6vh]'));
      heading.style.top = '-200px';
    });
    await page.clock.runFor(100); assert.equal((await state()).theme, 'dark', 'heading position cannot trigger the theme');
    await page.evaluate(() => {
      const heading = [...document.getElementById('about').children].find(e => e.className.includes('top-[6vh]'));
      heading.style.removeProperty('top');
    });
    await page.screenshot({ path: `${output}/${name}-approaching.png` });
    await boundary('about', 81);
    assert.equal((await state()).transition, 'running', JSON.stringify({ state: await state(), top: await page.locator('#about').evaluate(e => e.getBoundingClientRect().top) })); assert.ok((await state()).cut > 75);
    await isolated('beginning'); await page.screenshot({ path: `${output}/${name}-beginning.png` });
    const stoppedScroll = await page.evaluate(() => scrollY);
    await page.clock.runFor(250);
    const middle = await state(); assert.ok(middle.cut > 32 && middle.cut < 48, '550ms automatic midpoint');
    assert.ok(middle.ink.includes(`${middle.cut}px`)); assert.ok(Math.abs(parseFloat(middle.clip.slice(6)) - middle.cut) < 0.001);
    await isolated('middle'); await page.screenshot({ path: `${output}/${name}-middle.png` });
    if (width >= 640) {
      await page.locator('.nav-join').hover();
      assert.equal(await page.locator('.nav-join .nav-ink').first().evaluate(e => getComputedStyle(e).webkitTextFillColor), 'rgb(245, 245, 245)');
    }
    if (width < 1024) {
      await page.getByRole('button', { name: 'Toggle navigation' }).click();
      assert.equal(await page.getByRole('button', { name: 'Toggle navigation' }).getAttribute('aria-expanded'), 'true');
      await page.getByRole('button', { name: 'Toggle navigation' }).click();
    }
    await page.keyboard.press('Escape');
    await page.locator('nav button:visible').first().evaluate(e => e.focus({ preventScroll: true }));
    assert.ok(await page.locator('nav button:visible').first().evaluate(e => e.matches(':focus-visible')));
    assert.equal(await page.locator('nav button:visible').count(), width >= 1024 ? 7 : width >= 640 ? 2 : 1);
    await page.mouse.move(width - 1, height - 1);
    await page.clock.runFor(400);
    assert.equal(await page.evaluate(() => scrollY), stoppedScroll, 'animation completes without more scrolling');
    assert.equal((await state()).theme, 'light'); assert.equal((await state()).transition, 'idle');
    assert.equal((await state()).background, 'rgb(255, 255, 255)'); assert.equal((await state()).height, 81);
    await isolated('end'); await page.screenshot({ path: `${output}/${name}-end.png` });
    await boundary('about', 82); assert.equal((await state()).transition, 'idle', 'one-pixel upward movement holds the theme');
    await boundary('about', 83); assert.equal((await state()).incoming, 'dark', 'Home theme activates at first reappearance, not Home top');
    assert.equal((await state()).transition, 'running');
    await page.screenshot({ path: `${output}/${name}-up-beginning.png` });
    const reverseScroll = await page.evaluate(() => scrollY);
    await page.clock.runFor(260); await isolated('reverse');
    assert.ok((await state()).cut > 30 && (await state()).cut < 48, 'upward trigger retains bottom-to-top wipe');
    await page.screenshot({ path: `${output}/${name}-reverse-middle.png` });
    await page.clock.runFor(400); assert.equal((await state()).theme, 'dark');
    assert.equal(await page.evaluate(() => scrollY), reverseScroll, 'reverse wipe completes without further scrolling');
    for (const y of [84, 83, 84, 83]) {
      await boundary('about', y); assert.equal((await state()).transition, 'idle', 'no repeated switching near the reverse boundary');
    }
    // Reverse direction twice during a running wipe: latest target wins without a queued wipe.
    await boundary('about', 81); await page.clock.runFor(100);
    await boundary('about', 83); await page.clock.runFor(32);
    await boundary('about', 81); await page.clock.runFor(650);
    assert.equal((await state()).theme, 'light'); assert.equal((await state()).transition, 'idle');
    await boundary('about', 83); await page.clock.runFor(650);
    // A missed sampling window still qualifies; rapid retargeting never queues a second wipe.
    await boundary('about', -20); await page.clock.runFor(100);
    assert.equal((await state()).transition, 'running', 'scroll step crossed the valid About coverage window');
    await boundary('events', 81);
    await page.clock.runFor(600); assert.equal((await state()).theme, 'dark'); assert.equal((await state()).transition, 'idle');
    await page.clock.runFor(600); assert.equal((await state()).transition, 'idle', 'no queued follow-up animation');
    await boundary('blogs', 81); assert.equal((await state()).transition, 'idle', 'same-theme section does not animate');
    await boundary('about', 81); await page.clock.runFor(650);
    await boundary('events', 81); await page.clock.runFor(260); await isolated('next-dark');
    await page.screenshot({ path: `${output}/${name}-next-dark-middle.png` });
    await page.clock.runFor(400);
    await boundary('events', 82); assert.equal((await state()).transition, 'idle');
    await boundary('events', 83); assert.equal((await state()).incoming, 'light', 'Events exposes preceding About at content top');
    await page.clock.runFor(260); await isolated('events-up');
    await page.screenshot({ path: `${output}/${name}-events-up-middle.png` });
    await page.clock.runFor(400); assert.equal((await state()).theme, 'light');
    await boundary('events', 81); await page.clock.runFor(650); assert.equal((await state()).theme, 'dark');
    await boundary('blogs', 81); await boundary('blogs', 83);
    assert.equal((await state()).transition, 'idle', 'same-theme upward crossing does not animate');
    if (width < 1024) {
      await page.getByRole('button', { name: 'Toggle navigation' }).click();
      assert.equal(await page.getByRole('button', { name: 'Toggle navigation' }).getAttribute('aria-expanded'), 'true');
      assert.equal(await page.locator('nav > div').nth(1).evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(11, 11, 11)');
      await page.screenshot({ path: `${output}/${name}-menu.png` });
    }
    await page.locator('nav').getByRole('button', { name: 'About', exact: true }).click();
    await page.clock.runFor(1800);
    assert.ok(Math.abs(await page.locator('#about').evaluate(e => e.getBoundingClientRect().top) - 80) < 2);
    if (width < 1024) assert.equal(await page.getByRole('button', { name: 'Toggle navigation' }).getAttribute('aria-expanded'), 'false');
    assert.ok(await page.evaluate(() => document.querySelector('[data-globe-stage] canvas') === window.originalCanvas));
    await page.clock.resume();
    await page.evaluate(() => scrollTo({ top: document.getElementById('about').getBoundingClientRect().top + scrollY - 80, behavior: 'instant' }));
    await page.waitForTimeout(650); await page.reload(); await page.waitForTimeout(1200);
    assert.equal((await state()).theme, 'light'); assert.equal((await state()).transition, 'idle');
    await page.evaluate(() => scrollTo({ top: document.getElementById('events').getBoundingClientRect().top + scrollY - 40, behavior: 'instant' }));
    await page.waitForTimeout(100); await page.reload(); await page.waitForTimeout(1200);
    assert.equal((await state()).theme, 'dark', 'Events covers the entire content region on restoration');
    await page.setViewportSize({ width: width + 20, height: height - 60 }); await page.waitForTimeout(700);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth));
    await page.goto('http://127.0.0.1:5173/#events'); await page.waitForTimeout(1200);
    assert.equal((await state()).theme, 'dark', 'anchor offset is excluded from content coverage');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => scrollTo({ top: document.getElementById('about').getBoundingClientRect().top + scrollY - 80, behavior: 'instant' }));
    await page.waitForTimeout(100); assert.equal((await state()).theme, 'light'); assert.equal((await state()).transition, 'idle');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => scrollTo({ top: document.getElementById('events').getBoundingClientRect().top + scrollY, behavior: 'instant' }));
    await page.waitForTimeout(650);
    await page.evaluate(() => scrollTo({ top: document.getElementById('about').getBoundingClientRect().top + scrollY - 80, behavior: 'instant' }));
    await page.waitForFunction(() => document.querySelector('nav').dataset.transition === 'running');
    if (width >= 640) {
      await page.locator('.nav-join').click(); await page.waitForTimeout(1500);
      assert.ok(await page.locator('#site-footer').evaluate(e => e.getBoundingClientRect().top < innerHeight));
    } else {
      await page.getByRole('button', { name: 'Toggle navigation' }).click();
      await page.locator('nav').getByRole('button', { name: 'Events', exact: true }).click(); await page.waitForTimeout(1500);
      assert.ok(Math.abs(await page.locator('#events').evaluate(e => e.getBoundingClientRect().top) - 80) < 2);
    }
    results.push({ name, midpoint: middle, noBleed: true, automaticCompletion: true, rapidRetarget: true });
    await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(`${output}/results.json`, JSON.stringify({ results, errors }, null, 2));
  console.log('PASS: DOWN full-content coverage; UP predecessor reveal; automatic bottom-to-top wipes, jitter stability, rapid reversals, same-theme sections, no bleed, menus and existing interactions.');
} finally { await browser.close(); }
