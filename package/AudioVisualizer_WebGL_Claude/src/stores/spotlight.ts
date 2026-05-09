import { writable } from 'svelte/store';

export const SPOTLIGHT_ENABLED     = writable(true);
export const SOLO_THRESHOLD_MS     = writable(4000);
export const SPOTLIGHT_MAX_ALPHA   = writable(0.18);
export const SPOTLIGHT_RADIUS_MULT = writable(3.5);
export const SPOTLIGHT_FADE_IN     = writable(0.04);
export const SPOTLIGHT_FADE_OUT    = writable(0.02);
