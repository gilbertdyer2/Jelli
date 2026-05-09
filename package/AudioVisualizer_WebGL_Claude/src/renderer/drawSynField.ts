import { freqToSynColor } from '@utils/synColors';

// ─── Shared interfaces (imported by SynRenderer and drawSynParticles) ──────────

export interface SynBand {
  hz0: number; hz1: number;
  binLo: number; binHi: number;
  r: number; g: number; b: number;   // synesthetic color
  zx: number; zy: number;             // zone center as fraction of canvas (0–1)
  amp: number;                         // raw amplitude this frame
  smooth: number;                      // EMA-smoothed amplitude
  peak: boolean;                       // true on the frame a beat peak fires
  peakHistory: number[];               // 9-frame window for peak detection
  lastPeakT: number;                   // DOMHighResTimeStamp of last peak
  clusters: Array<{ dx: number; dy: number; rScale: number }>;
}

export interface SynRing {
  x: number; y: number;
  radius: number;
  maxRadius: number;
  life: number;    // ms remaining
  maxLife: number;
  r: number; g: number; b: number;
  lineWidth: number;
}

// ─── Scatter nodes ─────────────────────────────────────────────────────────────

interface ScatterNode {
  binIdx: number;
  x: number; y: number;
  hz: number;
}

let _scatter: ScatterNode[] = [];

/**
 * Place scatter nodes at fixed canvas positions using a golden-ratio angular
 * spread. Must be called (and recalled on resize) before drawSynScatter.
 */
export function initSynScatter(canvas: HTMLCanvasElement, count: number): void {
  _scatter = [];
  const cW = canvas.width;
  const cH = canvas.height;
  if (cW === 0 || cH === 0) return;

  const GOLDEN_ANGLE = 2.39996323;
  for (let i = 0; i < count; i++) {
    // Log-spaced Hz from 80 Hz to 18 kHz
    const t = i / Math.max(1, count - 1);
    const hz = 80 * Math.pow(18000 / 80, t);
    const binIdx = Math.min(1023, Math.max(0, Math.round(hz * 1024 / 22050)));

    // Organic position: golden-ratio spiral with slight vertical squeeze
    const r = Math.sqrt((i + 0.5) / count) * 0.44;
    const angle = i * GOLDEN_ANGLE;
    const x = cW * 0.5 + Math.cos(angle) * r * cW;
    const y = cH * 0.5 + Math.sin(angle) * r * cH * 0.72;

    // Clamp to canvas
    const cx = Math.max(10, Math.min(cW - 10, x));
    const cy = Math.max(10, Math.min(cH - 10, y));

    _scatter.push({ binIdx, x: cx, y: cy, hz });
  }
}

// ─── Bloom layer ───────────────────────────────────────────────────────────────

