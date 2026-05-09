import { P } from '@renderer/snapshot';
import type { UWCaustic, UWParticle } from '@types';
import { rand } from '@utils/math';
import {
  particleTrigT as _ptT,
  particleTrigPhase as _ptPhase,
  particleTrigElapsed as _ptElapsed,
  setParticleTrig,
} from '@audio/audioEngine';

export let _uwCaustics: UWCaustic[] = [];
export let _uwParticles: UWParticle[] = [];
let _uwT: number = 0;
let _uwCurrentAngle: number = 0;

// Local aliases — kept in sync with audioEngine module variables via setParticleTrig
let particleTrigT: number = _ptT;
let particleTrigPhase: 'idle' | 'in' | 'out' = _ptPhase;
let particleTrigElapsed: number = _ptElapsed;

export function initUnderwater(canvas: HTMLCanvasElement): void {
  _uwCaustics = [];
  for (let i = 0; i < 10; i++) {
    _uwCaustics.push({
      cx: rand(canvas.width  * 0.05, canvas.width  * 0.95),
      cy: rand(canvas.height * 0.05, canvas.height * 0.95),
      ax: rand(50, canvas.width  * 0.22),
      ay: rand(40, canvas.height * 0.20),
      wx: rand(0.55, 1.45), wy: rand(0.45, 1.25),
      px: rand(0, Math.PI * 2), py: rand(0, Math.PI * 2),
      r:  rand(90, 210), rp: rand(0, Math.PI * 2), rw: rand(0.35, 1.1),
      shape:    Math.floor(rand(0, 3)),
      colorT:   rand(0, 1),
      angle:    rand(0, Math.PI * 2),
      angleVel: rand(-0.0003, 0.0003),
      flashT: 0, flashPhase: 'idle', flashElapsed: 0,
      flashR: 0, flashG: 0, flashB: 0,
      lrFlashT: 0, lrFlashMaxT: 0, lrFlashPhase: 'idle', lrFlashElapsed: 0,
      lrFlashR: 0, lrFlashG: 0, lrFlashB: 0,
    });
  }
  _uwParticles = [];
  for (let i = 0; i < 80; i++) {
    _uwParticles.push({
      x:     rand(0, canvas.width),
      y:     rand(0, canvas.height),
      r:     rand(0.5, 2.0),
      alpha: rand(0.55, 1.0),
      dvx:   rand(-0.08, 0.08),
      dvy:   rand(-0.06, 0.06),
      phase: rand(0, Math.PI * 2),
    });
  }
}

