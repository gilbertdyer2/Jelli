<script lang="ts">
  import SliderGroup from './SliderGroup.svelte';
  import { get } from 'svelte/store';
  import type { SliderGroup as SliderGroupType } from '@utils/sliderConfig';
  import {
    GROVE_GROW_SPEED, GROVE_MAX_DEPTH,
    GROVE_SWAY_ENABLED, GROVE_SWAY_SPEED,
    GROVE_BLOSSOM_ENABLED, GROVE_PULSE_ENABLED,
    GROVE_SPREAD_ANGLE, GROVE_GLOW_INTENSITY,
  } from '@stores/grove';

  const groups: SliderGroupType[] = [
    { group: 'Growth', col: 1, items: [
      { label: 'Grow Speed', min: 0.1, max: 5.0, step: 0.1, get: () => get(GROVE_GROW_SPEED), set: (v) => GROVE_GROW_SPEED.set(v) },
      { label: 'Max Depth',  min: 2,   max: 7,   step: 1,   get: () => get(GROVE_MAX_DEPTH),  set: (v) => GROVE_MAX_DEPTH.set(v) },
    ]},
    { group: 'Branching', col: 1, items: [
      { label: 'Spread Angle', min: 8, max: 55, step: 1, get: () => get(GROVE_SPREAD_ANGLE), set: (v) => GROVE_SPREAD_ANGLE.set(v) },
    ]},
    { group: 'Sway', col: 1, items: [
      { label: 'Enabled', type: 'toggle', get: () => get(GROVE_SWAY_ENABLED), set: (v) => GROVE_SWAY_ENABLED.set(v) },
      { label: 'Speed',   min: 0.1, max: 4.0, step: 0.1,  get: () => get(GROVE_SWAY_SPEED), set: (v) => GROVE_SWAY_SPEED.set(v) },
    ]},
    { group: 'Effects', col: 2, items: [
      { label: 'Blossoms', type: 'toggle', get: () => get(GROVE_BLOSSOM_ENABLED), set: (v) => GROVE_BLOSSOM_ENABLED.set(v) },
      { label: 'Pulses',   type: 'toggle', get: () => get(GROVE_PULSE_ENABLED),   set: (v) => GROVE_PULSE_ENABLED.set(v) },
    ]},
    { group: 'Rendering', col: 2, items: [
      { label: 'Glow Intensity', min: 0.1, max: 2.5, step: 0.05, get: () => get(GROVE_GLOW_INTENSITY), set: (v) => GROVE_GLOW_INTENSITY.set(v) },
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
