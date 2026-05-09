"use strict";

// True half-wave-rectified spectral flux: sums only energy increases relative to the previous frame.
// prevFrequencyData must be a Float32Array snapshot of the previous frame (not a reference to the
// live buffer). Returns 0 on the first call (when prevFrequencyData is null).
// Octave window widths scale proportionally with center frequency for constant relative bandwidth.
export function getSpectralFlux(analyser, context, frequencyData, prevFrequencyData, targetFrequency, width, octaves) {
    if (!prevFrequencyData) return 0;

    let totalSum = 0;

    for (let i = 0; i < octaves; i++) {
        const thisTargetFrequency = targetFrequency * Math.pow(2, i);
        // Scale window width with octave so bandwidth stays proportional (constant-Q)
        const scaledWidth = width * Math.pow(2, i);

        const startBin = Math.max(0, frequencyToBinIndex(analyser, context, thisTargetFrequency - scaledWidth / 2));
        const endBin = Math.min(frequencyData.length - 1, frequencyToBinIndex(analyser, context, thisTargetFrequency + scaledWidth / 2));

        let sum = 0;
        const binCount = endBin - startBin + 1;
        for (let j = startBin; j <= endBin; j++) {
            const amp     = Math.pow(10, frequencyData[j]     / 20);
            const prevAmp = Math.pow(10, prevFrequencyData[j] / 20);
            // Half-wave rectification: only count energy increases, not decays
            sum += Math.max(0, amp - prevAmp);
        }

        totalSum += binCount > 0 ? sum / binCount : sum;
    }
    return totalSum / octaves;
}

export function frequencyToBinIndex(analyser, context, targetFrequency) {
    const sampleRate = context.sampleRate;
    const binSize = analyser.frequencyBinCount;

    return Math.round((targetFrequency * binSize) / (sampleRate / 2));
}
