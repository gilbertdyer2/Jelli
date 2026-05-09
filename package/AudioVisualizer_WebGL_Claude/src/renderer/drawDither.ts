import { P } from '@renderer/snapshot';

const _BAYER4_FLAT = new Uint8Array([0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]);

let _ditherCanvas: HTMLCanvasElement | null = null;
let _ditherCtx: CanvasRenderingContext2D | null = null;
let _ditherLUT: Uint8Array | null = null;

export function invalidateDitherLUT(): void {
  _ditherLUT = null;
}

function buildDitherLUT(): void {
  const levels = Math.max(2, Math.round(P.DITHER_LEVELS));
  const step   = 1 / (levels - 1);
  const tstr   = P.DITHER_TINT_ENABLED ? P.DITHER_TINT_STR : 0;
  const tint   = [P.DITHER_TINT_R / 255, P.DITHER_TINT_G / 255, P.DITHER_TINT_B / 255];
  const lut    = new Uint8Array(3 * 16 * 256);
  for (let c = 0; c < 3; c++) {
    const tc   = tint[c];
    const base = c * 4096;
    for (let bv = 0; bv < 16; bv++) {
      const thresh = (_BAYER4_FLAT[bv] / 16 - 0.5) * step;
      const off    = base + bv * 256;
      for (let inp = 0; inp < 256; inp++) {
        let v = inp / 255;
        if (tstr > 0) v = v * (1 - tstr) + tc * tstr;
        v += thresh;
        if (v < 0) v = 0; else if (v > 1) v = 1;
        lut[off + inp] = Math.round(Math.round(v / step) * step * 255);
      }
    }
  }
  _ditherLUT = lut;
}

export function applyDitherFilter(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
  if (!P.DITHER_ENABLED) return;
  const W = canvas.width, H = canvas.height;
  const ps = Math.max(2, Math.round(P.DITHER_PIXEL_SIZE));
  const dw = Math.max(1, Math.round(W / ps));
  const dh = Math.max(1, Math.round(H / ps));

  if (!_ditherCanvas || _ditherCanvas.width !== dw || _ditherCanvas.height !== dh) {
    _ditherCanvas = document.createElement('canvas');
    _ditherCanvas.width  = dw;
    _ditherCanvas.height = dh;
    _ditherCtx = _ditherCanvas.getContext('2d', { willReadFrequently: true });
  }
  if (!_ditherLUT) buildDitherLUT();
  const lut = _ditherLUT!;
  const dc  = _ditherCtx!;

  dc.drawImage(canvas, 0, 0, dw, dh);
  const imgData = dc.getImageData(0, 0, dw, dh);
  const d = imgData.data;

  for (let y = 0; y < dh; y++) {
    const brR = (y    ) & 3;
    const brG = (y + 1) & 3;
    const brB = (y + 2) & 3;
    let i = y * dw * 4;
    for (let x = 0; x < dw; x++, i += 4) {
      const bcR = (x    ) & 3;
      const bcG = (x + 1) & 3;
      const bcB = (x + 2) & 3;
      d[i]   = lut[        _BAYER4_FLAT[brR * 4 + bcR] * 256 + d[i]  ];
      d[i+1] = lut[4096  + _BAYER4_FLAT[brG * 4 + bcG] * 256 + d[i+1]];
      d[i+2] = lut[8192  + _BAYER4_FLAT[brB * 4 + bcB] * 256 + d[i+2]];
    }
  }
  dc.putImageData(imgData, 0, 0);

  ctx.save();
  ctx.globalAlpha = Math.min(1, Math.max(0, P.DITHER_OPACITY));
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'low';
  ctx.drawImage(_ditherCanvas, 0, 0, W, H);
  ctx.restore();

  if (P.DITHER_SCAN_ENABLED && P.DITHER_SCAN_ALPHA > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${P.DITHER_SCAN_ALPHA})`;
    const gap = Math.max(2, Math.round(P.DITHER_SCAN_GAP));
    for (let y = 0; y < H; y += gap) ctx.fillRect(0, y, W, 1);
    ctx.restore();
  }
}
