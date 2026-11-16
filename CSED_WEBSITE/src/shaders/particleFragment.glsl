varying vec3 vColor;
varying float vAlpha;
uniform float uColorInvert;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5 || vAlpha < 0.01) discard;
  float alpha = (1.0 - smoothstep(0.18, 0.5, d)) * vAlpha;
  float white = step(0.2, vColor.g);
  vec3 color = mix(vColor, vec3(0.08), white * uColorInvert);
  gl_FragColor = vec4(color, alpha);
}
