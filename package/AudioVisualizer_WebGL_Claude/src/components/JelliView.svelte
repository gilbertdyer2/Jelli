<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Renderer } from '@renderer/Renderer';
  import { initStoreSnapshots } from '@renderer/snapshot';
  import { spawnModalState } from '@stores/ui';
  import { get } from 'svelte/store';
  import { setDraggedBlob, setDraggedClam, setDragCursor } from '@renderer/updateSystems';
  import { blobs, clams } from '@stores/creatures';
  import type { BlobCreature, ClamCreature } from '@types';

  let canvasEl: HTMLCanvasElement;
  let renderer: Renderer;

  onMount(() => {
    initStoreSnapshots();
    renderer = new Renderer(canvasEl);
    renderer.init();
    renderer.start();
  });

  onDestroy(() => renderer?.stop());

  function onMousedown(e: MouseEvent) {
    const rect = canvasEl.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let nearestBlob: BlobCreature | null = null;
    let nearestDist = Infinity;
    for (const b of get(blobs)) {
      const d = Math.hypot(b.cx - mx, b.cy - my);
      if (d < 130 && d < nearestDist) { nearestDist = d; nearestBlob = b; }
    }

    let nearestClam: ClamCreature | null = null;
    let nearestClamDist = Infinity;
    for (const c of get(clams)) {
      const d = Math.hypot(c.cx - mx, c.cy - my);
      if (d < 100 && d < nearestClamDist) { nearestClamDist = d; nearestClam = c; }
    }

    if (nearestBlob) {
      setDraggedBlob(nearestBlob);
    } else if (nearestClam) {
      setDraggedClam(nearestClam);
    }
    setDragCursor(mx, my);
  }

  function onMousemove(e: MouseEvent) {
    const rect = canvasEl.getBoundingClientRect();
    setDragCursor(e.clientX - rect.left, e.clientY - rect.top);
  }

  function onMouseup() {
    setDraggedBlob(null);
    setDraggedClam(null);
  }

  function onContextmenu(e: MouseEvent) {
    e.preventDefault();
    const rect = canvasEl.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const creature = renderer?.getCreatureUnderCursor(mx, my);
    if (creature) {
      spawnModalState.set({
        open: true,
        mode: 'edit',
        spawnType: creature.type === 'clam' ? 'clam' : 'jelli',
        creature,
      });
    }
  }
</script>

<canvas
  id="main-canvas"
  bind:this={canvasEl}
  onmousedown={onMousedown}
  onmousemove={onMousemove}
  onmouseup={onMouseup}
  oncontextmenu={onContextmenu}
></canvas>

<svelte:window onmouseup={onMouseup} />
