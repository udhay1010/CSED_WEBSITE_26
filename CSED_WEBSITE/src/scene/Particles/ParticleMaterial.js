import * as THREE from "three";
import vertexShader   from "../../shaders/particleVertex.glsl";
import fragmentShader from "../../shaders/particleFragment.glsl";
import { TIMING } from "./particleConfig";

/**
 * Particle ShaderMaterial.
 *
 * Uses NormalBlending (instead of AdditiveBlending) so particles are
 * visible on BOTH the dark Home background and the white About background.
 * The bloom post-process pass still creates the glowing halo effect.
 *
 * uColorInvert: 0 = white particles (dark bg), 1 = dark particles (white bg)
 */
export function createParticleMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite:  false,
    blending:    THREE.NormalBlending,

    uniforms: {
      uTime:        { value: 0 },
      uPixelRatio:  { value: Math.min(window.devicePixelRatio, 2) },
      uFormStart:   { value: TIMING.FORM_START },
      uFormEnd:     { value: TIMING.FORM_END },
      uColorInvert: { value: 0 }, // 0 = white-on-dark  |  1 = dark-on-white
    },
  });
}