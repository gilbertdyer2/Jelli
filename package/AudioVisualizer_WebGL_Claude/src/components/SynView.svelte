<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { SynRenderer } from '@renderer/SynRenderer';

  let canvasEl: HTMLCanvasElement;
  let renderer: SynRenderer;

  onMount(() => {
    renderer = new SynRenderer(canvasEl);
    renderer.init();
    renderer.start();
  });

  onDestroy(() => renderer?.stop());
</script>

<canvas id="syn-canvas" bind:this={canvasEl}></canvas>
