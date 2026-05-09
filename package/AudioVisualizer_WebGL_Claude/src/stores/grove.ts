import { writable } from 'svelte/store';

export const GROVE_GROW_SPEED      = writable(1.0);
export const GROVE_MAX_DEPTH       = writable(4);
export const GROVE_SWAY_ENABLED    = writable(true);
export const GROVE_SWAY_SPEED      = writable(1.0);
export const GROVE_BLOSSOM_ENABLED = writable(true);
export const GROVE_PULSE_ENABLED   = writable(true);
export const GROVE_SPREAD_ANGLE    = writable(26);    // degrees
export const GROVE_GLOW_INTENSITY  = writable(1.0);
