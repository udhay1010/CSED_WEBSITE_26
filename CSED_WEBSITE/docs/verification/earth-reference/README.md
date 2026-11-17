# Reference-driven Earth restoration

## What was inspected and compared

Both supplied files were inspected directly: `public/earth-target.png` is a 1043×253 globe crop; `earth-current.png` is a 1570×360 crop. They are not full-page viewport screenshots. Comparison uses the existing full landing page at 1536×1024, a globe-only crop from y=650 to the bottom, and normalization to the target's exact 1043×253 dimensions. The target horizon is at row 29 in that crop. The final restored horizon is at row 30.

`comparison.png` presents the supplied target above the final restored crop, at identical dimensions. `before/` captures the actual degraded implementation before this pass; `after/` captures the restoration. The supplied PNGs were not altered or used as runtime artwork.

## Diagnosed causes

Git diffs against HEAD and the preceding work showed several compounding changes:

- Angular/latitude jitter disrupted the previously successful orderly, fine-point distribution.
- Ocean samples had very dark source colors and an additional 0.16–0.32 alpha multiplier, making large real water regions effectively invisible.
- The halo was restricted to land and decayed sharply away from the limb. Removing atmospheric shells without replacing silhouette-wide scattering removed much of the illuminated horizon.
- Red accents were heavily restricted to a few geographic fields, leaving many visible areas without the target's red/white balance.
- The initial projected radius was too large for the target crop, magnifying a narrower portion of the geography.
- Network point endpoints were set to a subpixel material size, hiding much of their existing visual contribution.

## Controlled restoration

No candidate-count increase was made: desktop remains 160,000 samples, mobile 48,000. The existing single globe, shared point geometry, native scroll hook, real rotation, geographic land mask, and depth-only occluder remain.

1. Restored the earlier deterministic equal-area latitude and lightly perturbed Fibonacci-longitude sampling. Independent radial variation is retained, so red selection cannot create a separate-radius layer.
2. Restored visible ocean accents toward the earlier rendering: 20% of ocean candidates are red accents and another approximately 22% retain muted structure. Water remains materially sparser and lower contrast than land; the real coastline mask still determines land versus ocean.
3. Increased source brightness and core visibility, with a measured point-footprint adjustment (base size range 1.25–2.05 to 1.45–2.40). Red/white surface scatter shares the exact same point positions. No additional geographic particles, invented continents, or separate globe were introduced.
4. Restored a thin analytic atmosphere. Alpha is determined by the camera ray's altitude above the real spherical surface, using a narrow edge term and a soft haze falloff. This avoids the old broad, constant-opacity Fresnel band. Existing geographic point glow supplies the irregular illuminated detail.
5. Calibrated only the initial pose: home radius coefficient 1.8 to 1.25 and desktop horizon from 62% back to the target's approximately 68% viewport height. Mobile keeps its 64% horizon. Final left-side size/position, progress thresholds, smoothstep easing, and section entry/exit behavior are unchanged. This initial endpoint correction is necessary to reproduce the target curvature; the scroll implementation itself is untouched.
6. Restored visibility of existing network lines/endpoints without changing their positions or count.

The initial yaw remains -3.34, X orientation/tilt are unchanged, and rotation remains positive 0.028 rad/s with the same delta handling. Reduced motion remains supported. No Hero, CSS, navbar, button, starfield, About, Footer, route, or other section source was edited in this pass. Existing uncommitted changes were preserved.

## Measured comparisons

These are descriptive pixel measurements, not proof of geographic or perceptual equality. White counts require R>85 and G/B>0.65R; red counts require R>45, R>1.7G, R>1.4B. All use the same 1043×253 crop.

| Measurement | Before restoration | Final | Target |
| --- | ---: | ---: | ---: |
| Bright white coverage | 2,870 | 7,923 | 6,251 |
| Red coverage | 405 | 8,903 | 9,956 |
| Mean luminance (0–255) | 3.67 | 9.48 | 12.03 |
| Detected horizon row | No matching horizon in crop | 30 | 29 |

The final crop is substantially richer than the degraded implementation, but it is **not an exact visual reconstruction**. White coverage is approximately 27% higher, red coverage 11% lower, and overall luminance 21% lower than the target. The exact coastline arrangement and network-node moment remain visibly different. The reference's fixed camera/planet moment is not the same as the preserved Asia-facing orientation and existing tilt. Matching every reference silhouette would require changing that view or reshaping/recoloring geography to fake the image, which this pass does not do. A single cropped bitmap also does not supply the original 3D camera, coastline source, or lighting parameters.

## Files changed in this pass

- `src/scene/Particles/ParticleGeometry.js`: restored sampling, source brightness, visible water, and red balance.
- `src/shaders/particleVertex.glsl`: restored core/limb visibility and surface-scatter behavior.
- `src/shaders/particleFragment.glsl`: restored surface contrast and differentiated red/white scatter.
- `src/scene/Particles/GlobeMesh.jsx`: analytic atmospheric scattering, retaining all rotation code.
- `src/scene/Particles/GlobeConnections.jsx`: existing endpoint/line visibility.
- `src/scene/Particles/particleConfig.js`: target-calibrated initial frame only; existing final frame and speed preserved.
- `tests/globe.test.mjs`: updated target-framing and restored ocean-balance expectations; spherical/deterministic geometry, radial independence, and current rotation-speed checks retained.
- `tests/earth-reference-browser.mjs`: target-sized comparison captures and preservation checks.

## Verification

- `npm run build`: pass. The existing large-bundle warning remains.
- `npm test`: all five tests pass. The revised framing/ocean checks were observed failing before implementation.
- Focused ESLint of changed JavaScript: pass. Existing repo-wide lint issues are outside this pass.
- `node tests/earth-reference-browser.mjs`: pass at desktop, tablet, and mobile. It asserts exact equality of unrelated HTML, UI rectangles, text/fonts/colors, page flow, initial yaw, persistent canvas/geometry, reverse scrolling, and final left-side pose within native scroll subpixel rounding. It captures the same-size reference comparison and controlled Asia/Pacific hero views.
- `npm run test:earth:browser -- docs/verification/earth-reference/regression`: all 18 viewport/scroll states pass, including normal continuous rotation, navigation/CTAs, mobile menu, native wheel/keyboard scroll, scene release, reduced motion, and WebGL fallback.
- Visual inspection and several controlled iterations were performed against the actual target, including Asia-facing and Pacific-facing views, final left-side Earth, and responsive screenshots.
- Read-only review found no actionable correctness/regression issues.

No physical mobile GPU/touch hardware test was performed. Edge viewport emulation was used. The unchanged remote footer image is blocked by the environment's network policy and is recorded separately from local rendering errors in regression results. No commit, push, deployment, branch change, or history modification was made.

Run Vite on port 5173 before the browser commands. Preserve `before/` as the degraded baseline; do not recapture it from updated source.
