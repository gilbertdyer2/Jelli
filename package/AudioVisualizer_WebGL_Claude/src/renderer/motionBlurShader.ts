// ─── Motion Blur Post-Processing Shaders ────────────────────────────────────
// Vertex shader: reuse BLOOM_VERT from bloomShader.ts

// Accumulation blend — mix(previous, current, blend)
export const MB_ACCUM_FRAG = /* glsl */`#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_accum;  // previous accumulation frame
uniform sampler2D u_scene;  // current rendered frame
uniform float u_blend;      // fraction of new frame: 0=full old, 1=full new
out vec4 fragColor;
void main() {
  fragColor = mix(texture(u_accum, v_uv), texture(u_scene, v_uv), u_blend);
}
`;

// Simple blit — output a texture directly to the current framebuffer
export const MB_BLIT_FRAG = /* glsl */`#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex;
out vec4 fragColor;
void main() {
  fragColor = texture(u_tex, v_uv);
}
`;
