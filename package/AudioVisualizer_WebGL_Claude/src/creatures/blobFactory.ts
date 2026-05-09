import { get } from 'svelte/store';
import { blobs } from '@stores/creatures';
import { P } from '@renderer/snapshot';
import { hexToRgb } from '@utils/color';
import { rand, lerp } from '@utils/math';
import type { BlobCreature, RimParticle, TentacleParticle } from '@types';

export interface BlobConfig {
  name?: string;
  cx?: number; cy?: number;
  color?: string;
  effect?: import('@types').EffectType;
  effectColor?: string;
  effectSpeed?: number;
  kickScale?: number;
  detectorHz?: number;
  detectorRangeHz?: number;
  detectorOctaves?: number;
  detectorDuration?: number;
  detector?: import('@types').IBeatDetector | null;
  _lastLogTime?: number;
}

export const DEFAULT_BLOBS: BlobConfig[] = [
  { name: 'high', detectorHz: 12000, detectorRangeHz: 500, detectorOctaves: 2, detectorDuration: 6,  color: '#aa44ff', effect: 'sparks',    effectColor: '#dd88ff', effectSpeed: 1.8, kickScale: 0.7 },
  { name: 'bass', detectorHz: 60,    detectorRangeHz: 15,  detectorOctaves: 1, detectorDuration: 8,  color: '#dd2200', effect: 'shockwave', effectColor: '#ff6633', effectSpeed: 0.7, kickScale: 0.8 },
];

export function createBlobGeometry(cfg: BlobConfig, canvasW: number, canvasH: number): BlobCreature {
  const cx = cfg.cx ?? canvasW * (0.2 + Math.random() * 0.6);
  const cy = cfg.cy ?? canvasH * 0.42 + rand(-canvasH * 0.08, canvasH * 0.08);
  const bellRad = P.BELL_RADIUS;
  const rootRad = P.BLOB_REST_RADIUS;

  const rimParticles: RimParticle[] = [];
  const BELL_RIM_COUNT = 10;
  for (let i = 0; i < BELL_RIM_COUNT; i++) {
    const θ  = (i / (BELL_RIM_COUNT - 1)) * Math.PI;
    const rx = Math.cos(θ) * bellRad;
    const ry = -Math.sin(θ) * bellRad;
    rimParticles.push({ rx, ry, x: cx + rx, y: cy + ry, vx: 0, vy: 0, rim: true });
  }
  const BELL_INTERIOR = 18;
  for (let i = 0; i < BELL_INTERIOR; i++) {
    const θ  = rand(0.05, 0.95) * Math.PI;
    const r  = rand(0.10, 0.88) * bellRad;
    const rx = Math.cos(θ) * r;
    const ry = -Math.sin(θ) * r;
    rimParticles.push({ rx, ry, x: cx + rx, y: cy + ry, vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3), rim: false });
  }

  const tentacleCount = P.TENTACLE_COUNT;
  const segCount = Math.max(3, Math.round(P.BLOB_PARTICLE_COUNT));
  const segLen   = P.TENTACLE_SEG_LEN;
  const tentacles: TentacleParticle[][] = [];
  for (let t = 0; t < tentacleCount; t++) {
    const rootOffX = lerp(-rootRad * 0.88, rootRad * 0.88, t / (tentacleCount - 1));
    const chain: TentacleParticle[] = [];
    for (let s = 0; s < segCount; s++) {
      const tx = cx + rootOffX + rand(-2, 2);
      const ty = cy + s * segLen;
      chain.push({ x: tx, y: ty, px: tx, py: ty });
    }
    tentacles.push(chain);
  }

  const _color       = cfg.color       ?? '#00c8ff';
  const _effectColor = cfg.effectColor ?? cfg.color ?? '#00c8ff';
  const [colorR, colorG, colorB]   = hexToRgb(_color);
  const [effectR, effectG, effectB] = hexToRgb(_effectColor);

  return {
    type: 'blob',
    cx, cy,
    cvx: rand(-0.2, 0.2), cvy: rand(-0.15, 0.15),
    bkx: 0, bky: 0,
    angle: 0, targetAngle: 0,
    expandScale: 0, expandRemaining: 0,
    inflateScale: 1.0,
    tentacleSpreadScale: 1.0,
    energy: P.ENERGY_MAX,
    thrustRemaining: 0,
    idlePhase: rand(0, Math.PI * 2),
    rimParticles,
    rimOnly: rimParticles.filter(p => p.rim),
    tentacles,
    color: _color, colorR, colorG, colorB,
    effect:      cfg.effect      ?? 'none',
    effectColor: _effectColor,
    effectR, effectG, effectB,
    effectSpeed: cfg.effectSpeed ?? 1.0,
    kickScale:   cfg.kickScale   ?? 1.0,
    name:        cfg.name        ?? 'Jelli',
    detectorHz:      cfg.detectorHz      ?? 100,
    detectorRangeHz: cfg.detectorRangeHz ?? 20,
    detectorOctaves: cfg.detectorOctaves ?? 1,
    detectorDuration:cfg.detectorDuration ?? 8,
    detector:    cfg.detector ?? null,
    _lastLogTime: cfg._lastLogTime ?? 0,
    activitySmooth: 0,
    soloMs:      0,
    spotlightAlpha: 0,
    triggerTimes: [],
  };
}

export function initBlobs(canvasW: number, canvasH: number) {
  const newBlobs = DEFAULT_BLOBS.map((cfg, bi) =>
    createBlobGeometry({ ...cfg, cx: canvasW * ((bi + 1) / (DEFAULT_BLOBS.length + 1)) }, canvasW, canvasH)
  );
  blobs.set(newBlobs);
}

export function reinitBlobs(canvasW: number, canvasH: number) {
  const current = get(blobs);
  const saved = current.map(b => ({
    cx: b.cx, cy: b.cy,
    color: b.color, effect: b.effect, effectColor: b.effectColor,
    effectSpeed: b.effectSpeed, kickScale: b.kickScale,
    name: b.name, detector: b.detector, _lastLogTime: b._lastLogTime,
    detectorHz: b.detectorHz, detectorRangeHz: b.detectorRangeHz,
    detectorOctaves: b.detectorOctaves, detectorDuration: b.detectorDuration,
  }));
  blobs.set(saved.map(cfg => createBlobGeometry(cfg, canvasW, canvasH)));
}
