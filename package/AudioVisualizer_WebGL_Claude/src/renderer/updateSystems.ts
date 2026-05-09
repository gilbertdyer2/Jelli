import { get } from 'svelte/store';
import { blobs, clams } from '@stores/creatures';
import { P } from '@renderer/snapshot';
import { rand, lerp } from '@utils/math';
import type { BlobCreature, ClamCreature } from '@types';

// ─── Drag state ───────────────────────────────────────────────────────────────

export let draggedBlob: BlobCreature | null = null;
export let draggedClam: ClamCreature | null = null;
export let dragCursorX = 0;
export let dragCursorY = 0;

export function setDraggedBlob(b: BlobCreature | null): void { draggedBlob = b; }
export function setDraggedClam(c: ClamCreature | null): void { draggedClam = c; }
export function setDragCursor(x: number, y: number): void { dragCursorX = x; dragCursorY = y; }

// ─── Hardcoded constants (not in P) ───────────────────────────────────────────

const ROTATION_SMOOTH   = 0.02;
const DRAG_SPRING_K     = 0.005;
const JELLYFISH_GRAVITY = 0.055;

// ─── Spotlight constants (not in P) ───────────────────────────────────────────

const SOLO_ACTIVITY_DECAY = 0.985;
const SOLO_ACTIVITY_THRESH = 0.10;

// ─── updateBlobs ─────────────────────────────────────────────────────────────

