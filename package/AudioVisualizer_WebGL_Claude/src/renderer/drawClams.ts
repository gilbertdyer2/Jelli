import { P } from './snapshot';
import type { ClamCreature, ClamParticle } from '@types';

function smoothPath(ctx: CanvasRenderingContext2D, pts: ClamParticle[]) {
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i+1].x) * 0.5;
    const my = (pts[i].y + pts[i+1].y) * 0.5;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }
  ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y);
}

export function drawClams(ctx: CanvasRenderingContext2D, clams: ClamCreature[]) {
  ctx.lineCap = 'round';

  for (const clam of clams) {
    if (clam.particles.length < 3) continue;
    const param = clam.detector ? clam.detector.parameter : 0;
    const { particles, upperRim, lowerRim, cx, cy, colorR, colorG, colorB } = clam;

    // 1. Upper shell fill
    const apexU = upperRim[Math.floor(upperRim.length / 2)];
    ctx.beginPath();
    smoothPath(ctx, upperRim);
    ctx.lineTo(upperRim[0].x, upperRim[0].y);
    const fillU = ctx.createRadialGradient(apexU.x, apexU.y, 0, cx, cy, P.CLAM_SHELL_W * 1.15);
    fillU.addColorStop(0,    `rgba(${colorR},${colorG},${colorB},${(0.12 + param * 0.08).toFixed(3)})`);
    fillU.addColorStop(0.65, `rgba(${colorR},${colorG},${colorB},${(0.05 + param * 0.03).toFixed(3)})`);
    fillU.addColorStop(1,    `rgba(${colorR},${colorG},${colorB},0.01)`);
    ctx.fillStyle = fillU;
    ctx.fill();

    // 2. Lower shell fill
    const apexL = lowerRim[Math.floor(lowerRim.length / 2)];
    ctx.beginPath();
    smoothPath(ctx, lowerRim);
    ctx.lineTo(lowerRim[0].x, lowerRim[0].y);
    const fillL = ctx.createRadialGradient(apexL.x, apexL.y, 0, cx, cy, P.CLAM_SHELL_W * 1.15);
    fillL.addColorStop(0,    `rgba(${colorR},${colorG},${colorB},${(0.10 + param * 0.06).toFixed(3)})`);
    fillL.addColorStop(0.65, `rgba(${colorR},${colorG},${colorB},${(0.04 + param * 0.03).toFixed(3)})`);
    fillL.addColorStop(1,    `rgba(${colorR},${colorG},${colorB},0.01)`);
    ctx.fillStyle = fillL;
    ctx.fill();

    // 3. Web edges
    const webDist   = P.CLAM_EDGE_DIST;
    const webDistSq = webDist * webDist;
    const webAlpha0 = 0.07 + param * 0.22;
    ctx.lineWidth = 0.7;
    {
      const buckets: number[][] = [[], [], [], []];
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[j].x - particles[i].x;
          const dy = particles[j].y - particles[i].y;
          const dSq = dx*dx + dy*dy;
          if (dSq > webDistSq) continue;
          const t = 1 - Math.sqrt(dSq) / webDist;
          buckets[Math.min(3, t * 4 | 0)].push(i, j);
        }
      }
      for (let b = 0; b < 4; b++) {
        if (!buckets[b].length) continue;
        const a = webAlpha0 * ((b + 0.5) / 4);
        ctx.strokeStyle = `rgba(${colorR},${colorG},${colorB},${a})`;
        ctx.beginPath();
        for (let k = 0; k < buckets[b].length; k += 2) {
          const pi = particles[buckets[b][k]], pj = particles[buckets[b][k+1]];
          ctx.moveTo(pi.x, pi.y); ctx.lineTo(pj.x, pj.y);
        }
        ctx.stroke();
      }
    }

    // 4. Upper rim glow
    ctx.beginPath();
    smoothPath(ctx, upperRim);
    ctx.shadowColor = `rgba(${colorR},${colorG},${colorB},0.70)`;
    ctx.shadowBlur  = 7 + param * 12;
    ctx.strokeStyle = `rgba(${colorR},${colorG},${colorB},${(0.42 + param * 0.26).toFixed(3)})`;
    ctx.lineWidth   = 1.3;
    ctx.stroke();

    // 5. Lower rim glow
    ctx.beginPath();
    smoothPath(ctx, lowerRim);
    ctx.strokeStyle = `rgba(${colorR},${colorG},${colorB},${(0.30 + param * 0.18).toFixed(3)})`;
    ctx.lineWidth   = 1.1;
    ctx.stroke();
    ctx.shadowBlur  = 0;

    // 6. Lip gap
    if (clam.openAmount > 0.01) {
      const lipAlpha = Math.min(0.35, clam.openAmount * 0.6);
      const uL = upperRim[upperRim.length - 1], uR = upperRim[0];
      const lR = lowerRim[0], lL = lowerRim[lowerRim.length - 1];
      ctx.beginPath();
      ctx.moveTo(uR.x, uR.y); ctx.lineTo(lR.x, lR.y);
      ctx.moveTo(uL.x, uL.y); ctx.lineTo(lL.x, lL.y);
      ctx.strokeStyle = `rgba(${colorR},${colorG},${colorB},${lipAlpha.toFixed(3)})`;
      ctx.lineWidth   = 0.8;
      ctx.stroke();
    }

    // 7. Dots
    ctx.shadowColor = `rgba(${colorR},${colorG},${colorB},0.85)`;
    ctx.shadowBlur  = 3 + param * 8;
    for (const p of particles) {
      const r = p.rim ? 1.9 * 0.68 : 1.9 * 0.44;
      const a = p.rim ? (0.70 + param * 0.20) : (0.44 + param * 0.28);
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${colorR},${colorG},${colorB},${a})`;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}
