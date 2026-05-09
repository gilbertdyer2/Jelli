import { get } from 'svelte/store';

// Audio
import {
  liveAnalyser,
  liveContext,
  liveFreqData,
  subD,
  flashDetector,
  particleTrigDetector,
  rippleDetector,
  bgRandDetector,
  lrLeftDetector,
  lrRightDetector,
  lrLeftAnalyser,
  lrRightAnalyser,
  lrLeftFreqData,
  lrRightFreqData,
  ensureDetectors,
} from '@audio/audioEngine';

// Snapshot / stores
import { initStoreSnapshots, P } from '@renderer/snapshot';
import { blobs, clams } from '@stores/creatures';
import { beatLogEntries, streaming } from '@stores/ui';

// Creature factories
import { initBlobs, reinitBlobs } from '@creatures/blobFactory';
import { reinitClams } from '@creatures/clamFactory';

// Trigger effects — also holds shockwaves / polygonFlashes / sparks arrays
import {
  triggerBlobBeat,
  triggerClamBeat,
  shockwaves,
  polygonFlashes,
  sparks,
  ripples,
  spawnRipple,
} from '@creatures/triggerEffects';

// Update systems (updateSystems.ts — must be provided separately)
import {
  updateBlobs,
  updateClams,
  updateSpotlights,
} from '@renderer/updateSystems';

// Draw modules
import { drawBackground, setEffectiveBg, triggerBgRand, updateBgRand } from '@renderer/drawBackground';
import { drawBlobs }             from '@renderer/drawBlobs';
import { drawClams }             from '@renderer/drawClams';
import {
  drawShockwaves,
  drawPolygonFlashes,
  drawSparks,
  drawRipples,
} from '@renderer/drawEffects';
import { drawSpotlights }        from '@renderer/drawSpotlights';
import { drawDuoLinks, updateDuoLinks } from '@renderer/drawDuoLinks';
import {
  initUnderwater,
  updateUnderwater,
  drawUnderwater,
  triggerBlobFlash,
  triggerLRFlash,
  triggerParticleCurrent,
} from '@renderer/drawUnderwater';
import { applyDitherFilter }     from '@renderer/drawDither';

// Utils
import { rand } from '@utils/math';

// Types
import type { BlobCreature, ClamCreature } from '@types';

export class Renderer {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _ctx:    CanvasRenderingContext2D;

  private _rafId:         number = 0;
  private _lastFrameTime: number = 0;
  private _frameCount:    number = 0;

  // Background energy EMA
  private _bgEnergySmooth: number = 0;
  private _timeDomainBuf:  Uint8Array | null = null;

  // L/R mode — last trigger timestamps (ms, performance.now())
  private _lrLeftLastTrig:  number = -Infinity;
  private _lrRightLastTrig: number = -Infinity;

  // Bound handlers — stored so they can be removed on stop()
  private readonly _onResize:       () => void;
  private readonly _onBeforeUnload: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Renderer: could not get 2D context from canvas');
    this._ctx = ctx;

    this._onResize       = () => this._handleResize();
    this._onBeforeUnload = () => this.stop();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Initialise all subsystems. Call once before start(). */
  init(): void {
    initStoreSnapshots();
    this.resizeCanvas();
    initBlobs(this._canvas.width, this._canvas.height);
    reinitClams(this._canvas.width, this._canvas.height);
    initUnderwater(this._canvas);
    ensureDetectors();
  }

  /** Start the requestAnimationFrame render loop. */
  start(): void {
    window.addEventListener('resize',       this._onResize);
    window.addEventListener('beforeunload', this._onBeforeUnload);
    this._lastFrameTime = performance.now();
    this._rafId = requestAnimationFrame((t) => this._loop(t));
  }

  /** Cancel the render loop and remove window listeners. */
  stop(): void {
    if (this._rafId !== 0) {
      cancelAnimationFrame(this._rafId);
      this._rafId = 0;
    }
    window.removeEventListener('resize',       this._onResize);
    window.removeEventListener('beforeunload', this._onBeforeUnload);
  }

  /** Resize canvas to current window dimensions. */
  resizeCanvas(): void {
    this._canvas.width  = window.innerWidth;
    this._canvas.height = window.innerHeight;
  }

