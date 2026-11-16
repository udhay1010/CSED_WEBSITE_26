import { useEffect } from 'react';
import { useIntroStore } from '../store/introStore';

export function useScrollProgress() {
  useEffect(() => {
    const about = document.getElementById('about');
    const events = document.getElementById('events');
    const stage = document.querySelector('[data-globe-stage]');
    if (!about) return;
    let frame = 0;
    const compute = () => {
      frame = 0;
      const vh = window.innerHeight;
      const top = about.getBoundingClientRect().top;
      const progress = Math.max(0, Math.min(1, (vh - top) / (vh - 80)));
      // Release the stage as About leaves, before any unrelated section enters.
      const eventsTop = events ? events.getBoundingClientRect().top : vh;
      const opacity = Math.max(0, Math.min(1, (eventsTop - vh * 0.8) / (vh * 0.2)));
      // Clip at the section boundary so the persistent canvas never paints over Events.
      if (stage) stage.style.clipPath = `inset(0px 0px ${Math.max(0, vh - eventsTop)}px 0px)`;
      const state = useIntroStore.getState();
      if (state.scrollProgress !== progress) state.setScrollProgress(progress);
      if (state.globeOpacity !== opacity) state.setGlobeOpacity(opacity);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(compute); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    compute();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);
}
