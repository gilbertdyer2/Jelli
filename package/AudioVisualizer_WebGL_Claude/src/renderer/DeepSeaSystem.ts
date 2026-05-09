// ─── Deep Sea Particle Simulation ────────────────────────────────────────────
// Pure simulation class — no WebGL dependency.
// Caller is responsible for uploading gpuBuf to the GPU after update().
//
// Sim buffer layout per particle (12 floats):
//   [x,y,z,  vx,vy,vz,  age,lifespan,  baseSize,phase,colorBlend,type]
//   type: 0=ambient, 1=burst, -1=dead

export const DS_MAX = 512;

export class DeepSeaSystem {
  // ── Public fields — set via store subscriptions in LichenRenderer ──────────
  partCount    = 220;
  partSize     = 7.0;
  partSpeed    = 0.12;
  partBuoy     = 0.012;
  fogDensity   = 0.55;
  brightness   = 0.70;
  ambientGlow  = 0.08;
  flickerSpeed = 1.0;
  colAR = 0.10; colAG = 0.60; colAB = 1.00;
  colBR = 0.00; colBG = 0.88; colBB = 0.55;
  colBlend     = 0.5;
  burstCount   = 30;
  burstSize    = 1.6;
  burstBright  = 2.2;
  burstLife    = 1400;
  burstSpread  = 2.5;
  swimAz       = 0;    // degrees, added to monolith tilt in update()
  swimEl       = 0;    // degrees

  // ── Output — read by LichenRenderer._draw() ────────────────────────────────
  readonly simBuf = new Float32Array(DS_MAX * 12);
  readonly gpuBuf = new Float32Array(DS_MAX * 6);
  aliveCount = 0;

  // ── Internal state ─────────────────────────────────────────────────────────
  private _totalSlots = 0;
  private _burstHead  = 0;

  // ─────────────────────────────────────────────────────────────────────────

  spawnAmbient(i: number): void {
    const b = i * 12, s = this.simBuf;
    s[b+0] = (Math.random() - 0.5) * 4.2;
    s[b+1] = (Math.random() - 0.5) * 3.2;
    s[b+2] = (Math.random() - 0.5) * 5.5;
    s[b+3] = 0; s[b+4] = 0; s[b+5] = 0;
    s[b+6] = Math.random() * 25000;
    s[b+7] = 18000 + Math.random() * 22000;
    s[b+8] = 0.5 + Math.random() * 1.0;
    s[b+9] = Math.random() * 6.28318;
    s[b+10] = Math.random() < this.colBlend ? 1 : (Math.random() < 0.5 ? Math.random() * 0.45 : 0.55 + Math.random() * 0.45);
    s[b+11] = 0;
  }

  private _spawnBurst(slot: number): void {
    const b = slot * 12, s = this.simBuf;
    const r = this.burstSpread;
    s[b+0] = (Math.random() - 0.5) * r;
    s[b+1] = (Math.random() - 0.5) * r * 0.7;
    s[b+2] = (Math.random() - 0.5) * r * 0.8;
    const sp = 0.0003 + Math.random() * 0.0006;
    s[b+3] = s[b+0] * sp; s[b+4] = s[b+1] * sp + 0.0003; s[b+5] = s[b+2] * sp;
    s[b+6] = 0;
    s[b+7] = this.burstLife * (0.7 + Math.random() * 0.6);
    s[b+8] = 0.7 + Math.random() * 0.8;
    s[b+9] = Math.random() * 6.28318;
    s[b+10] = Math.random();
    s[b+11] = 1;
  }

  triggerBurst(): void {
    const ambientSlots = Math.min(this.partCount, DS_MAX - 60);
    const burstMax     = DS_MAX - ambientSlots;
    const count        = Math.min(this.burstCount, burstMax);
    for (let i = 0; i < count; i++) {
      const slot = ambientSlots + ((this._burstHead + i) % burstMax);
      this._spawnBurst(slot);
    }
    this._burstHead = (this._burstHead + count) % Math.max(burstMax, 1);
  }

