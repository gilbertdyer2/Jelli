// Vertex stride: [x, y, z, nx, ny, nz, u, v, faceId] = 9 floats
// faceId = 0 → front face; 1 → all other faces
// All faces are now subdivided so the vertex shader can displace them.

const FRONT_COLS = 32;
const FRONT_ROWS = 64;
const BACK_COLS  = 8;
const BACK_ROWS  = 20;
const SIDE_COLS  = 4;
const SIDE_ROWS  = 20;
const CAP_COLS   = 8;
const CAP_ROWS   = 4;
const STRIDE = 9;

export interface MonolithGeometry {
  vertexData:       Float32Array;
  indexData:        Uint16Array;
  frontIndexOffset: number;  // byte offset of front-face indices in IBO
  frontIndexCount:  number;
  otherIndexCount:  number;
  totalIndexCount:  number;  // otherIndexCount + frontIndexCount
}

export function buildMonolithGeometry(halfW = 0.28, halfH = 0.70, halfD = 0.04): MonolithGeometry {
  // Vertex counts per face
  const frontVerts = (FRONT_COLS + 1) * (FRONT_ROWS + 1);  // 33 × 65 = 2145
  const backVerts  = (BACK_COLS  + 1) * (BACK_ROWS  + 1);  //  9 × 21 = 189
  const sideVerts  = (SIDE_COLS  + 1) * (SIDE_ROWS  + 1);  //  5 × 21 = 105 × 2
  const capVerts   = (CAP_COLS   + 1) * (CAP_ROWS   + 1);  //  9 ×  5 =  45 × 2
  const totalVerts = frontVerts + backVerts + sideVerts * 2 + capVerts * 2;  // 2634

  // Index counts per face
  const frontQuads = FRONT_COLS * FRONT_ROWS;  // 2048
  const backQuads  = BACK_COLS  * BACK_ROWS;   //  160
  const sideQuads  = SIDE_COLS  * SIDE_ROWS;   //   80 × 2
  const capQuads   = CAP_COLS   * CAP_ROWS;    //   32 × 2
  const otherQuads = backQuads + sideQuads * 2 + capQuads * 2;  // 384
  const totalIdxs  = (frontQuads + otherQuads) * 6;  // 14592

  const verts = new Float32Array(totalVerts * STRIDE);
  const idxs  = new Uint16Array(totalIdxs);

  let vi = 0, ii = 0, vc = 0;

  function pushVert(
    x: number, y: number, z: number,
    nx: number, ny: number, nz: number,
    u: number, v: number, faceId: number,
  ): number {
    verts[vi++] = x;  verts[vi++] = y;  verts[vi++] = z;
    verts[vi++] = nx; verts[vi++] = ny; verts[vi++] = nz;
    verts[vi++] = u;  verts[vi++] = v;  verts[vi++] = faceId;
    return vc++;
  }

  // Emit a cols×rows subdivided quad face. getVert maps (u01, v01) → 9-tuple.
  // flip=true reverses triangle winding for faces where e1×e2 opposes the face normal
  // (back, top, bottom) so all faces are correctly outward-facing for gl.CULL_FACE.
  function pushGrid(
    cols: number, rows: number,
    getVert: (u: number, v: number) => readonly [number,number,number,number,number,number,number,number,number],
    flip = false,
  ): void {
    const base = vc;
    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= cols; col++) {
        const [x,y,z,nx,ny,nz,mu,mv,fId] = getVert(col / cols, row / rows);
        pushVert(x, y, z, nx, ny, nz, mu, mv, fId);
      }
    }
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tl = base + row * (cols + 1) + col;
        if (!flip) {
          idxs[ii++] = tl;            idxs[ii++] = tl + 1;               idxs[ii++] = tl + (cols + 1);
          idxs[ii++] = tl + 1;        idxs[ii++] = tl + (cols + 1) + 1;  idxs[ii++] = tl + (cols + 1);
        } else {
          idxs[ii++] = tl + (cols+1); idxs[ii++] = tl + 1;               idxs[ii++] = tl;
          idxs[ii++] = tl + (cols+1); idxs[ii++] = tl + (cols+1) + 1;    idxs[ii++] = tl + 1;
        }
      }
    }
  }

  // ── Other faces (drawn first) ──────────────────────────────────────────────
  const otherIndexStart = ii;

  // Back face (normal -Z) — flip: e1×e2=(+z) opposes normal(-z)
  pushGrid(BACK_COLS, BACK_ROWS, (u, v) => [
    -halfW + u * halfW * 2, -halfH + v * halfH * 2, -halfD,
    0, 0, -1, u, v, 1,
  ], true);

  // Right face (normal +X): e1=(-z), e2=(+y), e1×e2=(+x) ✓ no flip
  pushGrid(SIDE_COLS, SIDE_ROWS, (u, v) => [
    halfW, -halfH + v * halfH * 2, halfD - u * halfD * 2,
    1, 0, 0, u, v, 1,
  ]);

  // Left face (normal -X): e1=(+z), e2=(+y), e1×e2=(-x) ✓ no flip
  pushGrid(SIDE_COLS, SIDE_ROWS, (u, v) => [
    -halfW, -halfH + v * halfH * 2, -halfD + u * halfD * 2,
    -1, 0, 0, u, v, 1,
  ]);

  // Top face (normal +Y) — flip: e1×e2=(-y) opposes normal(+y)
  pushGrid(CAP_COLS, CAP_ROWS, (u, v) => [
    -halfW + u * halfW * 2, halfH, -halfD + v * halfD * 2,
    0, 1, 0, u, v, 1,
  ], true);

  // Bottom face (normal -Y) — flip: e1×e2=(+y) opposes normal(-y)
  pushGrid(CAP_COLS, CAP_ROWS, (u, v) => [
    -halfW + u * halfW * 2, -halfH, halfD - v * halfD * 2,
    0, -1, 0, u, v, 1,
  ], true);

  const otherIndexCount = ii - otherIndexStart;

  // ── Front face (faceId = 0) ────────────────────────────────────────────────
  const frontIndexStart = ii;

  pushGrid(FRONT_COLS, FRONT_ROWS, (u, v) => [
    -halfW + u * halfW * 2, -halfH + v * halfH * 2, halfD,
    0, 0, 1, u, v, 0,
  ]);

  const frontIndexCount = ii - frontIndexStart;

  return {
    vertexData:       verts,
    indexData:        idxs,
    frontIndexOffset: frontIndexStart * 2,  // byte offset (Uint16 = 2 bytes)
    frontIndexCount,
    otherIndexCount,
    totalIndexCount:  otherIndexCount + frontIndexCount,
  };
}
