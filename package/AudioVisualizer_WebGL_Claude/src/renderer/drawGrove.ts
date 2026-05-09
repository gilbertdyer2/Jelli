// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface TreeSegment {
  parentIdx: number;    // -1 for trunk roots
  treeIdx: number;      // 0 = center/bass, 1 = left/mid, 2 = right/high
  depth: number;        // 0 = trunk
  baseAngle: number;    // fixed direction (radians)
  length: number;       // full-grown length in px
  growT: number;        // 0–1 growth progress
  growSpeed: number;    // growT units/ms (base rate, before audio boost)
  thickness: number;    // base lineWidth
  r: number; g: number; b: number;
  swayPhase: number;    // random phase offset
  swayFreq: number;     // radians/ms
  swayAmp: number;      // peak sway in radians (increases with depth)
  spawned: boolean;     // children have been created
  blossomed: boolean;   // unused — blossom fires are event-driven, not per-segment
  seedX: number;        // only meaningful when parentIdx === -1
  seedY: number;
}

export interface EnergyPulse {
  treeIdx: number;
  depthProgress: number;  // 0 = at trunk base, MAX_DEPTH = at leaf tips
  speed: number;          // depthProgress units/ms
  intensity: number;      // 0–1 extra brightness multiplier
}

export interface BlossomParticle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;     // ms remaining
  maxLife: number;
  r: number; g: number; b: number;
  size: number;
  rotation: number;
}

// ─── Background ───────────────────────────────────────────────────────────────

export function drawGroveBackground(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  energySmooth: number,
): void {
  const { width: w, height: h } = canvas;

  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#050408';
  ctx.fillRect(0, 0, w, h);

  // Subtle moonlit radial — "clearing" feel
  const cx = w * 0.5;
  const cy = h * 0.42;
  const rad = Math.max(w, h) * 0.58;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
  grad.addColorStop(0, `rgba(42,28,66,${(0.07 + energySmooth * 0.08).toFixed(3)})`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// ─── Ground glow ──────────────────────────────────────────────────────────────

export function drawGroveGround(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  treeSmooths: readonly number[],
): void {
  const { width: w, height: h } = canvas;
  const bassEnergy  = treeSmooths[0] ?? 0;
  const midEnergy   = treeSmooths[1] ?? 0;
  const highEnergy  = treeSmooths[2] ?? 0;
  const totalEnergy = (bassEnergy + midEnergy + highEnergy) / 3;

  ctx.globalCompositeOperation = 'screen';

  // Wide soft ground glow (bass-driven violet-crimson)
  const soilGrad = ctx.createLinearGradient(0, h - 6, 0, h - 110);
  const bassAlpha = 0.30 + bassEnergy * 0.55;
  soilGrad.addColorStop(0, `rgba(80,18,120,${bassAlpha.toFixed(3)})`);
  soilGrad.addColorStop(0.5, `rgba(45,8,70,${(bassAlpha * 0.4).toFixed(3)})`);
  soilGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = soilGrad;
  ctx.fillRect(0, h - 110, w, 110);

  // Thin bright horizon line
  const horizonAlpha = 0.18 + totalEnergy * 0.30;
  ctx.strokeStyle = `rgba(110,40,180,${horizonAlpha.toFixed(3)})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, h - 1);
  ctx.lineTo(w, h - 1);
  ctx.stroke();

  ctx.globalCompositeOperation = 'source-over';
}

// ─── Tree segments ─────────────────────────────────────────────────────────────

/**
 * 3-pass glow rendering batched by (tree, depth) for efficiency.
 * Pass 1: wide halo  — lineWidth × 4.0, low alpha, screen blend
 * Pass 2: inner glow — lineWidth × 1.8, mid alpha, screen blend
 * Pass 3: bright core — lineWidth × 0.6, high alpha, source-over
 * ~45 total draw calls for 3 trees × 5 depths × 3 passes.
 */
export function drawTreeSegments(
  ctx: CanvasRenderingContext2D,
  segments: TreeSegment[],
  starts: readonly { x: number; y: number }[],
  tips: readonly { x: number; y: number }[],
  pulses: EnergyPulse[],
  glowIntensity: number,
  maxDepth: number,
): void {
  if (segments.length === 0) return;
  ctx.lineCap = 'round';

  for (let ti = 0; ti < 3; ti++) {
    for (let di = 0; di <= maxDepth; di++) {
      // Gather indices for this (tree, depth) batch
      const batch: number[] = [];
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (seg.treeIdx === ti && seg.depth === di && seg.growT > 0.001) {
          batch.push(i);
        }
      }
      if (batch.length === 0) continue;

      const ref = segments[batch[0]];
      const { r, g, b, thickness } = ref;

      // Compute pulse boost for this depth
      let pulseBoost = 0;
      for (const p of pulses) {
        if (p.treeIdx === ti) {
          const dist = Math.abs(p.depthProgress - di);
          if (dist < 1.2) {
            pulseBoost = Math.max(pulseBoost, (1 - dist / 1.2) * p.intensity);
          }
        }
      }

      // ── Pass 1: wide halo (screen) ──────────────────────────────────────────
      ctx.globalCompositeOperation = 'screen';
      ctx.lineWidth = thickness * 4.0;
      const haloA = Math.min(1, (0.09 + pulseBoost * 0.24) * glowIntensity);
      ctx.strokeStyle = `rgba(${r},${g},${b},${haloA.toFixed(3)})`;
      ctx.beginPath();
      for (const i of batch) {
        ctx.moveTo(starts[i].x, starts[i].y);
        ctx.lineTo(tips[i].x, tips[i].y);
      }
      ctx.stroke();

      // ── Pass 2: inner glow (screen) ─────────────────────────────────────────
      ctx.lineWidth = thickness * 1.8;
      const innerA = Math.min(1, (0.32 + pulseBoost * 0.30) * glowIntensity);
      ctx.strokeStyle = `rgba(${r},${g},${b},${innerA.toFixed(3)})`;
      ctx.beginPath();
      for (const i of batch) {
        ctx.moveTo(starts[i].x, starts[i].y);
        ctx.lineTo(tips[i].x, tips[i].y);
      }
      ctx.stroke();

      // ── Pass 3: bright core (source-over) ───────────────────────────────────
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = thickness * 0.6;
      const coreA = Math.min(1, (0.85 + pulseBoost * 0.15) * glowIntensity);
      ctx.strokeStyle = `rgba(${r},${g},${b},${coreA.toFixed(3)})`;
      ctx.beginPath();
      for (const i of batch) {
        ctx.moveTo(starts[i].x, starts[i].y);
        ctx.lineTo(tips[i].x, tips[i].y);
      }
      ctx.stroke();
    }
  }
}

// ─── Blossom particles ────────────────────────────────────────────────────────

export function drawBlossomParticles(
  ctx: CanvasRenderingContext2D,
  blossoms: BlossomParticle[],
): void {
  if (blossoms.length === 0) return;
  ctx.globalCompositeOperation = 'screen';

  for (const b of blossoms) {
    const t = b.life / b.maxLife;
    // Fade in quickly, hold, then ease out
    const alpha = Math.min(t * 4, 1) * t * 0.90;
    if (alpha < 0.01) continue;

    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rotation);
    ctx.fillStyle = `rgba(${b.r},${b.g},${b.b},${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, b.size, b.size * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.globalCompositeOperation = 'source-over';
}
