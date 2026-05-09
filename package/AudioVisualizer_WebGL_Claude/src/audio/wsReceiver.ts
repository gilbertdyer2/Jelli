import { VirtualDetector } from './VirtualDetector';

export const liveAnalyser:    null = null;
export const liveContext:     null = null;
export const liveFreqData:    null = null;
export const lrLeftAnalyser:  null = null;
export const lrRightAnalyser: null = null;
export const lrLeftFreqData  = new Float32Array(0);
export const lrRightFreqData = new Float32Array(0);

export const particleTrigPhase: 'idle' | 'in' | 'out' = 'idle';
export const particleTrigElapsed: number = 0;
export const particleTrigT: number = 0;
export function setParticleTrig(_t: number, _phase: string, _elapsed: number): void {}

export function startCapture(): void {}
export function stopCapture(): void {}
export function syncThresholdParams(): void {}
export function ensureDetectors(): void {}

export const subD                 = new VirtualDetector();
export const flashDetector        = new VirtualDetector();
export const particleTrigDetector = new VirtualDetector();
export const rippleDetector       = new VirtualDetector();
export const bgRandDetector       = new VirtualDetector();
export const lrLeftDetector       = new VirtualDetector();
export const lrRightDetector      = new VirtualDetector();

export const virtualDetectors = new Map<string, VirtualDetector>();

const host = window.location.hostname;
const ws = new WebSocket(`ws://${host}:8765`);
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data as string);
  if (msg.type === 'triggers') {
    for (const id of msg.ids as string[]) {
      virtualDetectors.get(id)?.trigger();
    }
  }
};
