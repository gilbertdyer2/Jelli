// ─── Shared GLSL snippets ─────────────────────────────────────────────────────
// Embed via template-literal interpolation: `... ${GLSL_ORGANIC_NOISE} ...`

// 3-octave sin-fbm organic noise — no hash, entirely smooth.
// Used in MONOLITH_VERT, LICHEN_VERT, MEMBRANE_VERT.
export const GLSL_ORGANIC_NOISE = /* glsl */`
float organicNoise(vec3 p, float t) {
  float n1 = sin(p.y * 12.6 + p.x *  7.2 + t * 0.00045) * sin(p.y *  9.8 + p.z * 15.0 + t * 0.00031);
  float n2 = sin(p.y * 35.0 + p.x * 28.0 + t * 0.00090) * sin(p.z * 42.0 + p.y * 18.0 + t * 0.00065);
  float n3 = sin(p.x *110.0 + p.z * 95.0 + t * 0.00150) * sin(p.y * 88.0 + p.x * 72.0 + t * 0.00120);
  return n1 * 0.55 + n2 * 0.30 + n3 * 0.15;
}`;

// Cyan-to-purple iridescent palette — same colour pair across all ribbon shaders.
// Used in LICHEN_FRAG, PHYS_TENT_FRAG, ORAL_FRAG.
export const GLSL_GLASS_IRID = /* glsl */`
vec3 glassIrid(float t) {
  return mix(vec3(0.10, 0.80, 0.90), vec3(0.60, 0.20, 1.00),
             0.5 + 0.5 * sin(t * 6.28318));
}`;
