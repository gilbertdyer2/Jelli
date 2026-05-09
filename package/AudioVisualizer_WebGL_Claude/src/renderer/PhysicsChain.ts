// ─── Physics Chain — PBD Verlet chain simulator ───────────────────────────────
// Unified class for both physics tentacles and oral arms.
// Caller passes halfW/H/D (monolith dimensions) at init/update time.
// Ribbon building and GPU upload stay in LichenRenderer._draw().

export interface ChainConfig {
  count: number;          // number of chains
  segCount: number;       // segments per chain
  segLen: number;         // rest length per segment
  gravity: number;
  gravityAz: number;      // degrees
  gravityEl: number;      // degrees
  damping: number;
  jitter: number;
  whipStr: number;
  spreadBoost: number;
  spreadDecay: number;
  attachY: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  ringSpread: number;     // > 0: deterministic hash jitter per chain (physics tentacles)
  halfStepAngle: boolean; // true: add π/count to each angle (oral arms)
}

export class PhysicsChain {
  cfg: ChainConfig;
  chainsCur:  Float32Array;
  chainsPrev: Float32Array;
  spreadScale = 1.0;
  ready = false;

  constructor(cfg: ChainConfig) {
    this.cfg = cfg;
    const n = cfg.count * cfg.segCount * 3;
    this.chainsCur  = new Float32Array(n);
    this.chainsPrev = new Float32Array(n);
  }

  // Re-allocate buffers after count or segCount changes; caller sets cfg fields first.
  resize(): void {
    const n = this.cfg.count * this.cfg.segCount * 3;
    this.chainsCur  = new Float32Array(n);
    this.chainsPrev = new Float32Array(n);
    this.ready = false;
  }

  // Place all particles at their attachment ring positions (no initial velocity).
  init(compressVal: number, halfW: number, halfH: number, halfD: number): void {
    const { count: n, segCount: nSeg, segLen, attachY, offsetX, offsetY, offsetZ,
            ringSpread, halfStepAngle } = this.cfg;
    const compXY = 1.0 + compressVal * 0.3;
    const compZ  = 1.0 - compressVal * 0.6;
    for (let i = 0; i < n; i++) {
      const baseAngle   = (i / n) * 6.28318;
      const jitter      = ringSpread > 0 ? (this._hash(i * 7.53 + 1.7) * 2.0 - 1.0) * ringSpread : 0;
      const angleOffset = halfStepAngle ? Math.PI / n : 0;
      const angle  = baseAngle + jitter + angleOffset;
      const rootX  = Math.cos(angle) * halfW * attachY * compXY + offsetX;
      const rootY  = Math.sin(angle) * halfH * attachY * compXY + offsetY;
      const rootZ  = halfD * compZ + offsetZ;
      for (let s = 0; s < nSeg; s++) {
        const idx = (i * nSeg + s) * 3;
        this.chainsCur[idx]     = this.chainsPrev[idx]     = rootX;
        this.chainsCur[idx + 1] = this.chainsPrev[idx + 1] = rootY;
        this.chainsCur[idx + 2] = this.chainsPrev[idx + 2] = rootZ + s * segLen;
      }
    }
    this.ready = true;
  }

