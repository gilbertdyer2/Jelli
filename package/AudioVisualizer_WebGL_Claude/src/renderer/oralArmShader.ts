// ─── Oral arm shaders ────────────────────────────────��────────────────────────
// Ribbon geometry is built CPU-side (3 strips per arm: body + left frill + right frill).
// Vertex layout: vec3 a_pos + float a_segT + float a_edgeT (0=body, 1=frill outer edge).

import { GLSL_GLASS_IRID } from '@renderer/shaderUtils';

export const ORAL_VERT = /* glsl */`#version 300 es
precision highp float;

layout(location=0) in vec3  a_pos;
layout(location=1) in float a_segT;
layout(location=2) in float a_edgeT;

uniform mat4  u_MVP;
uniform float u_time;

out float v_segT;
out float v_edgeT;
out float v_iridPhase;

void main() {
  v_segT      = a_segT;
  v_edgeT     = a_edgeT;
  // Slightly slower iridescence animation than tentacles for visual variety
  v_iridPhase = a_segT * 2.0 + u_time * 0.00022;
  gl_Position = u_MVP * vec4(a_pos, 1.0);
}
`;

export const ORAL_FRAG = /* glsl */`#version 300 es
precision highp float;

in float v_segT;
in float v_edgeT;
in float v_iridPhase;

uniform vec3  u_tintColor;
uniform float u_tintBlend;
uniform float u_opacity;
uniform float u_iridStr;
uniform vec3  u_edgeTint;
uniform float u_edgeBlend;

out vec4 fragColor;

${GLSL_GLASS_IRID}

void main() {
  vec3 irid    = glassIrid(v_iridPhase);
  vec3 bodyCol = mix(irid, u_tintColor, u_tintBlend);
  // Edge tint blends in toward the frill outer edge
  vec3 col     = mix(bodyCol, u_edgeTint, v_edgeT * u_edgeBlend);

  // Iridescent sheen that pulses along the length
  col *= 0.75 + 0.25 * u_iridStr * (0.5 + 0.5 * sin(v_iridPhase * 2.0 + 1.2));

  float tipFade  = 1.0 - v_segT * v_segT * 0.85;
  float baseFade = smoothstep(0.0, 0.06, v_segT);
  // Body center stays opaque; frill outer edge fades to zero alpha
  float edgeFade = 1.0 - v_edgeT;
  float alpha    = u_opacity * tipFade * baseFade * edgeFade;

  fragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`;
