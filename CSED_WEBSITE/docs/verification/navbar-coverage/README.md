# Navbar content-region coverage correction

Inspected `public/nav_issue.png` before editing. It shows a dark navbar while About already occupies the visible region below it.

## Trigger correction

Previously `getNavbarTheme` inspected `[scrollY + rowTop, scrollY + rowTop + rowHeight]`: the navbar's own 80px row. This delayed About activation until the section had passed behind that row.

Now the inspected region is `[scrollY + actualNavbarBottom, scrollY + innerHeight]`. Actual section container rectangles must satisfy:

```
sectionTop <= navbarBottom + 1px
sectionBottom >= viewportHeight - 1px
```

The 1px tolerance handles subpixel rounding. Heading/child positions and section percentages do not participate. Section geometry is refreshed once per scheduled scroll/resize update, including sticky/pinned containers. The actual navbar bottom includes its border and an open mobile menu; glyph sizing still uses the unchanged row.

About is `100vh - 80px` tall and the normal navbar is 81px including its border. Consequently its full-coverage window is only a few scroll pixels wide. The controller detects crossing that mathematically valid window between scroll samples, in either direction, so wheel/touch jumps cannot skip its confirmed theme.

When no section qualifies, the last confirmed theme remains. The explicit fallback for a section physically shorter than the content region requires it to be entirely visible and to occupy more visible area than any other section or unmarked background. This uses real visual ownership; no section heights or margins were changed. About uses the normal full-coverage rule, not this fallback.

## Wipe preservation and rapid scrolling

The opaque surface, solid backgrounds, red accents, glyph mask and normal 550ms bottom-to-top wipe are unchanged. Opposite requests during an unfinished wipe now retarget that same boundary from its current position, retracing the partial wipe instead of queuing a second animation. Initial state/restoration and reduced motion still snap to the confirmed theme. No controls are duplicated.

Only production file changed this task: `src/hooks/useNavbarForeground.js`. Updated tests: `tests/navbar-theme.test.mjs`, `tests/navbar-browser.mjs`.

## Verification

- Nine combined globe/navbar unit tests passed, including exact coverage, bottom-edge rejection, 1px tolerance, narrow-window crossing in both directions, short-section ownership, and unchanged glyph colors.
- Focused ESLint and `git diff --check` passed.
- Production build passed; existing large-chunk warning remains.
- Browser suite passed at desktop 1536x1024, tablet 768x1024, and mobile 390x844. Verified pre-coverage hold, full-content activation, moving the About heading without triggering a theme, automatic completion with no more scrolling, reverse/rapid scrolling without queued follow-ups, same-theme transitions, hover/focus/clicks, mobile menus, resize, refresh, fragment navigation and reduced motion.
- Adversarial z-59 content placed directly behind the z-60 navbar produces byte-identical navbar screenshots at the beginning, midpoint, end and reverse states: no bleed-through.
- Existing Earth/navigation suite passed all 18 viewport/scroll states, including persistent geometry/canvas, continuous rotation, reverse scroll, navigation/CTA actions, native scroll, reduced motion and WebGL fallback.
- Visually inspected desktop approach/beginning/midpoint and mobile midpoint/completed screenshots against the reported timing issue.

[Desktop approaching](desktop-approaching.png) · [Qualifying/beginning](desktop-beginning.png) · [Midpoint](desktop-middle.png) · [Completed](desktop-end.png) · [Mobile midpoint](mobile-middle.png) · [Mobile completed](mobile-end.png)

[Browser results](results.json) · [Earth regression](earth-regression/results.json)

Safari and physical mobile devices were not tested. No commit, push, deployment or branch change performed.
