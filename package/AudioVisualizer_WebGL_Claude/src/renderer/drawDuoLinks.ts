import { P } from '@renderer/snapshot';
import type { DuoPair, DuoParticle, BlobCreature, ClamCreature } from '@types';
import { rand } from '@utils/math';
import { get } from 'svelte/store';
import { blobs, clams } from '@stores/creatures';

export let _duoPair: DuoPair | null = null;

export function createDuoParticles(bA: BlobCreature | ClamCreature, bB: BlobCreature | ClamCreature): DuoParticle[] {
  const particles: DuoParticle[] = [];
  const total     = P.DUO_LINK_PARTICLE_COUNT;
  const nearCount = Math.floor(total * 0.35);
  const midCount  = total - nearCount * 2;
  const axLen = Math.hypot(bB.cx - bA.cx, bB.cy - bA.cy) || 1;
  const ax = (bB.cx - bA.cx) / axLen, ay = (bB.cy - bA.cy) / axLen;
  const perpX = -ay, perpY = ax;

  function mkParticle(t: number): DuoParticle {
    const profile = 1 - Math.sin(Math.PI * t);
    const maxPerp = P.DUO_LINK_SPREAD * P.BELL_RADIUS * (0.42 + 0.58 * profile);
    const perpAmt = rand(-maxPerp, maxPerp);
    const wx = bA.cx + t * (bB.cx - bA.cx) + perpAmt * perpX;
    const wy = bA.cy + t * (bB.cy - bA.cy) + perpAmt * perpY;
    return { x: wx, y: wy, vx: 0, vy: 0, t, perpAmt, colorT: t, _prox: 0 };
  }

  for (let i = 0; i < nearCount; i++) particles.push(mkParticle(rand(0,    0.35)));
  for (let i = 0; i < nearCount; i++) particles.push(mkParticle(rand(0.65, 1.0)));
  for (let i = 0; i < midCount;  i++) particles.push(mkParticle(rand(0.25, 0.75)));
  return particles;
}

function updateDuoParticles(pair: DuoPair, dtF: number): void {
  const bA = pair.blobA, bB = pair.blobB;
  const axLen = Math.hypot(bB.cx - bA.cx, bB.cy - bA.cy);
  if (axLen < 1) return;
  const ax = (bB.cx - bA.cx) / axLen, ay = (bB.cy - bA.cy) / axLen;
  const perpX = -ay, perpY = ax;
  for (const p of pair.particles) {
    const homeX = bA.cx + p.t * (bB.cx - bA.cx) + p.perpAmt * perpX;
    const homeY = bA.cy + p.t * (bB.cy - bA.cy) + p.perpAmt * perpY;
    const mid     = 1 - Math.abs(p.t * 2 - 1);
    const springK = 0.0026 - 0.0012 * mid;
    p.vx += (homeX - p.x) * springK * dtF + rand(-0.18, 0.18) * dtF;
    p.vy += (homeY - p.y) * springK * dtF + rand(-0.18, 0.18) * dtF;
    p.vx *= Math.pow(0.93, dtF);
    p.vy *= Math.pow(0.93, dtF);
    p.x  += p.vx * dtF;
    p.y  += p.vy * dtF;
  }
}

