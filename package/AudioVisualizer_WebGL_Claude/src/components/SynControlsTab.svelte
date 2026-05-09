<script lang="ts">
  import SliderGroup from './SliderGroup.svelte';
  import { get } from 'svelte/store';
  import type { SliderGroup as SliderGroupType } from '@utils/sliderConfig';
  import {
    SYN_BLOOM_ENABLED, SYN_BLOOM_INTENSITY,
    SYN_SCATTER_ENABLED, SYN_SCATTER_COUNT,
    SYN_PARTICLES_ENABLED,
    SYN_RINGS_ENABLED, SYN_RING_SPEED, SYN_RING_LIFETIME,
    SYN_WAVEFORM_ENABLED,
  } from '@stores/synesthesia';

  const groups: SliderGroupType[] = [
    { group: 'Bloom', col: 1, items: [
      { label: 'Enabled',   type: 'toggle', get: () => get(SYN_BLOOM_ENABLED),   set: (v) => SYN_BLOOM_ENABLED.set(v) },
      { label: 'Intensity', min: 0.1, max: 3.0, step: 0.05, get: () => get(SYN_BLOOM_INTENSITY), set: (v) => SYN_BLOOM_INTENSITY.set(v) },
    ]},
    { group: 'Scatter', col: 1, items: [
      { label: 'Enabled', type: 'toggle', get: () => get(SYN_SCATTER_ENABLED), set: (v) => SYN_SCATTER_ENABLED.set(v) },
      { label: 'Count',   min: 8, max: 160, step: 4, get: () => get(SYN_SCATTER_COUNT), set: (v) => SYN_SCATTER_COUNT.set(v) },
    ]},
    { group: 'Particles', col: 2, items: [
      { label: 'Enabled', type: 'toggle', get: () => get(SYN_PARTICLES_ENABLED), set: (v) => SYN_PARTICLES_ENABLED.set(v) },
    ]},
    { group: 'Rings', col: 2, items: [
      { label: 'Enabled',  type: 'toggle', get: () => get(SYN_RINGS_ENABLED),    set: (v) => SYN_RINGS_ENABLED.set(v) },
      { label: 'Speed',    min: 0.3, max: 5.0,  step: 0.1, get: () => get(SYN_RING_SPEED),    set: (v) => SYN_RING_SPEED.set(v) },
      { label: 'Lifetime', min: 100, max: 2500, step: 50,  get: () => get(SYN_RING_LIFETIME), set: (v) => SYN_RING_LIFETIME.set(v) },
    ]},
    { group: 'Waveform', col: 2, items: [
      { label: 'Enabled', type: 'toggle', get: () => get(SYN_WAVEFORM_ENABLED), set: (v) => SYN_WAVEFORM_ENABLED.set(v) },
    ]},
  ];
</script>

<div class="simple-ctrl-layout">
  {#each groups as group}
    <SliderGroup {group} />
  {/each}
</div>

<style>
  .simple-ctrl-layout {
    display: flex;
    flex-wrap: wrap;
    gap: 0 28px;
    padding: 8px 14px;
    overflow-y: auto;
    height: 100%;
    box-sizing: border-box;
    align-content: flex-start;
  }
</style>
