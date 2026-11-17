import * as THREE from 'three';
import { PARTICLE_COUNT } from './particleConfig.js';

function sample(seed) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

// Restore the orderly equal-area surface; retain independent, subpixel radial variation.
export function createParticleGeometry(isLand, count = PARTICLE_COUNT) {
  const positions = [], colors = [], sizes = [], oceans = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const random = sample(i);
    const y = 1 - 2 * (i + 0.5) / count;
    const ring = Math.sqrt(1 - y * y);
    const angle = i * goldenAngle + (random - 0.5) * 0.007;
    const x = ring * Math.cos(angle), z = ring * Math.sin(angle);
    const lat = Math.asin(y) * 180 / Math.PI;
    const lon = Math.atan2(-z, x) * 180 / Math.PI;
    const land = isLand(lat, lon);
    if (!land && random > 0.42) continue;
    // Color selection must not bias the surface height into separate red/white layers.
    const radius = 0.9996 + sample(i + 900001) * 0.0008;
    positions.push(x * radius, y * radius, z * radius);
    const red = !land && random < 0.2;
    const brightness = red ? 0.95 + random * 0.05 : 0.8 + random * 0.25;
    if (!land && !red) colors.push(0.24, 0.1, 0.13);
    else colors.push(red ? brightness : brightness * 0.96, red ? 0.025 : brightness * 0.97, red ? 0.055 : brightness);
    sizes.push(1.45 + random * 0.95);
    oceans.push(land ? 0 : 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('aOcean', new THREE.Float32BufferAttribute(oceans, 1));
  geometry.computeBoundingSphere();
  return geometry;
}
