import { get } from 'svelte/store';
import { liveAnalyser, lrLeftAnalyser, lrRightAnalyser } from '@audio/audioEngine';
import { freqToSynColor } from '@utils/synColors';
import {
  initSynScatter,
  drawSynBlooms,
  drawSynScatter,
  drawSynRings,
  drawSynWaveform,
  type SynBand,
  type SynRing,
} from '@renderer/drawSynField';
import {
  initSynParticles,
  updateSynParticles,
  drawSynParticles,
} from '@renderer/drawSynParticles';
import {
  SYN_BLOOM_ENABLED,
  SYN_SCATTER_ENABLED,
  SYN_PARTICLES_ENABLED,
  SYN_RINGS_ENABLED,
  SYN_WAVEFORM_ENABLED,
  SYN_BLOOM_INTENSITY,
  SYN_SCATTER_COUNT,
  SYN_RING_SPEED,
  SYN_RING_LIFETIME,
} from '@stores/synesthesia';

// ─── Band definitions ─────────────────────────────────────────────────────────
// Each entry maps a Hz range to a vertical zone position (zy: 0=top, 1=bottom).
// Bass sits at the bottom, treble at the top — a canonical synesthetic layout.

const NYQUIST = 22050;
const NUM_BINS = 1024;

const BAND_DEFS: Array<{ hz0: number; hz1: number; zy: number }> = [
  { hz0: 20,    hz1: 80,    zy: 0.88 },  // sub-bass  — deep violet
  { hz0: 80,    hz1: 200,   zy: 0.75 },  // bass      — crimson
  { hz0: 200,   hz1: 500,   zy: 0.62 },  // low-mid   — amber
  { hz0: 500,   hz1: 1500,  zy: 0.50 },  // mid       — gold/green
  { hz0: 1500,  hz1: 4000,  zy: 0.38 },  // upper-mid — cyan-green
  { hz0: 4000,  hz1: 8000,  zy: 0.26 },  // high      — sky blue
  { hz0: 8000,  hz1: 14000, zy: 0.16 },  // presence  — blue-violet
  { hz0: 14000, hz1: 20000, zy: 0.08 },  // air       — magenta/silver
];

