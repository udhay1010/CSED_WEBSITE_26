import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { createParticleGeometry } from './ParticleGeometry';
import { createParticleMaterial } from './ParticleMaterial';
import { PARTICLE_COUNT } from './particleConfig';
import { useIntroStore } from '../../store/introStore';

export default function ParticleSystem({ isLand, compact }) {
  const geometry = useMemo(() => createParticleGeometry(isLand, compact ? 48000 : PARTICLE_COUNT), [isLand, compact]);
  const material = useMemo(() => createParticleMaterial(), []);
  const points = useRef();
  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);
  useFrame(({ gl }) => {
    const progress = useIntroStore.getState().scrollProgress;
    points.current.material.uniforms.uPixelRatio.value = gl.getPixelRatio();
    points.current.material.uniforms.uColorInvert.value = progress;
    points.current.material.uniforms.uScale.value = 1 - progress * 0.2;
  });
  return <points ref={points} geometry={geometry} material={material} />;
}
