<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { GroveRenderer } from '@renderer/GroveRenderer';

  let canvasEl: HTMLCanvasElement;
  let renderer: GroveRenderer;

  onMount(() => {
    renderer = new GroveRenderer(canvasEl);
    renderer.init();
    renderer.start();
  });

  onDestroy(() => renderer?.stop());
</script>

<canvas id="grove-canvas" bind:this={canvasEl}></canvas>
