import * as THREE from 'three';
import { PARTICLE_COUNT } from './particleConfig.js';

// Equal-area sampling avoids stacked points and dense polar bands.
export function createParticleGeometry(isLand, count = PARTICLE_COUNT) {
  const positions = [], colors = [], sizes = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const seed = (Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1;
    const random = seed - Math.floor(seed);
    const y = 1 - 2 * (i + 0.5) / count;
    const angle = i * goldenAngle + (random - 0.5) * 0.007;
    const ring = Math.sqrt(1 - y * y);
    const x = ring * Math.cos(angle), z = ring * Math.sin(angle);
    const lat = Math.asin(y) * 180 / Math.PI;
    const lon = Math.atan2(-z, x) * 180 / Math.PI;
    const land = isLand(lat, lon);
    if (!land && random > 0.22) continue;
    const radius = 1 + random * 0.001;
    positions.push(x * radius, y * radius, z * radius);
    const red = !land || random < 0.17;
    const brightness = 0.68 + random * 0.32;
    colors.push(red ? brightness : brightness * 0.96, red ? 0.025 : brightness * 0.97, red ? 0.055 : brightness);
    sizes.push(1.25 + random * 0.8);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
  geometry.computeBoundingSphere();
  return geometry;
}
