# Semantic footer hover correction

- Removed FooterFull's SplitType import/effect/ref and all word spans. Description, column headings and copyright remain ordinary static text.
- Each existing footer anchor is the complete hover target, with inline-block rendering, brand-red color and 1.05 scale over 200ms ease-out. Multiword labels are not split. Reduced motion disables scaling/transitions.
- Character-level C.S.E.D behavior, footer stacking, original text/link destinations, typography and column layout are preserved. No unrelated production files changed.

Files: Footer.jsx, Footer.css and the updated footer-hover-browser.mjs regression.

Verification: production build passed. Desktop 1536x1024, tablet 768x1024 and mobile 390x844 browser checks passed for About Us, Dev Team, Join our team, Back to top, social and mailto links; only the hovered link changes and it resets smoothly. Description, headings and copyright remain static under hover. No word spans or extra controls remain. C.S.E.D characters, reduced motion, keyboard focus, About navigation, unchanged text/hrefs, responsive layout and no horizontal overflow were checked.

Compared pre-change layout captures. Inline-block anchor rectangles include line-height leading (previous inline text rectangles did not); surrounding layout positions and visible text alignment are preserved. Visually inspected desktop/mobile About Us hover screenshots.

[Desktop hover](desktop-about-hover.png) · [Mobile hover](mobile-about-hover.png) · [Large C hover](desktop-large-C-hover.png) · [Browser results](results.json)

Two existing Footer.jsx lint errors remain unchanged (unused React import and computedLayout initialization). Existing large-bundle build warning remains. Safari and physical mobile devices were not tested. No commit, push or branch change performed.
