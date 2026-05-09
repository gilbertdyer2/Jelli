import { P } from './snapshot';
import type { BeatDetector } from '@audio/BeatDetector';

// Effective BG color — mirrors P.BG_* when randomize is off, updated by fade state machine.
let _effR = 96, _effG = 123, _effB = 123;
export function setEffectiveBg(r: number, g: number, b: number): void {
  _effR = r; _effG = g; _effB = b;
}

// BG randomize fade state machine
let _bgRandTargetR = 96, _bgRandTargetG = 123, _bgRandTargetB = 123;
let _bgRandT       = 0;
let _bgRandPhase: 'idle' | 'in' | 'out' = 'idle';
let _bgRandElapsed = 0;

export function triggerBgRand(r: number, g: number, b: number): void {
  _bgRandTargetR   = r; _bgRandTargetG = g; _bgRandTargetB = b;
  _bgRandT         = 0;
  _bgRandPhase     = 'in';
  _bgRandElapsed   = 0;
}

export function updateBgRand(dt: number): void {
  if (_bgRandPhase === 'in') {
    _bgRandElapsed += dt;
    _bgRandT = P.BG_RANDOMIZE_FADE_IN > 0
      ? Math.min(1, _bgRandElapsed / P.BG_RANDOMIZE_FADE_IN)
      : 1;
    if (_bgRandT >= 1) { _bgRandPhase = 'out'; _bgRandElapsed = 0; }
  } else if (_bgRandPhase === 'out') {
    _bgRandElapsed += dt;
    _bgRandT = P.BG_RANDOMIZE_FADE_OUT > 0
      ? 1 - Math.min(1, _bgRandElapsed / P.BG_RANDOMIZE_FADE_OUT)
      : 0;
    if (_bgRandT <= 0) { _bgRandT = 0; _bgRandPhase = 'idle'; }
  }
  if (_bgRandT > 0) {
    const t = Math.pow(_bgRandT, P.BG_RANDOMIZE_SLOPE);
    _effR = Math.round(P.BG_R + t * (_bgRandTargetR - P.BG_R));
    _effG = Math.round(P.BG_G + t * (_bgRandTargetG - P.BG_G));
    _effB = Math.round(P.BG_B + t * (_bgRandTargetB - P.BG_B));
  } else {
    _effR = P.BG_R; _effG = P.BG_G; _effB = P.BG_B;
  }
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  frameCount: number,
  bgEnergySmooth: number,
  subD: BeatDetector | null
) {
  if (frameCount === 0) {
    ctx.fillStyle = `rgb(${_effR},${_effG},${_effB})`;
  } else {
    ctx.fillStyle = `rgba(${_effR},${_effG},${_effB},${P.BG_TRAIL_ALPHA})`;
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (bgEnergySmooth > 0.001 && P.BG_ENERGY_MAX_ALPHA > 0) {
    ctx.fillStyle = `rgba(255,255,255,${(bgEnergySmooth * P.BG_ENERGY_MAX_ALPHA).toFixed(4)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (subD && subD.parameter > 0) {
    const a     = subD.parameter;
    const cW    = canvas.width;
    const cH    = canvas.height;
    const bandH = cH * P.SUB_BAND_HEIGHT;
    const grad  = ctx.createLinearGradient(0, cH - bandH, 0, cH);
    const col   = `${P.SUB_R | 0}, ${P.SUB_G | 0}, ${P.SUB_B | 0}`;
    grad.addColorStop(0, `rgba(${col}, 0)`);
    grad.addColorStop(1, `rgba(${col}, ${(a * P.SUB_MAX_ALPHA).toFixed(3)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, cH - bandH, cW, bandH);
  }
}
