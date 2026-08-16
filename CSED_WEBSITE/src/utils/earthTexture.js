// ──────────────────────────────────────────────────
// Programmatic Earth Land Mask
// ──────────────────────────────────────────────────
// Draws ~60 overlapping ellipses onto a hidden canvas to approximate
// continent shapes.  Provides isLand(lat, lon) for rejection sampling.
// This is "texture-based" mapping without requiring an external image.

const WIDTH = 720;
const HEIGHT = 360;
let landData = null;

// Detailed continent regions — [lat, lon, dLat, dLon]
// Many overlapping ellipses approximate real coastlines.
const LAND_REGIONS = [
  // ── North America ────────────────────────────────
  { lat: 55,  lon: -105, dLat: 15, dLon: 30 },  // Canada
  { lat: 45,  lon: -95,  dLat: 10, dLon: 20 },  // Central US
  { lat: 35,  lon: -100, dLat: 8,  dLon: 15 },  // Southern US
  { lat: 30,  lon: -90,  dLat: 5,  dLon: 8 },   // Gulf states
  { lat: 62,  lon: -150, dLat: 8,  dLon: 12 },  // Alaska
  { lat: 25,  lon: -102, dLat: 5,  dLon: 8 },   // Mexico
  { lat: 18,  lon: -95,  dLat: 4,  dLon: 6 },   // S. Mexico
  { lat: 15,  lon: -87,  dLat: 4,  dLon: 4 },   // Central America
  { lat: 50,  lon: -70,  dLat: 10, dLon: 12 },  // Eastern Canada
  { lat: 70,  lon: -100, dLat: 8,  dLon: 25 },  // Northern Canada
  { lat: 75,  lon: -70,  dLat: 6,  dLon: 15 },  // Baffin Island
  { lat: 48,  lon: -120, dLat: 6,  dLon: 5 },   // Pacific NW

  // ── South America ───────────────────────────────
  { lat: 2,   lon: -60,  dLat: 12, dLon: 15 },  // Brazil north
  { lat: -12, lon: -52,  dLat: 12, dLon: 14 },  // Brazil central
  { lat: -25, lon: -55,  dLat: 8,  dLon: 10 },  // Brazil south
  { lat: -32, lon: -65,  dLat: 8,  dLon: 6 },   // Argentina
  { lat: -44, lon: -70,  dLat: 10, dLon: 4 },   // Patagonia
  { lat: 5,   lon: -73,  dLat: 5,  dLon: 5 },   // Colombia
  { lat: -5,  lon: -78,  dLat: 6,  dLon: 4 },   // Peru
  { lat: -18, lon: -66,  dLat: 4,  dLon: 4 },   // Bolivia
  { lat: 8,   lon: -66,  dLat: 5,  dLon: 6 },   // Venezuela

  // ── Europe ──────────────────────────────────────
  { lat: 55,  lon: 10,   dLat: 8,  dLon: 12 },  // Northern Europe
  { lat: 48,  lon: 3,    dLat: 5,  dLon: 6 },   // France
  { lat: 53,  lon: -2,   dLat: 5,  dLon: 3 },   // UK
  { lat: 57,  lon: -5,   dLat: 3,  dLon: 2 },   // Scotland
  { lat: 42,  lon: 12,   dLat: 5,  dLon: 4 },   // Italy
  { lat: 40,  lon: -4,   dLat: 5,  dLon: 5 },   // Spain
  { lat: 50,  lon: 20,   dLat: 5,  dLon: 5 },   // Poland
  { lat: 48,  lon: 12,   dLat: 4,  dLon: 5 },   // Germany/Austria
  { lat: 62,  lon: 15,   dLat: 6,  dLon: 8 },   // Scandinavia
  { lat: 65,  lon: -18,  dLat: 3,  dLon: 4 },   // Iceland
  { lat: 39,  lon: 22,   dLat: 4,  dLon: 4 },   // Greece/Balkans
  { lat: 44,  lon: 26,   dLat: 4,  dLon: 5 },   // Romania

  // ── Africa ──────────────────────────────────────
  { lat: 15,  lon: 10,   dLat: 15, dLon: 20 },  // West/Central Africa
  { lat: 30,  lon: 3,    dLat: 6,  dLon: 14 },  // North Africa west
  { lat: 28,  lon: 25,   dLat: 5,  dLon: 8 },   // Libya/Egypt
  { lat: 27,  lon: 32,   dLat: 4,  dLon: 3 },   // Nile corridor
  { lat: 0,   lon: 28,   dLat: 8,  dLon: 10 },  // Central Africa
  { lat: -8,  lon: 32,   dLat: 8,  dLon: 8 },   // East Africa
  { lat: -22, lon: 28,   dLat: 10, dLon: 8 },   // Southern Africa
  { lat: 5,   lon: 40,   dLat: 8,  dLon: 5 },   // Horn of Africa
  { lat: -20, lon: 46,   dLat: 8,  dLon: 3 },   // Madagascar

  // ── Asia ────────────────────────────────────────
  { lat: 58,  lon: 70,   dLat: 10, dLon: 35 },  // W. Siberia
  { lat: 58,  lon: 115,  dLat: 10, dLon: 25 },  // E. Siberia
  { lat: 62,  lon: 155,  dLat: 8,  dLon: 15 },  // Russian Far East
  { lat: 50,  lon: 75,   dLat: 8,  dLon: 18 },  // Central Asia
  { lat: 38,  lon: 80,   dLat: 10, dLon: 15 },  // W. China / Tibet
  { lat: 32,  lon: 108,  dLat: 10, dLon: 14 },  // E. China
  { lat: 42,  lon: 120,  dLat: 6,  dLon: 10 },  // N. China / Mongolia
  { lat: 36,  lon: 138,  dLat: 6,  dLon: 4 },   // Japan
  { lat: 28,  lon: 83,   dLat: 5,  dLon: 8 },   // N. India / Nepal
  { lat: 20,  lon: 78,   dLat: 8,  dLon: 6 },   // India
  { lat: 10,  lon: 78,   dLat: 5,  dLon: 3 },   // S. India
  { lat: 16,  lon: 102,  dLat: 8,  dLon: 8 },   // SE Asia mainland
  { lat: 0,   lon: 112,  dLat: 5,  dLon: 12 },  // Indonesia west
  { lat: -4,  lon: 125,  dLat: 5,  dLon: 8 },   // Indonesia east
  { lat: 28,  lon: 50,   dLat: 8,  dLon: 12 },  // Middle East
  { lat: 38,  lon: 35,   dLat: 5,  dLon: 8 },   // Turkey
  { lat: 33,  lon: 55,   dLat: 6,  dLon: 10 },  // Iran
  { lat: 45,  lon: 65,   dLat: 5,  dLon: 12 },  // Kazakhstan
  { lat: 37,  lon: 127,  dLat: 3,  dLon: 3 },   // Korea
  { lat: 24,  lon: 121,  dLat: 3,  dLon: 2 },   // Taiwan
  { lat: 5,   lon: 104,  dLat: 4,  dLon: 4 },   // Malaysia
  { lat: 12,  lon: 123,  dLat: 7,  dLon: 5 },   // Philippines
  { lat: 8,   lon: 81,   dLat: 2,  dLon: 1.5 }, // Sri Lanka

  // ── Australia & Oceania ─────────────────────────
  { lat: -25, lon: 135,  dLat: 13, dLon: 18 },  // Australia
  { lat: -14, lon: 132,  dLat: 4,  dLon: 5 },   // N. Australia
  { lat: -38, lon: 145,  dLat: 3,  dLon: 4 },   // Tasmania
  { lat: -42, lon: 172,  dLat: 5,  dLon: 3 },   // New Zealand
  { lat: -6,  lon: 147,  dLat: 5,  dLon: 5 },   // Papua New Guinea

  // ── Greenland ───────────────────────────────────
  { lat: 72,  lon: -42,  dLat: 10, dLon: 14 },
];

