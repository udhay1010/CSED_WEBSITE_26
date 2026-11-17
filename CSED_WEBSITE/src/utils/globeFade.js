export function getEventsGlobeOpacity(eventsRect, navbarBottom, viewportBottom) {
  // Keep the stage released after Events passes, even as its trailing-edge coverage decreases.
  if (eventsRect.top <= navbarBottom) return 0;
  const usableHeight = viewportBottom - navbarBottom;
  if (usableHeight <= 0) return 1;
  const visibleHeight = Math.max(0, Math.min(eventsRect.bottom, viewportBottom) - Math.max(eventsRect.top, navbarBottom));
  const coverage = Math.min(1, visibleHeight / usableHeight);
  if (coverage >= 0.6 - Number.EPSILON) return 0;
  const progress = Math.min(1, coverage / 0.6);
  return 1 - progress * progress;
}
