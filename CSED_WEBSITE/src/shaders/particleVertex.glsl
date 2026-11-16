attribute float aSize;
attribute vec3 aColor;
uniform float uPixelRatio;
uniform float uScale;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 normal = normalize(normalMatrix * normalize(position));
  float facing = dot(normal, normalize(-mv.xyz));
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPixelRatio * clamp(40.0 / -mv.z, 0.65, 1.8) * uScale;
  vAlpha = smoothstep(-0.005, 0.035, facing) * (0.8 + 0.2 * pow(1.0 - max(facing, 0.0), 2.0));
  vColor = aColor;
}