export function updateBlobs(canvasW: number, canvasH: number, dtF: number): void {
  for (const blob of get(blobs)) {
    const param = blob.detector ? blob.detector.parameter : 0;

    // ── Center drift ──────────────────────────────────────────────────────
    const isDragged = (blob === draggedBlob);

    if (!isDragged) {
      blob.cvx += rand(-P.BLOB_DRIFT_ACCEL, P.BLOB_DRIFT_ACCEL) * dtF;
      blob.cvy += rand(-P.BLOB_DRIFT_ACCEL, P.BLOB_DRIFT_ACCEL) * dtF;
    }

    if (isDragged) {
      blob.cvx += (dragCursorX - blob.cx) * DRAG_SPRING_K * dtF;
      blob.cvy += (dragCursorY - blob.cy) * DRAG_SPRING_K * dtF;
    } else {
      if (blob.cx < P.BLOB_MARGIN)             blob.cvx += 0.045 * dtF;
      if (blob.cx > canvasW - P.BLOB_MARGIN)   blob.cvx -= 0.045 * dtF;
      if (blob.cy < P.TOP_CLEAR + P.BLOB_MARGIN) blob.cvy += 0.045 * dtF;
      if (blob.cy > canvasH - P.BLOB_MARGIN)   blob.cvy -= 0.045 * dtF;
    }

    const dMax = isDragged ? 6 : P.BLOB_DRIFT_MAX;
    const dspd = Math.sqrt(blob.cvx ** 2 + blob.cvy ** 2);
    if (dspd > dMax) { blob.cvx *= dMax / dspd; blob.cvy *= dMax / dspd; }

    if (!isDragged) {
      if (blob.cx < P.BLOB_MARGIN)             blob.bkx =  Math.abs(blob.bkx);
      if (blob.cx > canvasW - P.BLOB_MARGIN)   blob.bkx = -Math.abs(blob.bkx);
      if (blob.cy < P.TOP_CLEAR + P.BLOB_MARGIN) blob.bky =  Math.abs(blob.bky);
      if (blob.cy > canvasH - P.BLOB_MARGIN)   blob.bky = -Math.abs(blob.bky);
    }

    // ── Drain thrust ──────────────────────────────────────────────────────
    if (blob.thrustRemaining > 0.0005) {
      const t = blob.thrustRemaining * P.KICK_ACCEL * dtF;
      blob.bkx += Math.sin(blob.angle) * t;
      blob.bky -= Math.cos(blob.angle) * t;
      blob.thrustRemaining -= t;
    } else {
      blob.thrustRemaining = 0;
    }

    blob.bkx *= Math.pow(P.BLOB_BEAT_KICK_DECAY, dtF);
    blob.bky *= Math.pow(P.BLOB_BEAT_KICK_DECAY, dtF);

    blob.cx += (blob.cvx + blob.bkx) * dtF;
    blob.cy += (blob.cvy + blob.bky) * dtF;
    blob.cx = Math.max(P.BLOB_REST_RADIUS, Math.min(canvasW - P.BLOB_REST_RADIUS, blob.cx));
    blob.cy = Math.max(P.TOP_CLEAR + P.BLOB_REST_RADIUS, Math.min(canvasH - P.BLOB_REST_RADIUS, blob.cy));

    // ── Orientation ───────────────────────────────────────────────────────
    const totalVx = blob.cvx + blob.bkx;
    const totalVy = blob.cvy + blob.bky;
    const speed   = Math.sqrt(totalVx * totalVx + totalVy * totalVy);

    if (isDragged) {
      const cdx = dragCursorX - blob.cx;
      const cdy = dragCursorY - blob.cy;
      if (Math.hypot(cdx, cdy) > 8) {
        blob.targetAngle = Math.atan2(cdx, -cdy);
      }
    } else {
      if (speed > 0.08) {
        blob.targetAngle = Math.atan2(totalVx, -totalVy);
      }
    }

    let dAngle = blob.targetAngle - blob.angle;
    if (dAngle >  Math.PI) dAngle -= Math.PI * 2;
    if (dAngle < -Math.PI) dAngle += Math.PI * 2;
    const turnRate = isDragged ? ROTATION_SMOOTH : ROTATION_SMOOTH * Math.min(1, speed / 0.35);
    blob.angle += dAngle * Math.max(0.003, turnRate) * dtF;

    if (!isDragged && Math.abs(dAngle) > 0.15 && speed > 0.08) {
      const nudge = Math.abs(dAngle) * 0.004;
      blob.cvx += Math.sin(blob.angle) * nudge;
      blob.cvy -= Math.cos(blob.angle) * nudge;
    }

    const cosA = Math.cos(blob.angle);
    const sinA = Math.sin(blob.angle);

    // ── Drain expand ──────────────────────────────────────────────────────
    if (blob.expandRemaining > 0.0005) {
      const e = blob.expandRemaining * P.KICK_ACCEL * dtF;
      blob.expandScale += e;
      blob.expandRemaining -= e;
    } else {
      blob.expandRemaining = 0;
    }

    blob.expandScale *= Math.pow(P.BLOB_EXPAND_DECAY, dtF);
    if (blob.expandScale < 0.001) blob.expandScale = 0;

    blob.tentacleSpreadScale = 1 + (blob.tentacleSpreadScale - 1) * Math.pow(P.TENTACLE_SPREAD_DECAY, dtF);
    if (blob.tentacleSpreadScale < 1.001) blob.tentacleSpreadScale = 1.0;

    // ── Energy recharge ───────────────────────────────────────────────────
    blob.energy = Math.min(blob.energy + P.ENERGY_RECHARGE * dtF, P.ENERGY_MAX);

    // ── Inflate/deflate ───────────────────────────────────────────────────
    blob.inflateScale = 1 + (blob.inflateScale - 1) * Math.pow(P.INFLATE_DECAY, dtF);
    if (blob.inflateScale < 1.0001) blob.inflateScale = 1.0;

    // ── Idle pulsing ──────────────────────────────────────────────────────
    blob.idlePhase += 0.022 * dtF;
    const idlePulse = Math.sin(blob.idlePhase) * 0.045;
    const bellScale = (1 + idlePulse + blob.expandScale * P.BLOB_EXPAND_SCALE) * blob.inflateScale;

    // ── Bell rim particles ────────────────────────────────────────────────
    const rimJitter = P.BLOB_JITTER * 0.35 * (1 + param * 0.5);
    for (const p of blob.rimParticles) {
      const srx   = p.rx * bellScale;
      const sry   = p.ry * bellScale;
      const restX = blob.cx + srx * cosA - sry * sinA;
      const restY = blob.cy + srx * sinA + sry * cosA;
      p.vx += (restX - p.x) * P.BLOB_SPRING_K * dtF;
      p.vy += (restY - p.y) * P.BLOB_SPRING_K * dtF;
      p.vx += rand(-rimJitter, rimJitter) * dtF;
      p.vy += rand(-rimJitter, rimJitter) * dtF;
      p.vx *= Math.pow(P.BLOB_DAMPING, dtF);
      p.vy *= Math.pow(P.BLOB_DAMPING, dtF);
      p.x  += p.vx * dtF;
      p.y  += p.vy * dtF;
    }

    // ── Tentacle chain — Position-Based Dynamics ──────────────────────────
    const trailDX    = -sinA;
    const trailDY    =  cosA;
    const tentJitter = P.BLOB_JITTER * 0.6 * (1 + param * 1.2);

    for (let ti = 0; ti < blob.tentacles.length; ti++) {
      const chain   = blob.tentacles[ti];
      const tNorm   = ti / (blob.tentacles.length - 1);
      const rootOff = lerp(-P.BLOB_REST_RADIUS * 0.88, P.BLOB_REST_RADIUS * 0.88, tNorm) * bellScale * blob.tentacleSpreadScale;
      const rootX   = blob.cx + rootOff * cosA;
      const rootY   = blob.cy + rootOff * sinA;

      for (let si = 0; si < chain.length; si++) {
        const p = chain[si];

        if (si === 0) {
          p.px = p.x;
          p.py = p.y;
          p.x  = rootX;
          p.y  = rootY;
          continue;
        }

        const ivx = (p.x - p.px) * Math.pow(P.BLOB_DAMPING, dtF);
        const ivy = (p.y - p.py) * Math.pow(P.BLOB_DAMPING, dtF);

        p.px = p.x;
        p.py = p.y;

        p.x += ivx
             + rand(-tentJitter, tentJitter) * dtF
             + trailDX * JELLYFISH_GRAVITY * 0.12 * dtF;
        p.y += ivy
             + rand(-tentJitter, tentJitter) * dtF
             + trailDY * JELLYFISH_GRAVITY * 0.12 * dtF
             + JELLYFISH_GRAVITY * 0.06 * dtF;

        const par   = chain[si - 1];
        const dx    = p.x - par.x;
        const dy    = p.y - par.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 1e-6) continue;
        const dist  = Math.sqrt(dist2);
        const corr  = (dist - P.TENTACLE_SEG_LEN) / dist;
        p.x -= dx * corr;
        p.y -= dy * corr;
      }
    }
  }
}

