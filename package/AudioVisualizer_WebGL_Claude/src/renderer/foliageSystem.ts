export const NODE_RUNNER = 0;
export const NODE_LEAF   = 1;
export const NODE_BLOOM  = 2;

// 12 floats per instance:
// instA[0..3]: u, v, size, health
// instB[0..3]: colorT, seed, type, growthT
// instC[0..3]: growthDir, emissive, face, 0
export const INSTANCE_STRIDE = 12;
export const GPU_MAX_NODES   = 128;

export interface FoliageNode {
  u: number; v: number;
  size: number;
  health: number; growthT: number;
  colorT: number; seed: number;
  type: number;      // NODE_RUNNER | NODE_LEAF | NODE_BLOOM
  growthDir: number; // radians — orientation on face tangent plane
  emissive: number;
  age: number;
  face: number;      // 0=front, 1=back, 2=right, 3=left, 4=top, 5=bottom
  spawned: boolean;
  decayMult: number;
}

function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }

function evictWeakest(nodes: FoliageNode[]): void {
  let minHealth = Infinity, minIdx = 0;
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].health < minHealth) { minHealth = nodes[i].health; minIdx = i; }
  }
  nodes.splice(minIdx, 1);
}

export function spawnRunner(nodes: FoliageNode[], max: number, u: number, v: number, colorT: number, face = 0): void {
  if (nodes.length >= max) {
    const weakest = nodes.reduce((mi, n, i) => n.health < nodes[mi].health ? i : mi, 0);
    if (nodes[weakest].health > 0.5) return;
    evictWeakest(nodes);
  }
  nodes.push({
    u: clamp01(u), v: clamp01(v),
    size:      0.09 + Math.random() * 0.06,
    health:    0.75,
    growthT:   0.0,
    colorT,
    seed:      Math.floor(Math.random() * 256),
    type:      NODE_RUNNER,
    growthDir: Math.random() * Math.PI * 2,
    emissive:  1.0,
    age:       0,
    face,
    spawned:   false,
    decayMult: 0.7,
  });
}

export function spawnLeaf(nodes: FoliageNode[], max: number, u: number, v: number, colorT: number, face = 0): void {
  if (nodes.length >= max) {
    const weakest = nodes.reduce((mi, n, i) => n.health < nodes[mi].health ? i : mi, 0);
    if (nodes[weakest].health > 0.6) return;
    evictWeakest(nodes);
  }
  nodes.push({
    u: clamp01(u), v: clamp01(v),
    size:      0.055 + Math.random() * 0.045,
    health:    0.80,
    growthT:   0.0,
    colorT,
    seed:      Math.floor(Math.random() * 256),
    type:      NODE_LEAF,
    growthDir: Math.random() * Math.PI * 2,
    emissive:  0.95,
    age:       0,
    face,
    spawned:   false,
    decayMult: 1.0,
  });
}

export function spawnBloom(nodes: FoliageNode[], max: number, u: number, v: number, colorT: number, face = 0): void {
  if (nodes.length >= max) evictWeakest(nodes);
  nodes.push({
    u: clamp01(u), v: clamp01(v),
    size:      0.045 + Math.random() * 0.035,
    health:    0.85,
    growthT:   0.0,
    colorT,
    seed:      Math.floor(Math.random() * 256),
    type:      NODE_BLOOM,
    growthDir: Math.random() * Math.PI * 2,
    emissive:  1.0,
    age:       0,
    face,
    spawned:   false,
    decayMult: 2.2,
  });
}

export function boostNode(node: FoliageNode, amount: number): void {
  node.health  = clamp01(node.health + amount);
  node.emissive = Math.min(1.0, node.emissive + 0.5);
}

// face is the cube face to place child on
export type SpawnChildFn = (u: number, v: number, colorT: number, type: number, face: number) => void;

const GROWTH_RATES = [0.50, 1.10, 2.80];

export function updateFoliage(
  nodes:        FoliageNode[],
  dt:           number,
  sustainedRMS: number,
  decayRate:    number,
  idleBreath:   number,
  onSpawnChild: SpawnChildFn,
): void {
  const dtS = dt * 0.001;

  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    n.age += dtS;

    if (n.growthT < 1.0) {
      n.growthT = Math.min(1.0, n.growthT + GROWTH_RATES[n.type] * dtS);
    }

    const sustain = Math.max(sustainedRMS, idleBreath * 0.25);
    n.health -= decayRate * n.decayMult * dt;
    n.health += sustain * 0.000020 * dt;
    n.health = clamp01(n.health);

    if (n.health <= 0) { nodes.splice(i, 1); continue; }

    const idlePulse = 0.07 + 0.05 * Math.sin(n.age * 1.3 + n.seed * 0.025);
    const targetEmissive = Math.max(idlePulse, sustainedRMS * 0.65);
    n.emissive += (targetEmissive - n.emissive) * Math.min(1, dtS * 2.2);

    // Organic spread: mature runners spawn leaf children on the same face
    if (n.type === NODE_RUNNER && !n.spawned && n.growthT >= 1.0 && n.age > 1.0 && n.health > 0.3) {
      n.spawned = true;
      const numLeaves = 1 + Math.floor(Math.random() * 2);
      for (let li = 0; li < numLeaves; li++) {
        const tipU = n.u + Math.cos(n.growthDir) * n.size * 3.0 + (Math.random() - 0.5) * 0.12;
        const tipV = n.v + Math.sin(n.growthDir) * n.size * 3.0 + (Math.random() - 0.5) * 0.12;
        onSpawnChild(tipU, tipV, n.colorT, NODE_LEAF, n.face);
      }
      if (Math.random() < 0.45) {
        const extDir = n.growthDir + (Math.random() - 0.5) * 0.8;
        const extU = n.u + Math.cos(extDir) * n.size * 5.5;
        const extV = n.v + Math.sin(extDir) * n.size * 5.5;
        onSpawnChild(extU, extV, n.colorT, NODE_RUNNER, n.face);
      }
    }
  }
}

export function buildInstanceBuffer(nodes: FoliageNode[]): Float32Array {
  const buf = new Float32Array(nodes.length * INSTANCE_STRIDE);
  for (let i = 0; i < nodes.length; i++) {
    const n   = nodes[i];
    const off = i * INSTANCE_STRIDE;
    buf[off + 0]  = n.u;
    buf[off + 1]  = n.v;
    buf[off + 2]  = n.size;
    buf[off + 3]  = n.health;
    buf[off + 4]  = n.colorT;
    buf[off + 5]  = n.seed;
    buf[off + 6]  = n.type;
    buf[off + 7]  = n.growthT;
    buf[off + 8]  = n.growthDir;
    buf[off + 9]  = n.emissive;
    buf[off + 10] = n.face;
    buf[off + 11] = 0;
  }
  return buf;
}
