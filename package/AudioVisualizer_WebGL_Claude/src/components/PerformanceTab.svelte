<script lang="ts">
  import { onMount } from 'svelte';
  import { blobs, clams } from '@stores/creatures';
  import { activeTab, currentPage } from '@stores/ui';
  import { shockwaves, polygonFlashes, sparks } from '@creatures/triggerEffects';
  import { get } from 'svelte/store';
  import * as Phys from '@stores/physics';

  // FPS tracking
  const FPS_WINDOW = 60;
  let frameTimes: number[] = [];
  let lastT = performance.now();
  let animId: number;

  // Display values — updated each frame
  let fps = 0;
  let frameMs = 0;
  let blobCount = 0;
  let clamCount = 0;
  let totalParticles = 0;
  let swCount = 0;
  let polyCount = 0;
  let sparkCount = 0;
  let canvasW = 0;
  let canvasH = 0;
  let heapUsed = '';
  let heapTotal = '';

  onMount(() => {
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  });

  function tick(now: number) {
    const dt = now - lastT;
    lastT = now;

    frameTimes.push(dt);
    if (frameTimes.length > FPS_WINDOW) frameTimes.shift();

    if ($activeTab === 'performance') {
      const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      fps = Math.round(1000 / avg);
      frameMs = +avg.toFixed(1);

      const bs = get(blobs);
      const cs = get(clams);
      blobCount = bs.length;
      clamCount = cs.length;

      const segCount = get(Phys.BLOB_PARTICLE_COUNT);
      const tentacleCount = 7; // hardcoded in blobFactory
      totalParticles = bs.reduce((sum, b) => sum + b.rimParticles.length + b.tentacles.length * segCount, 0)
                     + cs.reduce((sum, c) => sum + c.particles.length, 0);

      swCount    = shockwaves.length;
      polyCount  = polygonFlashes.length;
      sparkCount = sparks.length;

      const pageCanvasId = $currentPage === 'syn' ? 'syn-canvas'
                         : $currentPage === 'grove' ? 'grove-canvas'
                         : $currentPage === 'lichen' ? 'lichen-canvas'
                         : 'main-canvas';
      const canvas = document.getElementById(pageCanvasId) as HTMLCanvasElement | null;
      if (canvas) { canvasW = canvas.width; canvasH = canvas.height; }

      // Chrome-only memory API
      const mem = (performance as any).memory;
      if (mem) {
        heapUsed  = (mem.usedJSHeapSize  / 1048576).toFixed(1) + ' MB';
        heapTotal = (mem.totalJSHeapSize / 1048576).toFixed(1) + ' MB';
      }
    }

    animId = requestAnimationFrame(tick);
  }
</script>

<div id="perf-tab">
  <div class="perf-section">
    <div class="perf-title">Timing</div>
    <div class="perf-row">
      <span class="perf-label">FPS</span>
      <span class="perf-value" class:perf-warn={fps < 45} class:perf-ok={fps >= 55}>{fps}</span>
    </div>
    <div class="perf-row">
      <span class="perf-label">Frame time</span>
      <span class="perf-value">{frameMs} ms</span>
    </div>
  </div>

  <div class="perf-section">
    <div class="perf-title">Canvas</div>
    <div class="perf-row">
      <span class="perf-label">Resolution</span>
      <span class="perf-value">{canvasW} × {canvasH}</span>
    </div>
  </div>

  {#if $currentPage === 'jelli'}
  <div class="perf-section">
    <div class="perf-title">Scene</div>
    <div class="perf-row">
      <span class="perf-label">Jellyfish</span>
      <span class="perf-value">{blobCount}</span>
    </div>
    <div class="perf-row">
      <span class="perf-label">Clams</span>
      <span class="perf-value">{clamCount}</span>
    </div>
    <div class="perf-row">
      <span class="perf-label">Particles</span>
      <span class="perf-value">{totalParticles}</span>
    </div>
  </div>

  <div class="perf-section">
    <div class="perf-title">Active Effects</div>
    <div class="perf-row">
      <span class="perf-label">Shockwaves</span>
      <span class="perf-value">{swCount}</span>
    </div>
    <div class="perf-row">
      <span class="perf-label">Polygons</span>
      <span class="perf-value">{polyCount}</span>
    </div>
    <div class="perf-row">
      <span class="perf-label">Sparks</span>
      <span class="perf-value">{sparkCount}</span>
    </div>
  </div>
  {/if}

  {#if heapUsed}
  <div class="perf-section">
    <div class="perf-title">Memory (JS Heap)</div>
    <div class="perf-row">
      <span class="perf-label">Used</span>
      <span class="perf-value">{heapUsed}</span>
    </div>
    <div class="perf-row">
      <span class="perf-label">Total</span>
      <span class="perf-value">{heapTotal}</span>
    </div>
  </div>
  {/if}
</div>

<style>
  #perf-tab {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    padding: 10px 14px;
    overflow-y: auto;
    height: 100%;
    box-sizing: border-box;
    align-content: flex-start;
  }
  .perf-section {
    min-width: 140px;
  }
  .perf-title {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: rgba(140,170,215,.45);
    margin-bottom: 6px;
  }
  .perf-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    font-size: 12px;
    line-height: 1.9;
  }
  .perf-label {
    color: rgba(180,200,230,.55);
  }
  .perf-value {
    color: rgba(200,220,255,.85);
    font-variant-numeric: tabular-nums;
    min-width: 52px;
    text-align: right;
  }
  .perf-warn { color: #f4a261; }
  .perf-ok   { color: #52c77a; }
</style>
