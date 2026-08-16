export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function easeInOutQuart(t) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

export function smoothstep(t) {
  const ct = Math.max(0, Math.min(1, t));
  return ct * ct * (3 - 2 * ct);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
