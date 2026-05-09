import { writable } from 'svelte/store';

export const UW_CAUSTICS_ENABLED  = writable(true);
export const UW_CAUSTICS_ALPHA    = writable(0.022);
export const UW_CAUSTICS_SPEED    = writable(0.00018);
export const UW_PARTICLES_ENABLED = writable(true);
export const UW_PARTICLES_ALPHA   = writable(0.40);
export const UW_PARTICLES_SPEED   = writable(0.84);
export const UW_BLOB_R1 = writable(255);
export const UW_BLOB_G1 = writable(158);
export const UW_BLOB_B1 = writable(215);
export const UW_BLOB_R2 = writable(253);
export const UW_BLOB_G2 = writable(109);
export const UW_BLOB_B2 = writable(109);
export const UW_PARTICLES_R = writable(0);
export const UW_PARTICLES_G = writable(0);
export const UW_PARTICLES_B = writable(0);
