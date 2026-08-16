import { TIMING } from "./particleConfig";

/**
 * Determine current animation phase from elapsed time.
 */
export function getPhase(time) {
  if (time < TIMING.SPLIT)       return "SPAWN";
  if (time < TIMING.SCATTER_END) return "SCATTER";
  if (time < TIMING.FORM_START)  return "PAUSE";
  if (time < TIMING.FORM_END)    return "FORMATION";
  return "GLOBE";
}

/**
 * Compute hero overlay opacity from elapsed time.
 */
export function getHeroOpacity(time) {
  if (time < TIMING.HERO_FADE) return 0;
  const duration = 1.5;
  const t = Math.min((time - TIMING.HERO_FADE) / duration, 1);
  return t * t * (3 - 2 * t); // smoothstep
}