"use strict";
import { getSpectralFlux } from './beatDetectorUtils.js';

// Gaussian remapping: makes beat-triggered effect intensity feel less linear
function gaussianRemap(x, min, max, stdDev = 0.5) {
    if (x < min || x > max) {
        console.log("[gaussianRemap] Input value out of range: (", x, ") not in [", min, ",", max, "]");
        return x;
    }
    let normalized = (x - min) / (max - min);
    const mean = 0.5;
    const gauss = t => Math.exp(-0.5 * Math.pow((t - mean) / stdDev, 2));
    let curveValue = gauss(normalized);
    let remapped = curveValue / gauss(mean);
    return min + remapped * (max - min);
}

// Single frequency-band beat detector. Monitors a target frequency band and fires
// onTrigger callbacks when spectral flux peaks exceed a dynamic threshold.
export class BeatDetector {
    constructor({ targetHz, rangeHz, octaves = 1, triggerDuration = 8, name = "unnamed", onTrigger = null, minIntervalMs = 0, windowSize = 9 }) {
        this.targetHz = targetHz;
        this._rangeHz = rangeHz;
        this._octaves = octaves;
        this._triggerDuration = triggerDuration;
        this._name = name;
        this._onTrigger = onTrigger;
        this._minIntervalMs = minIntervalMs;
        this._windowSize = windowSize;

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

        // Adaptive-decay parameters — settable at runtime from outside
        this.idleDecayRate  = 2.0;  // multiplier on how much faster max decays while idle (1 = original speed)
        this.freqDecayBias  = 0.0;  // 0 = flat; >0 gives low-freq detectors proportionally faster idle decay
        this.minFluxFloor   = 0.0001; // absolute minimum flux required to trigger — suppresses silence/noise triggers
    }

    get justTriggered() {
        return (this._isActive && this._triggerCounter === this._triggerDuration);
    }

    // Graph-readable snapshots of internal threshold state
    get currentFlux()       { return this._fluxHistory[Math.floor(this._fluxHistory.length / 2)]; }
    get maxLoudnessThresh() { return this._maxLoudness * 0.45; }
    get avgPeakThresh()     { return this._avgPeakLoudness * 0.1; }

