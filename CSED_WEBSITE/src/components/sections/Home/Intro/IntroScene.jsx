import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";

import GlobeMesh from "../../scene/Particles/GlobeMesh";
import ParticleSystem from "../../scene/Particles/ParticleSystem";
import PostProcessing from "../../scene/Effects/PostProcessing";
import CameraRig from "../../scene/CameraRig";
import { useIntroStore } from "../../store/introStore";

export default function IntroScene({ children }) {
  const heroOpacity = useIntroStore((s) => s.heroOpacity);

  return (
    <div className="fixed inset-0">
      {/* Three.js canvas — full viewport background */}
      <Canvas
        camera={{
          position: [0, 0, 18],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        className="absolute inset-0"
      >
        <Suspense fallback={null}>
          <CameraRig />
          <GlobeMesh />
          <ParticleSystem />
          <PostProcessing />
        </Suspense>
      </Canvas>

      {/* HTML overlay — fades in driven by intro timeline */}
      <div
        className="absolute inset-0 z-10"
        style={{
          opacity: heroOpacity,
          transition: "opacity 0.3s ease-out",
          pointerEvents: heroOpacity > 0.1 ? "auto" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
