import { writable } from 'svelte/store';

export const DITHER_ENABLED      = writable(false);
export const DITHER_PIXEL_SIZE   = writable(2);
export const DITHER_LEVELS       = writable(12);
export const DITHER_OPACITY      = writable(0.85);
export const DITHER_TINT_ENABLED = writable(false);
export const DITHER_TINT_R       = writable(20);
export const DITHER_TINT_G       = writable(60);
export const DITHER_TINT_B       = writable(80);
export const DITHER_TINT_STR     = writable(0.06);
export const DITHER_SCAN_ENABLED = writable(true);
export const DITHER_SCAN_ALPHA   = writable(0.08);
export const DITHER_SCAN_GAP     = writable(3);