function hzToBin(hz: number): number {
  return Math.min(NUM_BINS - 1, Math.max(0, Math.round(hz * NUM_BINS / NYQUIST)));
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

// ─── SynRenderer ─────────────────────────────────────────────────────────────

export class SynRenderer {
  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;
  private _rafId: number | null = null;
  private _lastT = 0;
  private _elapsed = 0;  // accumulated ms for idle animation

  // Per-frame audio buffers (owned by this renderer)
  private _freqData     = new Float32Array(NUM_BINS);
  private _lrLeftData   = new Float32Array(NUM_BINS);
  private _lrRightData  = new Float32Array(NUM_BINS);
  private _waveData     = new Uint8Array(NUM_BINS * 2);

  private _bands: SynBand[] = [];
  private _rings: SynRing[] = [];

  // Cached store values (updated via subscriptions)
  private _bloomEnabled     = true;
  private _scatterEnabled   = true;
  private _particlesEnabled = true;
  private _ringsEnabled     = true;
  private _waveformEnabled  = false;
  private _bloomIntensity   = 1.0;
  private _scatterCount     = 64;
  private _ringSpeed        = 1.8;
  private _ringLifetime     = 950;

  private _unsubs: Array<() => void> = [];

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d')!;
  }

  init(): void {
    this._resizeCanvas();
    this._scatterCount = get(SYN_SCATTER_COUNT);
    this._initBands();
    initSynScatter(this._canvas, this._scatterCount);
    initSynParticles(this._canvas, this._bands);

    this._unsubs = [
      SYN_BLOOM_ENABLED.subscribe(v    => { this._bloomEnabled     = v; }),
      SYN_SCATTER_ENABLED.subscribe(v  => { this._scatterEnabled   = v; }),
      SYN_PARTICLES_ENABLED.subscribe(v=> { this._particlesEnabled = v; }),
      SYN_RINGS_ENABLED.subscribe(v    => { this._ringsEnabled     = v; }),
      SYN_WAVEFORM_ENABLED.subscribe(v => { this._waveformEnabled  = v; }),
      SYN_BLOOM_INTENSITY.subscribe(v  => { this._bloomIntensity   = v; }),
      SYN_SCATTER_COUNT.subscribe(v    => {
        this._scatterCount = v;
        initSynScatter(this._canvas, v);
      }),
      SYN_RING_SPEED.subscribe(v       => { this._ringSpeed        = v; }),
      SYN_RING_LIFETIME.subscribe(v    => { this._ringLifetime     = v; }),
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
    initSynScatter(this._canvas, this._scatterCount);
    // Particles keep their positions; wrapping handles out-of-bounds naturally
  };

  private _resizeCanvas(): void {
    const w = this._canvas.clientWidth  || window.innerWidth;
    const h = this._canvas.clientHeight || window.innerHeight;
    this._canvas.width  = w;
    this._canvas.height = h;
  }

  private _initBands(): void {
    this._bands = BAND_DEFS.map(def => {
      const midHz = Math.sqrt(def.hz0 * def.hz1);
      const [r, g, b] = freqToSynColor(midHz);
      const clusters = Array.from({ length: 3 }, () => ({
        dx: (Math.random() - 0.5) * 0.30,
        dy: (Math.random() - 0.5) * 0.14,
        rScale: 0.32 + Math.random() * 0.24,
      }));
      return {
        hz0: def.hz0, hz1: def.hz1,
        binLo: hzToBin(def.hz0),
        binHi: hzToBin(def.hz1),
        r, g, b,
        zx: 0.5, zy: def.zy,
        amp: 0,
        smooth: 0.06,
        peak: false,
        peakHistory: [],
        lastPeakT: 0,
        clusters,
      };
    });
  }

  private _tick(t: DOMHighResTimeStamp): void {
    const dt = Math.min(50, t - this._lastT);
    this._lastT = t;
    this._elapsed += dt;

    this._updateAudio();
    this._updateBands(t);
    this._updateRings(dt);
    if (this._particlesEnabled) {
      updateSynParticles(dt, this._canvas, this._bands);
    }
    this._draw();

    this._rafId = requestAnimationFrame(t2 => this._tick(t2));
  }

  private _updateAudio(): void {
    // liveAnalyser is a live ES-module binding — reflects startCapture() assignment
    if (liveAnalyser) {
      liveAnalyser.getFloatFrequencyData(this._freqData);
      if (this._waveformEnabled) {
        liveAnalyser.getByteTimeDomainData(this._waveData);
      }
    }
    if (lrLeftAnalyser)  lrLeftAnalyser.getFloatFrequencyData(this._lrLeftData);
    if (lrRightAnalyser) lrRightAnalyser.getFloatFrequencyData(this._lrRightData);
  }

  private _updateBands(t: DOMHighResTimeStamp): void {
    const hasAudio = liveAnalyser !== null;

    for (let i = 0; i < this._bands.length; i++) {
      const band = this._bands[i];

      let amp: number;
      if (hasAudio) {
        amp = getBandAmp(this._freqData, band.binLo, band.binHi);

        // Stereo horizontal offset: shift zone X based on L/R balance in this band
        if (lrLeftAnalyser && lrRightAnalyser) {
          const lA = getBandAmp(this._lrLeftData,  band.binLo, band.binHi);
          const rA = getBandAmp(this._lrRightData, band.binLo, band.binHi);
          const total = lA + rA;
          if (total > 0.06) {
            const balance = (rA - lA) / total;  // -1 = full left, +1 = full right
            const targetX = 0.5 + balance * 0.16;
            band.zx = band.zx * 0.97 + targetX * 0.03;  // smooth lerp
          }
        }
      } else {
        // Idle animation: gentle organic breathing per band
        amp = 0.05 + 0.028 * Math.sin(this._elapsed * 0.00042 + i * 0.73)
                  + 0.012 * Math.sin(this._elapsed * 0.00088 + i * 1.41);
        // Reset zone X to center when idle
        band.zx = band.zx * 0.98 + 0.5 * 0.02;
      }

      band.amp = amp;
      band.smooth = band.smooth * 0.88 + amp * 0.12;
      band.peak = false;

      // Peak detection (9-frame window, same pattern as BeatDetector)
      band.peakHistory.push(amp);
      if (band.peakHistory.length > 9) band.peakHistory.shift();

      if (this._ringsEnabled && hasAudio && band.peakHistory.length === 9) {
        const center = band.peakHistory[4];
        const isPeak = center > 0.20 &&
          band.peakHistory.every((v, idx) => idx === 4 || v <= center);
        if (isPeak && t - band.lastPeakT > 240) {
          band.peak = true;
          band.lastPeakT = t;
          this._spawnRings(band);
        }
      }
    }
  }

  private _spawnRings(band: SynBand): void {
    const cW = this._canvas.width;
    const cH = this._canvas.height;
    const x = band.zx * cW;
    const y = band.zy * cH;
    const maxR = cH * (0.10 + band.smooth * 0.24);

    // Primary ring
    this._rings.push({
      x, y,
      radius: 3,
      maxRadius: maxR,
      life: this._ringLifetime,
      maxLife: this._ringLifetime,
      r: band.r, g: band.g, b: band.b,
      lineWidth: 1.5 + band.smooth * 2.0,
    });
    // Echo ring — larger, slightly transparent
    this._rings.push({
      x, y,
      radius: maxR * 0.22,
      maxRadius: maxR * 1.35,
      life: this._ringLifetime * 0.70,
      maxLife: this._ringLifetime * 0.70,
      r: band.r, g: band.g, b: band.b,
      lineWidth: 1.0,
    });
  }

  private _updateRings(dt: number): void {
    for (let i = this._rings.length - 1; i >= 0; i--) {
      const ring = this._rings[i];
      ring.radius += this._ringSpeed * dt;
      ring.life   -= dt;
      if (ring.life <= 0 || ring.radius >= ring.maxRadius) {
        this._rings.splice(i, 1);
      }
    }
  }

  private _draw(): void {
    const ctx    = this._ctx;
    const canvas = this._canvas;
    const hasAudio = liveAnalyser !== null;

    // Background — near-black deep space
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#080510';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bloom layer (always shown; idle animation keeps it gently lit)
    if (this._bloomEnabled) {
      drawSynBlooms(ctx, canvas, this._bands, this._bloomIntensity);
    }

    // Scatter layer (only meaningful with live audio)
    if (this._scatterEnabled && hasAudio) {
      drawSynScatter(ctx, this._freqData);
    }

    // Flow particles
    if (this._particlesEnabled) {
      drawSynParticles(ctx, this._bands);
    }

    // Beat rings
    if (this._ringsEnabled) {
      drawSynRings(ctx, this._rings);
    }

    // Optional waveform
    if (this._waveformEnabled && hasAudio) {
      drawSynWaveform(ctx, canvas, this._waveData);
    }
  }
}
