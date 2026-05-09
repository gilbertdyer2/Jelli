export function getSpectralFlux(
  analyser: AnalyserNode,
  context: AudioContext,
  frequencyData: Float32Array,
  prevFrequencyData: Float32Array | null,
  targetFrequency: number,
  width: number,
  octaves: number
): number {
  if (!prevFrequencyData) return 0;

  let totalSum = 0;

  for (let i = 0; i < octaves; i++) {
    const thisTargetFrequency = targetFrequency * Math.pow(2, i);
    const scaledWidth = width * Math.pow(2, i);

    const startBin = Math.max(0, frequencyToBinIndex(analyser, context, thisTargetFrequency - scaledWidth / 2));
    const endBin = Math.min(frequencyData.length - 1, frequencyToBinIndex(analyser, context, thisTargetFrequency + scaledWidth / 2));

    let sum = 0;
    const binCount = endBin - startBin + 1;
    for (let j = startBin; j <= endBin; j++) {
      const amp     = Math.pow(10, frequencyData[j]     / 20);
      const prevAmp = Math.pow(10, prevFrequencyData[j] / 20);
      sum += Math.max(0, amp - prevAmp);
    }

    totalSum += binCount > 0 ? sum / binCount : sum;
  }
  return totalSum / octaves;
}

export function frequencyToBinIndex(analyser: AnalyserNode, context: AudioContext, targetFrequency: number): number {
  const sampleRate = context.sampleRate;
  const binSize = analyser.frequencyBinCount;
  return Math.round((targetFrequency * binSize) / (sampleRate / 2));
}