  // PBD Verlet step: snap root each frame, then integrate remaining segments.
  update(dt: number, compressVal: number, elapsed: number,
         halfW: number, halfH: number, halfD: number): void {
    const { count: n, segCount: nSeg, segLen, attachY, offsetX, offsetY, offsetZ,
            gravity, gravityAz, gravityEl, damping, jitter: jAmt0,
            ringSpread, halfStepAngle, spreadDecay } = this.cfg;
    const dtCap    = Math.min(dt, 50);
    const frameFrac = dtCap / 16.667;
    const damp      = Math.pow(damping, frameFrac);
    this.spreadScale = 1.0 + (this.spreadScale - 1.0) * Math.pow(spreadDecay, frameFrac);
    const spread = this.spreadScale;

    const compXY = 1.0 + compressVal * 0.3;
    const compZ  = 1.0 - compressVal * 0.6;

    const azRad = gravityAz * 0.017453293;
    const elRad = gravityEl * 0.017453293;
    const cosEl = Math.cos(elRad);
    const gDirX = cosEl * Math.sin(azRad);
    const gDirY = Math.sin(elRad);
    const gDirZ = cosEl * Math.cos(azRad);

    for (let i = 0; i < n; i++) {
      const baseAngle   = (i / n) * 6.28318;
      const jitterVal   = ringSpread > 0 ? (this._hash(i * 7.53 + 1.7) * 2.0 - 1.0) * ringSpread : 0;
      const angleOffset = halfStepAngle ? Math.PI / n : 0;
      const angle = baseAngle + jitterVal + angleOffset;
      const rootX = Math.cos(angle) * halfW * attachY * compXY * spread + offsetX;
      const rootY = Math.sin(angle) * halfH * attachY * compXY * spread + offsetY;
      const rootZ = halfD * compZ + offsetZ;

      // Root: snap each frame (no velocity)
      const ri = i * nSeg * 3;
      this.chainsCur[ri]     = this.chainsPrev[ri]     = rootX;
      this.chainsCur[ri + 1] = this.chainsPrev[ri + 1] = rootY;
      this.chainsCur[ri + 2] = this.chainsPrev[ri + 2] = rootZ;

      for (let s = 1; s < nSeg; s++) {
        const idx = (i * nSeg + s) * 3;
        const cx = this.chainsCur[idx],     cy = this.chainsCur[idx + 1],     cz = this.chainsCur[idx + 2];
        const px = this.chainsPrev[idx], py = this.chainsPrev[idx + 1], pz = this.chainsPrev[idx + 2];

        // Implicit Verlet velocity with water-drag damping
        const vx = (cx - px) * damp;
        const vy = (cy - py) * damp;
        const vz = (cz - pz) * damp;

        this.chainsPrev[idx]     = cx;
        this.chainsPrev[idx + 1] = cy;
        this.chainsPrev[idx + 2] = cz;

        // Integrate: velocity + gravity + coherent sinusoidal flow field
        const jAmt    = jAmt0 * dtCap;
        const gAmt    = gravity * dtCap * dtCap;
        const segFrac = s / (nSeg - 1);
        // Golden-angle phase spread across chains for independent motion
        const phase   = elapsed * 0.00065 + segFrac * 6.2832 + i * 2.39996;
        const flowX   = Math.sin(phase)                 * jAmt;
        const flowY   = Math.sin(phase * 0.8713 + 1.57) * jAmt;
        const flowZ   = Math.sin(phase * 1.2341 + 0.90) * jAmt;
        const nx = cx + vx + flowX + gAmt * gDirX;
        const ny = cy + vy + flowY + gAmt * gDirY;
        const nz = cz + vz + flowZ + gAmt * gDirZ;

        this.chainsCur[idx]     = nx;
        this.chainsCur[idx + 1] = ny;
        this.chainsCur[idx + 2] = nz;

        // Inextensible distance constraint from parent — run multiple iterations
        // to distribute correction smoothly after large impulses (e.g. whip).
        const CONSTRAINT_ITERS = 2;
        for (let iter = 0; iter < CONSTRAINT_ITERS; iter++) {
          const parIdx = (i * nSeg + s - 1) * 3;
          const parX = this.chainsCur[parIdx],     parY = this.chainsCur[parIdx + 1],     parZ = this.chainsCur[parIdx + 2];
          const cx2 = this.chainsCur[idx], cy2 = this.chainsCur[idx + 1], cz2 = this.chainsCur[idx + 2];
          const dx = cx2 - parX, dy = cy2 - parY, dz = cz2 - parZ;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist > 1e-6) {
            // Clamp correction to 0.5 to prevent teleport snaps after strong impulses.
            const corr = Math.min((dist - segLen) / dist, 0.5);
            this.chainsCur[idx]     -= dx * corr;
            this.chainsCur[idx + 1] -= dy * corr;
            this.chainsCur[idx + 2] -= dz * corr;
          }
        }
      }
    }
  }

  // Beat-triggered whip: inject impulse into all chains (PBD velocity injection).
  whip(): void {
    const { count: n, segCount: nSeg, whipStr, spreadBoost } = this.cfg;
    this.spreadScale = spreadBoost;
    for (let i = 0; i < n; i++) {
      for (let s = 1; s < nSeg; s++) {
        const idx  = (i * nSeg + s) * 3;
        const segT = s / (nSeg - 1);
        const w    = (1.0 - segT) * whipStr;
        this.chainsPrev[idx]     += (this._hash(i * 1013 + s * 127) - 0.5) * w * 0.4;
        this.chainsPrev[idx + 1] += (this._hash(i * 1013 + s * 127 + 1) - 0.5) * w * 0.4;
        this.chainsPrev[idx + 2] -= w; // trail behind: +Z offset in next frame
      }
    }
  }

  // Deterministic hash — identical to the _tentHash used in LichenRenderer.
  private _hash(t: number): number {
    const s = Math.sin(t * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }
}
