import { BeatDetector } from './BeatDetector';
import { get } from 'svelte/store';
import { blobs, clams } from '@stores/creatures';
import { IDLE_DECAY_RATE, FREQ_DECAY_BIAS, MIN_FLUX_FLOOR } from '@stores/threshold';
import { BLOB_FLASH_HZ, PARTICLE_TRIGGER_HZ, RIPPLE_HZ, LR_HZ, BG_RANDOMIZE_HZ } from '@stores/effects';
import { streaming, status } from '@stores/ui';

export let liveAnalyser: AnalyserNode | null = null;
export let liveContext: AudioContext | null = null;
export let liveFreqData: Float32Array | null = null;

let _liveStream: MediaStream | null = null;
export let subD: BeatDetector | null = null;
export let flashDetector: BeatDetector | null = null;
export let particleTrigDetector: BeatDetector | null = null;
export let rippleDetector: BeatDetector | null = null;

export let bgRandDetector: BeatDetector | null = null;

// L/R stereo channel detectors
export let lrLeftAnalyser:  AnalyserNode | null = null;
export let lrRightAnalyser: AnalyserNode | null = null;
export let lrLeftFreqData:  Float32Array | null = null;
export let lrRightFreqData: Float32Array | null = null;
export let lrLeftDetector:  BeatDetector | null = null;
export let lrRightDetector: BeatDetector | null = null;
let _channelSplitter: ChannelSplitterNode | null = null;

export let particleTrigT = 0;
export let particleTrigPhase: 'idle' | 'in' | 'out' = 'idle';
export let particleTrigElapsed = 0;

export function setParticleTrig(t: number, phase: 'idle' | 'in' | 'out', elapsed: number) {
  particleTrigT = t;
  particleTrigPhase = phase;
  particleTrigElapsed = elapsed;
}

function flashHzParams(hz: number): { rangeHz: number; octaves: number; duration: number } {
  if (hz < 200)       return { rangeHz: 15,  octaves: 1, duration: 10 };
  else if (hz < 1000) return { rangeHz: 60,  octaves: 2, duration: 8  };
  else if (hz < 5000) return { rangeHz: 200, octaves: 2, duration: 6  };
  else                return { rangeHz: 500, octaves: 2, duration: 6  };
}

function syncDetectorParams(det: BeatDetector) {
  det.idleDecayRate = get(IDLE_DECAY_RATE);
  det.freqDecayBias = get(FREQ_DECAY_BIAS);
  det.minFluxFloor  = get(MIN_FLUX_FLOOR);
}

export function ensureDetectors() {
  const bs = get(blobs);
  const cs = get(clams);
  const idr = get(IDLE_DECAY_RATE);
  const fdb = get(FREQ_DECAY_BIAS);
  const mff = get(MIN_FLUX_FLOOR);

  for (const blob of bs) {
    if (!blob.detector) {
      blob.detector = new BeatDetector({
        targetHz: blob.detectorHz,
        rangeHz: blob.detectorRangeHz,
        octaves: blob.detectorOctaves,
        triggerDuration: blob.detectorDuration,
        name: blob.name,
      });
    }
    blob.detector.idleDecayRate = idr;
    blob.detector.freqDecayBias = fdb;
    blob.detector.minFluxFloor  = mff;
  }

  if (!subD) {
    subD = new BeatDetector({ targetHz: 150, rangeHz: 30, octaves: 2, triggerDuration: 16, name: 'Sub' });
  }
  syncDetectorParams(subD);

  const flashHz = get(BLOB_FLASH_HZ);
  if (!flashDetector) {
    const p = flashHzParams(flashHz);
    flashDetector = new BeatDetector({ targetHz: flashHz, rangeHz: p.rangeHz, octaves: p.octaves, triggerDuration: p.duration, name: 'Flash' });
  }
  syncDetectorParams(flashDetector);

  const ptHz = get(PARTICLE_TRIGGER_HZ);
  if (!particleTrigDetector) {
    const p = flashHzParams(ptHz);
    particleTrigDetector = new BeatDetector({ targetHz: ptHz, rangeHz: p.rangeHz, octaves: p.octaves, triggerDuration: p.duration, name: 'PrtTrig' });
  }
  syncDetectorParams(particleTrigDetector);

  const ripHz = get(RIPPLE_HZ);
  if (!rippleDetector) {
    const p = flashHzParams(ripHz);
    rippleDetector = new BeatDetector({ targetHz: ripHz, rangeHz: p.rangeHz, octaves: p.octaves, triggerDuration: p.duration, name: 'Ripple' });
  }
  syncDetectorParams(rippleDetector);

  const bgRandHz = get(BG_RANDOMIZE_HZ);
  if (!bgRandDetector) {
    const p = flashHzParams(bgRandHz);
    bgRandDetector = new BeatDetector({ targetHz: bgRandHz, rangeHz: p.rangeHz, octaves: p.octaves, triggerDuration: p.duration, name: 'BgRand' });
  }
  syncDetectorParams(bgRandDetector);

  const lrHz = get(LR_HZ);
  if (!lrLeftDetector) {
    const p = flashHzParams(lrHz);
    lrLeftDetector = new BeatDetector({ targetHz: lrHz, rangeHz: p.rangeHz, octaves: p.octaves, triggerDuration: p.duration, name: 'LR-L' });
  }
  syncDetectorParams(lrLeftDetector);
  if (!lrRightDetector) {
    const p = flashHzParams(lrHz);
    lrRightDetector = new BeatDetector({ targetHz: lrHz, rangeHz: p.rangeHz, octaves: p.octaves, triggerDuration: p.duration, name: 'LR-R' });
  }
  syncDetectorParams(lrRightDetector);

  for (const clam of cs) {
    if (!clam.detector) {
      clam.detector = new BeatDetector({
        targetHz: clam.detectorHz,
        rangeHz: clam.detectorRangeHz,
        octaves: clam.detectorOctaves,
        triggerDuration: clam.detectorDuration,
        name: clam.name,
      });
    }
    clam.detector.idleDecayRate = idr;
    clam.detector.freqDecayBias = fdb;
    clam.detector.minFluxFloor  = mff;
  }
}

