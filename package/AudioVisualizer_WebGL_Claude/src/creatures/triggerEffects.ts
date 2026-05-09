import { get } from 'svelte/store';
import { blobs, clams } from '@stores/creatures';
import { P } from '@renderer/snapshot';
import { rand, randInt } from '@utils/math';
import type { BlobCreature, ClamCreature, Shockwave, PolygonFlash, Spark, WaterRipple } from '@types';

export const shockwaves:     Shockwave[]     = [];
export const polygonFlashes: PolygonFlash[]  = [];
export const sparks:         Spark[]         = [];
export const ripples:        WaterRipple[]   = [];

export function triggerBlobBeat(index: number) {
  const blob = get(blobs)[index];
  if (!blob) return;

  blob.expandRemaining = 1.0;
  blob.tentacleSpreadScale = P.TENTACLE_SPREAD_BOOST;
  if (P.INFLATE_ENABLED) {
    blob.inflateScale = Math.min(blob.inflateScale + P.INFLATE_BOOST, P.INFLATE_MAX);
  }
  blob.thrustRemaining = blob.energy * P.BLOB_BEAT_KICK * (blob.kickScale ?? 1.0);
  blob.energy = 0;

  const headDX =  Math.sin(blob.angle);
  const headDY = -Math.cos(blob.angle);
  const perpDX =  Math.cos(blob.angle);
  const perpDY =  Math.sin(blob.angle);

  for (const chain of blob.tentacles) {
    for (let si = 1; si < chain.length; si++) {
      const rootBias = 1 - si / chain.length;
      const whip    = rand(3, 7)      * rootBias;
      const lateral = rand(-2.5, 2.5) * rootBias;
      chain[si].px -= headDX * whip + perpDX * lateral;
      chain[si].py -= headDY * whip + perpDY * lateral;
    }
  }

  triggerBlobEffect(blob);
  blob.triggerTimes.push(performance.now());
}

export function triggerClamBeat(ci: number) {
  const clam = get(clams)[ci];
  if (!clam) return;
  clam.openVel += 0.12 + rand(0, 0.04);
  clam.cvy -= P.CLAM_SNAP_FORCE * (clam.kickScale ?? 1.0);
  if (P.CLAM_SPIN_MAX > 0) {
    clam.cvx += rand(-P.CLAM_SNAP_SPREAD, P.CLAM_SNAP_SPREAD) * (clam.kickScale ?? 1.0);
    clam.spinVel += (rand(0, 1) < 0.5 ? 1 : -1) * rand(0.008, P.CLAM_SPIN_MAX);
  }
  triggerBlobEffect(clam);
  clam.triggerTimes.push(performance.now());
}

export function triggerBlobEffect(creature: BlobCreature | ClamCreature) {
  switch (creature.effect) {
    case 'shockwave': spawnShockwave(creature); break;
    case 'polygon':   spawnPolygon(creature);   break;
    case 'sparks':    spawnSparks(creature);    break;
  }
}

export function spawnShockwave(c: BlobCreature | ClamCreature) {
  shockwaves.push({
    x: c.cx, y: c.cy,
    radius: 0, maxRadius: P.SHOCKWAVE_MAX_R,
    life: 60, maxLife: 60,
    color: c.effectColor,
    er: c.effectR, eg: c.effectG, eb: c.effectB,
    speed: P.SHOCKWAVE_SPEED * c.effectSpeed,
  });
}

export function spawnPolygon(c: BlobCreature | ClamCreature) {
  polygonFlashes.push({
    progress: 0,
    sides: randInt(5, 8),
    rotation: rand(0, Math.PI * 2),
    opacity: 0.9,
    cx: c.cx, cy: c.cy,
    color: c.effectColor,
    er: c.effectR, eg: c.effectG, eb: c.effectB,
    speed: P.POLYGON_EXPAND_RATE * c.effectSpeed,
  });
}

export function spawnRipple(canvasW: number, canvasH: number) {
  const x = rand(canvasW * 0.1, canvasW * 0.9);
  const y = rand(canvasH * 0.1, canvasH * 0.9);
  const count = P.RIPPLE_RING_COUNT;
  const wl    = P.RIPPLE_WAVELENGTH;
  const life  = P.RIPPLE_MAX_R / P.RIPPLE_SPEED + 30;
  for (let i = 0; i < count; i++) {
    ripples.push({
      x, y,
      radius: i * wl,
      maxRadius: P.RIPPLE_MAX_R,
      life,
      maxLife: life,
      speed: P.RIPPLE_SPEED,
    });
  }
}

export function spawnSparks(c: BlobCreature | ClamCreature) {
  const src = (c as BlobCreature).rimParticles ?? (c as ClamCreature).particles;
  if (!src || !src.length) return;
  const p     = src[randInt(0, src.length - 1)];
  const count = randInt(15, 25);
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(1.5, 4.5) * c.effectSpeed;
    sparks.push({
      x: p.x, y: p.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(18, 36), maxLife: 36,
      color: c.effectColor,
      er: c.effectR, eg: c.effectG, eb: c.effectB,
    });
  }
}