export function updateUnderwater(dt: number, canvas: HTMLCanvasElement, bgEnergySmooth: number): void {
  const dtF = dt / 16.7;
  _uwT += P.UW_CAUSTICS_SPEED * dt;
  _uwCurrentAngle += 0.00018 * dtF;

  for (const c of _uwCaustics) {
    c.angle += c.angleVel * dtF;
    if (c.flashPhase === 'in') {
      c.flashElapsed += dt;
      c.flashT = Math.min(1, c.flashElapsed / P.BLOB_FLASH_FADE_IN);
      if (c.flashT >= 1) { c.flashPhase = 'out'; c.flashElapsed = 0; }
    } else if (c.flashPhase === 'out') {
      c.flashElapsed += dt;
      c.flashT = 1 - Math.min(1, c.flashElapsed / P.BLOB_FLASH_FADE_OUT);
      if (c.flashT <= 0) { c.flashT = 0; c.flashPhase = 'idle'; }
    }
    // L/R flash phase
    if (c.lrFlashPhase === 'in') {
      c.lrFlashElapsed += dt;
      c.lrFlashT = Math.min(1, c.lrFlashElapsed / P.LR_FADE_IN);
      if (c.lrFlashT >= 1) { c.lrFlashPhase = 'out'; c.lrFlashElapsed = 0; }
    } else if (c.lrFlashPhase === 'out') {
      c.lrFlashElapsed += dt;
      c.lrFlashT = 1 - Math.min(1, c.lrFlashElapsed / P.LR_FADE_OUT);
      if (c.lrFlashT <= 0) { c.lrFlashT = 0; c.lrFlashPhase = 'idle'; }
    }
  }

  // Particle current trigger phase advance
  if (particleTrigPhase === 'in') {
    particleTrigElapsed += dt;
    particleTrigT = Math.min(1, particleTrigElapsed / P.PARTICLE_TRIGGER_FADE_IN);
    if (particleTrigT >= 1) { particleTrigPhase = 'out'; particleTrigElapsed = 0; }
  } else if (particleTrigPhase === 'out') {
    particleTrigElapsed += dt;
    particleTrigT = 1 - Math.min(1, particleTrigElapsed / P.PARTICLE_TRIGGER_FADE_OUT);
    if (particleTrigT <= 0) { particleTrigT = 0; particleTrigPhase = 'idle'; }
  }
  setParticleTrig(particleTrigT, particleTrigPhase, particleTrigElapsed);

  if (P.UW_PARTICLES_ENABLED) {
    let effSpeed = P.UW_PARTICLES_SPEED;
    if (P.PARTICLE_TRIGGER_ENABLED && particleTrigT > 0)
      effSpeed += P.PARTICLE_TRIGGER_BOOST * Math.pow(particleTrigT, P.PARTICLE_TRIGGER_SLOPE);
    if (P.PARTICLE_ENERGY_ENABLED)
      effSpeed += P.PARTICLE_ENERGY_MIN + bgEnergySmooth * (P.PARTICLE_ENERGY_MAX - P.PARTICLE_ENERGY_MIN);
    const cx = Math.cos(_uwCurrentAngle) * effSpeed * dtF;
    const cy = Math.sin(_uwCurrentAngle) * effSpeed * dtF;
    const W = canvas.width, H = canvas.height;
    for (const p of _uwParticles) {
      p.phase += 0.008 * dtF;
      p.x += cx + p.dvx * dtF;
      p.y += cy + p.dvy * dtF + Math.sin(p.phase) * 0.05 * dtF;
      if (p.x < -4)        p.x = W + 4;
      else if (p.x > W + 4) p.x = -4;
      if (p.y < -4)        p.y = H + 4;
      else if (p.y > H + 4) p.y = -4;
    }
  }
}

export function triggerBlobFlash(): void {
  if (!P.BLOB_FLASH_ENABLED || _uwCaustics.length === 0) return;
  if (P.BLOB_FLASH_ALL) {
    for (const c of _uwCaustics) {
      c.flashR = P.BLOB_FLASH_RANDOM ? (Math.random() * 255) | 0 : P.BLOB_FLASH_R;
      c.flashG = P.BLOB_FLASH_RANDOM ? (Math.random() * 255) | 0 : P.BLOB_FLASH_G;
      c.flashB = P.BLOB_FLASH_RANDOM ? (Math.random() * 255) | 0 : P.BLOB_FLASH_B;
      c.flashT = 0; c.flashPhase = 'in'; c.flashElapsed = 0;
    }
  } else {
    const c = _uwCaustics[Math.floor(Math.random() * _uwCaustics.length)];
    c.flashR = P.BLOB_FLASH_RANDOM ? (Math.random() * 255) | 0 : P.BLOB_FLASH_R;
    c.flashG = P.BLOB_FLASH_RANDOM ? (Math.random() * 255) | 0 : P.BLOB_FLASH_G;
    c.flashB = P.BLOB_FLASH_RANDOM ? (Math.random() * 255) | 0 : P.BLOB_FLASH_B;
    c.flashT = 0; c.flashPhase = 'in'; c.flashElapsed = 0;
  }
}

export function triggerLRFlash(side: 'left' | 'right', canvasW: number): void {
  if (!P.LR_MODE_ENABLED || _uwCaustics.length === 0) return;
  const slope = P.LR_FLASH_SLOPE;
  for (const c of _uwCaustics) {
    const norm   = c.cx / canvasW;   // 0 = far left, 1 = far right
    const weight = side === 'left'
      ? Math.pow(Math.max(0, 1 - norm), slope)
      : Math.pow(Math.max(0, norm), slope);
    if (weight < 0.001) continue;
    c.lrFlashMaxT    = weight;
    c.lrFlashT       = 0;
    c.lrFlashPhase   = 'in';
    c.lrFlashElapsed = 0;
    c.lrFlashR = side === 'left' ? P.LR_LEFT_R : P.LR_RIGHT_R;
    c.lrFlashG = side === 'left' ? P.LR_LEFT_G : P.LR_RIGHT_G;
    c.lrFlashB = side === 'left' ? P.LR_LEFT_B : P.LR_RIGHT_B;
  }
}

