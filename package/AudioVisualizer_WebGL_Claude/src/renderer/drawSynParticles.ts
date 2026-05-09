import type { SynBand } from '@renderer/drawSynField';

interface SynParticle {
  x: number; y: number;
  vx: number; vy: number;
  bandIdx: number;
  size: number;
}

const PARTICLES_PER_BAND = 50;
let _particles: SynParticle[] = [];

/**
 * Allocate particles distributed near each band's zone center.
 * Call on init and when canvas is resized.
 */
export function initSynParticles(canvas: HTMLCanvasElement, bands: SynBand[]): void {
  _particles = [];
  const cW = canvas.width;
  const cH = canvas.height;
  if (cW === 0 || cH === 0) return;

  for (let bi = 0; bi < bands.length; bi++) {
    const band = bands[bi];
    const zx = band.zx * cW;
    const zy = band.zy * cH;
    const spreadX = cW * 0.22;
    const spreadY = cH * 0.10;

    for (let i = 0; i < PARTICLES_PER_BAND; i++) {
      _particles.push({
        x: zx + (Math.random() - 0.5) * spreadX,
        y: zy + (Math.random() - 0.5) * spreadY,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        bandIdx: bi,
        size: 0.7 + Math.random() * 1.9,
      });
    }
  }
}

/**
 * Update particle positions: weak attraction to zone, random walk, speed
 * modulation by band amplitude, wrap at canvas edges.
 */
export function updateSynParticles(
  dt: number,
  canvas: HTMLCanvasElement,
  bands: SynBand[],
): void {
  const dtF = dt / 16.7;
  const cW = canvas.width;
  const cH = canvas.height;

  for (const p of _particles) {
    const band = bands[p.bandIdx];
    const zx = band.zx * cW;
    const zy = band.zy * cH;

    // Weak spring toward zone center
    p.vx += (zx - p.x) * 0.00022 * dtF;
    p.vy += (zy - p.y) * 0.00022 * dtF;

    // Brownian walk
    p.vx += (Math.random() - 0.5) * 0.055 * dtF;
    p.vy += (Math.random() - 0.5) * 0.055 * dtF;

    // Amplitude-driven speed boost
    const boost = 1 + Math.max(0, band.smooth - 0.28) * 0.9;
    p.vx *= boost;
    p.vy *= boost;

    // Velocity damping
    const damp = Math.pow(0.972, dtF);
    p.vx *= damp;
    p.vy *= damp;

    // Clamp speed
    const speed = Math.hypot(p.vx, p.vy);
    if (speed > 3.5) { p.vx = p.vx / speed * 3.5; p.vy = p.vy / speed * 3.5; }

    p.x += p.vx * dtF;
    p.y += p.vy * dtF;

    // Wrap at canvas edges
    if      (p.x < -20)      p.x += cW + 40;
    else if (p.x > cW + 20)  p.x -= cW + 40;
    if      (p.y < -20)      p.y += cH + 40;
    else if (p.y > cH + 20)  p.y -= cH + 40;
  }
}

/**
 * Draw all particles as tiny glowing arcs using screen blend mode.
 */
export function drawSynParticles(
  ctx: CanvasRenderingContext2D,
  bands: SynBand[],
): void {
  if (_particles.length === 0) return;
  const prevOp = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'screen';

  for (const p of _particles) {
    const band = bands[p.bandIdx];
    const alpha = Math.min(0.85, 0.10 + band.smooth * 0.60);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${band.r},${band.g},${band.b},${alpha.toFixed(3)})`;
    ctx.fill();
  }

  ctx.globalCompositeOperation = prevOp;
}
