import * as THREE from "three";
import vertexShader from "../../shaders/particleVertex.glsl";
import fragmentShader from "../../shaders/particleFragment.glsl";
import { TIMING } from "./particleConfig";

/**
 * Create the ShaderMaterial for the particle system.
 * Additive blending, no depth write, transparent.
 */
export function createParticleMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,

    uniforms: {
      uTime:       { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uFormStart:  { value: TIMING.FORM_START },
      uFormEnd:    { value: TIMING.FORM_END },
    },
  });
}