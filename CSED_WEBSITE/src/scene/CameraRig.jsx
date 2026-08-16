import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { TIMING } from "./Particles/particleConfig";

const targetPos = new THREE.Vector3();
const targetLookAt = new THREE.Vector3();
const currentLookAt = new THREE.Vector3(0, 0, 0);

/**
 * Animated camera rig.
 *
 * Phases:
 *   SPAWN / SCATTER  → camera at (0, 0, 18), subtle drift
 *   FORMATION        → dolly to (0, 1.5, 14), look down at globe
 *   SETTLED          → gentle breathing sway
 */
export default function CameraRig() {
  const lookAtRef = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime;

    if (t < TIMING.FORM_START) {
      // ── Spawn & scatter ──
      targetPos.set(0, 0, 18 + Math.sin(t * 0.3) * 0.3);
      targetLookAt.set(0, 0, 0);
    } else if (t < TIMING.FORM_END) {
      // ── Formation — dolly toward globe ──
      const p = (t - TIMING.FORM_START) / (TIMING.FORM_END - TIMING.FORM_START);
      const ep = p * p * (3 - 2 * p);

      targetPos.set(
        0,
        ep * 2.5,
        18 - ep * 4, // 18 → 14
      );
      targetLookAt.set(0, -ep * 7.0, 0);
    } else {
      // ── Settled — gentle sway ──
      targetPos.set(
        Math.sin(t * 0.15) * 0.2,
        2.5 + Math.sin(t * 0.1) * 0.12,
        14,
      );
      targetLookAt.set(0, -7.0, 0);
    }

    // Smooth interpolation
    camera.position.lerp(targetPos, 0.03);

    const la = lookAtRef.current;
    la.lerp(targetLookAt, 0.03);
    camera.lookAt(la);
  });

  return null;
}
