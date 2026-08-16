import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";

import { createParticleGeometry } from "./ParticleGeometry";
import { createParticleMaterial } from "./ParticleMaterial";
import { getHeroOpacity } from "./ParticleTimeline";
import {
  TIMING,
  GLOBE_OFFSET_Y,
  AXIAL_TILT,
  GLOBE_ROTATION_SPEED,
} from "./particleConfig";
import { useIntroStore } from "../../store/introStore";

const TILT_RAD = (AXIAL_TILT * Math.PI) / 180;

export default function ParticleSystem() {
  // outerGroup  → handles vertical position + axial tilt (Z)
  // spinGroup   → spins around its own local Y (which IS the tilted axis)
  const outerRef  = useRef();
  const spinRef   = useRef();
  const pointsRef = useRef();
  const setHeroOpacity = useIntroStore((s) => s.setHeroOpacity);

  const geometry = useMemo(() => createParticleGeometry(), []);
  const material = useMemo(() => createParticleMaterial(), []);

  useFrame(({ clock }, delta) => {
    const t     = clock.elapsedTime;
    const outer = outerRef.current;
    const spin  = spinRef.current;
    if (!outer || !spin) return;

    // ── Update shader time ──────────────────────
    material.uniforms.uTime.value = t;

    // ── Outer: position Y + tilt Z (no rotation.y here) ───
    if (t < TIMING.FORM_START) {
      outer.position.y = 0;
      outer.rotation.z = 0;
    } else if (t < TIMING.FORM_END) {
      const p  = (t - TIMING.FORM_START) / (TIMING.FORM_END - TIMING.FORM_START);
      const ep = p * p * (3 - 2 * p); // smoothstep
      outer.position.y = GLOBE_OFFSET_Y * ep;
      outer.rotation.z = -TILT_RAD * ep; // negative = right tilt from viewer
    } else {
      outer.position.y = GLOBE_OFFSET_Y;
      outer.rotation.z = -TILT_RAD;      // negative = right tilt from viewer
    }

    // ── Inner spin: rotates around local Y (= the tilted axis) ─
    if (t > TIMING.FORM_START) {
      spin.rotation.y += delta * GLOBE_ROTATION_SPEED;
    }

    // ── Hero overlay opacity ────────────────────
    const heroAlpha = getHeroOpacity(t);
    if (heroAlpha > 0) {
      setHeroOpacity(heroAlpha);
    }
  });

  return (
    <group ref={outerRef}>
      <group ref={spinRef}>
        <points
          ref={pointsRef}
          geometry={geometry}
          material={material}
          frustumCulled={false}
        />
      </group>
    </group>
  );
}
