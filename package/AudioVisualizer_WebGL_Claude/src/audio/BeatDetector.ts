import { getSpectralFlux } from './beatDetectorUtils';
import type { IBeatDetector } from '@types';

function gaussianRemap(x: number, min: number, max: number, stdDev = 0.5): number {
  if (x < min || x > max) return x;
  const normalized = (x - min) / (max - min);
  const mean = 0.5;
  const gauss = (t: number) => Math.exp(-0.5 * Math.pow((t - mean) / stdDev, 2));
  const curveValue = gauss(normalized);
  const remapped = curveValue / gauss(mean);
  return min + remapped * (max - min);
}

export interface BeatDetectorConfig {
  targetHz: number;
  rangeHz: number;
  octaves?: number;
  triggerDuration?: number;
  name?: string;
  onTrigger?: ((timeSinceLast: number | null) => void) | null;
  minIntervalMs?: number;
  windowSize?: number;
}

export class BeatDetector implements IBeatDetector {
  targetHz: number;
  private _rangeHz: number;
  private _octaves: number;
  private _triggerDuration: number;
  private _name: string;
  private _onTrigger: ((timeSinceLast: number | null) => void) | null;
  private _minIntervalMs: number;
  private _windowSize: number;

  private _triggerCounter: number;
  parameter: number;
  private _fluxHistory: number[];
  private _previous_EMA: number;
  private _prevFrequencyData: Float32Array | null;

  private _maxLoudness: number;
  private _avgPeakLoudness: number;
  private _numPeaksMeasured: number;
  private _avgLoudness: number;
  private _isActive: boolean;
  private _lastTriggerTime: number;
  private _framesSinceTrigger: number;

  idleDecayRate: number;
  freqDecayBias: number;
  minFluxFloor: number;

  constructor(cfg: BeatDetectorConfig) {
    this.targetHz = cfg.targetHz;
    this._rangeHz = cfg.rangeHz;
    this._octaves = cfg.octaves ?? 1;
    this._triggerDuration = cfg.triggerDuration ?? 8;
    this._name = cfg.name ?? 'unnamed';
    this._onTrigger = cfg.onTrigger ?? null;
    this._minIntervalMs = cfg.minIntervalMs ?? 0;
    this._windowSize = cfg.windowSize ?? 9;

    this._triggerCounter = 0;
    this.parameter = 0.0;
    this._fluxHistory = new Array(this._windowSize).fill(0.0);
    this._previous_EMA = 0.0;
    this._prevFrequencyData = null;

    this._maxLoudness = 0.0;
    this._avgPeakLoudness = 0.0;
    this._numPeaksMeasured = 0;
    this._avgLoudness = 0.0;
    this._isActive = false;
    this._lastTriggerTime = 0;
    this._framesSinceTrigger = 0;

    this.idleDecayRate = 2.0;
    this.freqDecayBias = 0.0;
    this.minFluxFloor = 0.0001;
  }

  get triggerDuration(): number  { return this._triggerDuration; }
  set triggerDuration(v: number) { this._triggerDuration = v; }

  get octaves(): number  { return this._octaves; }
  set octaves(v: number) { this._octaves = v; this.reset(); }

  get windowSize(): number  { return this._windowSize; }
  set windowSize(v: number) { this._windowSize = v; this.reset(); }

  get justTriggered(): boolean {
    return this._isActive && this._triggerCounter === this._triggerDuration;
  }

  get currentFlux(): number { return this._fluxHistory[Math.floor(this._fluxHistory.length / 2)]; }
  get maxLoudnessThresh(): number { return this._maxLoudness * 0.45; }
  get avgPeakThresh(): number { return this._avgPeakLoudness * 0.1; }

