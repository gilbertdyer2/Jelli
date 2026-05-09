import { writable } from 'svelte/store';
import { syncThresholdParams } from '@audio/audioEngine';

export const IDLE_DECAY_RATE = writable(2.0);
export const FREQ_DECAY_BIAS = writable(0.5);
export const MIN_FLUX_FLOOR  = writable(0.0000);

IDLE_DECAY_RATE.subscribe(() => { try { syncThresholdParams(); } catch (_) {} });
FREQ_DECAY_BIAS.subscribe(() => { try { syncThresholdParams(); } catch (_) {} });
MIN_FLUX_FLOOR.subscribe(()  => { try { syncThresholdParams(); } catch (_) {} });
