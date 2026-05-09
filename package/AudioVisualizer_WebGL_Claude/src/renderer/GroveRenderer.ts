import { get } from 'svelte/store';
import { liveAnalyser } from '@audio/audioEngine';
import { freqToSynColor } from '@utils/synColors';
import {
  GROVE_GROW_SPEED, GROVE_MAX_DEPTH, GROVE_SWAY_ENABLED, GROVE_SWAY_SPEED,
  GROVE_BLOSSOM_ENABLED, GROVE_PULSE_ENABLED, GROVE_SPREAD_ANGLE, GROVE_GLOW_INTENSITY,
} from '@stores/grove';
import {
  drawGroveBackground, drawTreeSegments, drawBlossomParticles, drawGroveGround,
  type TreeSegment, type EnergyPulse, type BlossomParticle,
} from '@renderer/drawGrove';

// ─── Constants ─────────────────────────────────────────────────────────────────

const NUM_BINS = 1024;
const NYQUIST  = 22050;
const BASE_GROW_SPEED = 0.00030;  // growT per ms (full growth in ~3.3 s at 1× audio boost)

interface TreeDef {
  hz0: number; hz1: number;
  xFrac: number;          // horizontal position as fraction of canvas width
  lean: number;           // angle offset from -π/2 (toward center, in radians)
  baseLenFrac: number;    // trunk length as fraction of canvas height
}

const TREE_DEFS: TreeDef[] = [
  { hz0: 80,   hz1: 200,  xFrac: 0.50, lean: 0,     baseLenFrac: 0.22 },  // center — bass
  { hz0: 500,  hz1: 1500, xFrac: 0.28, lean: 0.12,  baseLenFrac: 0.17 },  // left   — mid
  { hz0: 4000, hz1: 8000, xFrac: 0.72, lean: -0.12, baseLenFrac: 0.14 },  // right  — high
];

// Length of each branch = parent.length × DEPTH_LEN_FACTORS[depth]
const DEPTH_LEN_FACTORS = [1.0, 0.60, 0.62, 0.65, 0.68];

// Base lineWidth per (tree, depth)
const DEPTH_THICKNESS: [number, number, number, number, number][] = [
  [7, 4, 2.5, 1.4, 0.8],    // tree 0 (center)
  [5, 3, 1.8, 1.0, 0.6],    // tree 1 (left)
  [3.5, 2, 1.2, 0.7, 0.4],  // tree 2 (right)
];

// Peak sway angle (radians) per depth — increases toward tips
const DEPTH_SWAY_AMPS = [0.008, 0.018, 0.030, 0.048, 0.068];

// ─── Audio helpers ─────────────────────────────────────────────────────────────

function hzToBin(hz: number): number {
  return Math.min(NUM_BINS - 1, Math.max(0, Math.round((hz * NUM_BINS) / NYQUIST)));
}

function getBandAmp(data: Float32Array, binLo: number, binHi: number): number {
  const lo = Math.max(0, binLo);
  const hi = Math.min(NUM_BINS, binHi);
  if (hi <= lo) return 0;
  let sum = 0;
  for (let i = lo; i < hi; i++) {
    const db = data[i];
    if (db > -94) sum += Math.pow(10, db / 20);
  }
  return Math.min(1, (sum / (hi - lo)) / 0.12);
}

// ─── GroveRenderer ─────────────────────────────────────────────────────────────

export class GroveRenderer {
  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;
  private _rafId: number | null = null;
  private _lastT  = 0;
  private _elapsed = 0;

  private _freqData = new Float32Array(NUM_BINS);

  // Tree state
  private _segments: TreeSegment[]               = [];
  private _starts:   { x: number; y: number }[]  = [];
  private _tips:     { x: number; y: number }[]  = [];
  private _pulses:   EnergyPulse[]               = [];
  private _blossoms: BlossomParticle[]           = [];

  // Audio state — one entry per tree (indexed by TREE_DEFS)
  private _treeSmooths  = [0, 0, 0];
  private _peakHistory: number[][] = [[], [], []];
  private _lastPeakT    = [0, 0, 0];
  private _energySmooth = 0;

