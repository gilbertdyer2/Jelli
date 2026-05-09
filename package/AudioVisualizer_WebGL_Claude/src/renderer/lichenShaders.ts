import { GLSL_ORGANIC_NOISE, GLSL_GLASS_IRID } from '@renderer/shaderUtils';

// ─── Monolith vertex shader ──────────────────────────────────────────────────
export const MONOLITH_VERT = `#version 300 es
precision highp float;

layout(location=0) in vec3 a_pos;
layout(location=1) in vec3 a_normal;
layout(location=2) in vec2 a_uv;
layout(location=3) in float a_faceId;  // kept for compat, unused

uniform mat4  u_MVP;
uniform mat4  u_modelMatrix;
uniform float u_time;
uniform int   u_rippleCount;
uniform vec4  u_rippleParams[4];  // xyz = model-space epicenter, w = amplitude
uniform float u_rippleAges[4];    // age in seconds for each ripple
uniform float u_idleBreath;
uniform float u_organicStr;       // 0..2, organic noise multiplier
uniform float u_compress;         // jellyfish compress state (0=normal, >0=squished)

out vec3  v_worldPos;
out vec3  v_normal;
out vec2  v_uv;
out float v_rippleIntensity;
out float v_organicT;

${GLSL_ORGANIC_NOISE}

void main() {
  vec3  pos        = a_pos;
  float rippleDisp = 0.0;

  // 3-D ripples propagate around all faces via model-space distance
  for (int i = 0; i < 4; i++) {
    if (i >= u_rippleCount) break;
    vec3  epic = u_rippleParams[i].xyz;
    float amp  = u_rippleParams[i].w;
    float age  = u_rippleAges[i];
    float dist = distance(pos, epic);
    rippleDisp += amp * sin(dist * 22.0 - age * 9.0) * exp(-dist * 3.0);
  }

  // Idle breath on all faces
  rippleDisp += u_idleBreath * 0.006 * sin(a_uv.y * 3.14159 + u_time * 0.0008);

  // Organic noise — low-freq undulation that makes the shape feel alive
  float organic   = organicNoise(pos, u_time) * u_organicStr * 0.018;
  float dispTotal = rippleDisp + organic;

  // Jellyfish compress: squish Z inward, expand XY outward (u_compress=0 = no-op)
  float compXY = 1.0 + u_compress * 0.3;
  float compZ  = 1.0 - u_compress * 0.6;
  pos = vec3(pos.x * compXY, pos.y * compXY, pos.z * compZ);

  // Displace radially from center using the (possibly compressed) pos direction
  pos += normalize(pos) * dispTotal;

  // Pass organic phase to fragment shader for iridescence sync
  v_organicT        = clamp(organicNoise(a_pos, u_time) * 0.5 + 0.5, 0.0, 1.0);
  v_rippleIntensity = abs(rippleDisp) * 10.0;
  v_worldPos        = (u_modelMatrix * vec4(pos, 1.0)).xyz;
  v_normal          = normalize((u_modelMatrix * vec4(a_normal, 0.0)).xyz);
  v_uv              = a_uv;
  gl_Position       = u_MVP * vec4(pos, 1.0);
}
`;

