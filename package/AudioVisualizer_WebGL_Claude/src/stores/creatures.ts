import { writable } from 'svelte/store';
import type { BlobCreature, ClamCreature } from '@types';

export const blobs = writable<BlobCreature[]>([]);
export const clams = writable<ClamCreature[]>([]);
