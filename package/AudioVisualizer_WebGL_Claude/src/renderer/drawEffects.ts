import { P } from './snapshot';
import type { Shockwave, PolygonFlash, Spark, WaterRipple } from '@types';

export function drawShockwaves(ctx: CanvasRenderingContext2D, shockwaves: Shockwave[], dtF: number) {
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];
    sw.radius += sw.speed * dtF;
    sw.life   -= dtF;
    if (sw.life <= 0 || sw.radius > sw.maxRadius) { shockwaves.splice(i, 1); continue; }
    const alpha     = (sw.life / sw.maxLife) * 0.7;
    const lineWidth = 1.5 + (1 - sw.radius / sw.maxRadius) * 2.5;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${sw.er},${sw.eg},${sw.eb},${alpha})`;
    ctx.lineWidth   = lineWidth;
    ctx.shadowColor = `rgba(${sw.er},${sw.eg},${sw.eb},0.6)`;
    ctx.shadowBlur  = 8;
    ctx.stroke();
    ctx.shadowBlur  = 0;
  }
}

export function drawPolygonFlashes(ctx: CanvasRenderingContext2D, polygonFlashes: PolygonFlash[], dtF: number) {
  for (let i = polygonFlashes.length - 1; i >= 0; i--) {
    const pf = polygonFlashes[i];
    const scale = pf.progress;
    pf.progress += pf.speed * dtF;
    if (pf.progress > P.POLYGON_MAX_SCALE) { polygonFlashes.splice(i, 1); continue; }
    const t       = pf.progress / P.POLYGON_MAX_SCALE;
    const opacity = pf.opacity * (1 - t);
    ctx.beginPath();
    for (let j = 0; j <= pf.sides; j++) {
      const angle = pf.rotation + (j / pf.sides) * Math.PI * 2;
      const px    = pf.cx + Math.cos(angle) * scale;
      const py    = pf.cy + Math.sin(angle) * scale;
      if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = `rgba(${pf.er},${pf.eg},${pf.eb},${opacity})`;
    ctx.lineWidth   = 2;
    ctx.shadowColor = `rgba(${pf.er},${pf.eg},${pf.eb},${opacity * 0.8})`;
    ctx.shadowBlur  = 12;
    ctx.stroke();
    ctx.shadowBlur  = 0;
  }
}

export function drawRipples(ctx: CanvasRenderingContext2D, ripples: WaterRipple[], dtF: number) {
  const brighten = P.RIPPLE_BRIGHTEN;
  const cr = Math.min(255, P.BG_R + brighten);
  const cg = Math.min(255, P.BG_G + brighten);
  const cb = Math.min(255, P.BG_B + brighten);
  const dr = Math.max(0,   P.BG_R - Math.floor(brighten * 0.5));
  const dg = Math.max(0,   P.BG_G - Math.floor(brighten * 0.5));
  const db = Math.max(0,   P.BG_B - Math.floor(brighten * 0.5));

  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];
    rp.radius += rp.speed * dtF;
    rp.life   -= dtF;
    if (rp.life <= 0 || rp.radius > rp.maxRadius) { ripples.splice(i, 1); continue; }

    const t     = rp.radius / rp.maxRadius;
    const alpha = (rp.life / rp.maxLife) * P.RIPPLE_ALPHA * (1 - t * 0.4);

    // Crest ring
    ctx.beginPath();
    ctx.arc(rp.x, rp.y, rp.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(4)})`;
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Trough ring (trailing, slightly darker)
    const troughR = rp.radius - P.RIPPLE_WAVELENGTH * 0.35;
    if (troughR > 0) {
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, troughR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${dr},${dg},${db},${(alpha * 0.6).toFixed(4)})`;
      ctx.lineWidth   = 1.0;
      ctx.stroke();
    }
  }
}

export function drawSparks(ctx: CanvasRenderingContext2D, sparks: Spark[], dtF: number) {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.x += s.vx * dtF; s.y += s.vy * dtF;
    s.vx *= Math.pow(0.94, dtF); s.vy *= Math.pow(0.94, dtF);
    s.life -= dtF;
    if (s.life <= 0) { sparks.splice(i, 1); continue; }
    const alpha = s.life / s.maxLife;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 1.5 * alpha + 0.5, 0, Math.PI * 2);
    ctx.fillStyle   = `rgba(${s.er},${s.eg},${s.eb},${alpha})`;
    ctx.shadowColor = `rgba(${s.er},${s.eg},${s.eb},${alpha * 0.6})`;
    ctx.shadowBlur  = 6;
    ctx.fill();
    ctx.shadowBlur  = 0;
  }
}
