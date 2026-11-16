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

  useFrame(({ clock, size }, delta) => {
    const t = clock.elapsedTime;
    const outer = outerRef.current;
    const spin = spinRef.current;
    if (!outer || !spin) return;

    // ── Shader time ────────────────────────────────────────
    material.uniforms.uTime.value = t;
    material.uniforms.uColorInvert.value = scrollProgress;

    // ── Responsive Scales & Positions ────────────────────────────────
    // Map viewport width from 480px (mobile) to 1024px (desktop)
    const tWidth = Math.max(0, Math.min(1, (size.width - 480) / (1024 - 480)));
    const easeW = tWidth * tWidth * (3 - 2 * tWidth);

    const targetHomeScale = lerp(HOME_SCALE * 0.30, HOME_SCALE, easeW);
    const targetAboutScale = lerp(ABOUT_SCALE * 0.55, ABOUT_SCALE, easeW);
    const targetAboutX = lerp(0, ABOUT_GLOBE_X, easeW);
    const targetHomeY = lerp(GLOBE_OFFSET_Y + 16.0, GLOBE_OFFSET_Y, easeW);
    const targetAboutY = lerp(ABOUT_GLOBE_Y - 4.0, ABOUT_GLOBE_Y, easeW);

    // ── Y position + axial tilt (intro animation) ──────────
    if (t < TIMING.FORM_START) {
      outer.position.y = 0;
      outer.rotation.z = 0;
    } else if (t < TIMING.FORM_END) {
      const p = (t - TIMING.FORM_START) / (TIMING.FORM_END - TIMING.FORM_START);
      const ep = p * p * (3 - 2 * p);
      outer.position.y = targetHomeY * ep;
      outer.rotation.z = -TILT_RAD * ep;
    } else {
      // Y is handled below after formation
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

    // X: Move left (or stay centered on mobile)
    outer.position.x = lerp(HOME_GLOBE_X, targetAboutX, sp);

    // Y: If intro is fully done, lerp from bottom to the centered About placement.
    if (t >= TIMING.FORM_END) {
      outer.position.y = lerp(targetHomeY, targetAboutY, sp);
    }

    // Reduce to the settled About scale.
    outer.scale.setScalar(lerp(targetHomeScale, targetAboutScale, sp));

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