// ─── Monolith fragment shader ─────────────────────────────────────────────────
// u_opacityMult: set to 1.0 for back/sides pass, reduced for front-face sheen pass.
export const MONOLITH_FRAG = `#version 300 es
precision highp float;

in vec3  v_worldPos;
in vec3  v_normal;
in vec2  v_uv;
in float v_rippleIntensity;
in float v_organicT;           // organic phase from vertex shader

uniform vec3  u_cameraPos;
uniform float u_time;
uniform float u_lichenGlow;
uniform float u_opacityMult;   // 1.0 = full, <1 = front-face sheen
uniform float u_fresnelStr;    // fresnel exponent multiplier
uniform float u_specStr;       // specular intensity multiplier
uniform float u_iridStr;       // iridescence blend strength
uniform vec3  u_glassTint;     // edge/highlight color
uniform vec3  u_lightDir;      // key light direction

uniform int   u_caEnabled;
uniform float u_caIntensity;
uniform float u_caFreq;
uniform vec3  u_caCol1;
uniform vec3  u_caCol2;

out vec4 fragColor;

void main() {
  vec3 N = normalize(v_normal);
  vec3 V = normalize(u_cameraPos - v_worldPos);

  float NdotV     = max(0.0, dot(N, V));
  float rawFresnel = pow(1.0 - NdotV, 4.5);
  float fresnel    = clamp(rawFresnel * u_fresnelStr, 0.0, 1.0);

  vec3  L    = normalize(u_lightDir);
  vec3  H    = normalize(L + V);
  float spec = pow(max(0.0, dot(N, H)), 96.0) * 0.9 * u_specStr;

  // Interior dark core, edges pick up tint
  vec3 glassColor = mix(vec3(0.02, 0.05, 0.12), u_glassTint, fresnel);

  // Iridescence synced to the organic phase so it pulses with deformation
  float iridT = 0.5 + 0.5 * sin(v_organicT * 6.28318 + u_time * 0.0003);
  vec3  irid  = mix(vec3(0.1, 0.8, 0.9), vec3(0.6, 0.2, 1.0), iridT);
  glassColor  = mix(glassColor, irid, u_iridStr * (fresnel + 0.15));

  glassColor += vec3(spec);
  glassColor += u_glassTint * v_rippleIntensity * 0.35;
  glassColor += vec3(0.05, 0.18, 0.08) * u_lichenGlow * 0.18;

  // Chromatic aberration — tangential Fresnel split creates colored edge fringing
  if (u_caEnabled == 1) {
    float pulse  = 0.5 + 0.5 * sin(v_organicT * u_caFreq * 6.28318 + u_time * 0.0007);
    float caAmp  = u_caIntensity * pulse * 0.06;
    vec3  tang   = normalize(cross(N, V) + vec3(1e-5, 0.0, 0.0));
    vec3  V1     = normalize(V + tang * caAmp);
    vec3  V2     = normalize(V - tang * caAmp);
    float f1     = clamp(pow(1.0 - max(0.0, dot(N, V1)), 4.5) * u_fresnelStr, 0.0, 1.0);
    float f2     = clamp(pow(1.0 - max(0.0, dot(N, V2)), 4.5) * u_fresnelStr, 0.0, 1.0);
    glassColor  += u_caCol1 * f1 * caAmp * 10.0;
    glassColor  += u_caCol2 * f2 * caAmp * 10.0;
  }

  float alpha = (mix(0.15, 0.85, fresnel) + spec * 0.5 + v_rippleIntensity * 0.12) * u_opacityMult;
  fragColor = vec4(glassColor, clamp(alpha, 0.0, 0.95));
}
`;

// ─── Wireframe fragment shader ────────────────────────────────────────────────
// Pairs with MONOLITH_VERT. Uses face-local UVs + screen-space derivatives
// to draw a pixel-consistent edge at each face boundary (u=0/1, v=0/1).
export const WIRE_FRAG = `#version 300 es
precision highp float;

in vec2 v_uv;

uniform vec4  u_wireColor;  // rgba
uniform float u_wireWidth;  // pixels

out vec4 fragColor;

void main() {
  vec2  e  = min(v_uv, 1.0 - v_uv);
  float uw = length(vec2(dFdx(v_uv.x), dFdy(v_uv.x)));
  float vw = length(vec2(dFdx(v_uv.y), dFdy(v_uv.y)));
  float d  = min(e.x / max(uw, 1e-4), e.y / max(vw, 1e-4));
  float w  = 1.0 - smoothstep(0.0, u_wireWidth, d);
  if (w < 0.01) discard;
  fragColor = u_wireColor * w;
}
`;

