# Opaque automatic navbar theme wipe

The earlier transparent treatment exposed page headings and graphics beneath navigation. This correction changes only the navbar surface/controller and their tests. No section spacing, typography, globe source, scroll transforms or navigation destinations changed.

## Rendering and activation

- `src/components/layout/Navbar/Navbar.css`: solid outgoing background on the existing fixed z-60 navbar; an isolated, non-interactive pseudo-element supplies the solid incoming background through a bottom-to-top clip. There is no background gradient, blur, transparency or opacity fade. The existing 80px row plus 1px border geometry is preserved.
- `src/hooks/useNavbarForeground.js`: uses existing section metadata and cached bounds. A theme becomes eligible only when it fills the full navigation row. Mixed boundaries preserve the outgoing theme. On initial/restored loads, the theme under the top edge establishes the starting state.
- One 550ms smoothstep animation drives both the background clip and the existing hard-stop glyph mask. Both directions always reveal the incoming theme from below. Red branding is outside the neutral-color mask.
- Rapid requests coalesce to the latest theme; the active wipe finishes before any next wipe begins. There are no overlapping animation layers or duplicated controls. Same-theme navigation does not animate. Reduced motion switches immediately.
- Existing mobile menu backgrounds and actions remain intact. The pseudo-element cannot intercept pointer events. Existing focus outlines remain visible.

## Verification

- Updated `tests/navbar-theme.test.mjs` and `tests/navbar-browser.mjs`.
- Seven combined globe/navbar unit tests pass; focused ESLint and `git diff --check` pass.
- Production build passes with the existing large-bundle warning.
- Desktop (1536x1024), tablet (768x1024), mobile (390x844) browser checks cover activation timing, automatic completion without more scrolling, aligned foreground/background cuts, reverse and rapid scrolling, same-theme sections, hover/focus, menus, native restoration including a partial boundary, resizing, fragment navigation and reduced motion.
- At beginning, midpoint, end and reverse states, a bright magenta/green test element at z-index 59 is placed immediately behind the z-60 navbar. Navbar screenshot bytes remain identical, proving the surface fully occludes underlying content.
- Existing Earth regression passes all 18 viewport/scroll states, persistent canvas/geometry, continuous rotation, reverse scrolling, navigation, CTAs, native scrolling, reduced motion and WebGL fallback.
- Visually inspected desktop and mobile home/midpoint/completed captures and the tablet menu. No page content appears through the navigation row.

[Desktop beginning](desktop-beginning.png) · [Midpoint](desktop-middle.png) · [Completed](desktop-end.png) · [Reverse midpoint](desktop-reverse-middle.png)

[Mobile midpoint](mobile-middle.png) · [Mobile completed](mobile-end.png) · [Tablet menu](tablet-menu.png) · [Browser results](results.json) · [Earth regression](earth-regression/results.json)

Physical mobile browsers and Safari were not tested. Rapid opposite-theme requests can take the remainder of the current wipe plus one additional 550ms wipe to settle. No commit, push or deployment performed.
