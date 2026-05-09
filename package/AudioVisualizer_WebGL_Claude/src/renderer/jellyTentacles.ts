// ─── Jellyfish tentacle geometry + shaders ───────────────────────────────────
//
// Vertex layout (4 floats, stride=16):
//   attr 0 (float): tentacle index  (0..N-1)
//   attr 1 (float): segT            (0=base at bell, 1=tip)
//   attr 2 (float): ringTheta       (0..2π around tube)
//   attr 3 (float): ringR           (taper scale, 1=base, 0=tip)
//
// The spine curve is computed entirely in the vertex shader using
// u_compress and u_propelZ from the jellyfish spring dynamics.

export interface TentacleGeometry {
  vertexData: Float32Array;
  indexData:  Uint16Array;
  indexCount: number;
}

export function buildTentacleGeometry(
  nTent: number, nSeg: number, nRing: number,
): TentacleGeometry {
  const vPerTent  = (nSeg + 1) * nRing;
  const ixPerTent = nSeg * nRing * 6;
  const verts = new Float32Array(nTent * vPerTent * 4);
  const idxs  = new Uint16Array(nTent * ixPerTent);

  let vi = 0, ii = 0;

  for (let t = 0; t < nTent; t++) {
    const base = t * vPerTent;

    for (let s = 0; s <= nSeg; s++) {
      const segT = s / nSeg;
      const ringR = Math.pow(1.0 - segT * 0.92, 0.6);  // smooth taper

      for (let r = 0; r < nRing; r++) {
        const theta = (2 * Math.PI * r) / nRing;
        verts[vi++] = t;
        verts[vi++] = segT;
        verts[vi++] = theta;
        verts[vi++] = ringR;
      }
    }

    for (let s = 0; s < nSeg; s++) {
      for (let r = 0; r < nRing; r++) {
        const rn = (r + 1) % nRing;
        const tl = base + s * nRing + r;
        const tr = base + s * nRing + rn;
        const bl = base + (s + 1) * nRing + r;
        const br = base + (s + 1) * nRing + rn;
        idxs[ii++] = tl; idxs[ii++] = bl; idxs[ii++] = tr;
        idxs[ii++] = tr; idxs[ii++] = bl; idxs[ii++] = br;
      }
    }
  }

  return { vertexData: verts, indexData: idxs, indexCount: idxs.length };
}

// ─── Vertex shader ────────────────────────────────────────────────────────────

