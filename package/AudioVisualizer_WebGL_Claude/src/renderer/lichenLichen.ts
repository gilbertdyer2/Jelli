export interface LichenPatch {
  u:         number;  // UV on front face [0–1]
  v:         number;
  radius:    number;  // current radius in UV space
  maxRadius: number;  // target radius at full health
  health:    number;  // 0–1 (0 = dead)
  emissive:  number;  // EMA-smoothed glow
  colorT:    number;  // 0 = amber, 1 = cyan
  seed:      number;  // 0–255, Voronoi variation
  age:       number;  // accumulated seconds
}

// Stride 8 floats: [u, v, radius, health, emissive, colorT, seed, 0]
export const INSTANCE_STRIDE = 8;

export function spawnPatch(
  patches:   LichenPatch[],
  maxPatches: number,
  u: number,
  v: number,
  colorT:    number,
): void {
  if (patches.length >= maxPatches) {
    // Replace the weakest existing patch
    let minHealth = Infinity, minIdx = 0;
    for (let i = 0; i < patches.length; i++) {
      if (patches[i].health < minHealth) { minHealth = patches[i].health; minIdx = i; }
    }
    if (minHealth > 0.5) return;  // all healthy — don't evict
    patches.splice(minIdx, 1);
  }
  const maxR = 0.07 + Math.random() * 0.07;  // 0.07–0.14 UV units
  patches.push({
    u, v,
    radius:    maxR * 0.1,
    maxRadius: maxR,
    health:    0.5,
    emissive:  0.1,
    colorT,
    seed:      Math.floor(Math.random() * 256),
    age:       0,
  });
}

export function boostPatch(patch: LichenPatch, amount: number): void {
  patch.health = Math.min(1.0, patch.health + amount);
}

export function updatePatches(
  patches:      LichenPatch[],
  dt:           number,   // milliseconds
  sustainedRMS: number,   // 0–1 continuous signal
  decayRate:    number,   // health drain per ms
  idleBreath:   number,   // 0–1 idle sustain signal
): void {
  const dtS = dt * 0.001;
  for (let i = patches.length - 1; i >= 0; i--) {
    const p = patches[i];
    p.age += dtS;

    // Health: drain + partial sustain from audio/idle
    const sustain = Math.max(sustainedRMS, idleBreath * 0.3);
    p.health -= decayRate * dt;
    p.health += sustain * 0.000025 * dt;
    p.health = Math.max(0, Math.min(1, p.health));

    if (p.health <= 0) {
      patches.splice(i, 1);
      continue;
    }

    // Radius lerp toward maxRadius scaled by health
    const targetR = p.maxRadius * Math.max(0.05, p.health);
    p.radius += (targetR - p.radius) * Math.min(1, dtS * 1.5);

    // Emissive EMA — driven by RMS + idle pulse
    const idlePulse = 0.12 + 0.10 * Math.sin(p.age * 1.0 + p.seed * 0.025);
    const targetEmissive = Math.max(idlePulse, sustainedRMS * 0.8);
    p.emissive += (targetEmissive - p.emissive) * Math.min(1, dtS * 2.0);
  }
}

export function buildInstanceBuffer(patches: LichenPatch[]): Float32Array {
  const buf = new Float32Array(patches.length * INSTANCE_STRIDE);
  for (let i = 0; i < patches.length; i++) {
    const p = patches[i];
    const off = i * INSTANCE_STRIDE;
    buf[off + 0] = p.u;
    buf[off + 1] = p.v;
    buf[off + 2] = p.radius;
    buf[off + 3] = p.health;
    buf[off + 4] = p.emissive;
    buf[off + 5] = p.colorT;
    buf[off + 6] = p.seed;
    buf[off + 7] = 0;
  }
  return buf;
}
