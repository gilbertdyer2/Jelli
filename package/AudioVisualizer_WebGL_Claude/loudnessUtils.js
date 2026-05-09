"use strict";
// Loudness util functions I wrote for this visualizer


// Returns average amplitude around a set frequency band with gaussian-like weighting
//   - @frequencyData - Uint8Array of frequency data from analyser.getByteFrequencyData()
//   - @targetFrequency - The center frequency in Hz to analyze
//   - @width - The width of the band in Hz. Range will be [targetFrequency - width/2, targetFrequency + width/2]
//   - @slope - Controls how steep the gaussian-like curve falls off (higher = steeper falloff)
export function getLoudness(analyser, context, frequencyData, targetFrequency, width, slope) {
    const sampleRate = context.sampleRate;
    const binFrequency = sampleRate / (analyser.fftSize * 2);
    
    // Convert frequency ranges to bin indices
    const targetBin = Math.floor(targetFrequency / binFrequency);
    const widthInBins = Math.floor(width / binFrequency);
    const startBin = Math.max(0, targetBin - Math.floor(widthInBins / 2));
    const endBin = Math.min(frequencyData.length - 1, targetBin + Math.floor(widthInBins / 2));
    
    let weightedSum = 0;
    let weightSum = 0;

    // Calculate weighted average using gaussian-like curve
    for (let i = startBin; i <= endBin; i++) {
        // Calculate distance from center frequency in terms of bins
        const distanceFromCenter = Math.abs(i - targetBin);
        
        // Gaussian-like weight calculation: e^(-(x^2)/(2*sigma^2))
        // where sigma is controlled by the slope parameter
        const weight = Math.exp(-(Math.pow(distanceFromCenter, 2)) / (2 * Math.pow(slope, 2)));
        
        const normalized = frequencyData[i] / 255; // Normalize amplitude to [0,1]
        weightedSum += normalized * weight;
        weightSum += weight;
    }
    
    // Return weighted average
    return weightSum > 0 ? weightedSum / weightSum : 0;
}


// Returns loudness in dB at a specific frequency
//  - @analyser - The analyser node
//  - @frequencyData - Uint8Array of frequency data from analyser.getByteFrequencyData()
//  - @targetFrequency - The target frequency in Hz
export function getLoudnessSimple(analyser, context, frequencyData, targetFrequency) {
    const sampleRate = context.sampleRate;
    const binIndex = Math.round((targetFrequency * analyser.fftSize) / sampleRate);
    
    // Return loudness in dB at targetFrequency
    return frequencyData[binIndex];
}


// Returns average loudness from a time-domain byte audio array
//  - @timeData - Uint8Array of time data from analyser.getByteTimeDomainData()
//
// Computes root mean square (RMS) 
// https://stackoverflow.com/questions/38971884/how-to-correctly-determine-volume-in-db-from-getbytefrequencydata
export function getTotalLoudnessSimple(timeData) {
    let square_sum = 0;
    for (let i = 0; i < timeData.length; i++) {
        const normalized = timeData[i] / 255; // Normalize between 0 and 1
        square_sum += Math.pow(normalized, 2);
    }
    console.log(Math.pow(square_sum / timeData.length, 0.5));
    // Calculate RMS
    return Math.pow(square_sum / timeData.length, 0.5);
}


// Returns an exponentially-weighted moving average of the loudness
//   - @loudness_raw - The raw loudness value to smooth
//   - @previous_EMA - The previous EMA value calculated from the previous call, or initial value
export function getEMA(loudness_raw, previous_EMA) {
    const N = 10;
    const smoothingFactor = (2 / (N + 1));

    return (smoothingFactor * loudness_raw + (1 - smoothingFactor) * previous_EMA);
}


export { getSpectralFlux, frequencyToBinIndex } from './beatDetectorUtils.js';
