import * as THREE from "three";
import {
  PARTICLE_COUNT,
  INTRO_PARTICLES,
  GLOBE_RADIUS,
  TIMING,
  COLORS,
  RED_RATIO_INTRO,
  SIZE_INTRO,
} from "./particleConfig";
import { latLonToVec3 } from "../../utils/globeUtils";
import { isLand, randomLandLatLon } from "../../utils/earthTexture";

// ── Grid texture parameters ─────────────────────────────────────
// A regular lat/lon grid (cos-adjusted per row) creates the distinctive
// "globe texture" look — dots visibly following latitude/longitude lines.
const LAT_STEP   = 0.55;   // degrees between each latitude row
const LON_BASE   = 0.75;   // longitude step at equator (widens at poles via cos)
const OCEAN_PROB = 0.025;  // fraction of ocean grid cells that become a red dot

// Globe particle sizes (separate from intro)
const LAND_SIZE  = [1.5, 2.4]; // white continent dots — prominent
const OCEAN_SIZE = [0.9, 1.4]; // red ocean dots — subtle

// ── Helpers ─────────────────────────────────────────────────────
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Build a cos-adjusted lat/lon grid of Three.js Vector3 positions.
 *
 * Longitude step is divided by cos(lat) so dots stay equally spaced
 * on the sphere surface rather than crowding at the poles — this is
 * exactly what creates the "globe texture" seen in the reference.
 *
 * Returns two shuffled arrays:
 *   land  — positions on continents  → white particles
 *   ocean — sparse positions on water → red particles
 */
function buildGlobeGrid(radius) {
  const land  = [];
  const ocean = [];

  for (let lat = -88; lat <= 88; lat += LAT_STEP) {
    const cosLat  = Math.cos((lat * Math.PI) / 180);
    const lonStep = LON_BASE / Math.max(cosLat, 0.14); // clamp near poles

    for (let lon = -180; lon < 180; lon += lonStep) {
      const v = latLonToVec3(lat, lon, radius);
      if (isLand(lat, lon)) {
        land.push(v);
      } else if (Math.random() < OCEAN_PROB) {
        ocean.push(v);
      }
    }
  }

  shuffle(land);
  shuffle(ocean);
  return { land, ocean };
}

// ── Main geometry builder ────────────────────────────────────────
/**
 * Build the BufferGeometry for the entire particle system.
 *
 * GPU Data Layout (per particle):
 *   position        vec3  — spawn position (Three.js required)
 *   aSpawnPosition  vec3  — where particle starts
 *   aTargetPosition vec3  — grid position on globe surface
 *   aSize           float — base point size
 *   aRandom         float — noise / direction seed [0, 1]
 *   aActivation     float — time (s) when particle becomes visible
 *   aColor          vec3  — pure red or pure white
 */