export async function startCapture(): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: { frameRate: { ideal: 1 } },
    } as MediaStreamConstraints);

    stream.getVideoTracks().forEach(t => t.stop());

    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) {
      status.set('No audio track — enable "Share system audio"');
      stream.getTracks().forEach(t => t.stop());
      return;
    }

    _liveStream  = stream;
    liveContext  = new AudioContext();
    liveAnalyser = liveContext.createAnalyser();
    liveAnalyser.fftSize = 2048;
    liveFreqData = new Float32Array(liveAnalyser.frequencyBinCount);
    const _source = liveContext.createMediaStreamSource(stream);
    _source.connect(liveAnalyser);

    // Stereo channel split for L/R mode
    _channelSplitter = liveContext.createChannelSplitter(2);
    _source.connect(_channelSplitter);
    lrLeftAnalyser  = liveContext.createAnalyser(); lrLeftAnalyser.fftSize  = 2048;
    lrRightAnalyser = liveContext.createAnalyser(); lrRightAnalyser.fftSize = 2048;
    _channelSplitter.connect(lrLeftAnalyser,  0);
    _channelSplitter.connect(lrRightAnalyser, 1);
    lrLeftFreqData  = new Float32Array(lrLeftAnalyser.frequencyBinCount);
    lrRightFreqData = new Float32Array(lrRightAnalyser.frequencyBinCount);

    ensureDetectors();
    const bs = get(blobs);
    const cs = get(clams);
    for (const b of bs) if (b.detector) b.detector.reset();
    for (const c of cs) if (c.detector) c.detector.reset();
    if (subD) subD.reset();
    if (flashDetector) flashDetector.reset();
    if (particleTrigDetector) particleTrigDetector.reset();
    if (rippleDetector)  rippleDetector.reset();
    if (bgRandDetector)  bgRandDetector.reset();
    if (lrLeftDetector)  lrLeftDetector.reset();
    if (lrRightDetector) lrRightDetector.reset();

    streaming.set(true);
    status.set('Live');

    audioTracks[0].addEventListener('ended', stopCapture);
  } catch (err: unknown) {
    const e = err as { name?: string };
    if (e.name !== 'AbortError' && e.name !== 'NotAllowedError') {
      status.set('Live audio unavailable');
    }
  }
}

export function stopCapture(): void {
  if (_liveStream) { _liveStream.getTracks().forEach(t => t.stop()); _liveStream = null; }
  if (liveContext)  { liveContext.close(); liveContext = null; }
  liveAnalyser   = null; liveFreqData   = null;
  lrLeftAnalyser = null; lrLeftFreqData = null;
  lrRightAnalyser= null; lrRightFreqData= null;
  _channelSplitter = null;
  const bs = get(blobs);
  const cs = get(clams);
  for (const b of bs) if (b.detector) b.detector.reset();
  for (const c of cs) if (c.detector) c.detector.reset();
  if (subD) subD.reset();
  if (flashDetector) flashDetector.reset();
  if (particleTrigDetector) particleTrigDetector.reset();
  if (rippleDetector)  rippleDetector.reset();
  if (bgRandDetector)  bgRandDetector.reset();
  if (lrLeftDetector)  lrLeftDetector.reset();
  if (lrRightDetector) lrRightDetector.reset();
  streaming.set(false);
  status.set('Idle');
}

export function syncThresholdParams() {
  const idr = get(IDLE_DECAY_RATE);
  const fdb = get(FREQ_DECAY_BIAS);
  const mff = get(MIN_FLUX_FLOOR);
  const bs = get(blobs);
  const cs = get(clams);
  for (const b of bs) if (b.detector) { b.detector.idleDecayRate = idr; b.detector.freqDecayBias = fdb; b.detector.minFluxFloor = mff; }
  for (const c of cs) if (c.detector) { c.detector.idleDecayRate = idr; c.detector.freqDecayBias = fdb; c.detector.minFluxFloor = mff; }
  if (subD) { subD.idleDecayRate = idr; subD.freqDecayBias = fdb; subD.minFluxFloor = mff; }
  if (flashDetector) { flashDetector.idleDecayRate = idr; flashDetector.freqDecayBias = fdb; flashDetector.minFluxFloor = mff; }
  if (particleTrigDetector) { particleTrigDetector.idleDecayRate = idr; particleTrigDetector.freqDecayBias = fdb; particleTrigDetector.minFluxFloor = mff; }
  if (rippleDetector)       { rippleDetector.idleDecayRate = idr;       rippleDetector.freqDecayBias = fdb;       rippleDetector.minFluxFloor = mff; }
  if (bgRandDetector)       { bgRandDetector.idleDecayRate = idr;       bgRandDetector.freqDecayBias = fdb;       bgRandDetector.minFluxFloor = mff; }
  if (lrLeftDetector)       { lrLeftDetector.idleDecayRate = idr;       lrLeftDetector.freqDecayBias = fdb;       lrLeftDetector.minFluxFloor = mff; }
  if (lrRightDetector)      { lrRightDetector.idleDecayRate = idr;      lrRightDetector.freqDecayBias = fdb;      lrRightDetector.minFluxFloor = mff; }
}
