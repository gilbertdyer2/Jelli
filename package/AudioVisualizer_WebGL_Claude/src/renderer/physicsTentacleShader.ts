// ─── Physics tentacle shaders ─────────────────────────────────────────────────
// Ribbon geometry is built CPU-side (billboard-oriented, width pre-computed).
// Vertex layout: vec3 a_pos (world-space ribbon corner) + float a_segT (0=root,1=tip).
import { GLSL_GLASS_IRID } from '@renderer/shaderUtils';

export const PHYS_TENT_VERT = /* glsl */`#version 300 es
precision highp float;

layout(location=0) in vec3  a_pos;
layout(location=1) in float a_segT;

uniform mat4  u_MVP;
uniform float u_time;

out float v_segT;
out float v_iridPhase;

void main() {
  v_segT      = a_segT;
  // Iridescence phase: shifts down the tentacle + animated over time
  v_iridPhase = a_segT * 1.8 + u_time * 0.00025;
  gl_Position = u_MVP * vec4(a_pos, 1.0);
}
`;

export const PHYS_TENT_FRAG = /* glsl */`#version 300 es
precision highp float;

in float v_segT;
in float v_iridPhase;

uniform vec3  u_tintColor;
uniform float u_tintBlend;
uniform float u_opacity;
uniform float u_iridStr;

out vec4 fragColor;

${GLSL_GLASS_IRID}

void main() {
  vec3 irid = glassIrid(v_iridPhase);
  vec3 col  = mix(irid, u_tintColor, u_tintBlend);

  // Subtle iridescent sheen that pulses down the length
  col *= 0.75 + 0.25 * u_iridStr * (0.5 + 0.5 * sin(v_iridPhase * 2.0 + 1.2));

  float tipFade  = 1.0 - v_segT * v_segT * 0.85;
  float baseFade = smoothstep(0.0, 0.05, v_segT);
  float alpha    = u_opacity * tipFade * baseFade;

  fragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`;