// ─── Foliage vertex shader ────────────────────────────────────────────────────
// Positions instanced quads on any of the 6 cube faces using a tangent-basis
// derived from the face index in instC.z.
// The same ripple + organic-noise displacement used by MONOLITH_VERT is applied
// to the node centre so foliage moves with the cube surface.
// instA: u, v, size, health    (u,v in [0,1] on the face)
// instB: colorT, seed, type, growthT
// instC: growthDir, emissive, face (0-5), _
export const LICHEN_VERT = `#version 300 es
precision highp float;

layout(location=0) in vec2 a_quadUV;
layout(location=1) in vec4 a_instA;  // u, v, size, health
layout(location=2) in vec4 a_instB;  // colorT, seed, type, growthT
layout(location=3) in vec4 a_instC;  // growthDir, emissive, face, _

uniform mat4  u_MVP;
uniform float u_halfW;
uniform float u_halfH;
uniform float u_halfD;

// ── Ripple / organic — same uniforms as MONOLITH_VERT ──
uniform float u_time;
uniform int   u_rippleCount;
uniform vec4  u_rippleParams[4];  // xyz = model-space epicentre, w = amplitude
uniform float u_rippleAges[4];
uniform float u_idleBreath;
uniform float u_organicStr;

out vec2  v_localUV;
out float v_health;
out float v_colorT;
out float v_seed;
out float v_type;
out float v_growthT;
out float v_emissive;
out float v_growthDir;

${GLSL_ORGANIC_NOISE}

void main() {
  float u         = a_instA.x;
  float v         = a_instA.y;
  float size      = a_instA.z;
  v_health        = a_instA.w;
  v_colorT        = a_instB.x;
  v_seed          = a_instB.y;
  v_type          = a_instB.z;
  v_growthT       = a_instB.w;
  v_growthDir     = a_instC.x;
  v_emissive      = a_instC.y;
  int   face      = int(a_instC.z + 0.5);
  v_localUV       = a_quadUV;

  // Map (u,v) from [0,1] to [-1,1] centred coords on the face
  float cu = u * 2.0 - 1.0;
  float cv = v * 2.0 - 1.0;
  const float EPS = 0.003;  // push above surface to avoid z-fighting

  // Face centre on the exact cube surface (no EPS yet) — used for displacement sampling
  vec3 fc_surf;
  // Face centre including EPS offset + tangent basis
  // cross(tu, tv) = outward face normal for each case
  vec3 fc, tu, tv;
  if (face == 0) {
    fc_surf = vec3( cu*u_halfW,  cv*u_halfH,  u_halfD);
    fc = fc_surf + vec3(0,0,EPS);
    tu = vec3(1,0,0);  tv = vec3(0,1,0);
  } else if (face == 1) {
    fc_surf = vec3(-cu*u_halfW,  cv*u_halfH, -u_halfD);
    fc = fc_surf - vec3(0,0,EPS);
    tu = vec3(-1,0,0); tv = vec3(0,1,0);
  } else if (face == 2) {
    fc_surf = vec3( u_halfW,  cv*u_halfH, -cu*u_halfD);
    fc = fc_surf + vec3(EPS,0,0);
    tu = vec3(0,0,-1); tv = vec3(0,1,0);
  } else if (face == 3) {
    fc_surf = vec3(-u_halfW,  cv*u_halfH,  cu*u_halfD);
    fc = fc_surf - vec3(EPS,0,0);
    tu = vec3(0,0,1);  tv = vec3(0,1,0);
  } else if (face == 4) {
    fc_surf = vec3( cu*u_halfW,  u_halfH, -cv*u_halfD);
    fc = fc_surf + vec3(0,EPS,0);
    tu = vec3(1,0,0);  tv = vec3(0,0,-1);
  } else {
    fc_surf = vec3( cu*u_halfW, -u_halfH,  cv*u_halfD);
    fc = fc_surf - vec3(0,EPS,0);
    tu = vec3(1,0,0);  tv = vec3(0,0,1);
  }

  // ── Surface displacement — same formula as MONOLITH_VERT ──────────────────
  float rippleDisp = 0.0;
  for (int i = 0; i < 4; i++) {
    if (i >= u_rippleCount) break;
    vec3  epic = u_rippleParams[i].xyz;
    float amp  = u_rippleParams[i].w;
    float age  = u_rippleAges[i];
    float dist = distance(fc_surf, epic);
    rippleDisp += amp * sin(dist * 22.0 - age * 9.0) * exp(-dist * 3.0);
  }
  rippleDisp += u_idleBreath * 0.006 * sin(cv * 3.14159 + u_time * 0.0008);
  float organic  = organicNoise(fc_surf, u_time) * u_organicStr * 0.018;
  float dispTotal = rippleDisp + organic;

  // Displace the node centre radially (same direction as the cube vertex)
  fc += normalize(fc_surf) * dispTotal;

  // ── Position quad vertices relative to the displaced centre ───────────────
  float refSize = max(u_halfW, u_halfH) * 2.0;
  int   nodeType = int(v_type + 0.5);
  vec3  pos;

  if (nodeType == 0) {
    // RUNNER: elongated quad oriented by growthDir in the face tangent plane
    float halfLen = size * refSize * 1.9;
    float halfWid = size * refSize * 0.24;
    float cs = cos(v_growthDir), sn = sin(v_growthDir);
    vec3 qDir  = cs * tu + sn * tv;
    vec3 qPerp = -sn * tu + cs * tv;
    pos = fc + a_quadUV.x * halfLen * qDir + a_quadUV.y * halfWid * qPerp;
  } else {
    // LEAF / BLOOM: square quad with sqrt/linear growthT scale-in
    float grow   = (nodeType == 2) ? v_growthT : sqrt(v_growthT);
    float extent = size * refSize * 1.2 * grow;
    pos = fc + a_quadUV.x * extent * tu + a_quadUV.y * extent * tv;
  }

  gl_Position = u_MVP * vec4(pos, 1.0);
}
`;

