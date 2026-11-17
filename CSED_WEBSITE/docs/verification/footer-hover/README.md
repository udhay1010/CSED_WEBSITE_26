# Footer hover restoration

Inspected Footer.jsx/Footer.css and all available footer history (`d910f16`, `fa3a4be`, and the initial structure). The historical large SVG heading's per-character GSAP animation is still present: scale 1.18, red fill, 300–350ms entry and 350–400ms exit, with the original easing. It was blocked by the invisible full-screen WebGL canvas intercepting pointer events.

Footer surfaces now use the existing content z-index 20, above the canvas at 5 and below navigation at 60. No canvas or unrelated component changed. The original large-letter animation remains intact; reduced-motion handling suppresses scaling.

No historical word-splitting/scaling implementation was found. Word hover is reconstructed with the already-installed SplitType dependency, scoped to footer text, using spans with 1.06 scale, 200ms ease-out transitions and the existing brand-red variable. Whole-link hover coloring was removed so one hovered word does not recolor its neighbors. The compact footer logo receives the same restrained per-letter scale; periods retain their positions. Reduced motion disables CSS scaling/transitions. SplitType reverts on cleanup, and links remain the only interactive elements.

Production files changed: `src/components/layout/Footer/Footer.jsx` and `Footer.css`. Added `tests/footer-hover-browser.mjs`.

## Verification

- Browser regression reproduced the missing word spans and then the canvas pointer interception before the fixes.
- Desktop (1536x1024), tablet (768x1024), and mobile (390x844) checks verify independent letters/words, unmodified neighbors/periods, smooth reset, unchanged layout/text/link destinations against pre-change captures, keyboard focus, original About link navigation, reduced motion, and no horizontal overflow.
- All four large SVG letters checked on desktop; the two fully visible letters also checked on tablet. The existing SVG crop is preserved on narrow screens. Compact footer logo letters are checked at all three widths.
- Visually inspected the large C hover and desktop/mobile word hover screenshots.
- Production build and all 13 existing globe/fade/navbar unit tests passed. `git diff --check` passed.
- Footer lint still reports the same two pre-existing issues seen before editing: unused React import and the computedLayout initialization. No new lint errors appeared. Existing large-bundle build warning remains.

[Large C hover](desktop-large-C-hover.png) · [Desktop word hover](desktop-word-hover.png) · [Mobile word hover](mobile-word-hover.png) · [Browser results](results.json)

Physical mobile devices and Safari were not tested. No commit, push, branch change or deployment performed.
