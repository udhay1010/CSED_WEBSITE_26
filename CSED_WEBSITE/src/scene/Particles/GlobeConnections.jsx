import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function GlobeConnections({ reducedMotion }) {
  const pulse = useRef();
  const { lines, tips, routes } = useMemo(() => {
    const vertices = [], endpoints = [], routes = [];
    for (let i = 0; i < 22; i++) {
      const lat = (-35 + (i * 31 % 108)) * Math.PI / 180;
      const lon = i * 137.508 * Math.PI / 180;
      const base = new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon));
      const tip = base.clone().multiplyScalar(1.035 + (i % 4) * 0.018);
      vertices.push(...base.toArray(), ...tip.toArray());
      endpoints.push(...tip.toArray());
      if (i % 3 === 0) {
        const end = base.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.28);
        const points = [];
        for (let j = 0; j <= 32; j++) {
          const t = j / 32;
          points.push(base.clone().lerp(end, t).normalize().multiplyScalar(1.003 + Math.sin(t * Math.PI) * 0.025));
        }
        for (let j = 1; j < points.length; j++) vertices.push(...points[j - 1].toArray(), ...points[j].toArray());
        routes.push(points);
      }
    }
    return { lines: new Float32Array(vertices), tips: new Float32Array(endpoints), routes };
  }, []);
  useFrame(({ clock }) => {
    if (!pulse.current || reducedMotion) return;
    const t = (clock.elapsedTime * 0.12) % 1;
    const points = routes[Math.floor(clock.elapsedTime * 0.12) % routes.length];
    const f = t * 32;
    pulse.current.position.copy(points[Math.floor(f)]).lerp(points[Math.min(32, Math.floor(f) + 1)], f % 1);
  });
  return (
    <group>
      <lineSegments>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[lines, 3]} /></bufferGeometry>
        <lineBasicMaterial color="#d71932" transparent opacity={0.38} depthWrite={false} />
      </lineSegments>
      <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[tips, 3]} /></bufferGeometry>
        <pointsMaterial color="#ff354c" size={0.005} sizeAttenuation transparent opacity={0.8} depthWrite={false} />
      </points>
      <mesh ref={pulse} visible={!reducedMotion}>
        <sphereGeometry args={[0.0035, 6, 6]} />
        <meshBasicMaterial color="#ff8b94" />
      </mesh>
    </group>
  );
}