export function createParticleGeometry() {
  // Build grid before allocating typed arrays (isLand() initialises canvas once)
  const { land, ocean } = buildGlobeGrid(GLOBE_RADIUS);

  const geometry        = new THREE.BufferGeometry();
  const positions       = new Float32Array(PARTICLE_COUNT * 3);
  const spawnPositions  = new Float32Array(PARTICLE_COUNT * 3);
  const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
  const sizes           = new Float32Array(PARTICLE_COUNT);
  const randoms         = new Float32Array(PARTICLE_COUNT);
  const activations     = new Float32Array(PARTICLE_COUNT);
  const colors          = new Float32Array(PARTICLE_COUNT * 3);

  const maxGen     = Math.floor(Math.log2(INTRO_PARTICLES));
  const globeCount = PARTICLE_COUNT - INTRO_PARTICLES;

  // Ocean capped at 8% of globe budget (keeps continents dominant)
  const oceanCount = Math.min(ocean.length, Math.floor(globeCount * 0.08));
  const landCount  = globeCount - oceanCount;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    randoms[i] = Math.random();

    // ══════════════════════════════════════════════
    // Intro Particles  (i < INTRO_PARTICLES)
    // ══════════════════════════════════════════════
    if (i < INTRO_PARTICLES) {
      // Spawn at origin
      spawnPositions[i3] = spawnPositions[i3 + 1] = spawnPositions[i3 + 2] = 0;

      // Target: random land point (they'll fly to globe later anyway)
      const [lat, lon] = randomLandLatLon();
      const tp = latLonToVec3(lat, lon, GLOBE_RADIUS);
      targetPositions[i3]     = tp.x;
      targetPositions[i3 + 1] = tp.y;
      targetPositions[i3 + 2] = tp.z;

      // Staggered binary-tree activation
      const generation = Math.floor(Math.log2(i + 1));
      activations[i] =
        TIMING.SPAWN +
        (generation / maxGen) * (TIMING.SPLIT - TIMING.SPAWN) +
        (Math.random() - 0.5) * 0.02;
      if (i === 0) activations[i] = 0;

      // Mixed pure red / pure white
      const isRed = Math.random() < RED_RATIO_INTRO;
      colors[i3]     = isRed ? COLORS.RED[0]   : COLORS.WHITE[0];
      colors[i3 + 1] = isRed ? COLORS.RED[1]   : COLORS.WHITE[1];
      colors[i3 + 2] = isRed ? COLORS.RED[2]   : COLORS.WHITE[2];
      sizes[i] = SIZE_INTRO[0] + Math.random() * (SIZE_INTRO[1] - SIZE_INTRO[0]);

    // ══════════════════════════════════════════════
    // Globe Particles  (i >= INTRO_PARTICLES)
    // ══════════════════════════════════════════════
    } else {
      const gi = i - INTRO_PARTICLES;

      let tp;
      if (gi < landCount) {
        // ── White continent dot ─────────────────
        tp = land[gi % land.length]; // wrap if grid generated fewer than budget
        colors[i3]     = COLORS.WHITE[0];
        colors[i3 + 1] = COLORS.WHITE[1];
        colors[i3 + 2] = COLORS.WHITE[2];
        sizes[i] = LAND_SIZE[0] + Math.random() * (LAND_SIZE[1] - LAND_SIZE[0]);
      } else {
        // ── Red ocean dot (sparse) ──────────────
        const oi = gi - landCount;
        tp = ocean[oi % ocean.length];
        colors[i3]     = COLORS.RED[0];
        colors[i3 + 1] = COLORS.RED[1];
        colors[i3 + 2] = COLORS.RED[2];
        sizes[i] = OCEAN_SIZE[0] + Math.random() * (OCEAN_SIZE[1] - OCEAN_SIZE[0]);
      }

      targetPositions[i3]     = tp.x;
      targetPositions[i3 + 1] = tp.y;
      targetPositions[i3 + 2] = tp.z;

      // Spawn at random point on a distant shell around origin
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const dist  = 8 + Math.random() * 12;
      spawnPositions[i3]     = dist * Math.sin(phi) * Math.cos(theta);
      spawnPositions[i3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
      spawnPositions[i3 + 2] = dist * Math.cos(phi);

      const formWindow = TIMING.FORM_END - TIMING.FORM_START - 0.5;
      activations[i] = TIMING.FORM_START + Math.random() * formWindow;
    }

    // position attribute mirrors spawn
    positions[i3]     = spawnPositions[i3];
    positions[i3 + 1] = spawnPositions[i3 + 1];
    positions[i3 + 2] = spawnPositions[i3 + 2];
  }

  geometry.setAttribute("position",        new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSpawnPosition",  new THREE.BufferAttribute(spawnPositions, 3));
  geometry.setAttribute("aTargetPosition", new THREE.BufferAttribute(targetPositions, 3));
  geometry.setAttribute("aSize",           new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aRandom",         new THREE.BufferAttribute(randoms, 1));
  geometry.setAttribute("aActivation",     new THREE.BufferAttribute(activations, 1));
  geometry.setAttribute("aColor",          new THREE.BufferAttribute(colors, 3));

  return geometry;
}