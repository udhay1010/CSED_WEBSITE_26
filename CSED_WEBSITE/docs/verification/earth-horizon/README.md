# Earth framing and surface illumination refinement

The globe was compared at equivalent viewport dimensions with its captured prior state and the available repository reference (`public/landingimage.jpeg`, also present as `src/assets/home.png`). Existing CSED typography/content remains the specification for HTML; the reference informs the planetary composition and illumination.

## Changes in this pass

| File | Change |
| --- | --- |
| `src/scene/Particles/particleConfig.js` | Raise the initial perspective tangent from 68% to 62% viewport height on desktop/tablet and 64% on mobile. Keep the initial radius, camera, final radius/position, easing, and rotation speed unchanged. |
| `src/index.css` | Adjust only hero top padding at desktop/laptop and short-mobile sizes to keep existing typography and CTAs clear of the raised horizon. The hero's existing flow footprint is retained. |
| `src/scene/Particles/GlobeMesh.jsx` | Remove both oversized atmospheric sphere shells and their shaders. Preserve the depth-only core, shared globe transform, tilt, initial Asia-facing yaw, rotation loop, and network group. |
| `src/scene/Particles/ParticleGeometry.js` | Jitter both angular coordinates within equal-area strata; decouple radial jitter from color selection; select red accents through smooth geographic fields rather than uniform random red filler. |
| `src/scene/Particles/ParticleMaterial.js` | Add a halo-pass uniform to the existing point material factory. No postprocessing dependency or new rendering framework. |
| `src/scene/Particles/ParticleSystem.jsx` | Share the same BufferGeometry between the primary point pass and a low-opacity scattering pass. Both use identical coordinates and transforms; dispose the additional material on cleanup. |
| `src/shaders/particleVertex.glsl` | Limit scattering to near-side geographic points close to the horizon; suppress far-side/ocean/away-from-horizon halo vertices. The main particle size and existing front/back handling remain unchanged. |
| `src/shaders/particleFragment.glsl` | Apply a warm red-white edge exposure to surface particles and soft Gaussian red scattering around those same points. Maintain the existing light-background charcoal treatment and neutral ocean structure. |

Verification changes: `tests/globe.test.mjs` now checks the revised tangent, shared red/white radial distribution, geographic red clustering, and the existing current rotation speed. Its obsolete expectation of 0.027 rad/s was updated to the actual pre-existing 0.028 setting; no speed change was made. New `tests/earth-horizon-browser.mjs` captures and compares this pass against its own pre-change baseline.

## Why the previous border and layers appeared

Two continuous atmospheric shells were scaled to 1.009 and 1.035 times the surface radius. The outer shell extended 3.5% beyond the globe and accumulated dark-red opacity into a visible geometric band. Both shells are removed. The atmospheric edge now comes from the actual geographic points and their shared-geometry scattering pass, so coastlines and density naturally interrupt it. No spherical color outline, bloom increase, or textured replacement globe is used.

Red and white points were already in one geometry, but the same random sample selected color and radial height. Red samples therefore tended toward one side of the radial band. Independent radial sampling now places all colors in the same 0.9996–1.0004 surface band. A test verifies that mean red/white radius is independent of color.

Red probabilities vary smoothly over existing landmass clusters in Asia, northern Eurasia, northern North America, South America, and Africa. Actual land/ocean classification still comes from the existing coastline mask. A small, attenuated ocean-red probability follows those same geographic fields; most ocean structure stays neutral. No continent shapes are invented or duplicated. Candidate counts remain 160,000 desktop / 48,000 mobile and main point sizes remain unchanged.

## Framing and preservation

At 1536×1024, the main horizon rises by 61.44 CSS pixels to y=634.88. Its radius is unchanged, so the globe remains massive and partially below the viewport. The new home endpoint interpolates through the original smoothstep to the unchanged left-side endpoint. Scroll trigger ranges, section entry/exit logic, camera behavior, yaw -3.34, positive rotation at 0.028 rad/s, and reduced-motion handling are unchanged.

Measured CTA-to-horizon gaps are approximately 42px desktop, 27px laptop, 145px tablet, 82px mobile, and 30px small mobile. Before/after checks confirm identical heading fonts/sizes/tracking/colors, tagline wording/colors, CTA styles, navbar styles, hero flow height, and final globe pose (within native scroll subpixel rounding).

The starfield, Hero JSX, navbar, About, other sections, Footer, routes, scrolling treatment, and network effects were not changed during this pass. Pre-existing uncommitted work was retained.

## Verification results

- `npm run build`: pass. The existing large shared-bundle warning remains.
- `npm test`: 5 tests pass. The new framing and radial-independence checks were observed failing before implementation.
- Focused ESLint of all changed JavaScript source: pass.
- Full-repository ESLint: the same 20 existing errors remain; `lint-results.json` records them.
- `node tests/earth-horizon-browser.mjs`: pass at 1536×1024, 1366×768, 768×1024, 390×844, and 320×568, covering top/mid/final/reverse views and an additional controlled longitude. Its before/after measurements confirm the preserved final transform, type/CTA/nav styling, hero footprint, and persistent geometry/canvas.
- `npm run test:earth:browser -- docs/verification/earth-horizon/regression`: all 18 viewport/scroll states pass, including ongoing rotation, stable geometry/canvas, forward/reverse scrolling, navigation and CTAs, native wheel/keyboard scrolling, scene release, mobile menu, reduced motion, and WebGL fallback. No local JavaScript or shader errors.
- Read-only review of the geometry/shader/lifecycle changes: no actionable findings.

Before/after top, mid-scroll, left-side, reverse, and alternate-longitude screenshots were visually inspected and iterated. Captures and measurements are under `before/`, `after/`, and `regression/`. The retained geometry contains 93,997 unique desktop points versus 94,002 before, and 28,109 mobile points versus 28,112 before. The halo reuses these positions in another point pass rather than increasing geometric density. Initial-view draw calls decreased from 6 to 5 after removing the two shell meshes.

## Reproduce and limitations

Run Vite on port 5173, then the commands above. `earth-horizon-browser.mjs before` is for the original implementation only; preserve the supplied baseline when testing updated code.

Visual fidelity is reference-informed rather than pixel-identical: existing copy, initial Asia-facing orientation, and website styling remain. Scattering is intentionally subtle and follows the geographic surface rather than drawing an uninterrupted ring over oceans. Physical mobile GPU/touch-device performance was not measured; mobile checks used Edge viewport emulation. The unchanged footer's remote Picsum image remains blocked by this environment's network policy, recorded separately in regression results.

No commits, pushes, deployments, branch changes, repository restructuring, or history changes were made.
