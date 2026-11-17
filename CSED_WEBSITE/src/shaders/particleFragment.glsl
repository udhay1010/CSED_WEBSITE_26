varying vec3 vColor;
varying float vAlpha;
varying float vOcean;
varying float vFacing;
uniform float uColorInvert;
uniform float uHalo;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5 || vAlpha < 0.01) discard;
  if (uHalo > 0.5) {
    float white = step(0.2, vColor.g) * (1.0 - vOcean);
    vec3 glow = mix(vec3(1.0, 0.045, 0.1), vec3(1.0, 0.6, 0.65), white);
    gl_FragColor = vec4(glow, exp(-d * d * 20.0) * vAlpha * 0.6);
    return;
  }
  float alpha = (1.0 - smoothstep(0.18, 0.5, d)) * vAlpha;
  float white = step(0.2, vColor.g) * (1.0 - vOcean);
  vec3 color = mix(vColor, vec3(0.022), white * uColorInvert);
  if (vOcean > 0.5) {
    float red = 1.0 - step(0.03, vColor.g);
    color = mix(vColor, vec3(0.022), (1.0 - red) * uColorInvert);
    // Water stays sparse and neutral, with a near-side gradient rather than bright filler.
    alpha *= mix(0.4 + 0.2 * vFacing, 0.7, red);
  } else {
    // The luminous edge comes from the geographic surface, not an opaque outline.
    float horizon = pow(1.0 - vFacing, 18.0) * (1.0 - uColorInvert);
    vec3 edgeColor = mix(vec3(1.0, 0.18, 0.25), vec3(1.0, 0.8, 0.82), white);
    color = mix(color, edgeColor, horizon * 0.4);
    alpha = min(1.0, alpha * (1.0 + horizon * 0.8));
  }
  gl_FragColor = vec4(color, alpha);
}