export const TENTACLE_VERT = /* glsl */`#version 300 es
precision highp float;

layout(location=0) in vec4 a_data;
// a_data.x=tentIdx  a_data.y=segT  a_data.z=ringTheta  a_data.w=ringR

uniform mat4  u_MVP;
uniform mat4  u_modelMatrix;
uniform float u_time;
uniform float u_compress;
uniform float u_propelZ;
uniform float u_halfW;
uniform float u_halfH;
uniform float u_halfD;
uniform int   u_tentCount;
uniform float u_tentLength;
uniform float u_tentRadius;
uniform float u_tentWaveAmp;
uniform float u_tentWaveFreq;
uniform float u_tentWaveSpeed;
uniform float u_tentSplay;
uniform float u_tentAttachY;    // scatter spread (0=centered, 1=full face)
uniform float u_tentOffsetX;   // global position offset X
uniform float u_tentOffsetY;   // global position offset Y
uniform float u_tentOffsetZ;   // global position offset Z
uniform float u_idleAmp;       // idle sway amplitude
uniform float u_idleSpeed;     // idle sway animation speed
uniform float u_rippleEnergy;  // total ripple energy from cube surface (drives coupling)
uniform float u_rippleResp;    // ripple response strength multiplier
uniform float u_ringSpread;    // ± radians of random spread from equidistant ring position

out vec3  v_worldNormal;
out float v_segT;
out float v_rimDot;

// Deterministic per-tentacle hash: returns value in 0..1
float tentHash(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }

// Tentacles attach across the back face (+Z) via random scatter and extend backward
vec3 spineAt(float t, float tentIdx) {
  // Track body compression so attachment stays on the surface
  float compXY = 1.0 + u_compress * 0.3;
  float compZ  = 1.0 - u_compress * 0.6;

  // Place each tentacle equidistantly around the ring, with optional random spread
  float baseAngle = (tentIdx / float(u_tentCount)) * 6.28318;
  float jitter    = (tentHash(tentIdx * 7.53 + 1.7) * 2.0 - 1.0) * u_ringSpread;
  float angle     = baseAngle + jitter;
  float attachX   = cos(angle) * u_halfW * u_tentAttachY * compXY;
  float attachY   = sin(angle) * u_halfH * u_tentAttachY * compXY;

  // Attach to back face surface, tracking Z compression, plus user offset
  vec3 base = vec3(attachX + u_tentOffsetX, attachY + u_tentOffsetY, u_halfD * compZ + u_tentOffsetZ);

  // Extend in +Z (into screen)
  vec3 outward = vec3(0.0, 0.0, t * u_tentLength);

  // Idle wave in XY plane
  float wPhase = t * u_tentWaveFreq * 6.28318
               + u_time * u_tentWaveSpeed * 0.001
               + tentIdx * 1.05;
  vec3 wave = vec3(u_tentWaveAmp * sin(wPhase) * t,
                   u_tentWaveAmp * cos(wPhase * 0.7 + 1.3) * t * 0.5,
                   0.0);

  // Splay radially outward from attachment point on compress
  vec2 radial = vec2(attachX, attachY);
  float radLen = length(radial);
  vec2 splayDir2 = (radLen > 0.0001) ? radial / radLen : vec2(1.0, 0.0);
  vec3 splay = vec3(splayDir2.x, splayDir2.y, 0.0) * u_tentSplay * u_compress * t;

  // Idle sway: slow, gentle, unique per tentacle using golden-angle phase offset
  float idlePhase = u_time * u_idleSpeed * 0.001 + tentIdx * 2.39996;
  vec3 idle = vec3(
    u_idleAmp * sin(idlePhase + t * 1.3)              * t,
    u_idleAmp * cos(idlePhase * 0.73 + t * 0.85) * 0.6 * t,
    0.0
  );

  // Ripple coupling: cube surface ripples drive extra tentacle sway.
  // Uses a separate phase offset per tentacle so they don't all move in sync.
  float rEnergy = u_rippleEnergy * u_rippleResp;
  float rPhase  = u_time * u_idleSpeed * 0.0014 + tentIdx * 1.61803 + t * 2.8;
  vec3 rippleSway = vec3(
    rEnergy * sin(rPhase)                * t * 0.9,
    rEnergy * cos(rPhase * 0.79 + 1.05) * t * 0.55,
    0.0
  );

  // Propel drag: fluid ripple that grows from zero at base toward the tip.
  // Multiple sine cycles along t give the tentacle a curvy, wave-like bend
  // rather than a stiff lean. The time term keeps it animating as propel decays.
  float pPhase = t * u_tentWaveFreq * 6.28318 * 1.8
               - u_time * u_tentWaveSpeed * 0.0009
               + tentIdx * 0.85;
  float pAmp  = u_propelZ * 2.5;
  vec3 propelRipple = vec3(
    pAmp * sin(pPhase)               * t,          // primary XY curl
    pAmp * cos(pPhase * 0.6 + 1.2)  * t * 0.55,   // secondary out-of-phase curl
   -u_propelZ * t * t * 0.7                         // tip trails behind in Z
  );

  return base + outward + wave + splay + idle + rippleSway + propelRipple;
}

void main() {
  float a_tentIdx   = a_data.x;
  float a_segT      = a_data.y;
  float a_ringTheta = a_data.z;
  float a_ringR     = a_data.w;

  vec3 spine = spineAt(a_segT, a_tentIdx);

  float eps    = 0.012;
  vec3  spineA = spineAt(min(a_segT + eps, 1.0), a_tentIdx);
  vec3  spineB = spineAt(max(a_segT - eps, 0.0), a_tentIdx);
  vec3  tangent = normalize(spineA - spineB);

  // Reference vector: Y up; fall back to X if nearly parallel to tangent
  vec3 refV = vec3(0.0, 1.0, 0.0);
  if (abs(dot(tangent, refV)) > 0.98) refV = vec3(1.0, 0.0, 0.0);
  vec3 side     = normalize(cross(tangent, refV));
  vec3 localNrm = normalize(cross(side, tangent));

  // Ring cross-section
  vec3 rNorm   = cos(a_ringTheta) * localNrm + sin(a_ringTheta) * side;
  vec3 pos     = spine + rNorm * (a_ringR * u_tentRadius);

  v_worldNormal = normalize((u_modelMatrix * vec4(rNorm, 0.0)).xyz);
  v_segT        = a_segT;
  v_rimDot      = abs(rNorm.z); // rim glow based on Z-facing edges

  gl_Position = u_MVP * vec4(pos, 1.0);
}
`;

// ─── Fragment shader ──────────────────────────────────────────────────────────

export const TENTACLE_FRAG = /* glsl */`#version 300 es
precision highp float;

in vec3  v_worldNormal;
in float v_segT;
in float v_rimDot;

uniform vec3  u_tintColor;    // user tint
uniform float u_tintBlend;    // 0=pure irid, 1=pure tint
uniform float u_opacity;
uniform float u_lightX;
uniform float u_lightY;
uniform float u_time;
uniform float u_iridStr;      // iridescence strength

out vec4 fragColor;

vec3 glassIrid(float t) {
  return mix(vec3(0.10, 0.80, 0.90), vec3(0.60, 0.20, 1.00),
             0.5 + 0.5 * sin(t * 6.28318));
}

void main() {
  float iridPhase = v_segT * 1.8 + u_time * 0.00025;
  vec3  irid      = glassIrid(iridPhase);
  vec3  col       = mix(irid, u_tintColor, u_tintBlend);

  // Lambertian diffuse + ambient
  vec3 norm     = normalize(v_worldNormal);
  vec3 lightDir = normalize(vec3(u_lightX, u_lightY, 1.0));
  float diff    = max(0.0, dot(norm, lightDir)) * 0.55 + 0.45;
  col *= diff;

  // Rim glow: brighten tube silhouette
  float rim = 1.0 - v_rimDot;
  col += irid * rim * 0.35 * u_iridStr;

  // Tip fade + base fade (attachment point is seamless, tip dissolves)
  float tipFade  = 1.0 - v_segT * v_segT * 0.85;
  float baseFade = smoothstep(0.0, 0.04, v_segT);
  float alpha    = u_opacity * tipFade * baseFade;

  fragColor = vec4(col, alpha);
}
`;
