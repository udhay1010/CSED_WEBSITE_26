function randomLandLatLon() {
  // pick a continent weighted by size, then rejection-sample an ellipse
  let r = Math.random() * TOTAL_WEIGHT;
  let region = CONTINENTS[0];
  for (const c of CONTINENTS) {
    if (r < c.w) {
      region = c;
      break;
    }
    r -= c.w;
  }
  let lat, lon, ok;
  do {
    const dx = (Math.random() * 2 - 1);
    const dy = (Math.random() * 2 - 1);
    ok = dx * dx + dy * dy <= 1;
    lat = region.lat + dy * region.dLat;
    lon = region.lon + dx * region.dLon;
  } while (!ok);
  return [lat, lon];
}

function latLonToVec3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}
 
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}