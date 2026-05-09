// Superellipsoid geometry: |x/a|^n + |y/b|^n + |z/c|^n = 1
// n=2 → sphere, n=4 → rounded cube, n→∞ → box
// Returns the same MonolithGeometry interface as lichenGeometry.ts so
// the renderer can swap between the two without shader changes.

import type { MonolithGeometry } from './lichenGeometry';

const STACKS = 32;  // latitude divisions
const SLICES = 64;  // longitude divisions
const STRIDE = 9;   // floats per vertex: pos(3) + normal(3) + uv(2) + faceId(1)

// Signed power: preserves sign across zero, avoids NaN for negative bases
function spow(x: number, e: number): number {
  if (x === 0) return 0;
  return Math.sign(x) * Math.pow(Math.abs(x), e);
}

export function buildJellyGeometry(
  halfW: number, halfH: number, halfD: number,
  n = 4.0,
): MonolithGeometry {
  const e  = 2.0 / n;   // position exponent
  const ne = 2.0 - e;   // normal exponent (= 2 - 2/n ≥ 0 for n ≥ 2)

  const numVerts = (STACKS + 1) * (SLICES + 1);
  const numIdx   = STACKS * SLICES * 6;

  const verts = new Float32Array(numVerts * STRIDE);
  const idxs  = new Uint16Array(numIdx);

  let vi = 0;

  for (let si = 0; si <= STACKS; si++) {
    const phi    = -Math.PI / 2 + (Math.PI * si) / STACKS;  // -π/2 .. π/2
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    for (let ti = 0; ti <= SLICES; ti++) {
      const theta    = -Math.PI + (2 * Math.PI * ti) / SLICES;  // -π .. π
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      // Superellipsoid surface point
      const spCosPhi   = spow(cosPhi, e);
      const spSinPhi   = spow(sinPhi, e);
      const spCosTheta = spow(cosTheta, e);
      const spSinTheta = spow(sinTheta, e);

      const x = halfW * spCosPhi * spCosTheta;
      const y = halfH * spSinPhi;
      const z = halfD * spCosPhi * spSinTheta;

      // Outward normal = gradient of |x/a|^n + ... = 1
      // ∂F/∂x = (n/a) * spow(x/a, n-1) → scaled to: spow(cosPhi, ne)*spow(cosTheta, ne)/a
      let nx = spow(cosPhi, ne) * spow(cosTheta, ne) / halfW;
      let ny = spow(sinPhi, ne) / halfH;
      let nz = spow(cosPhi, ne) * spow(sinTheta, ne) / halfD;
      const nl = Math.hypot(nx, ny, nz);
      if (nl > 1e-8) { nx /= nl; ny /= nl; nz /= nl; }

      const u = ti / SLICES;
      const v = si / STACKS;

      verts[vi++] = x;  verts[vi++] = y;  verts[vi++] = z;
      verts[vi++] = nx; verts[vi++] = ny; verts[vi++] = nz;
      verts[vi++] = u;  verts[vi++] = v;
      verts[vi++] = 0;  // faceId=0 (single continuous surface)
    }
  }

  let ii = 0;
  for (let si = 0; si < STACKS; si++) {
    for (let ti = 0; ti < SLICES; ti++) {
      const tl = si * (SLICES + 1) + ti;
      const bl = tl + (SLICES + 1);
      idxs[ii++] = tl;     idxs[ii++] = bl;     idxs[ii++] = tl + 1;
      idxs[ii++] = tl + 1; idxs[ii++] = bl;     idxs[ii++] = bl + 1;
    }
  }

  return {
    vertexData:       verts,
    indexData:        idxs,
    frontIndexOffset: 0,
    frontIndexCount:  0,
    otherIndexCount:  numIdx,
    totalIndexCount:  numIdx,
  };
}
