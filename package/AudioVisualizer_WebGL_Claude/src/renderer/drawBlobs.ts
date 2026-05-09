import { P } from './snapshot';
import type { BlobCreature } from '@types';

function smoothPath(ctx: CanvasRenderingContext2D, pts: Array<{x:number;y:number}>) {
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i+1].x) * 0.5;
    const my = (pts[i].y + pts[i+1].y) * 0.5;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }
  ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
}

export function drawBlobs(ctx: CanvasRenderingContext2D, blobs: BlobCreature[]) {
  ctx.lineCap = 'round';

  for (const blob of blobs) {
    const param = blob.detector ? blob.detector.parameter : 0;
    const { rimParticles, rimOnly, tentacles, cx, cy, colorR, colorG, colorB } = blob;
    if (rimParticles.length < 3) continue;

    const apex = rimOnly[Math.floor(rimOnly.length / 2)];

    // 1. Tentacles
    for (const chain of tentacles) {
      if (chain.length < 2) continue;
      const root = chain[0];
      const tip  = chain[chain.length - 1];
      const sp   = blob.tentacleSpreadScale - 1.0;
      const grad = ctx.createLinearGradient(root.x, root.y, tip.x, tip.y);
      const a0   = 0.40 + param * 0.25 + sp * 0.35;
      grad.addColorStop(0,    `rgba(${colorR},${colorG},${colorB},${a0})`);
      grad.addColorStop(0.55, `rgba(${colorR},${colorG},${colorB},${a0 * 0.38})`);
      grad.addColorStop(1,    `rgba(${colorR},${colorG},${colorB},0)`);
      ctx.beginPath();
      smoothPath(ctx, chain);
      ctx.strokeStyle = grad;
      ctx.lineWidth   = 1.0 + param * 0.8 + sp * 2.5;
      ctx.shadowColor = `rgba(${colorR},${colorG},${colorB},${0.25 + sp * 0.4})`;
      ctx.shadowBlur  = 4 + param * 8 + sp * 14;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    const _roFirst = rimOnly[0], _roLast = rimOnly[rimOnly.length - 1];
    const _rimMidX = (_roFirst.x + _roLast.x) / 2;
    const _rimMidY = (_roFirst.y + _roLast.y) / 2;
    const _rimOdx  = _rimMidX - cx, _rimOdy = _rimMidY - cy;
    const _rimOlen = Math.sqrt(_rimOdx * _rimOdx + _rimOdy * _rimOdy) || 1;
    const _rimCpx  = _rimMidX + (_rimOdx / _rimOlen) * P.BELL_RADIUS * 0.2;
    const _rimCpy  = _rimMidY + (_rimOdy / _rimOlen) * P.BELL_RADIUS * 0.2;

    // 2. Hull fill
    ctx.beginPath();
    smoothPath(ctx, rimOnly);
    ctx.quadraticCurveTo(_rimCpx, _rimCpy, _roFirst.x, _roFirst.y);
    ctx.closePath();
    const fill = ctx.createRadialGradient(apex.x, apex.y, 0, cx, cy, P.BELL_RADIUS * 1.1);
    fill.addColorStop(0,   `rgba(${colorR},${colorG},${colorB},${0.13 + param * 0.10})`);
    fill.addColorStop(0.6, `rgba(${colorR},${colorG},${colorB},${0.05 + param * 0.04})`);
    fill.addColorStop(1,   `rgba(${colorR},${colorG},${colorB},0.01)`);
    ctx.fillStyle = fill;
    ctx.fill();

    // 3. Web edges
    const webDist   = P.BLOB_EDGE_DIST;
    const webDistSq = webDist * webDist;
    const webAlpha0 = 0.07 + param * 0.22;
    ctx.lineWidth = 0.7;
    {
      const buckets: number[][] = [[], [], [], []];
      for (let i = 0; i < rimParticles.length; i++) {
        for (let j = i + 1; j < rimParticles.length; j++) {
          const dx = rimParticles[j].x - rimParticles[i].x;
          const dy = rimParticles[j].y - rimParticles[i].y;
          const d2 = dx*dx + dy*dy;
          if (d2 > webDistSq) continue;
          const t = 1 - Math.sqrt(d2) / webDist;
          buckets[Math.min(3, t * 4 | 0)].push(i, j);
        }
      }
      for (let b = 0; b < 4; b++) {
        if (!buckets[b].length) continue;
        const a = webAlpha0 * ((b + 0.5) / 4);
        ctx.strokeStyle = `rgba(${colorR},${colorG},${colorB},${a})`;
        ctx.beginPath();
        for (let k = 0; k < buckets[b].length; k += 2) {
          const pi = rimParticles[buckets[b][k]], pj = rimParticles[buckets[b][k+1]];
          ctx.moveTo(pi.x, pi.y); ctx.lineTo(pj.x, pj.y);
        }
        ctx.stroke();
      }
    }

    // 4. Rim glow
    ctx.beginPath();
    smoothPath(ctx, rimOnly);
    ctx.quadraticCurveTo(_rimCpx, _rimCpy, _roFirst.x, _roFirst.y);
    ctx.shadowColor = `rgba(${colorR},${colorG},${colorB},0.75)`;
    ctx.shadowBlur  = 8 + param * 14;
    ctx.strokeStyle = `rgba(${colorR},${colorG},${colorB},${0.45 + param * 0.28})`;
    ctx.lineWidth   = 1.4;
    ctx.stroke();
    ctx.shadowBlur  = 0;

    // 5. Dots
    ctx.shadowColor = `rgba(${colorR},${colorG},${colorB},0.85)`;
    ctx.shadowBlur  = 4 + param * 9;
    for (const p of rimParticles) {
      const r = p.rim ? P.NODE_BASE_RADIUS * 0.70 : P.NODE_BASE_RADIUS * 0.48;
      const a = p.rim ? (0.75 + param * 0.20) : (0.48 + param * 0.30);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${colorR},${colorG},${colorB},${a})`;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}
