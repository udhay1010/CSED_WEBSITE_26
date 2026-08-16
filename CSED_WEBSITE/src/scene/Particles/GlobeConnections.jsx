import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { GLOBE_RADIUS, TIMING } from "./particleConfig";
import { randomLandLatLon } from "../../utils/earthTexture";
import { latLonToVec3 } from "../../utils/globeUtils";

// ── Tuning ─────────────────────────────────────────
const ARC_COUNT   = 16;
const SPIKE_COUNT = 20;
const SPIKE_MIN   = 0.14; // min spike length as fraction of radius
const SPIKE_MAX   = 0.42; // max spike length as fraction of radius

function landPoint(radius) {
  const [lat, lon] = randomLandLatLon();
  return latLonToVec3(lat, lon, radius);
}

export default function GlobeConnections() {
  // ── Build everything once ─────────────────────────
  const { arcLines, spikeLines, tipPoints } = useMemo(() => {
    // Shared materials
    const arcMat = new THREE.LineBasicMaterial({
      color:       new THREE.Color(0xe63946),
      transparent: true,
      opacity:     0,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    });

    const spikeMat = new THREE.LineBasicMaterial({
      color:       new THREE.Color(1.0, 0.38, 0.32),
      transparent: true,
      opacity:     0,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    });

    const tipMat = new THREE.PointsMaterial({
      color:           new THREE.Color(1.0, 0.50, 0.45),
      size:            0.45,
      transparent:     true,
      opacity:         0,
      blending:        THREE.AdditiveBlending,
      depthWrite:      false,
      sizeAttenuation: true,
    });

    // ── Arcs ─────────────────────────────────────────
    const arcLines = [];
    for (let i = 0; i < ARC_COUNT; i++) {
      const p1   = landPoint(GLOBE_RADIUS);
      const p2   = landPoint(GLOBE_RADIUS);
      const ctrl = p1.clone().add(p2).multiplyScalar(0.5);
      ctrl.normalize().multiplyScalar(
        ctrl.length() + GLOBE_RADIUS * (0.22 + Math.random() * 0.30)
      );
      const curve  = new THREE.QuadraticBezierCurve3(p1, ctrl, p2);
      const geom   = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
      arcLines.push(new THREE.Line(geom, arcMat));
    }

    // ── Spikes + tip dots ─────────────────────────────
    const spikeLines = [];
    const tipVerts   = [];
    for (let i = 0; i < SPIKE_COUNT; i++) {
      const base = landPoint(GLOBE_RADIUS * 0.99);
      const len  = SPIKE_MIN + Math.random() * (SPIKE_MAX - SPIKE_MIN);
      const tip  = base.clone().normalize().multiplyScalar(GLOBE_RADIUS * (1 + len));
      const geom = new THREE.BufferGeometry().setFromPoints([base, tip]);
      spikeLines.push(new THREE.Line(geom, spikeMat));
      tipVerts.push(tip);
    }

    const tipGeom   = new THREE.BufferGeometry().setFromPoints(tipVerts);
    const tipPoints = new THREE.Points(tipGeom, tipMat);

    return { arcLines, spikeLines, tipPoints };
  }, []);

  // ── Fade in after globe finishes forming ──────────
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (t <= TIMING.FORM_END) return;

    const raw = Math.min((t - TIMING.FORM_END) / 1.8, 1.0);
    const opacity = raw * raw * (3 - 2 * raw); // smoothstep

    // All lines share the same material instance — update once
    if (arcLines[0]) arcLines[0].material.opacity   = opacity * 0.70;
    if (spikeLines[0]) spikeLines[0].material.opacity = opacity * 0.90;
    tipPoints.material.opacity = opacity;
  });

  return (
    <group>
      {arcLines.map((line, i) => (
        <primitive key={`arc-${i}`} object={line} />
      ))}
      {spikeLines.map((line, i) => (
        <primitive key={`spike-${i}`} object={line} />
      ))}
      <primitive object={tipPoints} />
    </group>
  );
}
