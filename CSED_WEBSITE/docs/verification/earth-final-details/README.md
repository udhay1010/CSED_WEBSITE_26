# Final particle Earth refinements

Only three production files changed for this task:

- `ParticleGeometry.js`: actual land classification selects white for every ordinary continental particle. Existing white colors, all positions/sizes/classifications, and ocean colors are preserved. A deterministic 10,000-sample baseline comparison confirmed identical arrays except 502 recolored red land samples.
- `GlobeConnections.jsx`: 12 geographically validated land anchors, unit-radius bases, varied elevated endpoints, thin red lines and selected soft node halos. All inherit the existing rotating parent and scroll transform. Whole-connection anchor-facing attenuation plus depth testing hide back-side links. Short viewports shorten extensions to preserve CTA clearance.
- `GlobeMesh.jsx`: supplies the geographic classifier and increases atmospheric edge amplitude from 0.06 to 0.0672 and haze from 0.15 to 0.168 (+12%). Widths remain 0.003 and 0.016.

## Verification

- `npm.cmd test`: 5 passing tests, including all-white land over 60,000 source samples.
- Focused ESLint on the three production files: passed.
- `git diff --check`: passed.
- `npm.cmd run build`: passed; existing large-chunk warning remains.
- `node tests/earth-connections-browser.mjs`: four viewport sizes, independently checked GeoJSON land anchors, CTA clearance, exact captured desktop UI preservation, retained geometry/canvas, three geographic orientations, and GPU far-side visibility control.
- `npm.cmd run test:earth:browser -- docs/verification/earth-final-details/regression`: passed 18 viewport/scroll states, continuous rotation, reverse scroll, navigation, CTAs, native scrolling, reduced motion and WebGL fallback.

Inspected actual desktop, tablet/mobile, Asia/Atlantic/Pacific and scroll screenshots against the restrained connection style in `landingimage.jpeg`. See `desktop-top.png`, `small-mobile-top.png`, the orientation captures and `regression/`. Intrinsic land colors are white; existing atmospheric scattering and dedicated red nodes remain red. No UI, ocean distribution, starfield, rotation or scroll parameters changed in this task.

Physical mobile GPU performance was not measured. Browser checks use desktop Edge with emulated viewport sizes. No commit, push or deployment performed.