  /**
   * Return the first blob or clam whose center is within 130 px of (x, y),
   * or null if there is none.
   */
  getCreatureUnderCursor(x: number, y: number): BlobCreature | ClamCreature | null {
    for (const b of get(blobs)) {
      if (Math.hypot(b.cx - x, b.cy - y) < 130) return b;
    }
    for (const c of get(clams)) {
      if (Math.hypot(c.cx - x, c.cy - y) < 130) return c;
    }
    return null;
  }

  /** Smoothed background RMS energy in [0, 1]. Readable by external modules. */
  get bgEnergySmooth(): number {
    return this._bgEnergySmooth;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _handleResize(): void {
    this.resizeCanvas();
    reinitBlobs(this._canvas.width, this._canvas.height);
    reinitClams(this._canvas.width, this._canvas.height);
    initUnderwater(this._canvas);
  }

  // ---------------------------------------------------------------------------
  // Render loop
  // ---------------------------------------------------------------------------

  private _loop(now: number): void {
    const dt = now - this._lastFrameTime;
    this._lastFrameTime = now;
    this._tick(dt);
    this._rafId = requestAnimationFrame((t) => this._loop(t));
  }

  private _tick(rawDt: number): void {
    const dt    = Math.min(rawDt, 50);
    const dtF   = (dt / 16.7) * P.TIMESCALE;
    const ctx    = this._ctx;
    const canvas = this._canvas;
    const isStreaming = get(streaming);

    // ---- 1. Audio data update (streaming mode) ----------------------------
    // Capture module-level lets into locals so TypeScript can narrow past null.
    const _analyser  = liveAnalyser;
    const _actx      = liveContext;
    const _freqData  = liveFreqData;

    if (isStreaming && _analyser !== null && _actx !== null && _freqData !== null) {
      _analyser.getFloatFrequencyData(_freqData);

      // Update each blob's detector
      const bs = get(blobs);
      for (const blob of bs) {
        if (blob.detector) {
          blob.detector.updateData(_analyser, _actx, _freqData);
        }
      }

      // Update subD background detector
      if (subD) {
        subD.updateData(_analyser, _actx, _freqData);
      }

      // Flash detector → underwater caustic flash
      if (flashDetector) {
        flashDetector.updateData(_analyser, _actx, _freqData);
        if (flashDetector.justTriggered) {
          triggerBlobFlash();
        }
      }

      // Particle trigger detector → start fade-in phase
      if (particleTrigDetector) {
        particleTrigDetector.updateData(_analyser, _actx, _freqData);
        if (particleTrigDetector.justTriggered) {
          triggerParticleCurrent();
        }
      }

      // BG randomize detector → fade to random color within ±range
      if (bgRandDetector && P.BG_RANDOMIZE_ENABLED) {
        bgRandDetector.updateData(_analyser, _actx, _freqData);
        if (bgRandDetector.justTriggered) {
          const range = P.BG_RANDOMIZE_RANGE;
          triggerBgRand(
            Math.max(0, Math.min(255, Math.round(P.BG_R + rand(-range, range)))),
            Math.max(0, Math.min(255, Math.round(P.BG_G + rand(-range, range)))),
            Math.max(0, Math.min(255, Math.round(P.BG_B + rand(-range, range)))),
          );
        }
      }

      // Ripple detector → spawn water ripple
      if (rippleDetector && P.RIPPLE_ENABLED) {
        rippleDetector.updateData(_analyser, _actx, _freqData);
        if (rippleDetector.justTriggered) {
          spawnRipple(canvas.width, canvas.height);
        }
      }

      // L/R stereo detectors
      const _lrLA = lrLeftAnalyser;
      const _lrRA = lrRightAnalyser;
      const _lrLF = lrLeftFreqData;
      const _lrRF = lrRightFreqData;
      if (P.LR_MODE_ENABLED && lrLeftDetector && lrRightDetector &&
          _lrLA !== null && _lrRA !== null && _lrLF !== null && _lrRF !== null) {
        _lrLA.getFloatFrequencyData(_lrLF);
        _lrRA.getFloatFrequencyData(_lrRF);
        lrLeftDetector.updateData(_lrLA, _actx, _lrLF);
        lrRightDetector.updateData(_lrRA, _actx, _lrRF);

        const nowLR    = performance.now();
        const leftJust  = lrLeftDetector.justTriggered;
        const rightJust = lrRightDetector.justTriggered;
        if (leftJust)  this._lrLeftLastTrig  = nowLR;
        if (rightJust) this._lrRightLastTrig = nowLR;
        // Fire L/R flash only when one side triggered exclusively
        if (leftJust  && !rightJust && nowLR - this._lrRightLastTrig > P.LR_WINDOW_MS) {
          triggerLRFlash('left',  canvas.width);
          const lrMs = Date.now();
          const lrT  = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
          this._pushBeatLog({ id: lrMs + 50000, time: lrT, name: '← L', color: `rgb(${P.LR_LEFT_R},${P.LR_LEFT_G},${P.LR_LEFT_B})`, ivl: '' });
        }
        if (rightJust && !leftJust  && nowLR - this._lrLeftLastTrig  > P.LR_WINDOW_MS) {
          triggerLRFlash('right', canvas.width);
          const lrMs = Date.now();
          const lrT  = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
          this._pushBeatLog({ id: lrMs + 50001, time: lrT, name: 'R →', color: `rgb(${P.LR_RIGHT_R},${P.LR_RIGHT_G},${P.LR_RIGHT_B})`, ivl: '' });
        }
      }
    }

    // ---- 2. Compute bgEnergySmooth -----------------------------------------
    let rmsEnergy = 0;
    if (isStreaming && _analyser !== null) {
      const bufLen = _analyser.fftSize;
      if (!this._timeDomainBuf || this._timeDomainBuf.length !== bufLen) {
        this._timeDomainBuf = new Uint8Array(bufLen);
      }
      _analyser.getByteTimeDomainData(this._timeDomainBuf);
      let sumSq = 0;
      for (let i = 0; i < bufLen; i++) {
        const v = (this._timeDomainBuf[i] - 128) / 128;
        sumSq += v * v;
      }
      rmsEnergy = Math.sqrt(sumSq / bufLen);
    }
    this._bgEnergySmooth = this._bgEnergySmooth * 0.88 + rmsEnergy * 0.12;

    // ---- 3. Background -------------------------------------------------------
    if (P.BG_RANDOMIZE_ENABLED) {
      updateBgRand(dt);
    } else {
      setEffectiveBg(P.BG_R, P.BG_G, P.BG_B);
    }
    drawBackground(ctx, canvas, this._frameCount, this._bgEnergySmooth, subD);

    // ---- 4. Underwater update + draw ----------------------------------------
    updateUnderwater(dt, canvas, this._bgEnergySmooth);
    drawUnderwater(ctx);

    // ---- 5. Beat triggers ----------------------------------------------------
    const bs = get(blobs);
    const cs = get(clams);
    const nowMs  = Date.now();
    const timeStr = new Date().toLocaleTimeString('en-US', {
      hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

    for (let i = 0; i < bs.length; i++) {
      const blob = bs[i];
      if (blob.detector?.justTriggered) {
        triggerBlobBeat(i);
        this._pushBeatLog({ id: nowMs + i, time: timeStr, name: blob.name, color: blob.color, ivl: '' });
      }
    }
    for (let i = 0; i < cs.length; i++) {
      const clam = cs[i];
      if (clam.detector?.justTriggered) {
        triggerClamBeat(i);
        this._pushBeatLog({ id: nowMs + bs.length + i, time: timeStr, name: clam.name, color: clam.color, ivl: '' });
      }
    }

    // ---- 6. Spotlight + duo-link updates ------------------------------------
    updateSpotlights(dt, dtF);
    updateDuoLinks(dt, dtF);

    // ---- 7. Physics update ---------------------------------------------------
    updateBlobs(canvas.width, canvas.height, dtF);
    updateClams(canvas.width, canvas.height, dtF);

    // ---- 8. Draw all creatures and effects ----------------------------------
    const allCreatures = [...bs, ...cs];

    drawSpotlights(ctx, allCreatures);
    drawDuoLinks(ctx);

    drawClams(ctx, cs);
    drawBlobs(ctx, bs);

    drawRipples(ctx, ripples, dtF);
    drawShockwaves(ctx, shockwaves, dtF);
    drawPolygonFlashes(ctx, polygonFlashes, dtF);
    drawSparks(ctx, sparks, dtF);

    // ---- 9. Post-processing --------------------------------------------------
    applyDitherFilter(ctx, canvas);

    this._frameCount++;
  }

  // ---------------------------------------------------------------------------
  // Beat log
  // ---------------------------------------------------------------------------

  private _pushBeatLog(entry: { id: number; time: string; name: string; color: string; ivl: string }): void {
    beatLogEntries.update(entries => {
      const next = [entry, ...entries];
      return next.length > 40 ? next.slice(0, 40) : next;
    });
  }
}
