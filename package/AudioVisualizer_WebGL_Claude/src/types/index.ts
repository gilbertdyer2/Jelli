export type EffectType = 'none' | 'shockwave' | 'polygon' | 'sparks';

export interface RimParticle {
  rx: number; ry: number;
  x: number; y: number;
  vx: number; vy: number;
  rim: boolean;
}

export interface TentacleParticle {
  x: number; y: number;
  px: number; py: number;
}

export interface IBeatDetector {
  targetHz: number;
  parameter: number;
  readonly justTriggered: boolean;
  readonly currentFlux: number;
  readonly maxLoudnessThresh: number;
  readonly avgPeakThresh: number;
  idleDecayRate: number;
  freqDecayBias: number;
  minFluxFloor: number;
  updateData(analyser: AnalyserNode, ctx: AudioContext, freqData: Float32Array, minIntervalMsOverride?: number): number;
  reset(): void;
}

export interface BlobCreature {
  type: 'blob';
  name: string;
  cx: number; cy: number;
  cvx: number; cvy: number;
  bkx: number; bky: number;
  angle: number; targetAngle: number;
  expandScale: number; expandRemaining: number;
  inflateScale: number;
  tentacleSpreadScale: number;
  energy: number; thrustRemaining: number;
  idlePhase: number;
  rimParticles: RimParticle[];
  rimOnly: RimParticle[];
  tentacles: TentacleParticle[][];
  color: string; colorR: number; colorG: number; colorB: number;
  effect: EffectType;
  effectColor: string; effectR: number; effectG: number; effectB: number;
  effectSpeed: number; kickScale: number;
  detectorHz: number; detectorRangeHz: number; detectorOctaves: number; detectorDuration: number;
  detector: IBeatDetector | null;
  _lastLogTime: number;
  activitySmooth: number; soloMs: number; spotlightAlpha: number;
  triggerTimes: number[];
}

export interface ClamParticle {
  rx: number; ry: number;
  x: number; y: number;
  vx: number; vy: number;
  rim: boolean;
  halfBit: 0 | 1;
}

export interface ClamCreature {
  type: 'clam';
  name: string;
  cx: number; cy: number;
  cvx: number; cvy: number;
  angle: number; spinVel: number;
  openAmount: number; openVel: number;
  idlePhase: number;
  color: string; colorR: number; colorG: number; colorB: number;
  effectColor: string; effectR: number; effectG: number; effectB: number;
  effect: EffectType;
  effectSpeed: number; kickScale: number;
  detectorHz: number; detectorRangeHz: number; detectorOctaves: number; detectorDuration: number;
  detector: IBeatDetector | null;
  _lastLogTime: number;
  activitySmooth: number; soloMs: number; spotlightAlpha: number;
  triggerTimes: number[];
  particles: ClamParticle[];
  upperRim: ClamParticle[];
  lowerRim: ClamParticle[];
}

export type Creature = BlobCreature | ClamCreature;

export interface Shockwave {
  x: number; y: number;
  radius: number; maxRadius: number;
  life: number; maxLife: number;
  color: string;
  er: number; eg: number; eb: number;
  speed: number;
}

export interface PolygonFlash {
  progress: number;
  sides: number;
  rotation: number;
  opacity: number;
  cx: number; cy: number;
  color: string;
  er: number; eg: number; eb: number;
  speed: number;
}

export interface Spark {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string;
  er: number; eg: number; eb: number;
}

export interface WaterRipple {
  x: number; y: number;
  radius: number; maxRadius: number;
  life: number; maxLife: number;
  speed: number;
}

export interface UWCaustic {
  cx: number; cy: number;
  ax: number; ay: number;
  wx: number; wy: number;
  px: number; py: number;
  r: number; rp: number; rw: number;
  shape: number;
  colorT: number;
  angle: number; angleVel: number;
  flashT: number;
  flashPhase: 'idle' | 'in' | 'out';
  flashElapsed: number;
  flashR: number; flashG: number; flashB: number;
  // L/R positional flash — additive layer on top of base flash
  lrFlashT: number;
  lrFlashMaxT: number;  // baked positional weight at trigger time (0–1)
  lrFlashPhase: 'idle' | 'in' | 'out';
  lrFlashElapsed: number;
  lrFlashR: number; lrFlashG: number; lrFlashB: number;
}

export interface UWParticle {
  x: number; y: number;
  r: number;
  alpha: number;
  dvx: number; dvy: number;
  phase: number;
}

export interface DuoParticle {
  x: number; y: number;
  vx: number; vy: number;
  t: number;
  perpAmt: number;
  colorT: number;
  _prox: number;
}

export interface DuoPair {
  blobA: Creature;
  blobB: Creature;
  duoMs: number;
  linkAlpha: number;
  particles: DuoParticle[];
}

export interface DetectorGraph {
  det: IBeatDetector;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  color: string;
  data: { flux: number[]; maxT: number[]; avgT: number[]; triggered: boolean[] };
  yMax: number;
}
