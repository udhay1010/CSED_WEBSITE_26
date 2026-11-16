import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AXIAL_TILT, GLOBE_ROTATION_SPEED, getGlobePose } from './particleConfig';
import { useIntroStore } from '../../store/introStore';
import ParticleSystem from './ParticleSystem';
import GlobeConnections from './GlobeConnections';

const atmosphereVertex = `
  varying vec3 vNormal; varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal); vView = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }`;
const atmosphereFragment = `
  varying vec3 vNormal; varying vec3 vView;
  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(vView)));
    float rim = pow(1.0 - facing, 12.0);
    float edge = pow(1.0 - facing, 70.0);
    gl_FragColor = vec4(1.0, 0.055, 0.12, rim * 0.35 + edge * 0.65);
  }`;
const glowFragment = `
  varying vec3 vNormal; varying vec3 vView;
  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(vView)));
    float glow = smoothstep(0.0, 0.1, facing) * exp(-facing * 8.0);
    gl_FragColor = vec4(0.8, 0.015, 0.045, glow * 0.18);
  }`;

export default function GlobeMesh({ isLand, compact, reducedMotion }) {
  const outer = useRef(), spin = useRef();
  useFrame(({ size }, delta) => {
    const p = useIntroStore.getState().scrollProgress;
    const pose = getGlobePose(size.width, size.height, p);
    outer.current.position.set(pose.x, pose.y, 0);
    outer.current.scale.setScalar(pose.radius);
    if (!reducedMotion) spin.current.rotation.y += Math.min(delta, 0.05) * GLOBE_ROTATION_SPEED;
  }, -1);
  return (
    <group ref={outer}>
      <mesh>
        <sphereGeometry args={[0.998, 192, 128]} />
        {/* Depth-only core hides far-side links without painting over the page. */}
        <meshBasicMaterial colorWrite={false} />
      </mesh>
      <group rotation={[0, 0, -AXIAL_TILT * Math.PI / 180]}>
        <group ref={spin} rotation={[0.22, -1.15, 0]}>
          <ParticleSystem isLand={isLand} compact={compact} />
          <GlobeConnections reducedMotion={reducedMotion} />
        </group>
      </group>
      <mesh scale={1.009}>
        <sphereGeometry args={[1, 192, 128]} />
        <shaderMaterial vertexShader={atmosphereVertex} fragmentShader={atmosphereFragment} transparent depthWrite={false} side={THREE.BackSide} />
      </mesh>
      <mesh scale={1.035}>
        <sphereGeometry args={[1, 128, 96]} />
        <shaderMaterial vertexShader={atmosphereVertex} fragmentShader={glowFragment} transparent depthWrite={false} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
