import { useEffect } from "react";
import { useIntroStore } from "../store/introStore";

/**
 * useScrollProgress
 *
 * Writes a 0 → 1 value to introStore.scrollProgress as the #about
 * section scrolls into the viewport.
 *
 * Progress milestones:
 *   0   — About section top is at or below 85% viewport height (not yet visible)
 *   0→1 — About section top moves from 85 vh down to 10 vh
 *   1   — About section is fully scrolled in (top near viewport top)
 */
export function useScrollProgress() {
  const setScrollProgress = useIntroStore((s) => s.setScrollProgress);

  useEffect(() => {
    const aboutSection = document.getElementById("about");
    if (!aboutSection) return;

    const compute = () => {
      const rect        = aboutSection.getBoundingClientRect();
      const vh          = window.innerHeight;
      const startTrigger = vh * 0.85; // transition starts when About top is 85% down
      const endTrigger   = vh * 0.15; // transition ends when About top is 15% down

      const raw      = 1 - (rect.top - endTrigger) / (startTrigger - endTrigger);
      const progress = Math.max(0, Math.min(1, raw));

      setScrollProgress(progress);
    };

    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute, { passive: true });
    compute();

    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [setScrollProgress]);
}