// ─── updateClams ─────────────────────────────────────────────────────────────

export function updateClams(canvasW: number, canvasH: number, dtF: number): void {
  for (const clam of get(clams)) {
    const param = clam.detector ? clam.detector.parameter : 0;
    const isDragged = (clam === draggedClam);

    clam.cvy += P.CLAM_GRAVITY * dtF;

    clam.idlePhase += 0.016 * dtF;
    clam.cvy += Math.sin(clam.idlePhase) * 0.007 * dtF;

    clam.cvx *= Math.pow(P.CLAM_WATER_DRAG, dtF);
    clam.cvy *= Math.pow(P.CLAM_WATER_DRAG, dtF);

    if (P.CLAM_SPIN_MAX <= 0) {
      clam.spinVel = 0;
      clam.angle  *= Math.pow(0.95, dtF);
    } else {
      clam.spinVel *= Math.pow(P.CLAM_SPIN_DECAY, dtF);
      clam.angle   += clam.spinVel * dtF;
    }

    if (isDragged) {
      clam.cvx += (dragCursorX - clam.cx) * DRAG_SPRING_K * dtF;
      clam.cvy += (dragCursorY - clam.cy) * DRAG_SPRING_K * dtF;
    } else {
      if (clam.cx < P.CLAM_MARGIN)              clam.cvx += 0.04 * dtF;
      if (clam.cx > canvasW - P.CLAM_MARGIN)    clam.cvx -= 0.04 * dtF;
      if (clam.cy < P.TOP_CLEAR + P.CLAM_MARGIN) clam.cvy += 0.04 * dtF;
      if (clam.cy > canvasH - P.CLAM_MARGIN)    clam.cvy -= 0.04 * dtF;
    }

    const spd    = Math.sqrt(clam.cvx * clam.cvx + clam.cvy * clam.cvy);
    const spdMax = isDragged ? 12 : 10;
    if (spd > spdMax) { clam.cvx *= spdMax / spd; clam.cvy *= spdMax / spd; }

    clam.cx += clam.cvx * dtF;
    clam.cy += clam.cvy * dtF;
    clam.cx  = Math.max(P.CLAM_MARGIN, Math.min(canvasW - P.CLAM_MARGIN, clam.cx));
    clam.cy  = Math.max(P.TOP_CLEAR + P.CLAM_MARGIN, Math.min(canvasH - P.CLAM_MARGIN, clam.cy));

    clam.openVel   += -P.CLAM_SNAP_SPRING * clam.openAmount * dtF;
    clam.openVel   *= Math.pow(P.CLAM_SNAP_DAMP, dtF);
    clam.openAmount = Math.max(0, clam.openAmount + clam.openVel * dtF);

    const cosA = Math.cos(clam.angle);
    const sinA = Math.sin(clam.angle);

    const rimJitter = P.BLOB_JITTER * 0.22 * (1 + param * 0.5);
    for (const p of clam.particles) {
      const lipShift = p.halfBit === 1
        ? -clam.openAmount * P.CLAM_LIP_OPEN
        :  clam.openAmount * P.CLAM_LIP_OPEN * 0.25;
      const localX = p.rx;
      const localY = p.ry + lipShift;
      const restX  = clam.cx + localX * cosA - localY * sinA;
      const restY  = clam.cy + localX * sinA + localY * cosA;
      p.vx += (restX - p.x) * P.BLOB_SPRING_K * dtF;
      p.vy += (restY - p.y) * P.BLOB_SPRING_K * dtF;
      p.vx += rand(-rimJitter, rimJitter) * dtF;
      p.vy += rand(-rimJitter, rimJitter) * dtF;
      p.vx *= Math.pow(P.BLOB_DAMPING, dtF);
      p.vy *= Math.pow(P.BLOB_DAMPING, dtF);
      p.x  += p.vx * dtF;
      p.y  += p.vy * dtF;
    }
  }
}

