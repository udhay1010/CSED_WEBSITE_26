import { useEffect } from 'react';
import { useIntroStore } from '../store/introStore';
import { getEventsGlobeOpacity } from '../utils/globeFade';

export function useScrollProgress() {
  useEffect(() => {
    const about = document.getElementById('about');
    const events = document.getElementById('events');
    const stage = document.querySelector('[data-globe-stage]');
    const navbar = document.querySelector('nav');
    if (!about) return;
    // The whole canvas fades together; a moving crop would hide the globe prematurely.
    stage?.style.removeProperty('clip-path');
    let frame = 0;
    const compute = () => {
      frame = 0;
      const vh = window.innerHeight;
      const top = about.getBoundingClientRect().top;
      const progress = Math.max(0, Math.min(1, (vh - top) / (vh - 80)));
      const navbarBottom = navbar?.getBoundingClientRect().bottom ?? 0;
      const opacity = events ? getEventsGlobeOpacity(events.getBoundingClientRect(), navbarBottom, vh) : 1;
      const state = useIntroStore.getState();
      if (state.scrollProgress !== progress) state.setScrollProgress(progress);
      if (state.globeOpacity !== opacity) state.setGlobeOpacity(opacity);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(compute); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    if (navbar) observer.observe(navbar);
    compute();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);
}
