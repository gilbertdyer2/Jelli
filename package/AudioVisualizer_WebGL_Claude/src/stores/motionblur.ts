import { writable } from 'svelte/store';

export const MB_ENABLED       = writable(true);
export const MB_STRENGTH      = writable(0.35);  // 0 = no blur, 0.98 = max persistence
export const MB_SOFTNESS      = writable(0.56);   // 0 = sharp ghosts, 1 = very blurry
export const MB_TRIGGER_BOOST = writable(0.52);   // extra persistence spike on bass trigger (0-1)
export const MB_TRIGGER_DECAY = writable(350);   // ms half-life for boost decay
export const MB_REVERSE_BOOST = writable(false); // invert trigger: reduce blur instead of increase
export const MB_TRIG_HZ       = writable(90);    // dedicated MB trigger detector center frequency
export const MB_TRIG_RANGE_HZ = writable(30);    // dedicated MB trigger detector range