export function updateDuoLinks(dt: number, dtF: number): void {
  const now    = performance.now();
  const cutoff = now - P.DUO_SYNC_WINDOW * 1000;
  const allC   = get(blobs).concat(get(clams) as Array<BlobCreature | ClamCreature>);

  for (const c of allC) {
    let i = 0;
    while (i < c.triggerTimes.length && c.triggerTimes[i] < cutoff) i++;
    if (i > 0) c.triggerTimes.splice(0, i);
  }

  function matchCount(src: number[], dst: number[]): number {
    let n = 0;
    for (const tS of src) {
      for (const tD of dst) {
        if (Math.abs(tS - tD) <= P.DUO_SYNC_TOLERANCE) { n++; break; }
      }
    }
    return n;
  }

  let bA: BlobCreature | ClamCreature | null = null;
  let bB: BlobCreature | ClamCreature | null = null;
  let bestScore = -1;

  for (let i = 0; i < allC.length; i++) {
    const tA = allC[i].triggerTimes;
    if (tA.length < P.DUO_SYNC_MIN_MATCHES) continue;
    for (let j = i + 1; j < allC.length; j++) {
      const tB = allC[j].triggerTimes;
      if (tB.length < P.DUO_SYNC_MIN_MATCHES) continue;
      const mAB = matchCount(tA, tB);
      if (mAB < P.DUO_SYNC_MIN_MATCHES) continue;
      const mBA = matchCount(tB, tA);
      if (mBA < P.DUO_SYNC_MIN_MATCHES) continue;
      const score = Math.min(mAB, mBA);
      if (score > bestScore) { bestScore = score; bA = allC[i]; bB = allC[j]; }
    }
  }

  const isDuo = bA !== null;

  if (_duoPair && (!allC.includes(_duoPair.blobA) || !allC.includes(_duoPair.blobB))) {
    _duoPair = null;
  }

  if (!_duoPair && isDuo && P.DUO_LINK_ENABLED && bA !== null && bB !== null) {
    _duoPair = { blobA: bA, blobB: bB, duoMs: 0, linkAlpha: 0,
                 particles: createDuoParticles(bA, bB) };
  }

  if (!_duoPair) return;

  const pair      = _duoPair;
  const pairMatch = isDuo && bA !== null && bB !== null &&
                    ((pair.blobA === bA && pair.blobB === bB) ||
                     (pair.blobA === bB && pair.blobB === bA));

  if (P.DUO_LINK_ENABLED && pairMatch) {
    pair.duoMs = Math.min(pair.duoMs + dt, P.DUO_THRESHOLD_MS * 2);
  } else {
    pair.duoMs = Math.max(0, pair.duoMs - dt * 3);
  }

  const targetAlpha = (P.DUO_LINK_ENABLED && pair.duoMs >= P.DUO_THRESHOLD_MS) ? P.DUO_LINK_MAX_ALPHA : 0;
  const rate = targetAlpha > pair.linkAlpha ? P.DUO_FADE_IN : P.DUO_FADE_OUT;
  pair.linkAlpha += (targetAlpha - pair.linkAlpha) * rate * dtF;

  if (pair.linkAlpha < 0.001 && pair.duoMs <= 0) { _duoPair = null; return; }

  if (_duoPair && pair.linkAlpha > 0.001) updateDuoParticles(pair, dtF);
}

export function drawDuoLinks(ctx: CanvasRenderingContext2D): void {
  if (!_duoPair || _duoPair.linkAlpha < 0.001) return;
  const pair = _duoPair;
  const bA = pair.blobA, bB = pair.blobB;
  const allC = get(blobs).concat(get(clams) as Array<BlobCreature | ClamCreature>);
  if (!allC.includes(bA) || !allC.includes(bB)) return;

  const { particles, linkAlpha } = pair;
  const edgeDist   = P.DUO_LINK_EDGE_DIST;
  const edgeDistSq = edgeDist * edgeDist;
  const proxRange  = P.BELL_RADIUS * 1.5 + edgeDist;

  for (const p of particles) {
    const dA = Math.hypot(p.x - bA.cx, p.y - bA.cy);
    const dB = Math.hypot(p.x - bB.cx, p.y - bB.cy);
    p._prox = Math.max(0, 1 - Math.min(dA, dB) / proxRange);
  }

  const NC = 5, NA = 3;
  const buckets = Array.from({ length: NC }, () => [[], [], []] as number[][]);

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[j].x - particles[i].x;
      const dy = particles[j].y - particles[i].y;
      const d2 = dx * dx + dy * dy;
      if (d2 > edgeDistSq) continue;
      const tProx  = 1 - Math.sqrt(d2) / edgeDist;
      const prox   = (particles[i]._prox + particles[j]._prox) * 0.5;
      const tColor = (particles[i].colorT + particles[j].colorT) * 0.5;
      const ci     = Math.min(NC - 1, tColor * NC | 0);
      const ai     = Math.min(NA - 1, tProx * prox * NA | 0);
      buckets[ci][ai].push(i, j);
    }
  }

  ctx.lineWidth = 0.65;
  for (let ci = 0; ci < NC; ci++) {
    const t = (ci + 0.5) / NC;
    const r = (bA.colorR + (bB.colorR - bA.colorR) * t) | 0;
    const g = (bA.colorG + (bB.colorG - bA.colorG) * t) | 0;
    const b = (bA.colorB + (bB.colorB - bA.colorB) * t) | 0;
    for (let ai = 0; ai < NA; ai++) {
      const bucket = buckets[ci][ai];
      if (!bucket.length) continue;
      const alpha = linkAlpha * (ai + 1) / NA;
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha.toFixed(4)})`;
      ctx.beginPath();
      for (let k = 0; k < bucket.length; k += 2) {
        const pi = particles[bucket[k]], pj = particles[bucket[k + 1]];
        ctx.moveTo(pi.x, pi.y);
        ctx.lineTo(pj.x, pj.y);
      }
      ctx.stroke();
    }
  }
}
