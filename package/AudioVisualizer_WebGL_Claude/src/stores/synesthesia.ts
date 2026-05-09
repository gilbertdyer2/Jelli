import { writable } from 'svelte/store';

export const SYN_BLOOM_ENABLED     = writable(true);
export const SYN_SCATTER_ENABLED   = writable(true);
export const SYN_PARTICLES_ENABLED = writable(true);
export const SYN_RINGS_ENABLED     = writable(true);
export const SYN_WAVEFORM_ENABLED  = writable(false);
export const SYN_BLOOM_INTENSITY   = writable(1.0);   // multiplier on bloom opacity
export const SYN_SCATTER_COUNT     = writable(64);    // number of scatter nodes
export const SYN_RING_SPEED        = writable(1.8);   // px/ms ring expansion
export const SYN_RING_LIFETIME     = writable(950);   // ms ring lifetime
