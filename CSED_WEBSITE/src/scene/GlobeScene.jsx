import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

import GlobeMesh      from "./Particles/GlobeMesh";
import ParticleSystem from "./Particles/ParticleSystem";
import PostProcessing from "./Effects/PostProcessing";
import CameraRig      from "./CameraRig";

/**
 * GlobeScene — the single, persistent Three.js canvas.
 *
 * ┌───────────────────────────────────────────────────────┐
 * │ position: fixed   inset: 0   z-index: 2               │
 * │ width: 100vw      height: 100vh                        │
 * │ alpha: true  ← transparent canvas background          │
 * │ pointerEvents: none                                    │
 * │                                                        │
 * │  Rendered objects:                                     │
 * │    CameraRig  — animated camera                        │
 * │    GlobeMesh  — red wireframe shell                    │
 * │    ParticleSystem — particles (intro + globe)          │
 * │    PostProcessing — bloom + vignette                   │
 * └───────────────────────────────────────────────────────┘
 *
 * The canvas is NEVER unmounted.  All scroll-driven globe
 * transforms are applied inside the Three.js scene via the
 * introStore.scrollProgress uniform — never via CSS transforms.
 *
 * The canvas background is transparent so:
 *   • On Home: the dark body background shows through → dark scene
 *   • On About: About's white bg-gradient shows through → light scene
 */
export default function GlobeScene() {
  return (
    <Canvas
      camera={{
        position: [0, 0, 18],
        fov:      50,
        near:     0.1,
        far:      200,
      }}
      gl={{
        antialias:       true,
        alpha:           true,
        powerPreference: "high-performance",
      }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%" }}
    >
      <Suspense fallback={null}>
        <CameraRig />
        <GlobeMesh />
        <ParticleSystem />
        <PostProcessing />
      </Suspense>
    </Canvas>
  );
}