// ─── Foliage fragment shader ──────────────────────────────────────────────────
// Iridescent energy patches blended into the cube surface.
// All three types use the same cyan/purple colour pair as the glass shader,
// Bayer 4x4 ordered dithering dissolves the edges into the glass rather than
// leaving hard outlines.  Additive blend mode (set in renderer pass 2) lets
// overlapping nodes accumulate into a glow.
export const LICHEN_FRAG = `#version 300 es
precision highp float;

in vec2  v_localUV;
in float v_health;
in float v_colorT;
in float v_seed;
in float v_type;
in float v_growthT;
in float v_emissive;
in float v_growthDir;

uniform vec3  u_warmColor;
uniform vec3  u_coolColor;
uniform float u_time;

out vec4 fragColor;

// ─── Bayer 4x4 ordered dither ─────────────────────────────────────────────────
float bayer4(ivec2 p) {
  int i = (p.x & 3) + (p.y & 3) * 4;
  if      (i ==  0) return  0.0/16.0; else if (i ==  1) return  8.0/16.0;
  else if (i ==  2) return  2.0/16.0; else if (i ==  3) return 10.0/16.0;
  else if (i ==  4) return 12.0/16.0; else if (i ==  5) return  4.0/16.0;
  else if (i ==  6) return 14.0/16.0; else if (i ==  7) return  6.0/16.0;
  else if (i ==  8) return  3.0/16.0; else if (i ==  9) return 11.0/16.0;
  else if (i == 10) return  1.0/16.0; else if (i == 11) return  9.0/16.0;
  else if (i == 12) return 15.0/16.0; else if (i == 13) return  7.0/16.0;
  else if (i == 14) return 13.0/16.0; else              return  5.0/16.0;
}

// ─── Value noise ─────────────────────────────────────────────────────────────
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}
float noise2(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = dot(hash2(i),           f);
  float b = dot(hash2(i+vec2(1,0)), f-vec2(1,0));
  float c = dot(hash2(i+vec2(0,1)), f-vec2(0,1));
  float d = dot(hash2(i+vec2(1,1)), f-vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y) * 0.5 + 0.5;
}

// ─── Iridescent palette — same cyan/purple pair as the glass shader ───────────
${GLSL_GLASS_IRID}

// Blend user warm/cool colour with the glass iridescence
vec3 foliageCol(float colorT, float iridPhase) {
  return mix(mix(u_warmColor, u_coolColor, colorT),
             glassIrid(iridPhase), 0.68);
}

void main() {
  vec2  uv       = v_localUV;
  int   nodeType = int(v_type + 0.5);
  float density  = 0.0;
  vec3  col      = vec3(0.0);

  // Shared slow time pulse used by all types
  float timeDrift = u_time * 0.00022;

  // ─── RUNNER ─────────────────────────────────────────────────────────────────
  // Soft tapered band.  The growth front advances as growthT rises from 0 to 1.
  if (nodeType == 0) {
    float growthX = v_growthT * 2.0 - 1.0;        // tip position in UV x [-1,1]
    if (uv.x > growthX + 0.07) discard;

    float t     = clamp((uv.x + 1.0) / max(growthX + 1.001, 0.01), 0.0, 1.0);
    float bw    = mix(1.0, 0.28, t);               // cross-section tapers toward tip
    float cap   = smoothstep(-0.06, 0.18, growthX - uv.x);
    float gauss = exp(-pow(uv.y / max(bw * 0.55, 0.01), 2.0) * 3.5) * cap;

    float streak = noise2(vec2(uv.x * 6.0, uv.y * 18.0 + v_seed * 0.04)) * 0.28 + 0.72;
    density = gauss * streak;

    float iridPhase = v_seed * 0.022 + t * 2.8 + v_growthDir * 0.5 + timeDrift;
    col = foliageCol(v_colorT, iridPhase) * (0.55 + 0.45 * streak);

    // Bright iridescent edge at the advancing growth front
    float distFront = growthX - uv.x;
    float frontGlow = smoothstep(0.28, 0.0, max(0.0, distFront));
    col += glassIrid(iridPhase + 0.25) * (v_emissive * 0.9 + frontGlow * v_emissive * 1.8);

  // ─── LEAF ───────────────────────────────────────────────────────────────────
  // N-lobed radial glow — lobes fan out like energy petals from the centre.
  } else if (nodeType == 1) {
    float r = length(uv);
    if (r > 1.0) discard;
    float theta = atan(uv.y, uv.x);

    float N    = 2.0 + floor(mod(v_seed * 0.047, 3.0));   // 2, 3 or 4 lobes
    float lobe = 0.50 + 0.50 * cos(theta * N + v_growthDir);
    float gauss = exp(-r * r * (2.8 - 1.1 * lobe));
    float grain = noise2(uv * 4.5 + v_seed * 0.03) * 0.22 + 0.78;
    density = gauss * grain;

    float iridPhase = v_seed * 0.021 + r * 2.8 + theta * 0.3 + timeDrift * 1.2;
    col = foliageCol(v_colorT, iridPhase) * (0.5 + 0.5 * gauss);

    // Bright iridescent core disc
    col += glassIrid(iridPhase + 0.4) * v_emissive * 1.4 * exp(-r * r * 6.0);

  // ─── BLOOM ──────────────────────────────────────────────────────────────────
  // Crystal starburst: radial spokes that flare at the tips + solid glowing core.
  } else {
    float r = length(uv);
    if (r > 1.0) discard;
    float theta = atan(uv.y, uv.x);

    float nS     = 5.0 + floor(mod(v_seed * 0.063, 5.0));
    float period = 6.28318 / nS;
    float phase  = mod(theta + v_growthDir, period);
    float aDist  = min(phase, period - phase);

    float fringeN = noise2(vec2(r * 6.0, aDist * 5.0 + v_seed * 0.05)) * 0.05;
    float spokeW  = 0.04 + 0.13 * smoothstep(0.15, 0.95, r) + fringeN;
    float onSpoke = (1.0 - smoothstep(0.0, spokeW, aDist))
                  * (1.0 - smoothstep(0.05, 1.0, r));
    float core    = exp(-r * r * 9.0);
    float ring    = smoothstep(0.10, 0.0, abs(r - 0.60))
                  * (0.5 + 0.5 * cos(theta * nS + v_growthDir))
                  * smoothstep(0.0, 0.5, onSpoke + 0.3);

    density = max(max(onSpoke, core), ring * 0.85);
    if (density < 0.01) discard;

    float iridPhase = v_seed * 0.018 + r * 4.5 + theta * 0.4 + timeDrift * 0.8;
    col = foliageCol(v_colorT, iridPhase) * 0.6;
    col += glassIrid(iridPhase + 0.35) * v_emissive * (3.0 * core + 1.4 * onSpoke);
    col += glassIrid(iridPhase + 0.6)  * ring * v_emissive * 1.0;
  }

  // ─── Common: health desaturation + Bayer dither ───────────────────────────
  float sat = smoothstep(0.0, 0.45, v_health);
  col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, sat);

  float alpha = density * smoothstep(0.0, 0.12, v_health) * (0.80 + v_emissive * 0.18);
  alpha = clamp(alpha, 0.0, 0.88);

  // Bayer screen-door dither: dissolves edges into the glass surface.
  // The threshold scales with the bayer value so only faint edge pixels
  // are affected — dense cores remain solid.
  if (alpha < bayer4(ivec2(gl_FragCoord.xy)) * 0.72) discard;

  fragColor = vec4(col, alpha);
}
`;

