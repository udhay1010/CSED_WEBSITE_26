import * as THREE from 'three';
import vertexShader from '../../shaders/particleVertex.glsl';
import fragmentShader from '../../shaders/particleFragment.glsl';

export function createParticleMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader, fragmentShader, transparent: true, depthWrite: false,
    uniforms: { uPixelRatio: { value: 1 }, uColorInvert: { value: 0 }, uScale: { value: 1 } },
  });
}
