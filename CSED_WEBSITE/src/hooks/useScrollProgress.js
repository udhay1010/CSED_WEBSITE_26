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
      const vh    = window.innerHeight;
      const vw    = window.innerWidth;
      const isMobile = vw < 768; // md breakpoint

      // ── scrollProgress: About entering viewport ──────────────────
      const aRect        = aboutSection.getBoundingClientRect();
      const startTrigger = vh * 0.85;
      const endTrigger   = vh * 0.15;
      const raw          = 1 - (aRect.top - endTrigger) / (startTrigger - endTrigger);
      const sp           = Math.max(0, Math.min(1, raw));
      setScrollProgress(sp);

      // ── globeOpacity ─────────────────────────────────────────────
      if (isMobile) {
        // On mobile: hide the globe as soon as About is entered
        // (globe layout is designed for wide screens only)
        setGlobeOpacity(sp > 0 ? 0 : 1);
      } else if (eventsSection) {
        // On desktop: fade out as Events section scrolls into view
        const eRect     = eventsSection.getBoundingClientRect();
        const fadeStart = vh * 1.0;  // start when Events top hits bottom edge
        const fadeEnd   = vh * 0.30; // fully gone when Events top is 30% from top
        const fadeRaw   = (eRect.top - fadeEnd) / (fadeStart - fadeEnd);
        setGlobeOpacity(Math.max(0, Math.min(1, fadeRaw)));
      }

    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute, { passive: true });
    compute();

    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [setScrollProgress, setGlobeOpacity]);
}

