import { useEffect } from "react";
import { useIntroStore } from "../store/introStore";

/**
 * useScrollProgress
 *
 * Writes two values to introStore:
 *
 * scrollProgress (0→1):
 *   Tracks the #about section entering the viewport.
 *   0 = About not yet visible, 1 = About fully in view.
 *
 * globeOpacity (1→0):
 *   Tracks the #events section entering the viewport.
 *   Globe fades out as Events scrolls up, fully gone when Events is centred.
 */
export function useScrollProgress() {
  const setScrollProgress = useIntroStore((s) => s.setScrollProgress);
  const setGlobeOpacity   = useIntroStore((s) => s.setGlobeOpacity);

  useEffect(() => {
    const aboutSection  = document.getElementById("about");
    const eventsSection = document.getElementById("events");
    if (!aboutSection) return;

    const compute = () => {
      const vh = window.innerHeight;

      // ── scrollProgress: About entering viewport ──────────────────
      const aRect        = aboutSection.getBoundingClientRect();
      const startTrigger = vh * 0.85;
      const endTrigger   = vh * 0.15;
      const raw          = 1 - (aRect.top - endTrigger) / (startTrigger - endTrigger);
      setScrollProgress(Math.max(0, Math.min(1, raw)));

      // ── globeOpacity: fade out as Events enters viewport ─────────
      // Fade window: Events top goes from 100vh (off screen) → 30vh
      if (eventsSection) {
        const eRect      = eventsSection.getBoundingClientRect();
        const fadeStart  = vh * 1.0;  // start fading when Events top hits bottom of screen
        const fadeEnd    = vh * 0.30; // fully gone when Events top is 30% from top
        const fadeRaw    = (eRect.top - fadeEnd) / (fadeStart - fadeEnd);
        setGlobeOpacity(Math.max(0, Math.min(1, fadeRaw)));
      }
    };

    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute, { passive: true });
    compute();

    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [setScrollProgress, setGlobeOpacity]);
}

