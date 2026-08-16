varying vec3 vColor;
varying float vAlpha;

void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dist = length(uv);

    // Discard outside circle
    if (dist > 0.5) discard;

    // Gaussian core — hot bright center
    float core = exp(-dist * dist * 80.0);

    // Wider glow falloff
    float glow = exp(-dist * dist * 8.0);

    // Combined intensity
    float intensity = core * 0.7 + glow * 0.45;
    intensity *= vAlpha;

    // Final output — additive blending adds src.rgb * src.a to dest
    vec3 color = vColor * intensity;
    gl_FragColor = vec4(color, intensity);
}