    // Called each frame by BeatDetectorManager.update(). minIntervalMsOverride takes precedence
    // over the instance-level _minIntervalMs when provided.
    updateData(analyser, context, frequencyData, minIntervalMsOverride) {
        const minIntervalMs = (minIntervalMsOverride !== undefined) ? minIntervalMsOverride : this._minIntervalMs;
        const loudness = getSpectralFlux(analyser, context, frequencyData, this._prevFrequencyData,
                                         this.targetHz, this._rangeHz, this._octaves);

        // Adaptive decay: accelerates when no trigger has fired recently so the threshold
        // descends to meet quieter-but-consistent beats rather than staying anchored to old peaks.
        // Ramp starts after 1.5 s idle (90 frames) and reaches full speed at 5.5 s (330 frames).
        this._framesSinceTrigger++;
        const _idleRamp = Math.min(1.0, Math.max(0, (this._framesSinceTrigger - 90) / 240));
        // freqNorm: 0 at low frequencies → 1 at 20 kHz on a log scale.
        // freqMult: >1 for low-freq detectors, ≈1 at high freq, scaling idle decay rate.
        const _freqNorm   = Math.log2(Math.max(2, this.targetHz)) / Math.log2(20000);
        const _freqMult   = 1 + this.freqDecayBias * (1 - _freqNorm);
        const _decayDelta = _idleRamp * this.idleDecayRate * _freqMult * 0.0025;
        this._maxLoudness     *= Math.max(0.985, 0.9995 - _decayDelta);
        this._avgPeakLoudness *= Math.max(0.9975, 0.9999 - _decayDelta * 0.15);
        this._maxLoudness = Math.max(this._maxLoudness, loudness);
        this._updateMovingAvgLoudness(loudness);

        // Copy current spectrum before it is overwritten next frame (must be a new array, not a reference)
        if (!this._prevFrequencyData) this._prevFrequencyData = new Float32Array(frequencyData.length);
        this._prevFrequencyData.set(frequencyData);

        // Shift history and push current value
        for (let i = 0; i < this._fluxHistory.length - 1; i++) {
            this._fluxHistory[i] = this._fluxHistory[i + 1];
        }
        this._fluxHistory[this._fluxHistory.length - 1] = loudness;

        // Peak detection: center of 9-frame window must be strictly greater than all neighbors.
        // This gives ~40ms of lookback on each side at 10ms/frame, reducing noise sensitivity.
        const mid = Math.floor(this._fluxHistory.length / 2);
        const centerVal = this._fluxHistory[mid];
        const isPeak = centerVal > 0 && this._fluxHistory.every((v, i) => i === mid || v < centerVal);
        const loudEnough = centerVal >= Math.max(this._maxLoudness * 0.45, this._avgPeakLoudness * 0.1, this.minFluxFloor);

        if (!this._isActive && isPeak && loudEnough) {
            const now = performance.now();
            if (minIntervalMs > 0 && (now - this._lastTriggerTime) < minIntervalMs) {
                // Ignore this trigger (within cooldown)
            } else {
                const timeSinceLastMs = this._lastTriggerTime === 0 ? null : Math.round(now - this._lastTriggerTime);
                this._lastTriggerTime = now;
                this._framesSinceTrigger = 0;
                if (this._onTrigger) {
                    try { this._onTrigger(timeSinceLastMs); } catch (e) { console.error("[BeatDetector] onTrigger error:", e); }
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

    _updateMovingAvgLoudness(newLoudnessValue) {
        const alpha = 0.005;
        this._avgLoudness = alpha * newLoudnessValue + (1 - alpha) * this._avgLoudness;
    }

    _updateMovingPeakAvg(newLoudnessValue) {
        this._numPeaksMeasured += 1;
        this._avgPeakLoudness += (newLoudnessValue - this._avgPeakLoudness) / this._numPeaksMeasured;
    }

    get triggerDuration()  { return this._triggerDuration; }
    set triggerDuration(v) { this._triggerDuration = v; }

    get octaves()  { return this._octaves; }
    set octaves(v) { this._octaves = v; this.reset(); }

    get windowSize()  { return this._windowSize; }
    set windowSize(v) { this._windowSize = v; this.reset(); }

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

// Manages a shared Web Audio graph and drives multiple BeatDetector instances.
export class BeatDetectorManager {
    constructor(audioElement, { fftSize = 2048, audioContext = null } = {}) {
        this._audioElement = audioElement;
        this._fftSize = fftSize;
        this._injectedContext = audioContext;
        this._context = null;
        this._analyser = null;
        this._frequencyData = null;
        this._detectors = [];
        this._initialized = false;
    }

    // Must be called inside a user gesture handler (browser autoplay policy).
    init() {
        if (this._initialized) return this;
        this._context = this._injectedContext || new AudioContext();
        this._analyser = this._context.createAnalyser();
        this._analyser.fftSize = this._fftSize;
        const source = this._context.createMediaElementSource(this._audioElement);
        source.connect(this._analyser);
        this._analyser.connect(this._context.destination);
        this._frequencyData = new Float32Array(this._analyser.frequencyBinCount);
        this._initialized = true;
        return this;
    }

    // Instantiates a BeatDetector with the given config, registers it, and returns the instance.
    // Can be called before init().
    addDetector(config) {
        const detector = new BeatDetector(config);
        this._detectors.push(detector);
        return detector;
    }

    // Reads the analyser once, then drives all registered detectors.
    update(minIntervalMsOverride) {
        if (!this._initialized) return;
        this._analyser.getFloatFrequencyData(this._frequencyData);
        for (const detector of this._detectors) {
            detector.updateData(this._analyser, this._context, this._frequencyData, minIntervalMsOverride);
        }
    }

    reset() {
        for (const detector of this._detectors) {
            detector.reset();
        }
    }

    get context()       { return this._context; }
    get analyser()      { return this._analyser; }
    get frequencyData() { return this._frequencyData; }
}
