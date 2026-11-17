import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { latLonToVec3 } from '../../utils/globeUtils';

const LAND_ANCHORS = [
  // Northern land anchors keep several silhouette links visible in the cropped hero.
  [32.608, 13.717], [44.006, 3.037], [58.032, -4.043], [69.639, -23.868],
  [80.485, -58.422], [74.09, -123.727], [62.987, -150.143], [54.79, -163.586],
  [22.7, 77.5], [35, 105], [-12, -52], [-25, 134],
  [55, -95], [55, 90], [15, 20], [-10, -60],
];

const vertexShader = `
  attribute vec3 aAnchor;
  attribute float aStrength;
  uniform float uSize;
  uniform float uPixelRatio;
  varying float vAlpha;
  void main() {
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vec3 anchorView = (modelViewMatrix * vec4(aAnchor, 1.0)).xyz;
    vec3 normal = normalize(normalMatrix * aAnchor);
    float facing = dot(normal, normalize(-anchorView));
    vAlpha = smoothstep(-0.01, 0.06, facing) * aStrength;
    gl_Position = projectionMatrix * view;
    gl_PointSize = uSize * uPixelRatio * clamp(40.0 / -view.z, 0.7, 1.6);
  }`;
const fragmentShader = `
  uniform float uSize;
  uniform float uGlow;
  varying float vAlpha;
  void main() {
    float alpha = vAlpha;
    if (uSize > 0.0) {
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      alpha *= uGlow > 0.5 ? exp(-d * d * 18.0) * 0.22 : 1.0 - smoothstep(0.2, 0.5, d);
    }
    if (alpha < 0.005) discard;
    gl_FragColor = vec4(1.0, 0.055, 0.12, alpha);
  }`;

function batch() { return { position: [], anchor: [], strength: [] }; }
function append(target, point, anchor, strength) {
  target.position.push(...point.toArray());
  target.anchor.push(...anchor.toArray());
  target.strength.push(strength);
}
function ConnectionGeometry({ data }) {
  return <bufferGeometry>
    <bufferAttribute attach="attributes-position" args={[new Float32Array(data.position), 3]} />
    <bufferAttribute attach="attributes-aAnchor" args={[new Float32Array(data.anchor), 3]} />
    <bufferAttribute attach="attributes-aStrength" args={[new Float32Array(data.strength), 1]} />
  </bufferGeometry>;
}
function ConnectionMaterial({ size = 0, glow = false }) {
  return <shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthWrite={false}
    uniforms={{ uSize: { value: size }, uGlow: { value: glow ? 1 : 0 }, uPixelRatio: { value: 1 } }} />;
}

export default function GlobeConnections({ isLand, reducedMotion }) {
  const group = useRef(), pulse = useRef(), nodes = useRef(), glow = useRef();
  const shortViewport = useThree(state => state.size.height < 650);
  const scratch = useMemo(() => ({ anchor: new THREE.Vector3(), normal: new THREE.Vector3(), view: new THREE.Vector3() }), []);
  const { lines, cores, halos, routes } = useMemo(() => {
    const lines = batch(), cores = batch(), halos = batch(), routes = [];
    const lengthScale = shortViewport ? 0.4 : 1;
    LAND_ANCHORS.filter(([lat, lon]) => isLand(lat, lon)).slice(0, 12).forEach(([lat, lon], i) => {
      const base = latLonToVec3(lat, lon, 1);
      const tangent = new THREE.Vector3(-base.z, 0, base.x).normalize();
      const tip = base.clone().multiplyScalar(1 + (0.05 + i % 4 * 0.017) * lengthScale)
        .addScaledVector(tangent, (i % 3 - 1) * 0.015 * lengthScale);
      const strength = 0.42 + i % 4 * 0.06;
      append(lines, base, base, strength); append(lines, tip, base, strength);
      append(cores, base, base, 0.65); append(cores, tip, base, 0.8 + i % 3 * 0.08);
      if (i % 2 === 0) append(halos, tip, base, 1);
      if (i % 3 === 0) {
        const end = base.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.28);
        const points = [];
        for (let j = 0; j <= 32; j++) {
          const t = j / 32;
          points.push(base.clone().lerp(end, t).normalize().multiplyScalar(1.003 + Math.sin(t * Math.PI) * 0.025 * lengthScale));
        }
        for (let j = 1; j < points.length; j++) {
          append(lines, points[j - 1], base, 0.26); append(lines, points[j], base, 0.26);
        }
        routes.push({ points, anchor: base });
      }
    });
    return { lines, cores, halos, routes };
  }, [isLand, shortViewport]);

  useFrame(({ clock, camera, gl }) => {
    nodes.current.material.uniforms.uPixelRatio.value = gl.getPixelRatio();
    glow.current.material.uniforms.uPixelRatio.value = gl.getPixelRatio();
    if (!pulse.current || reducedMotion || routes.length === 0) return;
    const phase = clock.elapsedTime * 0.12;
    const route = routes[Math.floor(phase) % routes.length];
    const f = (phase % 1) * 32;
    pulse.current.position.copy(route.points[Math.floor(f)]).lerp(route.points[Math.min(32, Math.floor(f) + 1)], f % 1);
    group.current.updateWorldMatrix(true, false);
    scratch.anchor.copy(route.anchor).applyMatrix4(group.current.matrixWorld);
    scratch.normal.copy(route.anchor).transformDirection(group.current.matrixWorld);
    scratch.view.copy(camera.position).sub(scratch.anchor).normalize();
    const facing = scratch.normal.dot(scratch.view);
    pulse.current.visible = facing > -0.01;
    pulse.current.material.opacity = THREE.MathUtils.smoothstep(facing, -0.01, 0.06);
  });
  return <group ref={group}>
    <lineSegments><ConnectionGeometry data={lines} /><ConnectionMaterial /></lineSegments>
    <points ref={nodes}><ConnectionGeometry data={cores} /><ConnectionMaterial size={2.8} /></points>
    <points ref={glow}><ConnectionGeometry data={halos} /><ConnectionMaterial size={8} glow /></points>
    <mesh ref={pulse} visible={!reducedMotion}>
      <sphereGeometry args={[0.0035, 6, 6]} />
      <meshBasicMaterial color="#ff8b94" transparent depthWrite={false} />
    </mesh>
  </group>;
}