// Precompute cumulative areas for weighted sampling
const AREAS = LAND_REGIONS.map((r) => r.dLat * r.dLon);
const TOTAL_AREA = AREAS.reduce((s, a) => s + a, 0);

function initLandMask() {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");

  // Ocean — black
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Land — white ellipses
  ctx.fillStyle = "#fff";
  for (const region of LAND_REGIONS) {
    // Convert lat/lon to canvas pixel coords (equirectangular projection)
    const cx = ((region.lon + 180) / 360) * WIDTH;
    const cy = ((90 - region.lat) / 180) * HEIGHT;
    const rx = (region.dLon / 360) * WIDTH;
    const ry = (region.dLat / 180) * HEIGHT;

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  landData = ctx.getImageData(0, 0, WIDTH, HEIGHT).data;
}

/**
 * Check if a lat/lon coordinate falls on land.
 */
export function isLand(lat, lon) {
  if (!landData) initLandMask();

  const x = Math.floor(((lon + 180) / 360) * WIDTH) % WIDTH;
  const y = Math.floor(((90 - lat) / 180) * HEIGHT) % HEIGHT;
  const idx = (y * WIDTH + Math.abs(x)) * 4;

  return landData[idx] > 128;
}

/**
 * Return a random [lat, lon] pair on land.
 * Uses area-weighted region selection + rejection sampling against the mask.
 */
export function randomLandLatLon() {
  if (!landData) initLandMask();

  for (let attempt = 0; attempt < 500; attempt++) {
    // Pick a region weighted by area
    let r = Math.random() * TOTAL_AREA;
    let region = LAND_REGIONS[0];
    for (let i = 0; i < LAND_REGIONS.length; i++) {
      if (r < AREAS[i]) {
        region = LAND_REGIONS[i];
        break;
      }
      r -= AREAS[i];
    }

    // Sample within the region's bounding ellipse
    const dx = Math.random() * 2 - 1;
    const dy = Math.random() * 2 - 1;
    // Reject points outside unit circle (ellipse rejection)
    if (dx * dx + dy * dy > 1) continue;

    const lat = Math.max(-90, Math.min(90, region.lat + dy * region.dLat));
    const lon = region.lon + dx * region.dLon;

    // Verify against the rendered mask
    if (isLand(lat, lon)) {
      return [lat, lon];
    }
  }

  // Fallback — should rarely hit this
  return [0, 20];
}

/**
 * Return a random [lat, lon] pair on ocean (non-land).
 * Uses asin sampling for uniform distribution over the sphere surface.
 */
export function randomOceanLatLon() {
  if (!landData) initLandMask();

  for (let attempt = 0; attempt < 1000; attempt++) {
    // Uniform-sphere sampling: asin gives correct lat distribution
    const lat = Math.asin(2 * Math.random() - 1) * (180 / Math.PI);
    const lon  = Math.random() * 360 - 180;
    if (!isLand(lat, lon)) return [lat, lon];
  }

  // Fallback — middle of Pacific Ocean
  return [0, -150];
}

