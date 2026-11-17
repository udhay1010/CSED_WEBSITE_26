import { useLayoutEffect } from 'react';

export function getNavbarTheme(bands, top, bottom, previous, previousTop = top) {
  const height = bottom - top;
  if (height <= 0) return previous;
  if (top < previousTop) {
    // Upward: the departing section exposes its predecessor below the navbar, with 2px hysteresis.
    const index = bands.findIndex((b, i) => i > 0 && b.top >= top + 2 && b.top <= previousTop + 2);
    return index > 0 ? bands[index - 1].theme : previous;
  }
  const covered = bands.findLast(b => b.top <= top + 1 && b.bottom >= bottom - 1);
  if (covered) return covered.theme;

  // Impossible-to-fill short sections qualify only when fully visible and the largest visual owner.
  const owners = bands.map(b => ({ ...b, visible: Math.max(0, Math.min(b.bottom, bottom) - Math.max(b.top, top)) }));
  const owner = owners.reduce((largest, b) => !largest || b.visible > largest.visible ? b : largest, null);
  const uncovered = Math.max(0, height - owners.reduce((sum, b) => sum + b.visible, 0));
  if (owner?.visible > uncovered && owner.bottom - owner.top < height - 2 && owner.top >= top - 1 && owner.bottom <= bottom + 1) return owner.theme;

  // A wheel/touch step can cross About's narrow valid coverage window between rendered frames.
  let crossed = null, distance = -1;
  for (const b of bands) {
    const start = b.top - 1, end = b.bottom - height + 1;
    if (start > end || end < Math.min(previousTop, top) || start > Math.max(previousTop, top)) continue;
    const entry = top >= previousTop ? Math.max(previousTop, start) : Math.min(previousTop, end);
    if (Math.abs(entry - previousTop) >= distance) { crossed = b; distance = Math.abs(entry - previousTop); }
  }
  return crossed?.theme || previous;
}

export function getNavbarInk(from, to, progress, height) {
  const color = theme => theme === 'light' ? '#111111' : '#f5f5f5';
  const cut = height * (1 - progress);
  return `linear-gradient(to bottom, ${color(from)} 0px ${cut}px, ${color(to)} ${cut}px ${height}px)`;
}

export function useNavbarForeground(rowRef) {
  useLayoutEffect(() => {
    const row = rowRef.current;
    const surface = row.parentElement;
    const sections = [...document.querySelectorAll('[data-nav-theme]')];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let bands = [], top = 0, height = 80, navbarBottom = 81, frame = 0, disposed = false;
    let needsMeasure = true, needsCoverage = true, initialize = true, previousTop = null;
    let current = 'dark', desired = 'dark', transition = null;
    const paint = (from, to, progress) => {
      surface.style.setProperty('--nav-ink', getNavbarInk(from, to, progress, height));
      surface.style.setProperty('--nav-from-bg', from === 'light' ? '#ffffff' : 'var(--bg)');
      surface.style.setProperty('--nav-to-bg', to === 'light' ? '#ffffff' : 'var(--bg)');
      surface.style.setProperty('--nav-cut', `${height * (1 - progress)}px`);
      surface.dataset.theme = from;
      surface.dataset.incomingTheme = to;
      surface.dataset.transition = transition ? 'running' : 'idle';
    };
    const update = (time = performance.now()) => {
      frame = 0;
      if (needsMeasure) {
        const rect = row.getBoundingClientRect();
        top = rect.top; height = rect.height;
        navbarBottom = surface.getBoundingClientRect().bottom;
        surface.style.setProperty('--nav-height', `${height}px`);
        row.querySelectorAll('.nav-ink').forEach(text => {
          text.style.setProperty('--nav-text-offset', `${text.getBoundingClientRect().top - top}px`);
        });
        needsMeasure = false;
      }
      if (needsCoverage) {
        bands = sections.map(section => {
          const rect = section.getBoundingClientRect();
          return { top: rect.top + scrollY, bottom: rect.bottom + scrollY, theme: section.dataset.navTheme };
        });
        needsCoverage = false;
      }
      const contentTop = scrollY + navbarBottom, contentBottom = scrollY + innerHeight;
      const initialTheme = bands.findLast(b => contentTop >= b.top && contentTop < b.bottom)?.theme || 'dark';
      if (initialize || previousTop === null || contentTop !== previousTop) {
        desired = getNavbarTheme(bands, contentTop, contentBottom, initialize ? initialTheme : desired, initialize ? contentTop : previousTop ?? contentTop);
      }
      previousTop = contentTop;
      if (initialize || reducedMotion.matches) {
        current = desired; transition = null; initialize = false;
      }
      let progress = 1;
      if (transition) {
        const t = Math.min(1, (time - transition.start) / Math.max(1, transition.duration));
        progress = transition.origin + (transition.end - transition.origin) * t * t * (3 - 2 * t);
        const end = desired === transition.to ? 1 : 0;
        // Retarget the visible wipe in place, never queue another animation or jump its boundary.
        if (end !== transition.end) transition = { ...transition, origin: progress, end, start: time, duration: 550 * Math.abs(end - progress) };
        if (Math.abs(progress - transition.end) < 0.00001) {
          current = transition.end === 1 ? transition.to : transition.from; transition = null;
        }
      }
      if (!transition && desired !== current) {
        transition = { from: current, to: desired, start: time, origin: 0, end: 1, duration: 550 }; progress = 0;
      }
      paint(transition?.from || current, transition?.to || current, transition ? progress : 1);
      if (transition) schedule();
    };
    const schedule = () => { if (!frame && !disposed) frame = requestAnimationFrame(update); };
    const scroll = () => { needsCoverage = true; schedule(); };
    const measure = () => { needsMeasure = true; needsCoverage = true; previousTop = null; schedule(); };
    const restore = () => { initialize = true; measure(); };
    const observer = new ResizeObserver(measure);
    [row, surface, document.body, ...sections].forEach(element => observer.observe(element));
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('pageshow', restore);
    reducedMotion.addEventListener('change', schedule);
    document.fonts.ready.then(() => { if (!disposed) measure(); });
    update();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('resize', measure);
      window.removeEventListener('pageshow', restore);
      reducedMotion.removeEventListener('change', schedule);
    };
  }, [rowRef]);
}
