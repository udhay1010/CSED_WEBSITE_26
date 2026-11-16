import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
  GLOBE_RADIUS,
  GLOBE_OFFSET_Y,
  AXIAL_TILT,
  GLOBE_ROTATION_SPEED,
  TIMING,
  HOME_GLOBE_X,
  ABOUT_GLOBE_X,
  ABOUT_GLOBE_Y,
  HOME_SCALE,
  ABOUT_SCALE,
} from "./particleConfig";
import { useIntroStore } from "../../store/introStore";

const TILT_RAD = (AXIAL_TILT * Math.PI) / 180;

const W_SEGMENTS = 18;
const H_SEGMENTS = 12;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export default function GlobeMesh() {
  const outerRef = useRef();
  const spinRef = useRef();

  const scrollProgress = useIntroStore((s) => s.scrollProgress);

  const geometry = useMemo(() => {
    const sphere = new THREE.SphereGeometry(
      GLOBE_RADIUS,
      W_SEGMENTS,
      H_SEGMENTS,
    );
    return new THREE.WireframeGeometry(sphere);
  }, []);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color:       new THREE.Color(0xff0000), // pure red to match particles
        transparent: true,
        opacity:     0,
        depthWrite:  false,
        linewidth:   1,
      }),
    [],
  );

  useFrame(({ clock, size }, delta) => {
    const t = clock.elapsedTime;
    const outer = outerRef.current;
    const spin = spinRef.current;
    if (!outer || !spin) return;

    // ── Responsive Scales & Positions (matches ParticleSystem) ─────────
    // Map viewport width from 480px (mobile) to 1024px (desktop)
    const tWidth = Math.max(0, Math.min(1, (size.width - 480) / (1024 - 480)));
    const easeW = tWidth * tWidth * (3 - 2 * tWidth);

    const targetHomeScale = lerp(HOME_SCALE * 0.30, HOME_SCALE, easeW);
    const targetAboutScale = lerp(ABOUT_SCALE * 0.55, ABOUT_SCALE, easeW);
    const targetAboutX = lerp(0, ABOUT_GLOBE_X, easeW);
    const targetHomeY = lerp(GLOBE_OFFSET_Y + 16.0, GLOBE_OFFSET_Y, easeW);
    const targetAboutY = lerp(ABOUT_GLOBE_Y - 4.0, ABOUT_GLOBE_Y, easeW);

    // ── Y + tilt ───────────────────────────────────────────────────────
    if (t < TIMING.FORM_START) {
      outer.position.y = 0;
      outer.rotation.z = 0;
    } else if (t < TIMING.FORM_END) {
      const p = (t - TIMING.FORM_START) / (TIMING.FORM_END - TIMING.FORM_START);
      const ep = p * p * (3 - 2 * p);
      outer.position.y = targetHomeY * ep;
      outer.rotation.z = -TILT_RAD * ep;
    } else {
      // Y is handled by the scroll-driven lerp below if intro is done
      outer.rotation.z = -TILT_RAD;
    }

    // ── Position — scroll-driven (matches ParticleSystem exactly) ───────
    const sp = scrollProgress * scrollProgress * (3 - 2 * scrollProgress);

    // X: Move left (or stay centered on mobile)
    outer.position.x = lerp(HOME_GLOBE_X, targetAboutX, sp);

    // Y: Lerp bottom -> centered About placement
    if (t >= TIMING.FORM_END) {
      outer.position.y = lerp(targetHomeY, targetAboutY, sp);
    }

    // Match the particle globe's settled About scale.
    outer.scale.setScalar(lerp(targetHomeScale, targetAboutScale, sp));

    // ── Continuous spin ───────────────────────────────────
    if (t > TIMING.FORM_START) {
      spin.rotation.y += delta * GLOBE_ROTATION_SPEED;
    }

    // ── Wireframe fade-in after formation ─────────────────
    if (t > TIMING.FORM_END) {
      const raw = Math.min((t - TIMING.FORM_END) / 2.2, 1.0);
      const opacity = raw * raw * (3 - 2 * raw);
      material.opacity = opacity * 0.18;
    }
  });

  return (
    <group ref={outerRef}>
      <group ref={spinRef}>
        <lineSegments
          geometry={geometry}
          material={material}
          frustumCulled={false}
        />
      </group>
    </group>
  );
}