  updateData(analyser: AnalyserNode, context: AudioContext, frequencyData: Float32Array, minIntervalMsOverride?: number): number {
    const minIntervalMs = minIntervalMsOverride !== undefined ? minIntervalMsOverride : this._minIntervalMs;
    const loudness = getSpectralFlux(analyser, context, frequencyData, this._prevFrequencyData,
                                     this.targetHz, this._rangeHz, this._octaves);

    this._framesSinceTrigger++;
    const _idleRamp = Math.min(1.0, Math.max(0, (this._framesSinceTrigger - 90) / 240));
    const _freqNorm = Math.log2(Math.max(2, this.targetHz)) / Math.log2(20000);
    const _freqMult = 1 + this.freqDecayBias * (1 - _freqNorm);
    const _decayDelta = _idleRamp * this.idleDecayRate * _freqMult * 0.0025;
    this._maxLoudness     *= Math.max(0.985, 0.9995 - _decayDelta);
    this._avgPeakLoudness *= Math.max(0.9975, 0.9999 - _decayDelta * 0.15);
    this._maxLoudness = Math.max(this._maxLoudness, loudness);
    this._updateMovingAvgLoudness(loudness);

    if (!this._prevFrequencyData) this._prevFrequencyData = new Float32Array(frequencyData.length);
    this._prevFrequencyData.set(frequencyData);

    for (let i = 0; i < this._fluxHistory.length - 1; i++) {
      this._fluxHistory[i] = this._fluxHistory[i + 1];
    }
    this._fluxHistory[this._fluxHistory.length - 1] = loudness;

    const mid = Math.floor(this._fluxHistory.length / 2);
    const centerVal = this._fluxHistory[mid];
    const isPeak = centerVal > 0 && this._fluxHistory.every((v, i) => i === mid || v < centerVal);
    const loudEnough = centerVal >= Math.max(this._maxLoudness * 0.45, this._avgPeakLoudness * 0.1, this.minFluxFloor);

    if (!this._isActive && isPeak && loudEnough) {
      const now = performance.now();
      if (minIntervalMs > 0 && (now - this._lastTriggerTime) < minIntervalMs) {
        // within cooldown
      } else {
        const timeSinceLastMs = this._lastTriggerTime === 0 ? null : Math.round(now - this._lastTriggerTime);
        this._lastTriggerTime = now;
        this._framesSinceTrigger = 0;
        if (this._onTrigger) {
          try { this._onTrigger(timeSinceLastMs); } catch (e) { console.error('[BeatDetector] onTrigger error:', e); }
        }
        this._updateMovingPeakAvg(centerVal);
        this._isActive = true;
        this._triggerCounter = this._triggerDuration;
        const triggerRatio = this._triggerCounter / this._triggerDuration;
        this.parameter = gaussianRemap(triggerRatio, 0, 1);
      }
    } else if (this._isActive) {
      this._triggerCounter--;
      const triggerRatio = this._triggerCounter / this._triggerDuration;
      this.parameter = gaussianRemap(triggerRatio, 0, 1);
      if (this._triggerCounter <= 0) {
        this._triggerCounter = this._triggerDuration;
        this._isActive = false;
        this.parameter = 0.0;
      }
    }

    this._previous_EMA = loudness;
    return this._isActive ? this.parameter : 0.0;
  }

  private _updateMovingAvgLoudness(v: number) {
    const alpha = 0.005;
    this._avgLoudness = alpha * v + (1 - alpha) * this._avgLoudness;
  }

  private _updateMovingPeakAvg(v: number) {
    this._numPeaksMeasured += 1;
    this._avgPeakLoudness += (v - this._avgPeakLoudness) / this._numPeaksMeasured;
  }

  reset() {
    this._triggerCounter = 0;
    this.parameter = 0.0;
    this._fluxHistory = new Array(this._windowSize).fill(0.0);
    this._previous_EMA = 0.0;
    this._prevFrequencyData = null;
    this._maxLoudness = 0.0;
    this._avgPeakLoudness = 0.0;
    this._numPeaksMeasured = 0;
    this._avgLoudness = 0.0;
    this._isActive = false;
    this._lastTriggerTime = 0;
    this._framesSinceTrigger = 0;
  }
}
