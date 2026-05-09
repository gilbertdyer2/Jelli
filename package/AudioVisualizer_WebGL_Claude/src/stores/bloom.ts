import { writable } from 'svelte/store';

// ─── Bloom post-processing ────────────────────────────────────────────────────
export const BLOOM_ENABLED   = writable(true);
export const BLOOM_THRESHOLD = writable(0.12);  // luminance cutoff for extraction (soft-knee)
export const BLOOM_STRENGTH  = writable(2.45);  // additive glow multiplier
export const BLOOM_RADIUS    = writable(2.7);   // blur kernel spread (texel offset scale)
export const BLOOM_PASSES    = writable(3);     // H+V blur iterations (1=sharp, 4=very soft)