export function triggerParticleCurrent(): void {
  particleTrigT = 0;
  particleTrigPhase = 'in';
  particleTrigElapsed = 0;
  setParticleTrig(particleTrigT, particleTrigPhase, particleTrigElapsed);
}

export function drawUnderwater(ctx: CanvasRenderingContext2D): void {
  if (P.UW_CAUSTICS_ENABLED && P.UW_CAUSTICS_ALPHA > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const c of _uwCaustics) {
      const x = c.cx + c.ax * Math.sin(c.wx * _uwT + c.px);
      const y = c.cy + c.ay * Math.cos(c.wy * _uwT + c.py);
      const r = c.r  * (1 + 0.15 * Math.sin(c.rw * _uwT + c.rp));
      const cr = Math.round(P.UW_BLOB_R1 + c.colorT * (P.UW_BLOB_R2 - P.UW_BLOB_R1));
      const cg = Math.round(P.UW_BLOB_G1 + c.colorT * (P.UW_BLOB_G2 - P.UW_BLOB_G1));
      const cb = Math.round(P.UW_BLOB_B1 + c.colorT * (P.UW_BLOB_B2 - P.UW_BLOB_B1));
      // Base flash — reduced when L/R mode is active
      const ft_raw = c.flashT > 0 ? Math.pow(c.flashT, P.BLOB_FLASH_SLOPE) : 0;
      const ft     = P.LR_MODE_ENABLED ? ft_raw * (1 - P.LR_CENTER_REDUCTION) : ft_raw;
      // L/R flash — additive, weighted by baked positional intensity
      const lrEff  = c.lrFlashT * c.lrFlashMaxT;
      const ft_lr  = lrEff > 0 ? Math.pow(lrEff, P.BLOB_FLASH_SLOPE) : 0;
      const combinedFt = Math.min(1, ft + ft_lr);
      // Additive color blend: each flash layer shifts color independently from caustic base
      let dr: number = cr + ft * (c.flashR - cr) + ft_lr * (c.lrFlashR - cr);
      let dg: number = cg + ft * (c.flashG - cg) + ft_lr * (c.lrFlashG - cg);
      let db: number = cb + ft * (c.flashB - cb) + ft_lr * (c.lrFlashB - cb);
      dr = Math.round(Math.max(0, Math.min(255, dr)));
      dg = Math.round(Math.max(0, Math.min(255, dg)));
      db = Math.round(Math.max(0, Math.min(255, db)));
      const a0 = P.UW_CAUSTICS_ALPHA * (1 + combinedFt * 1.5);
      const a1 = P.UW_CAUSTICS_ALPHA * 0.28 * (1 + combinedFt);
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0,    `rgba(${dr},${dg},${db},${a0.toFixed(4)})`);
      grad.addColorStop(0.4,  `rgba(${dr},${dg},${db},${a1.toFixed(4)})`);
      grad.addColorStop(0.75, `rgba(${dr},${dg},${db},${(a0 * 0.04).toFixed(4)})`);
      grad.addColorStop(1,    `rgba(${dr},${dg},${db},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      if (c.shape === 1) {
        ctx.ellipse(x, y, r * 1.1, r * 0.9, c.angle, 0, Math.PI * 2);
      } else if (c.shape === 2) {
        ctx.ellipse(x, y, r * 0.9, r * 1.1, c.angle, 0, Math.PI * 2);
      } else {
        ctx.ellipse(x, y, r, r, 0, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    ctx.restore();
  }

  if (P.UW_PARTICLES_ENABLED && P.UW_PARTICLES_ALPHA > 0) {
    ctx.save();
    ctx.fillStyle = `rgb(${P.UW_PARTICLES_R},${P.UW_PARTICLES_G},${P.UW_PARTICLES_B})`;
    for (const p of _uwParticles) {
      ctx.globalAlpha = p.alpha * P.UW_PARTICLES_ALPHA;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
