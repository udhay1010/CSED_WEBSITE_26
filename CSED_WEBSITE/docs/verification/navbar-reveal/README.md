# Scroll-synchronized transparent navbar

The existing fixed 80px navigation row stays transparent. A hard-stop gradient is clipped to the actual text glyphs: no duplicate text, controls, opacity fade, backdrop, or theme timer. Individual characters can contain white and near-black portions simultaneously. Red branding, active states and borders remain separate.

`useNavbarForeground.js` caches explicitly marked section bounds and glyph offsets. Scroll events coalesce into requestAnimationFrame updates of one inherited CSS gradient. Layout measurements run on initialization, resize, font readiness, page restoration and ResizeObserver notifications. Only About is light in the current design; other sections remain dark. Same-theme boundaries merge. Mobile panel styling remains opaque and readable.

Changed source: Navbar.jsx, new Navbar.css, new useNavbarForeground.js; theme metadata only in Home/About/Events/Blogs/Board/Footer; App.jsx removes its forced top-of-page reset so native scroll restoration and fragment navigation work.

## Evidence

- `node --test tests/globe.test.mjs tests/navbar-theme.test.mjs`: seven passing tests.
- `node tests/navbar-browser.mjs`: desktop/tablet/mobile, 15 reveal states; screenshot pixel checks confirm split white/near-black glyphs. Transparent background, hold/reverse scroll, light-to-dark and same-theme transitions, hover, keyboard focus, mobile menu, resizing, reload and hash navigation all passed. No page errors.
- Existing `test:earth:browser`: 18 viewport/scroll states passed, including continuous rotation, persistent canvas/geometry, reverse scrolling, navigation/CTAs, reduced motion and no-WebGL fallback.
- Focused ESLint, `git diff --check`, production build passed. Existing large-bundle build warning remains.
- Visually inspected actual desktop and mobile screenshots, including split and completed foregrounds and the next dark-section boundary.

## Desktop transition captures

[0%](desktop-0.png) · [25%](desktop-25.png) · [50%](desktop-50.png) · [75%](desktop-75.png) · [100%](desktop-100.png) · [Next dark section](desktop-next-dark.png)

[Mobile midpoint](mobile-50.png) · [Mobile menu](mobile-menu.png) · [Browser results](results.json) · [Earth regression](earth-regression/results.json)

Browser verification used Edge on Windows and emulated tablet/mobile sizes; physical mobile browsers and Safari were not tested. No dependencies added, no commit/push/deployment performed, and no globe source changed in this task.
