import assert from 'node:assert/strict';
import test from 'node:test';
import { getNavbarTheme, getNavbarInk } from '../src/hooks/useNavbarForeground.js';

const bands = [{ top: 1000, bottom: 2000, theme: 'light' }];
test('activation checks the content region, excluding the navbar', () => {
  assert.equal(getNavbarTheme(bands, 999, 1809, 'dark'), 'light', 'one-pixel tolerance');
  assert.equal(getNavbarTheme(bands, 998, 1808, 'dark'), 'dark', 'not yet full coverage');
  assert.equal(getNavbarTheme(bands, 1000, 2000, 'dark'), 'light');
  assert.equal(getNavbarTheme(bands, 1200, 2100, 'dark'), 'dark', 'section bottom must also reach viewport bottom');
  assert.equal(getNavbarTheme(bands, 950, 2050, 'light'), 'light', 'mixed content keeps last confirmed theme');
});
test('downward scrolling cannot skip a narrow full-coverage window', () => {
  const sections = [{ top: 0, bottom: 1000, theme: 'dark' }, ...bands];
  assert.equal(getNavbarTheme(sections, 1300, 2300, 'dark', 900), 'light');
  assert.equal(getNavbarTheme(sections, 900, 1900, 'light', 1300), 'dark');
  assert.equal(getNavbarTheme(sections, 0, 1000, 'light', 1300), 'dark');
});
test('upward scrolling activates the predecessor at the content top with 2px hysteresis', () => {
  const sections = [{ top: 0, bottom: 1000, theme: 'dark' }, ...bands, { top: 2000, bottom: 3000, theme: 'dark' }, { top: 3000, bottom: 4000, theme: 'dark' }];
  assert.equal(getNavbarTheme(sections, 999, 1942, 'light', 1001), 'light', 'one-pixel jitter holds theme');
  assert.equal(getNavbarTheme(sections, 998, 1941, 'light', 999), 'dark', 'first visible Home strip activates without full Home coverage');
  assert.equal(getNavbarTheme(sections, 998.3, 1941.3, 'dark', 998), 'dark', 'small downward jitter does not undo the change');
  assert.equal(getNavbarTheme(sections, 1998, 2941, 'dark', 2005), 'light', 'Events to About uses the same rule');
  assert.equal(getNavbarTheme(sections, 2998, 3941, 'dark', 3005), 'dark', 'same-theme predecessor stays dark');
  assert.equal(getNavbarTheme(sections, 998, 1941, 'light', 3500), 'dark', 'rapid upward skips select the nearest predecessor');
});
test('only fully visible short sections with the largest visible ownership use fallback', () => {
  const sections = [{ top: 0, bottom: 400, theme: 'dark' }, { top: 400, bottom: 1000, theme: 'light' }, { top: 1000, bottom: 2000, theme: 'dark' }];
  assert.equal(getNavbarTheme(sections, 300, 1100, 'dark'), 'light');
  assert.equal(getNavbarTheme(sections, 450, 1250, 'dark'), 'dark', 'partly visible short section cannot qualify');
  assert.equal(getNavbarTheme([{ top: 400, bottom: 500, theme: 'light' }], 300, 1100, 'dark'), 'dark', 'unmarked page background can own more area than a short section');
});
test('automatic wipe shares one hard stop, including reversed colors', () => {
  assert.equal(getNavbarInk('dark', 'light', 0, 80), 'linear-gradient(to bottom, #f5f5f5 0px 80px, #111111 80px 80px)');
  assert.equal(getNavbarInk('dark', 'light', 0.5, 80), 'linear-gradient(to bottom, #f5f5f5 0px 40px, #111111 40px 80px)');
  assert.equal(getNavbarInk('light', 'dark', 0.5, 80), 'linear-gradient(to bottom, #111111 0px 40px, #f5f5f5 40px 80px)');
  assert.equal(getNavbarInk('dark', 'light', 1, 80), 'linear-gradient(to bottom, #f5f5f5 0px 0px, #111111 0px 80px)');
});
