varying vec3  vColor;
varying float vAlpha;

uniform float uColorInvert;

void main() {
    vec2  uv   = gl_PointCoord - vec2(0.5);
    float dist = length(uv);

    // Discard outside circle
    if (dist > 0.5) discard;

    // Gaussian core — bright tight center
    float core = exp(-dist * dist * 80.0);

    // Softer glow falloff
    float glow = exp(-dist * dist * 8.0);

    // Combined intensity
    float intensity = core * 0.7 + glow * 0.45;
    intensity *= vAlpha;

    // ── Scroll-driven colour inversion ──────────────────────────
    // White particles (vColor ≈ 0.96) lerp toward dark grey on scroll.
    // Red particles (vColor.r >> vColor.gb) are preserved as-is.
    float isWhite = step(0.9, vColor.r) * step(0.9, vColor.g) * step(0.9, vColor.b);

    // On white background: white particles → pitch black (#000000)
    // On dark background:  keep original colour
    vec3 finalColor = mix(vColor, vec3(0.0), uColorInvert * isWhite);

    // Flip alpha logic for light background so particles are properly
    // composited with NormalBlending
    float alpha = intensity;

    gl_FragColor = vec4(finalColor, alpha);
}