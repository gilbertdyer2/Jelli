// ─── Inner membrane shaders ───────────────────────────────────────────────────
// Shares the same vertex layout as MONOLITH_VERT (pos, normal, uv, faceId).
// u_memScale shrinks the geometry inward before displacement so the membrane
// sits inside the outer glass shell.

import { GLSL_ORGANIC_NOISE } from '@renderer/shaderUtils';

export const MEMBRANE_VERT = /* glsl */`#version 300 es
precision highp float;

layout(location=0) in vec3  a_pos;
layout(location=1) in vec3  a_normal;
layout(location=2) in vec2  a_uv;
layout(location=3) in float a_faceId;

uniform mat4  u_MVP;
uniform mat4  u_modelMatrix;
uniform float u_time;
uniform int   u_rippleCount;
uniform vec4  u_rippleParams[4];
uniform float u_rippleAges[4];
uniform float u_idleBreath;
uniform float u_organicStr;
uniform float u_compress;
uniform float u_memScale;   // inner size (0.2–0.98)

out vec3  v_worldPos;
out vec3  v_normal;
out vec2  v_uv;
out float v_rippleIntensity;
out float v_organicT;

${GLSL_ORGANIC_NOISE}

void main() {
  // Scale inward before any displacement
  vec3 pos = a_pos * u_memScale;
  float rippleDisp = 0.0;

  for (int i = 0; i < 4; i++) {
    if (i >= u_rippleCount) break;
    vec3  epic = u_rippleParams[i].xyz;
    float amp  = u_rippleParams[i].w;
    float age  = u_rippleAges[i];
    float dist = distance(pos, epic);
    rippleDisp += amp * sin(dist * 22.0 - age * 9.0) * exp(-dist * 3.0);
  }

  // Idle breath — offset phase from outer shell for subtle distinction
  rippleDisp += u_idleBreath * 0.004 * sin(a_uv.y * 3.14159 + u_time * 0.00095 + 1.2);

  float organic   = organicNoise(pos, u_time) * u_organicStr * 0.010;
  float dispTotal = rippleDisp + organic;

  float compXY = 1.0 + u_compress * 0.3;
  float compZ  = 1.0 - u_compress * 0.6;
  pos = vec3(pos.x * compXY, pos.y * compXY, pos.z * compZ);

  pos += normalize(pos) * dispTotal;

  v_organicT        = clamp(organicNoise(a_pos * u_memScale, u_time) * 0.5 + 0.5, 0.0, 1.0);
  v_rippleIntensity = abs(rippleDisp) * 10.0;
  v_worldPos        = (u_modelMatrix * vec4(pos, 1.0)).xyz;
  v_normal          = normalize((u_modelMatrix * vec4(a_normal, 0.0)).xyz);
  v_uv              = a_uv;
  gl_Position       = u_MVP * vec4(pos, 1.0);
}
`;

export const MEMBRANE_FRAG = /* glsl */`#version 300 es
precision highp float;

in vec3  v_worldPos;
in vec3  v_normal;
in vec2  v_uv;
in float v_rippleIntensity;
in float v_organicT;

uniform vec3  u_cameraPos;
uniform float u_time;
uniform float u_opacityMult;
uniform float u_fresnelStr;
uniform float u_specStr;
uniform float u_iridStr;
uniform vec3  u_memTint;      // base membrane tint
uniform vec3  u_lightDir;
uniform float u_emission;     // base self-emission (0–2)
uniform float u_emitPulse;    // audio-reactive emission boost

out vec4 fragColor;

void main() {
  vec3 N = normalize(v_normal);
  vec3 V = normalize(u_cameraPos - v_worldPos);

  float NdotV   = max(0.0, dot(N, V));
  float fresnel = clamp(pow(1.0 - NdotV, 4.5) * u_fresnelStr, 0.0, 1.0);

  vec3  L    = normalize(u_lightDir);
  vec3  H    = normalize(L + V);
  float spec = pow(max(0.0, dot(N, H)), 80.0) * 0.7 * u_specStr;

  // Core color — membrane dark center, tint on edges (same fresnel lerp as outer)
  vec3 col = mix(vec3(0.01, 0.02, 0.06), u_memTint, fresnel);

  // Iridescence — 120° phase offset from outer shell so the two layers look
  // distinct and the space between them shimmers differently
  float iridT = 0.5 + 0.5 * sin(v_organicT * 6.28318 + u_time * 0.00045 + 2.094);
  vec3  irid  = mix(vec3(0.05, 0.55, 1.0), vec3(0.85, 0.05, 0.9), iridT);
  col = mix(col, irid, u_iridStr * (fresnel + 0.10));

  // Specular highlight
  col += vec3(spec);

  // Ripple scatters tint light along the surface
  col += u_memTint * v_rippleIntensity * 0.22;

  // Emission — glows from inside; brightest at interior-facing (low-fresnel) areas
  float totalEmit = u_emission + u_emitPulse;
  float emitWeight = 1.0 - fresnel * 0.65;  // interior faces emit more
  col += u_memTint * totalEmit * emitWeight * 0.55;
  col += irid      * u_emitPulse            * 0.25;

  // Alpha: same fresnel-driven shape as outer, scaled by opacityMult
  float alpha = (mix(0.06, 0.78, fresnel) + spec * 0.35 + v_rippleIntensity * 0.07) * u_opacityMult;
  fragColor = vec4(col, clamp(alpha, 0.0, 0.92));
}
`;
