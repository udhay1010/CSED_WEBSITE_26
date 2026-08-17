#include "common.glsl"

// ── Per-particle attributes ────────────────────────
attribute float aSize;
attribute float aRandom;
attribute float aActivation;
attribute vec3  aSpawnPosition;
attribute vec3  aTargetPosition;
attribute vec3  aColor;

// ── Uniforms ───────────────────────────────────────
uniform float uTime;
uniform float uPixelRatio;
uniform float uFormStart;
uniform float uFormEnd;

// ── Varyings → fragment shader ─────────────────────
varying vec3  vColor;
varying float vAlpha;

void main() {
    float life = uTime - aActivation;

    // ── Not yet activated → invisible ──────────────
    if (life < 0.0) {
        gl_Position  = vec4(9999.0, 9999.0, 9999.0, 1.0);
        gl_PointSize = 0.0;
        vColor = vec3(0.0);
        vAlpha = 0.0;
        return;
    }

    // ── Grow-in (quick pop) ────────────────────────
    float growT = smoothstep(0.0, 0.2, life);

    // ── Scatter position ───────────────────────────
    // How long this particle lived before formation started
    // → intro particles get large scatter, globe particles ≈ 0
    float preFormLife = max(uFormStart - aActivation, 0.0);
    float scatterScale = clamp(preFormLife / 2.0, 0.0, 1.0) * 6.0;

    // Random direction from seed (uniform sphere)
    float theta = aRandom * 6.2831853;
    float phi   = acos(2.0 * fract(aRandom * 7.31) - 1.0);
    vec3 scatterDir = vec3(
        sin(phi) * cos(theta),
        sin(phi) * sin(theta),
        cos(phi)
    );

    // Expansion over lifetime — ease-out
    float expandT = clamp(life / 2.0, 0.0, 1.0);
    expandT = expandT * (2.0 - expandT);

    // Swirl rotation
    float swirlAngle = life * (0.3 + aRandom * 0.5);
    float cs = cos(swirlAngle);
    float sn = sin(swirlAngle);
    vec3 expanded = scatterDir * scatterScale * expandT;
    expanded.xz = vec2(
        expanded.x * cs - expanded.z * sn,
        expanded.x * sn + expanded.z * cs
    );

    // Noise-driven organic drift
    float nt = uTime * 0.25;
    vec3 noiseOff = vec3(
        snoise(vec3(aRandom * 12.9 + 1.0, nt, 0.0)),
        snoise(vec3(aRandom * 78.2 + 2.0, nt, 5.0)),
        snoise(vec3(aRandom * 45.1 + 3.0, nt, 10.0))
    ) * expandT * 1.2;

    vec3 scatterPos = aSpawnPosition + expanded + noiseOff;

    // ── Morph to globe target ──────────────────────
    float morphStart    = max(aActivation + 0.25, uFormStart);
    float morphDuration = max(uFormEnd - morphStart, 0.8);
    float morphT        = clamp((uTime - morphStart) / morphDuration, 0.0, 1.0);
    // Smooth ease-in-out
    morphT = morphT * morphT * (3.0 - 2.0 * morphT);

    vec3 pos = mix(scatterPos, aTargetPosition, morphT);

    // ── Post-formation breathing ───────────────────
    if (morphT > 0.98) {
        float breathe = sin(uTime * 1.5 + aRandom * 6.2831) * 0.025;
        vec3 normal = normalize(aTargetPosition);
        pos += normal * breathe;
    }

    // ── Transform ──────────────────────────────────
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // ── Back-face soft-cull ────────────────────────
    // Once a particle has settled on the globe surface we compare its
    // outward normal (aTargetPosition direction, in world space) to the
    // vector from the particle to the camera.  Particles on the far
    // hemisphere face away from the camera and are faded out, so red
    // ocean dots and black/white land dots never overlap on-screen.
    float backFade = 1.0;
    if (morphT > 0.01) {
        vec3 worldNormal = normalize(
            (modelMatrix * vec4(normalize(aTargetPosition), 0.0)).xyz
        );
        vec3 worldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
        vec3 toCam    = normalize(cameraPosition - worldPos);
        float facing  = dot(worldNormal, toCam);
        // Soft edge: fully visible at facing > 0.15, fully gone at facing < 0
        backFade = smoothstep(0.0, 0.15, facing) * morphT
                 + (1.0 - morphT); // let intro/scatter particles pass freely
    }

    // ── Point size with perspective attenuation ────
    float baseSize = aSize * uPixelRatio;
    gl_PointSize = baseSize * (50.0 / -mvPosition.z) * growT * backFade;
    gl_PointSize = max(gl_PointSize * backFade, 0.0);

    // ── Output to fragment ─────────────────────────
    vColor = aColor;
    vAlpha = growT * backFade;
}