  // Cached store values
  private _growSpeed      = 1.0;
  private _maxDepth       = 4;
  private _swayEnabled    = true;
  private _swaySpeed      = 1.0;
  private _blossomEnabled = true;
  private _pulseEnabled   = true;
  private _spreadAngle    = 26;
  private _glowIntensity  = 1.0;

  private _unsubs: Array<() => void> = [];

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._ctx    = canvas.getContext('2d')!;
  }

  init(): void {
    this._resizeCanvas();

    this._growSpeed      = get(GROVE_GROW_SPEED);
    this._maxDepth       = get(GROVE_MAX_DEPTH);
    this._swayEnabled    = get(GROVE_SWAY_ENABLED);
    this._swaySpeed      = get(GROVE_SWAY_SPEED);
    this._blossomEnabled = get(GROVE_BLOSSOM_ENABLED);
    this._pulseEnabled   = get(GROVE_PULSE_ENABLED);
    this._spreadAngle    = get(GROVE_SPREAD_ANGLE);
    this._glowIntensity  = get(GROVE_GLOW_INTENSITY);

    this._initTrees();

    this._unsubs = [
      GROVE_GROW_SPEED.subscribe(v      => { this._growSpeed      = v; }),
      GROVE_MAX_DEPTH.subscribe(v       => { this._maxDepth       = v; this._initTrees(); }),
      GROVE_SWAY_ENABLED.subscribe(v    => { this._swayEnabled    = v; }),
      GROVE_SWAY_SPEED.subscribe(v      => { this._swaySpeed      = v; }),
      GROVE_BLOSSOM_ENABLED.subscribe(v => { this._blossomEnabled = v; }),
      GROVE_PULSE_ENABLED.subscribe(v   => { this._pulseEnabled   = v; }),
      GROVE_SPREAD_ANGLE.subscribe(v    => { this._spreadAngle    = v; }),
      GROVE_GLOW_INTENSITY.subscribe(v  => { this._glowIntensity  = v; }),
    ];

    window.addEventListener('resize', this._onResize);
  }

  start(): void {
    this._lastT = performance.now();
    this._rafId = requestAnimationFrame(t => this._tick(t));
  }

  stop(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._unsubs.forEach(u => u());
    window.removeEventListener('resize', this._onResize);
  }

  private _onResize = (): void => {
    this._resizeCanvas();
    this._initTrees();
  };

  private _resizeCanvas(): void {
    const w = this._canvas.clientWidth  || window.innerWidth;
    const h = this._canvas.clientHeight || window.innerHeight;
    this._canvas.width  = w;
    this._canvas.height = h;
  }

  // ── Tree initialization ────────────────────────────────────────────────────

  private _initTrees(): void {
    this._segments = [];
    this._starts   = [];
    this._tips     = [];
    this._pulses   = [];
    this._blossoms = [];
    this._treeSmooths  = [0, 0, 0];
    this._peakHistory  = [[], [], []];
    this._lastPeakT    = [0, 0, 0];
    this._energySmooth = 0;

    const cW = this._canvas.width;
    const cH = this._canvas.height;

    for (let ti = 0; ti < 3; ti++) {
      const def = TREE_DEFS[ti];
      const seedX     = cW * def.xFrac;
      const seedY     = cH;
      const baseAngle = -Math.PI / 2 + def.lean;
      const length    = cH * def.baseLenFrac;

      const [r, g, b] = freqToSynColor(def.hz0);  // root = base of Hz range

      this._pushSegment({
        parentIdx:  -1,
        treeIdx:    ti,
        depth:      0,
        baseAngle,
        length,
        growT:      0,
        growSpeed:  BASE_GROW_SPEED,
        thickness:  DEPTH_THICKNESS[ti][0],
        r, g, b,
        swayPhase:  Math.random() * Math.PI * 2,
        swayFreq:   0.0010 + Math.random() * 0.0006,
        swayAmp:    DEPTH_SWAY_AMPS[0],
        spawned:    false,
        blossomed:  false,
        seedX,
        seedY,
      });
    }
  }

  private _pushSegment(seg: TreeSegment): void {
    this._segments.push(seg);
    this._starts.push({ x: 0, y: 0 });
    this._tips.push({ x: 0, y: 0 });
  }

  // ── Main loop ─────────────────────────────────────────────────────────────

  private _tick(t: DOMHighResTimeStamp): void {
    const dt = Math.min(50, t - this._lastT);
    this._lastT   = t;
    this._elapsed += dt;

    this._updateAudio();
    this._updateBands(t, dt);
    this._updateSegments(dt);
    this._computePositions(t);
    this._updatePulses(dt);
    this._updateBlossoms(dt);
    this._draw();

    this._rafId = requestAnimationFrame(t2 => this._tick(t2));
  }

  // ── Audio ──────────────────────────────────────────────────────────────────

  private _updateAudio(): void {
    if (liveAnalyser) liveAnalyser.getFloatFrequencyData(this._freqData);
  }

  private _updateBands(t: DOMHighResTimeStamp, dt: number): void {
    const hasAudio = liveAnalyser !== null;
    let totalAmp   = 0;

    for (let ti = 0; ti < 3; ti++) {
      const def = TREE_DEFS[ti];
      let amp: number;

      if (hasAudio) {
        amp = getBandAmp(this._freqData, hzToBin(def.hz0), hzToBin(def.hz1));
      } else {
        // Idle breathing animation
        amp = 0.06 + 0.03 * Math.sin(this._elapsed * 0.0004 + ti * 1.2);
      }

      this._treeSmooths[ti] = this._treeSmooths[ti] * 0.88 + amp * 0.12;
      totalAmp += amp;

      // Peak detection (9-frame window, center-max)
      const hist = this._peakHistory[ti];
      hist.push(amp);
      if (hist.length > 9) hist.shift();

      if (hasAudio && hist.length === 9) {
        const center = hist[4];
        const isPeak = center > 0.22 && hist.every((v, idx) => idx === 4 || v <= center);
        if (isPeak && t - this._lastPeakT[ti] > 300) {
          this._lastPeakT[ti] = t;
          this._onBandPeak(ti);
        }
      }
    }

    this._energySmooth = this._energySmooth * 0.94 + (totalAmp / 3) * 0.06;
  }

  private _onBandPeak(bandIdx: number): void {
    const intensity = 0.55 + 0.45 * this._treeSmooths[bandIdx];
    const speed     = 0.0035 + Math.random() * 0.0020;

    if (this._pulseEnabled) {
      if (bandIdx === 0) {
        // Bass peak — pulse radiates out to all trees
        for (let ti = 0; ti < 3; ti++) {
          this._pulses.push({
            treeIdx: ti,
            depthProgress: 0,
            speed,
            intensity: intensity * (ti === 0 ? 1.0 : 0.55),
          });
        }
      } else {
        // Mid/high peak — pulse on driving tree only
        this._pulses.push({ treeIdx: bandIdx, depthProgress: 0, speed, intensity });
      }
    }

    // High-freq peak → blossom bursts at leaf tips
    if (bandIdx === 2 && this._blossomEnabled) {
      this._fireBlossoms(2, 1.0);
      if (Math.random() < 0.30) this._fireBlossoms(0, 0.55);
      if (Math.random() < 0.30) this._fireBlossoms(1, 0.55);
    }
  }

  private _fireBlossoms(treeIdx: number, intensityScale: number): void {
    const maxDepth = this._maxDepth;
    const leaves: number[] = [];
    for (let i = 0; i < this._segments.length; i++) {
      const seg = this._segments[i];
      if (seg.treeIdx === treeIdx && seg.depth === maxDepth && seg.growT >= 0.88) {
        leaves.push(i);
      }
    }
    if (leaves.length === 0) return;

    const leafIdx = leaves[Math.floor(Math.random() * leaves.length)];
    const tip = this._tips[leafIdx];
    const seg = this._segments[leafIdx];

    const count = 12 + Math.floor(Math.random() * 9);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.5 + Math.random() * 1.5) * intensityScale;
      const life  = 1200 + Math.random() * 1300;
      this._blossoms.push({
        x: tip.x, y: tip.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.35,  // slight upward bias
        life, maxLife: life,
        r: seg.r, g: seg.g, b: seg.b,
        size: 1.4 + Math.random() * 2.6,
        rotation: Math.random() * Math.PI * 2,
      });
    }
  }

  // ── Segment growth & branching ─────────────────────────────────────────────

  private _updateSegments(dt: number): void {
    const maxDepth = this._maxDepth;
    const n = this._segments.length;  // snapshot — new children appended after

    for (let i = 0; i < n; i++) {
      const seg = this._segments[i];
      const amp   = this._treeSmooths[seg.treeIdx];
      const boost = 1 + 5 * amp;
      seg.growT = Math.min(1, seg.growT + seg.growSpeed * this._growSpeed * boost * dt);

      if (!seg.spawned && seg.growT >= 0.88 && seg.depth < maxDepth) {
        seg.spawned = true;
        this._spawnChildren(i, seg);
      }
    }
  }

  private _spawnChildren(parentIdx: number, parent: TreeSegment): void {
    const childDepth = parent.depth + 1;
    if (childDepth > this._maxDepth) return;

    const spreadRad  = (this._spreadAngle + parent.depth * 4) * (Math.PI / 180);
    const jitterRad  = () => Math.random() * (10 * Math.PI / 180);

    const angles = [
      parent.baseAngle - spreadRad - jitterRad(),
      parent.baseAngle + spreadRad + jitterRad(),
    ];

    const ti       = parent.treeIdx;
    const def      = TREE_DEFS[ti];
    const childLen = parent.length * DEPTH_LEN_FACTORS[childDepth];

    // Synesthetic color: log-interpolate through tree's Hz range by depth fraction
    const hz = def.hz0 * Math.pow(def.hz1 / def.hz0, childDepth / this._maxDepth);
    const [r, g, b] = freqToSynColor(hz);

    for (const angle of angles) {
      this._pushSegment({
        parentIdx,
        treeIdx:   ti,
        depth:     childDepth,
        baseAngle: angle,
        length:    childLen,
        growT:     0,
        growSpeed: BASE_GROW_SPEED,
        thickness: DEPTH_THICKNESS[ti][childDepth],
        r, g, b,
        swayPhase: Math.random() * Math.PI * 2,
        swayFreq:  0.0010 + Math.random() * 0.0006,
        swayAmp:   DEPTH_SWAY_AMPS[childDepth],
        spawned:   false,
        blossomed: false,
        seedX: 0,
        seedY: 0,
      });
    }
  }

  // ── World position computation ─────────────────────────────────────────────

  private _computePositions(t: number): void {
    for (let i = 0; i < this._segments.length; i++) {
      const seg = this._segments[i];
      const sx = seg.parentIdx < 0 ? seg.seedX : this._tips[seg.parentIdx].x;
      const sy = seg.parentIdx < 0 ? seg.seedY : this._tips[seg.parentIdx].y;

      const angle = this._swayEnabled
        ? seg.baseAngle + seg.swayAmp * Math.sin(seg.swayPhase + t * seg.swayFreq * this._swaySpeed)
        : seg.baseAngle;

      this._starts[i].x = sx;
      this._starts[i].y = sy;
      this._tips[i].x   = sx + Math.cos(angle) * seg.length * seg.growT;
      this._tips[i].y   = sy + Math.sin(angle) * seg.length * seg.growT;
    }
  }

  // ── Pulse & blossom simulation ─────────────────────────────────────────────

  private _updatePulses(dt: number): void {
    const limit = this._maxDepth + 1;
    for (let i = this._pulses.length - 1; i >= 0; i--) {
      const p = this._pulses[i];
      p.depthProgress += p.speed * dt;
      if (p.depthProgress >= limit) this._pulses.splice(i, 1);
    }
  }

  private _updateBlossoms(dt: number): void {
    const GRAVITY = 0.00055;  // px/ms²
    for (let i = this._blossoms.length - 1; i >= 0; i--) {
      const b = this._blossoms[i];
      b.life -= dt;
      if (b.life <= 0) { this._blossoms.splice(i, 1); continue; }
      b.vy += GRAVITY * dt;
      b.x  += b.vx * dt;
      b.y  += b.vy * dt;
      b.rotation += 0.0025 * dt;
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  private _draw(): void {
    const ctx    = this._ctx;
    const canvas = this._canvas;

    drawGroveBackground(ctx, canvas, this._energySmooth);
    drawGroveGround(ctx, canvas, this._treeSmooths);
    drawTreeSegments(
      ctx, this._segments, this._starts, this._tips,
      this._pulses, this._glowIntensity, this._maxDepth,
    );
    drawBlossomParticles(ctx, this._blossoms);
  }
}
