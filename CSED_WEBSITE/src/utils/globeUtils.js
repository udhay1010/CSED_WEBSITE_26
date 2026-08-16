import * as THREE from "three";
import { randomLandLatLon } from "./earthTexture";

/**
 * Convert lat/lon (degrees) to a THREE.Vector3 on a sphere of given radius.
 */
export function latLonToVec3(lat, lon, radius) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

/**
 * Generate `count` particle positions distributed on land masses.
 * Returns a Float32Array(count * 3) centered at origin.
 * Each point has a slight radial jitter for organic depth.
 */
export function generateGlobePositions(count, radius) {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const [lat, lon] = randomLandLatLon();
    const pos = latLonToVec3(lat, lon, radius);

    // Small radial jitter so particles aren't all on the exact surface
    const jitter = 0.97 + Math.random() * 0.06;
    const i3 = i * 3;
    positions[i3]     = pos.x * jitter;
    positions[i3 + 1] = pos.y * jitter;
    positions[i3 + 2] = pos.z * jitter;
  }

  return positions;
}