// ─── Spore vertex shader ──────────────────────────────────────────────────────
export const SPORE_VERT = `#version 300 es
precision highp float;

layout(location=0) in vec3 a_pos;
layout(location=1) in float a_lifeRatio;
layout(location=2) in float a_colorT;
layout(location=3) in float a_size;

uniform mat4 u_MVP;
uniform float u_sizeScale;

out float v_lifeRatio;
out float v_colorT;

void main() {
  v_lifeRatio = a_lifeRatio;
  v_colorT    = a_colorT;
  gl_PointSize = a_size * a_lifeRatio * u_sizeScale;
  gl_Position  = u_MVP * vec4(a_pos, 1.0);
}
`;

// ─── Spore fragment shader ────────────────────────────────────────────────────
export const SPORE_FRAG = `#version 300 es
precision mediump float;

in float v_lifeRatio;
in float v_colorT;

uniform vec3 u_warmColor;
uniform vec3 u_coolColor;

out vec4 fragColor;

void main() {
  vec2 pc = gl_PointCoord - vec2(0.5);
  float dist = length(pc) * 2.0;
  float a = (1.0 - smoothstep(0.6, 1.0, dist)) * v_lifeRatio;
  fragColor = vec4(mix(u_warmColor, u_coolColor, v_colorT), a * 0.85);
}
`;
