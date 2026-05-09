// Module-level flat typed arrays — cache-friendly, avoids GC pressure.
// GPU stride = 8 floats: [x, y, z, lifeRatio, colorT, size, 0, 0]

export const MAX_SPORES    = 2000;
export const GPU_STRIDE    = 8;

const posX  = new Float32Array(MAX_SPORES);
const posY  = new Float32Array(MAX_SPORES);
const posZ  = new Float32Array(MAX_SPORES);
const velX  = new Float32Array(MAX_SPORES);
const velY  = new Float32Array(MAX_SPORES);
const velZ  = new Float32Array(MAX_SPORES);
const life  = new Float32Array(MAX_SPORES);  // remaining seconds
const maxL  = new Float32Array(MAX_SPORES);
const colT  = new Float32Array(MAX_SPORES);
const size  = new Float32Array(MAX_SPORES);

export let activeCount = 0;

// ─── Spawn ──────────────────────────────────────────────────────────────────
// patchU, patchV: UV coords on front face [0–1]
// count: how many spores to emit
// colorT: 0 = amber, 1 = cyan
export function emitSpores(
  patchU: number,
  patchV: number,
  count:  number,
  colorT: number,
  driftStrength: number,
  halfW = 0.28,
  halfH = 0.70,
  halfD = 0.04,
): void {
  const worldX = -halfW + patchU * halfW * 2;
  const worldY = -halfH + patchV * halfH * 2;
  const worldZ = halfD + 0.002;

  for (let i = 0; i < count; i++) {
    if (activeCount >= MAX_SPORES) break;
    const idx = activeCount++;

    posX[idx] = worldX + (Math.random() - 0.5) * 0.04;
    posY[idx] = worldY + (Math.random() - 0.5) * 0.04;
    posZ[idx] = worldZ + Math.random() * 0.02;

    const spread = 0.4 * driftStrength;
    velX[idx] = (Math.random() - 0.5) * spread;
    velY[idx] = (0.04 + Math.random() * 0.08) * driftStrength;  // upward bias
    velZ[idx] = (Math.random() - 0.5) * spread * 0.5;

    const lt = 1.5 + Math.random() * 2.0;
    life[idx] = lt;
    maxL[idx] = lt;
    colT[idx] = colorT;
    size[idx] = 6 + Math.random() * 8;  // px
  }
}

// ─── Update ─────────────────────────────────────────────────────────────────
export function updateSpores(dtS: number, elapsed: number): void {
  const t = elapsed * 0.001;
  let i = 0;
  while (i < activeCount) {
    life[i] -= dtS;
    if (life[i] <= 0) {
      // Swap-with-last
      const last = activeCount - 1;
      posX[i] = posX[last]; posY[i] = posY[last]; posZ[i] = posZ[last];
      velX[i] = velX[last]; velY[i] = velY[last]; velZ[i] = velZ[last];
      life[i] = life[last]; maxL[i] = maxL[last];
      colT[i] = colT[last]; size[i] = size[last];
      activeCount--;
      continue;
    }

    // Cheap noise-field drift
    const nx = 0.4 * Math.sin(posY[i] * 1.7 + t * 0.3) * Math.cos(posZ[i] * 1.7);
    const ny = 0.4 * Math.cos(posX[i] * 1.7 + t * 0.2) * Math.sin(posZ[i] * 1.2) + 0.12;

    posX[i] += (velX[i] + nx * 0.1) * dtS;
    posY[i] += (velY[i] + ny * 0.1) * dtS;
    posZ[i] +=  velZ[i] * dtS;

    // Gentle deceleration
    velX[i] *= 0.992;
    velY[i] *= 0.994;
    velZ[i] *= 0.992;
    i++;
  }
}

// ─── Pack GPU buffer ─────────────────────────────────────────────────────────
// Returns a Float32Array view into a pre-allocated buffer.
let _gpuBuf: Float32Array | null = null;

export function packGpuBuffer(): Float32Array {
  const needed = activeCount * GPU_STRIDE;
  if (!_gpuBuf || _gpuBuf.length < needed) {
    _gpuBuf = new Float32Array(Math.max(needed, MAX_SPORES * GPU_STRIDE));
  }
  for (let i = 0; i < activeCount; i++) {
    const off = i * GPU_STRIDE;
    _gpuBuf[off + 0] = posX[i];
    _gpuBuf[off + 1] = posY[i];
    _gpuBuf[off + 2] = posZ[i];
    _gpuBuf[off + 3] = maxL[i] > 0 ? life[i] / maxL[i] : 0;
    _gpuBuf[off + 4] = colT[i];
    _gpuBuf[off + 5] = size[i];
    _gpuBuf[off + 6] = 0;
    _gpuBuf[off + 7] = 0;
  }
  return _gpuBuf;
}

export function reset(): void {
  activeCount = 0;
}
