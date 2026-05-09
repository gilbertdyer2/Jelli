// ─── Bloom Post-Processing Shaders ───────────────────────────────────────────

// Shared vertex shader — full-screen quad (reuses same layout as DS_BG_VERT)
export const BLOOM_VERT = /* glsl */`#version 300 es
precision highp float;
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// Threshold extraction with soft knee — avoids harsh hard cutoff
export const BLOOM_THRESHOLD_FRAG = /* glsl */`#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_scene;
uniform float u_threshold;
out vec4 fragColor;
void main() {
  vec3 color = texture(u_scene, v_uv).rgb;
  float lum  = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float knee = u_threshold * 0.5;
  float rq   = clamp(lum - (u_threshold - knee), 0.0, 2.0 * knee);
  float w    = max(rq * rq / (4.0 * knee + 0.0001), lum - u_threshold);
  fragColor  = vec4(color * clamp(w, 0.0, 1.0), 1.0);
}
`;

// Separable 9-tap Gaussian blur — direction and spread set per pass
export const BLOOM_BLUR_FRAG = /* glsl */`#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_texelDir;   // (radius/texW, 0) for H, (0, radius/texH) for V
out vec4 fragColor;
void main() {
  // Gaussian weights for taps 0..4 (symmetric)
  const float w0 = 0.22702703;
  const float w1 = 0.19459459;
  const float w2 = 0.12162162;
  const float w3 = 0.05405405;
  const float w4 = 0.01621622;
  vec4 result = texture(u_tex, v_uv) * w0;
  result += texture(u_tex, v_uv + u_texelDir * 1.0) * w1;
  result += texture(u_tex, v_uv - u_texelDir * 1.0) * w1;
  result += texture(u_tex, v_uv + u_texelDir * 2.0) * w2;
  result += texture(u_tex, v_uv - u_texelDir * 2.0) * w2;
  result += texture(u_tex, v_uv + u_texelDir * 3.0) * w3;
  result += texture(u_tex, v_uv - u_texelDir * 3.0) * w3;
  result += texture(u_tex, v_uv + u_texelDir * 4.0) * w4;
  result += texture(u_tex, v_uv - u_texelDir * 4.0) * w4;
  fragColor = result;
}
`;

// Composite — blit scene, then add bloom additively
export const BLOOM_COMPOSITE_FRAG = /* glsl */`#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_scene;
uniform sampler2D u_bloom;
uniform float u_strength;
out vec4 fragColor;
void main() {
  vec4 scene = texture(u_scene, v_uv);
  vec3 bloom = texture(u_bloom, v_uv).rgb;
  fragColor  = vec4(scene.rgb + bloom * u_strength, scene.a);
}
`;
