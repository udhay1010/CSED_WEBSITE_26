# Precision refinement verification

This pass changes six production files. Navbar, navigation destinations, About layout/content, other sections, Footer, camera, scene mounting, atmosphere, network effects, scroll hook, and globe transform calculations are untouched. No dependencies, commits, pushes, deployments, or branch changes were introduced.

## Changes

| File | Reason |
| --- | --- |
| `src/components/sections/Home/Hero/Hero.jsx` | Restore CSED / CENTER FOR SOCIAL / ENTREPRENEURSHIP & DEVELOPMENT hierarchy and exact grey/amber tagline; modestly increase the existing static dust field. Existing CTA elements and links remain. |
| `src/index.css` | Restore Outfit display type and wide tracking, red ampersand, muted secondary headings, amber tagline; fit the text/CTA stack above the unchanged horizon. CTA border, sizing, hover, focus, and responsive button rules are untouched. |
| `src/scene/Particles/particleConfig.js` | Multiply the existing delta-based rotation speed by 1.08. No framing constants or pose calculations change. |
| `src/scene/Particles/ParticleGeometry.js` | Keep land geometry/colors/sizes unchanged; add selective ocean metadata and neutral ocean samples within the same Points geometry. |
| `src/shaders/particleVertex.glsl` | Pass ocean classification and near-side facing to the fragment shader. Existing size attenuation, near-side fade, and transforms remain. |
| `src/shaders/particleFragment.glsl` | Deepen the existing light-background charcoal treatment and attenuate neutral/red ocean particles selectively. |

Tests changed: `tests/globe.test.mjs` adds rotation and ocean-structure checks. `tests/earth-browser.mjs` accepts an optional output directory so verification does not overwrite the previous session's artifacts. New `tests/earth-refinement-browser.mjs` checks the before/after typography, layout, star rendering, original CTA/nav styling, section footprint, globe poses, and five sampled longitudes.

## Exact values

- Rotation: `0.025` to `0.025 * 1.08 = 0.027` radians/second. Direction, axis, initial orientation, frame delta handling, and reduced-motion behavior are unchanged.
- Background count: desktop/tablet `520 → 610` (+17.3%); mobile `160 → 188` (+17.5%). Same deterministic spatial distribution, palette, opacity variation, DPR cap, and static redraw-on-resize behavior.
- Star sizes: `0.8 → 0.82` and `1.3 → 1.3325` CSS pixels, exactly ×1.025. No new bloom, twinkling, or shadows.
- Typography: primary `CSED`, followed by `CENTER FOR SOCIAL` and `ENTREPRENEURSHIP & DEVELOPMENT`. Ampersand uses the existing red variable. The exact supporting sentence is `Building Bridges to a Better World Through Social Entrepreneurship`, with `Social Entrepreneurship` in `#efb557` and the preceding words in `#a7a7a7`. No text-shadow is introduced.
- Dark land treatment on About: `vec3(0.08) → vec3(0.022)`. Primary white land colors in the initial hero are unchanged. A byte-for-byte comparison against the HEAD version confirmed identical land positions, sizes, and source color arrays.
- Ocean candidates: previously 22% retained, all red. Now 42% retained: 7% red accents and 35% neutral structure. Land retains full density. Ocean dots remain geographically classified as water; no fabricated landmass shapes or second globe/layer draw call is introduced.
- Ocean alpha: neutral dots multiply existing alpha by `0.16 + 0.16 * nearSideFacing`; red ocean dots multiply by `0.48`. Neutral dots map to the same deep charcoal on white and remain subdued neutral tones on black. The existing depth-only core, depth testing, normal blending, and back-facing fade are preserved.

The white background is the intentional `bg-white` layer of About, not an alpha-compositing fallback or a rendering bug. It is unchanged. Ocean definition is deliberately lower contrast than land, so a Pacific view still reads as mostly water.

## Layout and preservation

Hero content spacing adapts to viewport width and height rather than using a negative margin or transform. CTA-to-main-horizon gaps measured approximately 73px at 1536×1024 (about 47px to the outer glow), 43px at 1366×768, 115px on 390×844 mobile, and 45px on 320×568 mobile. Desktop CTAs remain one horizontal row with their original styles and dimensions. The desktop organisation heading and tagline remain single lines.

The old hero naturally exceeded one viewport on some short screens. Its original flow footprint is retained through min-height expressions derived from its previous padding, type line boxes, and spacing. Before/after differences were under 0.15px from font rounding; at 1280×600 the original and updated heights both measured 603.09375px. This avoids shifting About's scroll entry while independently fitting the restored type above the globe.

## Verification performed

- `npm test`: 4 tests pass. New rotation/ocean tests were observed failing before implementation.
- `node tests/earth-refinement-browser.mjs`: passes at 1536×1024, 1366×768, 768×1024, 390×844, and 320×568. Checks exact wording/hierarchy, unclipped heading, CTA clearance, single-line desktop text, unchanged button/navbar computed styles, no horizontal overflow, original section entry and globe poses, and rendered star counts/sizes. A separate 1280×600 check passes.
- `npm run test:earth:browser -- docs/verification/precision-refinement/regression`: all 18 viewport/scroll states pass, including persistent Canvas/geometry, ongoing rotation, reverse scroll, section release, navbar/CTA actions, native wheel/keyboard scrolling, mobile menu, reduced motion, and unavailable-WebGL fallback. No local JavaScript or shader errors.
- `npm run build`: passes; the pre-existing large-bundle warning remains.
- Focused ESLint of changed JavaScript source passes. Full-repository lint still reports the same 20 pre-existing errors; see `lint-results.json`.
- Read-only diff review reported no actionable issues.

Visual inspection included before/after landing screenshots, mid-scroll and final side positions, reverse scroll, responsive views, and controlled longitude samples for the Americas, Atlantic, Europe/Africa, Asia, and Pacific. Longitude sampling was done through the browser's existing Three.js objects without changing production orientation or adding controls. `before/` and `after/` contain these captures; `regression/` contains the full existing interaction suite captures/results.

Physical mobile GPU performance and a real touch device were not tested. Mobile checks used Edge viewport emulation. The unchanged footer's remote Picsum image remains blocked by the environment's network policy; local assets and application checks pass. The restored typography intentionally has no recreated neon/glow from the older screenshot, following the request to avoid new text lighting.

To reproduce after checks, run Vite on port 5173, then the commands above. The `before` measurements are preserved from the original implementation; do not overwrite them by running the capture script with `before` on the updated source.
