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
import { useIntroStore } from "../../store/introStore";

const TILT_RAD = (AXIAL_TILT * Math.PI) / 180;

const W_SEGMENTS = 18;
const H_SEGMENTS = 12;

const HOME_GLOBE_X  =  0;
const ABOUT_GLOBE_X = -14;
const ABOUT_GLOBE_Y = -2.5;
const HOME_SCALE    = 1.0;
const ABOUT_SCALE   = HOME_SCALE * 0.6;

function lerp(a, b, t) { return a + (b - a) * t; }

export default function GlobeMesh() {
  const outerRef = useRef();
  const spinRef  = useRef();

  const scrollProgress = useIntroStore((s) => s.scrollProgress);

  const geometry = useMemo(() => {
    const sphere = new THREE.SphereGeometry(GLOBE_RADIUS, W_SEGMENTS, H_SEGMENTS);
    return new THREE.WireframeGeometry(sphere);
  }, []);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color:       new THREE.Color(0xe63946),
        transparent: true,
        opacity:     0,
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

    // ── Y + tilt (mirrors ParticleSystem) ────────────────
    if (t < TIMING.FORM_START) {
      outer.position.y = 0;
      outer.rotation.z = 0;
    } else if (t < TIMING.FORM_END) {
      const p  = (t - TIMING.FORM_START) / (TIMING.FORM_END - TIMING.FORM_START);
      const ep = p * p * (3 - 2 * p);
      outer.position.y = GLOBE_OFFSET_Y * ep;
      outer.rotation.z = -TILT_RAD * ep;
    } else {
      // Y is handled by the scroll-driven lerp below if intro is done
      outer.rotation.z = -TILT_RAD;
    }

    // ── Position — scroll-driven (matches ParticleSystem exactly) ───────
    const sp = scrollProgress * scrollProgress * (3 - 2 * scrollProgress);
    
    // X: Move left
    outer.position.x = lerp(HOME_GLOBE_X, ABOUT_GLOBE_X, sp);
    
    // Y: Lerp bottom -> centered About placement
    if (t >= TIMING.FORM_END) {
      outer.position.y = lerp(GLOBE_OFFSET_Y, ABOUT_GLOBE_Y, sp);
    }

    // Match the particle globe's 60% settled About scale.
    outer.scale.setScalar(lerp(HOME_SCALE, ABOUT_SCALE, sp));

    // ── Continuous spin ───────────────────────────────────
    if (t > TIMING.FORM_START) {
      spin.rotation.y += delta * GLOBE_ROTATION_SPEED;
    }

    // ── Wireframe fade-in after formation ─────────────────
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
