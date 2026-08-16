import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
  GLOBE_RADIUS,
  GLOBE_OFFSET_Y,
  AXIAL_TILT,
  GLOBE_ROTATION_SPEED,
  TIMING,
} from "./particleConfig";

const TILT_RAD = (AXIAL_TILT * Math.PI) / 180;

// Low-density wireframe: fewer segments = sparser mesh
const W_SEGMENTS = 18; // longitude lines
const H_SEGMENTS = 12; // latitude lines

export default function GlobeMesh() {
  // outerGroup → position Y + tilt Z
  // spinGroup  → spins around local Y (the tilted axis)
  const outerRef = useRef();
  const spinRef  = useRef();

  // Build a thin wireframe geometry from a sphere
  const geometry = useMemo(() => {
    const sphere = new THREE.SphereGeometry(
      GLOBE_RADIUS,
      W_SEGMENTS,
      H_SEGMENTS
    );
    return new THREE.WireframeGeometry(sphere);
  }, []);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color:       new THREE.Color(0xe63946),
        transparent: true,
        opacity:     0,
        blending:    THREE.AdditiveBlending,
        depthWrite:  false,
        linewidth:   1,
      }),
    []
  );

  useFrame(({ clock }, delta) => {
    const t     = clock.elapsedTime;
    const outer = outerRef.current;
    const spin  = spinRef.current;
    if (!outer || !spin) return;

    // ── Outer: position Y + tilt Z (matches ParticleSystem exactly) ──
    if (t < TIMING.FORM_START) {
      outer.position.y = 0;
      outer.rotation.z = 0;
    } else if (t < TIMING.FORM_END) {
      const p  = (t - TIMING.FORM_START) / (TIMING.FORM_END - TIMING.FORM_START);
      const ep = p * p * (3 - 2 * p);
      outer.position.y = GLOBE_OFFSET_Y * ep;
      outer.rotation.z = -TILT_RAD * ep; // negative = right tilt from viewer
    } else {
      outer.position.y = GLOBE_OFFSET_Y;
      outer.rotation.z = -TILT_RAD;      // negative = right tilt from viewer
    }

    // ── Inner spin: local Y = the tilted axis ────────────────────
    if (t > TIMING.FORM_START) {
      spin.rotation.y += delta * GLOBE_ROTATION_SPEED;
    }

    // ── Fade in after globe finishes forming ─────────────────────
    if (t > TIMING.FORM_END) {
      const raw     = Math.min((t - TIMING.FORM_END) / 2.2, 1.0);
      const opacity = raw * raw * (3 - 2 * raw);
      material.opacity = opacity * 0.18;
    }
  });

  return (
    <group ref={outerRef}>
      <group ref={spinRef}>
        <lineSegments geometry={geometry} material={material} frustumCulled={false} />
      </group>
    </group>
  );
}
