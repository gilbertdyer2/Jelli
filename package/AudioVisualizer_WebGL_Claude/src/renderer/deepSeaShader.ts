// ─── Deep Sea Background + Particle Shaders ──────────────────────────────────

// ─── Background gradient quad ─────────────────────────────────────────────────
// Clip-space 2-triangle quad, drawn before all other geometry.
// Gradient from bottom (deep) to top (faint surface light), with radial vignette.

export const DS_BG_VERT = /* glsl */`#version 300 es
precision highp float;
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.9999, 1.0);
}
`;

export const DS_BG_FRAG = /* glsl */`#version 300 es
precision highp float;
in vec2 v_uv;
uniform vec3  u_colorTop;
uniform vec3  u_colorBot;
uniform float u_vignette;
uniform float u_horizonY;   // gradient knee (0=all bottom, 1=all top)
out vec4 fragColor;
void main() {
  // Gradient: compress to make the dark abyss dominate the bottom half
  float t = clamp(v_uv.y / max(u_horizonY, 0.01), 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);   // smoothstep-like ease
  vec3 col = mix(u_colorBot, u_colorTop, t);

  // Radial vignette: darkens corners and edges
  vec2 c = v_uv * 2.0 - 1.0;
  float vd = dot(c, c);           // 0=center, 2=corner
  col *= clamp(1.0 - u_vignette * vd * 0.7, 0.0, 1.0);

  fragColor = vec4(col, 1.0);
}
`;

// ─── Bioluminescent particle points ───────────────────────────────────────────
// GL_POINTS with perspective size attenuation and depth fog.
// Vertex layout: [x, y, z, size, brightness, colorBlend]  stride=24, 6 floats.

export const DS_PART_VERT = /* glsl */`#version 300 es
precision highp float;
layout(location=0) in vec3  a_pos;
layout(location=1) in float a_size;
layout(location=2) in float a_brightness;
layout(location=3) in float a_colorBlend;

uniform mat4  u_PV;          // proj × view (world space, no model)
uniform float u_baseSize;    // base pixel size at 1 unit depth
uniform float u_fogDensity;  // exp fog falloff rate

out float v_brightness;
out float v_colorBlend;
out float v_fog;

void main() {
  vec4 clip  = u_PV * vec4(a_pos, 1.0);
  gl_Position = clip;

  // Perspective size: larger when close (clip.w small), smaller when far
  float depth = max(clip.w, 0.01);
  gl_PointSize = clamp(u_baseSize * a_size / depth, 0.5, 64.0);

  // Exponential depth fog (increases with view depth)
  v_fog        = exp(-u_fogDensity * max(0.0, depth - 0.3));
  v_brightness = a_brightness;
  v_colorBlend = a_colorBlend;
}
`;

export const DS_PART_FRAG = /* glsl */`#version 300 es
precision highp float;
in float v_brightness;
in float v_colorBlend;
in float v_fog;

uniform vec3  u_colorA;
uniform vec3  u_colorB;
uniform float u_ambientGlow;  // minimum brightness floor

out vec4 fragColor;

void main() {
  vec2 d = gl_PointCoord - vec2(0.5);
  float r = length(d) * 2.0;   // 0=center, 1=edge
  if (r > 1.0) discard;

  // Soft glow profile: bright core + soft halo
  float core = max(0.0, 1.0 - r * 2.5);
  float halo = max(0.0, 1.0 - r);
  float shape = core * 0.55 + halo * halo * halo * 0.45;

  vec3 col = mix(u_colorA, u_colorB, clamp(v_colorBlend, 0.0, 1.0));

  float bright = clamp(v_brightness + u_ambientGlow, 0.0, 6.0);
  float alpha  = shape * v_fog * bright;

  // Premultiplied alpha for additive-style blending
  fragColor = vec4(col * alpha, alpha);
}
`;
