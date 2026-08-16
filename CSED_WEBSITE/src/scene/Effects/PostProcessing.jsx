import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

/**
 * Post-processing stack — bloom + vignette.
 *
 * Bloom makes the red particles glow hot and creates the atmospheric
 * red haze visible in the reference image.
 * Vignette darkens edges to focus attention on the globe.
 */
export default function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        intensity={1.5}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
        radius={0.85}
      />
      <Vignette eskil={false} offset={0.1} darkness={0.8} />
    </EffectComposer>
  );
}