// ─── updateSpotlights ────────────────────────────────────────────────────────

export function updateSpotlights(dt: number, dtF: number): void {
  const allC = (get(blobs) as Array<BlobCreature | ClamCreature>).concat(get(clams));

  for (const blob of allC) {
    if (blob.detector?.justTriggered) {
      blob.activitySmooth = 1.0;
    } else {
      blob.activitySmooth *= Math.pow(SOLO_ACTIVITY_DECAY, dtF);
    }
  }

  let soloBlob: BlobCreature | ClamCreature | null = null;
  let activeCount = 0;
  for (const blob of allC) {
    if (blob.activitySmooth > SOLO_ACTIVITY_THRESH) {
      activeCount++;
      soloBlob = blob;
    }
  }
  if (activeCount !== 1) soloBlob = null;

  for (const blob of allC) {
    if (!P.SPOTLIGHT_ENABLED) {
      blob.soloMs = 0;
      blob.spotlightAlpha *= Math.pow(1 - P.SPOTLIGHT_FADE_OUT, dtF);
      continue;
    }
    if (blob === soloBlob) {
      blob.soloMs = Math.min(blob.soloMs + dt, P.SOLO_THRESHOLD_MS * 2);
    } else {
      blob.soloMs = Math.max(0, blob.soloMs - dt * 3);
    }
    const targetAlpha = blob.soloMs >= P.SOLO_THRESHOLD_MS ? P.SPOTLIGHT_MAX_ALPHA : 0;
    const rate = targetAlpha > blob.spotlightAlpha ? P.SPOTLIGHT_FADE_IN : P.SPOTLIGHT_FADE_OUT;
    blob.spotlightAlpha += (targetAlpha - blob.spotlightAlpha) * rate * dtF;
  }
}
