# Asymmetric navbar trigger correction

Only trigger detection changed in `src/hooks/useNavbarForeground.js`:

- **Down:** existing full-content coverage, 1px tolerance, skipped-window detection and short-section fallback remain unchanged.
- **Up:** when a departing section's top crosses 2px below the actual navbar bottom, select the preceding section's theme metadata. Multiple boundaries crossed in one scroll step resolve to the predecessor nearest the current content top. Same-theme transitions stay idle.
- A stationary animation frame no longer reruns the downward detection rule after an upward trigger. It retains the selected target so the existing wipe finishes automatically.

The 2px upward threshold and existing 1px downward coverage tolerance create a small hysteresis band. No heading geometry, section-specific thresholds, or large scroll offsets are used. The CSS, navbar markup, appearance, 550ms animation state machine/easing, red accents, menu actions, page sections and globe are untouched.

The complete animation block from `let progress = 1` through `if (transition) schedule()` was compared with the saved pre-change hook and matches exactly.

Updated tests: `tests/navbar-theme.test.mjs` and `tests/navbar-browser.mjs`.

## Verification

- Ten combined globe/navbar unit tests pass, including upward predecessor selection, 2px hysteresis, downward coverage, skipped boundaries and same-theme metadata.
- Focused ESLint, production build and `git diff --check` pass. The existing large-bundle warning remains.
- Desktop 1536x1024, tablet 768x1024 and mobile 390x844 browser suite passes independently checked Home-to-About downward and About-to-Home upward triggers, Events-to-About upward trigger, automatic completion without more scrolling, two direction reversals during a running animation, boundary jitter, same-theme crossings, content isolation, hover/focus/clicks, mobile menus, restoration, resize, deep links and reduced motion.
- Visually inspected the early upward-trigger screenshot, desktop upward midpoint and mobile Events-to-About midpoint. Both normal transition directions retain a bottom-to-top background-and-lettering wipe.

[Upward trigger](desktop-up-beginning.png) · [Upward midpoint](desktop-reverse-middle.png) · [Mobile Events-to-About](mobile-events-up-middle.png) · [Browser results](results.json)

The existing Earth/navigation regression results are in [earth-regression/results.json](earth-regression/results.json).

Safari and physical mobile devices were not tested. No commit, push, deployment or branch change performed.
