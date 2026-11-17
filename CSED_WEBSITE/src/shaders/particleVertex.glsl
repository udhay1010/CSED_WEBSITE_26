attribute float aSize;
attribute vec3 aColor;
attribute float aOcean;
uniform float uPixelRatio;
uniform float uScale;
uniform float uHalo;
uniform float uColorInvert;
varying vec3 vColor;
varying float vAlpha;
varying float vOcean;
varying float vFacing;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 normal = normalize(normalMatrix * normalize(position));
  float facing = dot(normal, normalize(-mv.xyz));
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPixelRatio * clamp(40.0 / -mv.z, 0.65, 1.8) * uScale;
  vAlpha = smoothstep(-0.005, 0.012, facing);
  vColor = aColor;
  vOcean = aOcean;
  vFacing = max(facing, 0.0);
  if (uHalo > 0.5) {
    float red = 1.0 - step(0.03, aColor.g);
    float white = step(0.2, aColor.g) * (1.0 - aOcean);
    float rim = exp(-vFacing * 14.0);
    vAlpha *= (rim * 0.55 + red * 0.5 + white * 0.12) * mix(1.0, 0.5, aOcean) * (1.0 - uColorInvert * 0.65);
    gl_PointSize *= mix(4.5, 6.5, red);
    if (vAlpha < 0.01) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; }
  }
}
