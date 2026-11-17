# Scroll-driven About-to-Events globe fade

The old fade reached zero after Events entered the first 20% of the full viewport, including the navbar. An additional moving clip cropped the planet at the section boundary.

## Changes

- `src/hooks/useScrollProgress.js` now measures Events' actual container rectangle and the actual navbar bottom. It keeps the existing hero-to-About progress calculation unchanged and sends the new opacity through the existing store/canvas parent. Observing navbar size includes an open mobile menu. The old moving clip is removed so the whole globe fades consistently.
- `src/utils/globeFade.js` calculates the Events intersection with `[navbarBottom, viewportBottom]`, divides by usable height and applies `1 - min(coverage / 0.6, 1)^2`. The 60% endpoint is stabilized against floating-point round-off. Once Events passes the navbar, the stage stays released even when its trailing edge later leaves the screen; it cannot reappear over unrelated sections.
- Added `tests/globe-fade.test.mjs` and `tests/globe-fade-browser.mjs`.

| Events coverage | Opacity |
| --- | --- |
| 0% | 100% |
| 15% | 93.75% |
| 30% | 75% |
| 45% | 43.75% |
| 55% | 15.97% |
| 60%+ | exactly 0% |

No timer or independent animation was introduced. Holding scroll holds opacity; reverse scroll follows the same curve. One parent opacity covers particles, atmospheric illumination, lines and nodes. No renderer or scene is recreated, and existing hidden-stage frame scheduling is unchanged. No particle, shader, camera, orientation, rotation-speed, pose, navbar or section-design source changed.

## Verification

- Thirteen combined unit tests passed: globe geometry/rotation/framing, navbar triggers and three fade tests. Fade tests cover target values at four usable viewport configurations, continuous monotonic nonzero values before 60%, deterministic reversal, actual short-section intersections and no later reappearance.
- Focused ESLint, production build and `git diff --check` passed. Existing large-chunk build warning remains.
- Browser suite passed 36 forward/reverse states at desktop 1536x1024, tablet 768x1024 and mobile 390x844. Each state measures real Events coverage independently and checks opacity, persistent canvas/geometry, unchanged left-side pose and no moving crop. Also checks held scroll, continuing rotation, positive opacity at 59%, exactly zero at 60%, restoration from later sections and actual navbar height with mobile menus open.
- Existing Earth/navigation regression passed all 18 viewport/scroll states, persistent WebGL, continuous rotation, reverse scrolling, navigation/CTA actions, native scrolling, reduced motion and WebGL fallback.
- Visually inspected all six desktop fade targets, mobile 0/30/55/60%, and mobile reverse restoration. The faint rim remains at 55%; the entire planet and its effects disappear at 60%.

Desktop captures: [0%](desktop-forward-0.png) · [15%](desktop-forward-15.png) · [30%](desktop-forward-30.png) · [45%](desktop-forward-45.png) · [55%](desktop-forward-55.png) · [60%](desktop-forward-60.png)

Mobile: [30%](mobile-forward-30.png) · [55%](mobile-forward-55.png) · [60%](mobile-forward-60.png) · [Reverse 30%](mobile-reverse-30.png)

[Browser measurements](results.json) · [Earth regression](earth-regression/results.json)

Physical mobile devices and Safari were not tested. No commit, push, deployment or branch change performed.