  // tilt: monolith tilt in degrees (added to swimAz for swim direction)
  // swimVel: current swim speed in world units/ms (from LichenRenderer swim envelope)
  update(dt: number, elapsed: number, tilt: number, swimVel: number): void {
    const ambientCount = Math.min(this.partCount, DS_MAX - 60);

    if (this._totalSlots !== ambientCount) {
      for (let i = 0; i < ambientCount; i++) this.spawnAmbient(i);
      this._totalSlots = ambientCount;
    }

    const dtCap   = Math.min(dt, 50);
    const flowStr = this.partSpeed * 0.00004 * dtCap;
    const buoy    = this.partBuoy  * 0.000008 * dtCap;
    const damp    = Math.pow(0.994, dtCap / 16.667);
    const s = this.simBuf, g = this.gpuBuf;

    const swimAzRad = (tilt + this.swimAz) * Math.PI / 180;
    const swimElRad = this.swimEl * Math.PI / 180;
    const swimDX = -Math.cos(swimElRad) * Math.sin(swimAzRad) * swimVel * dtCap;
    const swimDY =  Math.sin(swimElRad) * swimVel * dtCap;
    const swimDZ = -Math.cos(swimElRad) * Math.cos(swimAzRad) * swimVel * dtCap;

    let gpuIdx = 0, aliveCount = 0;

    for (let i = 0; i < DS_MAX; i++) {
      const b = i * 12;
      const type = s[b+11];
      if (type < 0) continue;

      const isAmbient = type === 0;
      const isBurst   = type === 1;
      if (isAmbient && i >= ambientCount) continue;

      s[b+6] += dtCap;
      const age = s[b+6], life = s[b+7];

      if (isAmbient && age >= life) {
        this.spawnAmbient(i);
        s[b+6] = 0;
      } else if (isBurst && age >= life) {
        s[b+11] = -1;
        continue;
      }

      const x = s[b+0], y = s[b+1], z = s[b+2];
      const ph1 = elapsed * 0.00028 + x * 2.31 + i * 1.618;
      const ph2 = elapsed * 0.00022 + y * 1.73 + i * 0.934;
      const ph3 = elapsed * 0.00033 + z * 2.07 + i * 2.399;
      s[b+3] += Math.sin(ph1) * flowStr;
      s[b+4] += Math.cos(ph2) * flowStr + buoy;
      s[b+5] += Math.sin(ph3) * flowStr * 0.5;
      s[b+3] *= damp; s[b+4] *= damp; s[b+5] *= damp;
      if (swimVel > 0) { s[b+0] += swimDX; s[b+1] += swimDY; s[b+2] += swimDZ; }
      s[b+0] += s[b+3]; s[b+1] += s[b+4]; s[b+2] += s[b+5];

      if (isAmbient) {
        if (s[b+0] < -2.5) s[b+0] = 2.5; else if (s[b+0] > 2.5) s[b+0] = -2.5;
        if (s[b+1] < -2.0) s[b+1] = 2.0; else if (s[b+1] > 2.0) s[b+1] = -2.0;
        if (s[b+2] < -3.2) s[b+2] = 1.8; else if (s[b+2] > 1.8) s[b+2] = -3.2;
      }

      const flickPhase = elapsed * 0.0018 * this.flickerSpeed + s[b+9];
      const flicker = 0.55 + 0.45 * Math.sin(flickPhase);

      let bright: number;
      if (isBurst) {
        const fade = Math.pow(1.0 - age / life, 0.7);
        bright = this.burstBright * flicker * fade;
        g[gpuIdx++] = s[b+0]; g[gpuIdx++] = s[b+1]; g[gpuIdx++] = s[b+2];
        g[gpuIdx++] = s[b+8] * this.burstSize;
        g[gpuIdx++] = bright;
        g[gpuIdx++] = s[b+10];
      } else {
        bright = this.brightness * flicker;
        g[gpuIdx++] = s[b+0]; g[gpuIdx++] = s[b+1]; g[gpuIdx++] = s[b+2];
        g[gpuIdx++] = s[b+8];
        g[gpuIdx++] = bright;
        g[gpuIdx++] = s[b+10];
      }
      aliveCount++;
    }

    this.aliveCount = aliveCount;
  }
}
