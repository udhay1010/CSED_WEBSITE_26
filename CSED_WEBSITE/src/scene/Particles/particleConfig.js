// ── Particle Counts ────────────────────────────────
export const PARTICLE_COUNT = 32768;   // 2^15 — denser globe coverage
export const INTRO_PARTICLES = 1024;   // visible during intro split

// ── Globe Geometry ─────────────────────────────────
export const GLOBE_RADIUS = 14.0;
export const GLOBE_OFFSET_Y = -28.0;   // top stays at Y=-14 (= GLOBE_OFFSET_Y + GLOBE_RADIUS)
export const AXIAL_TILT = 10;          // degrees — 10° right tilt as viewed from screen

// ── Particle Sizing ────────────────────────────────
export const SIZE_FACTOR = 50.0;       // perspective attenuation factor
export const SIZE_RED = [2.2, 4.0];    // [min, max] for red particles
export const SIZE_WHITE = [1.0, 1.8];  // [min, max] for white particles
export const SIZE_INTRO = [2.5, 4.0];  // intro particles are slightly larger

// ── Colors ─────────────────────────────────────────
export const COLORS = {
  RED:   [0.902, 0.224, 0.275],   // #e63946
  WHITE: [0.96,  0.96,  0.96],
};

// ── Red Particle Ratios ────────────────────────────
export const RED_RATIO_INTRO = 0.30;   // 30% red in intro batch
export const RED_RATIO_GLOBE = 0.28;   // 28% red on globe — matches reference image

// ── Animation Timeline (seconds) ───────────────────
export const TIMING = {
  SPAWN:       0.0,    // first particle appears
  SPLIT:       0.5,    // split animation runs 0 → 0.5s
  SCATTER_END: 2.5,    // intro particles finish scattering
  FORM_START:  3.0,    // particles begin flowing to globe
  FORM_END:    5.5,    // globe fully formed
  HERO_FADE:   4.0,    // hero text begins fading in
  SETTLED:     6.0,    // everything settled
};

// ── Rotation ───────────────────────────────────────
export const GLOBE_ROTATION_SPEED = 0.125; // radians per second