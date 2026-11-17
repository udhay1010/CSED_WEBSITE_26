import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { createParticleGeometry } from './ParticleGeometry';
import { createParticleMaterial } from './ParticleMaterial';
import { PARTICLE_COUNT } from './particleConfig';
import { useIntroStore } from '../../store/introStore';

export default function ParticleSystem({ isLand, compact }) {
  const geometry = useMemo(() => createParticleGeometry(isLand, compact ? 48000 : PARTICLE_COUNT), [isLand, compact]);
  const material = useMemo(() => createParticleMaterial(), []);
  const haloMaterial = useMemo(() => createParticleMaterial(true), []);
  const points = useRef();
  const halo = useRef();
  useEffect(() => () => { geometry.dispose(); material.dispose(); haloMaterial.dispose(); }, [geometry, material, haloMaterial]);
  useFrame(({ gl }) => {
    const progress = useIntroStore.getState().scrollProgress;
    for (const mesh of [points.current, halo.current]) {
      mesh.material.uniforms.uPixelRatio.value = gl.getPixelRatio();
      mesh.material.uniforms.uColorInvert.value = progress;
      mesh.material.uniforms.uScale.value = 1 - progress * 0.2;
    }
  });
  return <>
    <points ref={halo} geometry={geometry} material={haloMaterial} />
    <points ref={points} geometry={geometry} material={material} />
  </>;
}
