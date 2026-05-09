import { writable } from 'svelte/store';

export const DUO_LINK_ENABLED        = writable(false);
export const DUO_THRESHOLD_MS        = writable(4000);
export const DUO_LINK_MAX_ALPHA      = writable(0.14);
export const DUO_SYNC_WINDOW         = writable(5.0);
export const DUO_SYNC_TOLERANCE      = writable(200);
export const DUO_SYNC_MIN_MATCHES    = writable(3);
export const DUO_LINK_EDGE_DIST      = writable(110);
export const DUO_LINK_PARTICLE_COUNT = writable(32);
export const DUO_LINK_SPREAD         = writable(1.2);
export const DUO_FADE_IN             = writable(0.03);
export const DUO_FADE_OUT            = writable(0.015);
