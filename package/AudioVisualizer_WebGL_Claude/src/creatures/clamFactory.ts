import { get } from 'svelte/store';
import { clams } from '@stores/creatures';
import { P } from '@renderer/snapshot';
import { hexToRgb } from '@utils/color';
import { rand } from '@utils/math';
import type { ClamCreature, ClamParticle } from '@types';

export interface ClamConfig {
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
  angle?: number; spinVel?: number;
  cvx?: number; cvy?: number;
}

const CLAM_RIM_UPPER = 8;
const CLAM_RIM_LOWER = 5;
const CLAM_INT_UPPER = 9;
const CLAM_INT_LOWER = 4;

export function createClamGeometry(cfg: ClamConfig, canvasW: number, canvasH: number): ClamCreature {
  const cx = cfg.cx ?? canvasW * (0.2 + Math.random() * 0.6);
  const cy = cfg.cy ?? canvasH * 0.58 + rand(-canvasH * 0.06, canvasH * 0.06);

  const particles: ClamParticle[] = [];

  for (let i = 0; i < CLAM_RIM_UPPER; i++) {
    const θ  = (i / (CLAM_RIM_UPPER - 1)) * Math.PI;
    const rx =  Math.cos(θ) * P.CLAM_SHELL_W;
    const ry = -Math.sin(θ) * P.CLAM_SHELL_H;
    particles.push({ rx, ry, x: cx + rx, y: cy + ry, vx: 0, vy: 0, rim: true, halfBit: 1 });
  }
  for (let i = 0; i < CLAM_INT_UPPER; i++) {
    const θ  = rand(0.05, 0.95) * Math.PI;
    const r  = rand(0.15, 0.85);
    const rx =  Math.cos(θ) * P.CLAM_SHELL_W * r;
    const ry = -Math.sin(θ) * P.CLAM_SHELL_H * r;
    particles.push({ rx, ry, x: cx + rx, y: cy + ry, vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3), rim: false, halfBit: 1 });
  }
  for (let i = 0; i < CLAM_RIM_LOWER; i++) {
    const θ  = (i / (CLAM_RIM_LOWER - 1)) * Math.PI;
    const rx =  Math.cos(θ) * P.CLAM_SHELL_W;
    const ry =  Math.sin(θ) * P.CLAM_SHELL_BLOW;
    particles.push({ rx, ry, x: cx + rx, y: cy + ry, vx: 0, vy: 0, rim: true, halfBit: 0 });
  }
  for (let i = 0; i < CLAM_INT_LOWER; i++) {
    const θ  = rand(0.05, 0.95) * Math.PI;
    const r  = rand(0.2, 0.8);
    const rx =  Math.cos(θ) * P.CLAM_SHELL_W * r;
    const ry =  Math.sin(θ) * P.CLAM_SHELL_BLOW * r;
    particles.push({ rx, ry, x: cx + rx, y: cy + ry, vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3), rim: false, halfBit: 0 });
  }

  const upperRim = particles.filter(p => p.rim && p.halfBit === 1);
  const lowerRim = particles.filter(p => p.rim && p.halfBit === 0);

  const _color       = cfg.color       ?? '#d4924a';
  const _effectColor = cfg.effectColor ?? cfg.color ?? '#d4924a';
  const [colorR, colorG, colorB]    = hexToRgb(_color);
  const [effectR, effectG, effectB] = hexToRgb(_effectColor);

  return {
    type: 'clam',
    cx, cy,
    cvx: cfg.cvx ?? 0, cvy: cfg.cvy ?? 0,
    angle: cfg.angle ?? 0, spinVel: cfg.spinVel ?? 0,
    openAmount: 0, openVel: 0,
    idlePhase: rand(0, Math.PI * 2),
    color: _color, colorR, colorG, colorB,
    effectColor: _effectColor, effectR, effectG, effectB,
    effect:      cfg.effect      ?? 'none',
    effectSpeed: cfg.effectSpeed ?? 1.0,
    kickScale:   cfg.kickScale   ?? 1.0,
    name:        cfg.name        ?? 'Clam',
    detectorHz:      cfg.detectorHz      ?? 58,
    detectorRangeHz: cfg.detectorRangeHz ?? 15,
    detectorOctaves: cfg.detectorOctaves ?? 1,
    detectorDuration:cfg.detectorDuration ?? 8,
    detector:    cfg.detector ?? null,
    _lastLogTime: cfg._lastLogTime ?? 0,
    activitySmooth: 0, soloMs: 0, spotlightAlpha: 0,
    triggerTimes: [],
    particles, upperRim, lowerRim,
  };
}

export function reinitClams(canvasW: number, canvasH: number) {
  const current = get(clams);
  const saved = current.map(c => ({
    cx: c.cx, cy: c.cy,
    angle: c.angle, spinVel: c.spinVel,
    cvx: c.cvx, cvy: c.cvy,
    color: c.color, effectColor: c.effectColor,
    effect: c.effect, effectSpeed: c.effectSpeed, kickScale: c.kickScale,
    name: c.name, detector: c.detector, _lastLogTime: c._lastLogTime,
    detectorHz: c.detectorHz, detectorRangeHz: c.detectorRangeHz,
    detectorOctaves: c.detectorOctaves, detectorDuration: c.detectorDuration,
  }));
  clams.set(saved.map(cfg => createClamGeometry(cfg, canvasW, canvasH)));
}
