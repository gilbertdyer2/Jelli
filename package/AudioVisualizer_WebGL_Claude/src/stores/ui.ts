import { writable } from 'svelte/store';

export const currentPage    = writable<'jelli' | 'syn' | 'grove' | 'lichen'>('jelli');
export const panelOpen      = writable(false);
export const activeTab      = writable<'controls' | 'analysis' | 'performance'>('controls');
export const streaming      = writable(false);
export const status         = writable('Idle');
export const beatLogEntries = writable<Array<{ id: number; time: string; name: string; color: string; ivl: string }>>([]);

export interface SpawnModalState {
  open: boolean;
  mode: 'spawn' | 'edit';
  spawnType: 'jelli' | 'clam';
  creature?: import('@types').BlobCreature | import('@types').ClamCreature;
}

export const spawnModalState = writable<SpawnModalState>({
  open: false, mode: 'spawn', spawnType: 'jelli',
});