function _drawBloom(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  ri: number, gi: number, bi: number,
  alpha: number,
): void {
  if (r <= 0 || alpha <= 0) return;
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
  const a0 = alpha.toFixed(4);
  const a1 = (alpha * 0.28).toFixed(4);
  grad.addColorStop(0,    `rgba(${ri},${gi},${bi},${a0})`);
  grad.addColorStop(0.50, `rgba(${ri},${gi},${bi},${a1})`);
  grad.addColorStop(1,    `rgba(${ri},${gi},${bi},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/**
 * Draw large soft bloom glows for each frequency band plus surrounding cluster
 * sub-blooms that give a spatial texture to each zone.
 */
export function drawSynBlooms(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  bands: SynBand[],
  bloomIntensity: number,
): void {
  const cW = canvas.width;
  const cH = canvas.height;
  const prevOp = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'screen';

  for (const band of bands) {
    const { r, g, b, smooth, zx, zy, clusters } = band;
    const cx = zx * cW;
    const cy = zy * cH;
    const baseR = cH * (0.20 + smooth * 0.30);
    const baseA = bloomIntensity * (0.035 + Math.pow(smooth, 1.3) * 0.14);

    _drawBloom(ctx, cx, cy, baseR, r, g, b, baseA);

    for (const cl of clusters) {
      const sx = cx + cl.dx * cH;
      const sy = cy + cl.dy * cH;
      _drawBloom(ctx, sx, sy, baseR * cl.rScale, r, g, b, baseA * 0.50);
    }
  }

  ctx.globalCompositeOperation = prevOp;
}

// ─── Scatter layer ─────────────────────────────────────────────────────────────

/**
 * Draw frequency-reactive scatter nodes — small glowing dots at fixed canvas
 * positions, colored by their synesthetic frequency and brightened by amplitude.
 * Creates the "texture field" that changes with timbre.
 */
export function drawSynScatter(
  ctx: CanvasRenderingContext2D,
  freqData: Float32Array,
): void {
  if (_scatter.length === 0) return;
  const prevOp = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'screen';

  for (const node of _scatter) {
    const db = freqData[node.binIdx];
    if (db < -94) continue;
    const linAmp = Math.pow(10, db / 20);
    const amp = Math.min(1, linAmp / 0.12);
    if (amp < 0.025) continue;

    const [r, g, b] = freqToSynColor(node.hz);
    const nr = 5 + amp * 52;
    const alpha = amp * 0.52;

    const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, nr);
    grad.addColorStop(0,   `rgba(${r},${g},${b},${alpha.toFixed(3)})`);
    grad.addColorStop(0.5, `rgba(${r},${g},${b},${(alpha * 0.25).toFixed(3)})`);
    grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(node.x - nr, node.y - nr, nr * 2, nr * 2);
  }

  ctx.globalCompositeOperation = prevOp;
}

// ─── Beat rings ────────────────────────────────────────────────────────────────

/**
 * Draw expanding concentric rings at band zone centers triggered by beat peaks.
 */
export function drawSynRings(ctx: CanvasRenderingContext2D, rings: SynRing[]): void {
  if (rings.length === 0) return;
  const prevOp = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'screen';

  for (const ring of rings) {
    const t = ring.life / ring.maxLife;      // 1 at spawn → 0 at death
    const alpha = t * t * 0.65;
    if (alpha < 0.004) continue;

    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${ring.r},${ring.g},${ring.b},${alpha.toFixed(3)})`;
    ctx.lineWidth = ring.lineWidth;
    ctx.stroke();
  }

  ctx.globalCompositeOperation = prevOp;
}

// ─── Waveform layer ────────────────────────────────────────────────────────────

const WAVEFORM_CHUNKS = 16;

/**
 * Draw the time-domain waveform as a chromatic deviation line. Each horizontal
 * segment is colored by its synesthetic frequency mapping (artistic license —
 * x-position maps to frequency for color, y-position maps to amplitude).
 */
export function drawSynWaveform(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  waveData: Uint8Array,
): void {
  const w = canvas.width;
  const h = canvas.height;
  const cy = h * 0.5;
  const prevOp = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'screen';
  ctx.lineWidth = 1.5;

  const chunkW = Math.ceil(w / WAVEFORM_CHUNKS);

  for (let chunk = 0; chunk < WAVEFORM_CHUNKS; chunk++) {
    const x0 = chunk * chunkW;
    const x1 = Math.min(w, x0 + chunkW);
    const midX = (x0 + x1) * 0.5;
    const hz = (midX / w) * 20000;
    const [r, g, b] = freqToSynColor(hz);

    ctx.beginPath();
    for (let x = x0; x <= x1; x++) {
      const i = Math.floor(x / w * waveData.length);
      const v = (waveData[Math.min(i, waveData.length - 1)] - 128) / 128;
      const y = cy + v * h * 0.12;
      if (x === x0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(${r},${g},${b},0.50)`;
    ctx.stroke();
  }

  ctx.globalCompositeOperation = prevOp;
}
