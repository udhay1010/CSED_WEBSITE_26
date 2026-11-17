export const PARTICLE_COUNT = 160000;
export const GLOBE_RADIUS = 1;
export const AXIAL_TILT = 10;
export const GLOBE_ROTATION_SPEED = 0.028;
export const CAMERA_DISTANCE = 40;
export const CAMERA_FOV = 45;

// Frame the actual sphere's tangent, rather than its equatorial plane.
export function getGlobePose(width, height, progress) {
  const halfHeight = CAMERA_DISTANCE * Math.tan(CAMERA_FOV * Math.PI / 360);
  const halfWidth = halfHeight * width / height;
  const mobile = width < 768;
  const homeRadius = halfHeight * 1.25;
  const endRadius = Math.min(halfHeight * (mobile ? 0.29 : 0.64), halfWidth * 0.48);
  const q = (mobile ? 0.28 : 0.36) * halfHeight / CAMERA_DISTANCE;
  const homeY = -q * CAMERA_DISTANCE - homeRadius * Math.sqrt(1 + q * q);
  const endX = -halfWidth * (1 - endRadius * endRadius / (CAMERA_DISTANCE * CAMERA_DISTANCE));
  const p = Math.max(0, Math.min(1, progress));
  const t = p * p * (3 - 2 * p);
  return {
    radius: homeRadius + (endRadius - homeRadius) * t,
    x: endX * t,
    y: homeY + ((mobile ? -halfHeight * 0.52 : 0) - homeY) * t,
  };
}

// Retained for the unused legacy intro timeline.
export const TIMING = { SPAWN: 0, SPLIT: 0.5, SCATTER_END: 2.5, FORM_START: 3, FORM_END: 5.5, HERO_FADE: 4, SETTLED: 6 };
