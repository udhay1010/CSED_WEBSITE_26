# Cinematic particle Earth

The landing scene was visually compared with `public/landingimage.jpeg` in Edge at 1536 × 1024. Screenshots include top, 20%, 50%, 85%, final, and reverse scroll at desktop (1536 × 1024), tablet (768 × 1024), and mobile (390 × 844), plus reduced-motion and unavailable-WebGL cases.

## Implementation

- One persistent React Three Fiber Canvas and one globe parent group. GPU point geometry, network endpoints, curved connections, and atmospheric sphere shells share its scale and translation. Rotation lives in a child group, so scrolling never resets it.
- Camera-aware perspective geometry puts the initial sphere's tangent at 68% viewport height. The final projected bounding box is centred on the left viewport edge, leaving half the diameter outside the viewport. Mobile uses a smaller final globe lower in the viewport and reserves space for About content.
- Native document scroll maps About's top from viewport bottom to the 80px navigation offset. A clamped smoothstep interpolates the globe pose. There is no scroll interception, pinned spacer, camera sway, timer-based transform, or Canvas remount. Reverse scroll uses the same calculation.
- The existing white About background and its animations remain. White globe particles become dark against that background, as in the previous implementation. A depth-only core occludes far-side points and links without painting a disk over the page. The stage clips at the Events boundary and fades as About leaves.
- The initial five-second scatter sequence was replaced by the requested immediately visible Earth and heading. The existing full organisation name and tagline remain; reference-style Explore More and Our Initiatives anchors reach About and Events. Previously inert navbar buttons now reach the existing sections; Join Us reaches the footer contact information.
- The native scrollbar is visually hidden. Horizontal overflow uses `clip`, not a second scroll container. The decorative stage cannot receive pointer input.

## Performance and fallbacks

Desktop samples 160,000 unique, slightly jittered equal-area locations; sparse ocean sampling retains approximately 71,000 points. Mobile samples 48,000 locations. All particle data is created once per quality tier, not on scroll or every frame. DPR is capped at 1.5 desktop / 1.25 mobile. Coastlines are rasterized once for constant-time geographic lookup. Points use one draw call; connections are batched. Bloom and expensive per-particle simplex noise were removed. Geometry/material cleanup is explicit or handled by R3F's declarative objects.

Rendering stops while the scene is invisible or the document is hidden. Reduced motion freezes globe rotation and light pulses; the scroll pose remains directly controllable. If coastline loading fails, the existing land-mask helper supplies a fallback. If WebGL initialization fails, HTML content, navigation, native scrolling, and CTAs remain usable.

`performance.json` records a short headless Edge sample on this computer: 6 draw calls in the initial view, approximately 71,000 submitted points, 7ms median / 7.2ms p95 requestAnimationFrame interval at DPR 1. These timings are not a real mobile GPU benchmark or a universal frame-rate guarantee.

## Verification

Run from `CSED_WEBSITE`:

```powershell
npm ci
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
# In another terminal:
npm test
npm run test:earth:browser
npm run build
```

The browser test uses the installed Microsoft Edge (`channel: msedge`) through the development-only Playwright dependency. It verifies 18 viewport/scroll states, the same Canvas and geometry identifiers throughout, ongoing rotation, exact progress/reversal, no horizontal overflow or nested vertical scroll containers, hidden scrollbar, navbar and CTA navigation, mouse-wheel and keyboard scrolling, scene release, reduced motion, and WebGL fallback. `results.json` contains the measurements.

Two Node tests verify perspective framing at four viewport sizes, monotonic shrinking, deterministic reversal, unique stable particle positions, spherical geometry, and sparse oceans. Build succeeds. Focused lint of changed rendering, navigation, hero, and scroll modules passes. Full-repository lint remains blocked by 20 existing errors in Footer, About/kinetic/reference components, Home/placeholder sections, the unused CameraRig, and particleUtils; see `lint-results.json`. Vite still warns about the large shared JavaScript bundle.

Screenshots were visually inspected and iterated for horizon height, brightness, dot separation, atmosphere, transition clipping, and mobile text clearance. The reference is a visual target, not a pixel-identical result: existing branding, tagline, navbar destinations, About styling, and illustrations are retained. The globe shows real coastlines and changes geographic orientation as it rotates. The existing footer's remote Picsum image is blocked by this environment's network policy; this is recorded separately from local application errors in `results.json`.

## Changed files

- `src/scene/GlobeScene.jsx`: persistent canvas, coastline loading, quality tiers, reduced motion, error fallback, visibility pause.
- `src/scene/Particles/{GlobeMesh.jsx,GlobeConnections.jsx,ParticleSystem.jsx,ParticleGeometry.js,ParticleMaterial.js,particleConfig.js}`: shared globe transform, unique GPU points, batched network, atmospheric shells, camera geometry.
- `src/shaders/{particleVertex.glsl,particleFragment.glsl}`: fine point rendering, view-facing fade, stable red/white colors and light-background contrast.
- `src/hooks/useScrollProgress.js`, `src/App.jsx`, `src/store/introStore.js`: scroll progress, stage clipping/release, immediately available content.
- `src/components/sections/Home/Hero/Hero.jsx`, `src/index.css`: reference-informed typography/composition, static ambient dust, CTAs, responsive layout and native scrollbar treatment.
- `src/components/sections/About/About.jsx`: reveal timing and mobile content clearance only.
- `src/components/layout/Navbar/Navbar.jsx`: existing section navigation, active-section tracking, reduced-motion-aware scrolling.
- `public/earth-land.geojson`: locally served coastline data.
- `package.json`, `package-lock.json`, `tests/globe.test.mjs`, `tests/earth-browser.mjs`: repeatable verification; Playwright is development-only.
- `docs/verification/particle-earth/`: before/after screenshots and verification artifacts.

## Coastline source

Natural Earth, 1:110m land, public domain: https://www.naturalearthdata.com/about/terms-of-use/

Downloaded from https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson and served locally; no third-party API is used at runtime.

No commits, pushes, deployments, branch changes, or history edits were made.
