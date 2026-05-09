import { P } from './snapshot';
import type { BlobCreature, ClamCreature } from '@types';

export function drawSpotlights(ctx: CanvasRenderingContext2D, creatures: Array<BlobCreature | ClamCreature>) {
  for (const blob of creatures) {
    if (blob.spotlightAlpha < 0.001) continue;
    const r    = P.BELL_RADIUS * P.SPOTLIGHT_RADIUS_MULT;
    const a0   = blob.spotlightAlpha;
    const a1   = (a0 * 0.4).toFixed(4);
    const grad = ctx.createRadialGradient(blob.cx, blob.cy, 0, blob.cx, blob.cy, r);
    grad.addColorStop(0,   `rgba(${blob.colorR},${blob.colorG},${blob.colorB},${a0.toFixed(4)})`);
    grad.addColorStop(0.5, `rgba(${blob.colorR},${blob.colorG},${blob.colorB},${a1})`);
    grad.addColorStop(1,   `rgba(${blob.colorR},${blob.colorG},${blob.colorB},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(blob.cx, blob.cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
