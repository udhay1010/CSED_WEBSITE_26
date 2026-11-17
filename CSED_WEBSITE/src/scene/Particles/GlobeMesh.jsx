import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide } from 'three';
import { AXIAL_TILT, GLOBE_ROTATION_SPEED, getGlobePose } from './particleConfig';
import { useIntroStore } from '../../store/introStore';
import ParticleSystem from './ParticleSystem';
import GlobeConnections from './GlobeConnections';

const atmosphereVertex = `
  varying vec3 vViewPosition;
  varying vec3 vCenter;
  varying float vRadius;
  void main() {
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = view.xyz;
    vCenter = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vRadius = length(modelViewMatrix[0].xyz);
    gl_Position = projectionMatrix * view;
  }`;
const atmosphereFragment = `
  varying vec3 vViewPosition;
  varying vec3 vCenter;
  varying float vRadius;
  void main() {
    float impact = length(cross(normalize(vViewPosition), vCenter));
    float altitude = max(0.0, impact / vRadius - 1.0);
    float edge = exp(-pow(altitude / 0.003, 1.4)) * 0.0672;
    float haze = exp(-pow(altitude / 0.016, 1.2)) * 0.168;
    gl_FragColor = vec4(1.0, 0.055, 0.1, edge + haze);
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
        {/* Centre 90°E after accounting for the existing axial tilt and hero camera angle. */}
        <group ref={spin} rotation={[0.22, -3.34, 0]}>
          <ParticleSystem isLand={isLand} compact={compact} />
          <GlobeConnections isLand={isLand} reducedMotion={reducedMotion} />
        </group>
      </group>
      <mesh>
        <sphereGeometry args={[1.025, 192, 128]} />
        <shaderMaterial vertexShader={atmosphereVertex} fragmentShader={atmosphereFragment} transparent depthWrite={false} side={BackSide} />
      </mesh>
    </group>
  );
}
