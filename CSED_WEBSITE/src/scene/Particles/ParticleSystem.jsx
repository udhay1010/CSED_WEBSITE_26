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
  HOME_GLOBE_X,
  ABOUT_GLOBE_X,
  ABOUT_GLOBE_Y,
  HOME_SCALE,
  ABOUT_SCALE,
} from "./particleConfig";
import { useIntroStore } from "../../store/introStore";

const TILT_RAD = (AXIAL_TILT * Math.PI) / 180;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export default function ParticleSystem() {
  const outerRef = useRef();
  const spinRef = useRef();
  const pointsRef = useRef();

  const setHeroOpacity = useIntroStore((s) => s.setHeroOpacity);
  const scrollProgress = useIntroStore((s) => s.scrollProgress);
  const setIntroComplete = useIntroStore((s) => s.setIntroComplete);

  const geometry = useMemo(() => createParticleGeometry(), []);
  const material = useMemo(() => createParticleMaterial(), []);

  let introMarked = false;

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const outer = outerRef.current;
    const spin = spinRef.current;
    if (!outer || !spin) return;

    // ── Shader time ────────────────────────────────────────
    material.uniforms.uTime.value = t;
    material.uniforms.uColorInvert.value = scrollProgress;

    // ── Y position + axial tilt (intro animation) ──────────
    if (t < TIMING.FORM_START) {
      outer.position.y = 0;
      outer.rotation.z = 0;
    } else if (t < TIMING.FORM_END) {
      const p = (t - TIMING.FORM_START) / (TIMING.FORM_END - TIMING.FORM_START);
      const ep = p * p * (3 - 2 * p);
      outer.position.y = GLOBE_OFFSET_Y * ep;
      outer.rotation.z = -TILT_RAD * ep;
    } else {
      outer.position.y = GLOBE_OFFSET_Y;
      outer.rotation.z = -TILT_RAD;

      // Mark intro complete once the globe has settled
      if (!introMarked) {
        introMarked = true;
        setIntroComplete();
      }
    }

    // ── Position — scroll-driven (Home → About) ─────────────────────────
    // Smoothstep the progress for a snappier feel
    const sp = scrollProgress * scrollProgress * (3 - 2 * scrollProgress);

    // X: Move left
    outer.position.x = lerp(HOME_GLOBE_X, ABOUT_GLOBE_X, sp);

    // Y: If intro is fully done, lerp from bottom to the centered About placement.
    // (During intro (t < TIMING.FORM_END), it's handled above).
    if (t >= TIMING.FORM_END) {
      outer.position.y = lerp(GLOBE_OFFSET_Y, ABOUT_GLOBE_Y, sp);
    }

    // Reduce only the settled About globe to 60% of its Home size.
    outer.scale.setScalar(lerp(HOME_SCALE, ABOUT_SCALE, sp));

    // ── Continuous spin (never reset) ──────────────────────
    if (t > TIMING.FORM_START) {
      spin.rotation.y += delta * GLOBE_ROTATION_SPEED;
    }

    // ── Hero overlay opacity ────────────────────────────────
    const heroAlpha = getHeroOpacity(t);
    setHeroOpacity(heroAlpha);
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
