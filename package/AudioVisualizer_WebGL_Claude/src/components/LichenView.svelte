<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { LichenRenderer } from '@renderer/LichenRenderer';

  const IS_RPI = import.meta.env.VITE_RPI_MODE === '1';

  let canvasEl: HTMLCanvasElement;
  let renderer: LichenRenderer;
  let exportRafId = 0;
  let exportWs: WebSocket | null = null;

  onMount(() => {
    renderer = new LichenRenderer(canvasEl);
    renderer.init();
    renderer.start();

    if (!IS_RPI) return;

    const W = 128, H = 128;
    const gl = canvasEl.getContext('webgl2')!;
    exportWs = new WebSocket('ws://localhost:8766');
    exportWs.binaryType = 'arraybuffer';
    const rgba = new Uint8Array(W * H * 4);
    const rgb565 = new Uint8Array(W * H * 2);
    let lastExport = 0;

    function exportLoop(now: number): void {
      exportRafId = requestAnimationFrame(exportLoop);
      if (now - lastExport < 33 || exportWs?.readyState !== WebSocket.OPEN) return;
      lastExport = now;
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
      gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
      for (let row = 0; row < H; row++) {
        const srcRow = H - 1 - row;
        for (let col = 0; col < W; col++) {
          const si = (srcRow * W + col) * 4;
          const di = (row * W + col) * 2;
          const r = rgba[si] >> 3, g = rgba[si + 1] >> 2, b = rgba[si + 2] >> 3;
          rgb565[di]     = (r << 3) | (g >> 3);
          rgb565[di + 1] = ((g & 7) << 5) | b;
        }
      }
      exportWs!.send(rgb565.buffer);
    }
    exportRafId = requestAnimationFrame(exportLoop);
  });

  onDestroy(() => {
    renderer?.stop();
    cancelAnimationFrame(exportRafId);
    exportWs?.close();
  });
</script>

<canvas
  id="lichen-canvas"
  bind:this={canvasEl}
  style={IS_RPI ? 'width:128px;height:128px' : ''}
></canvas>
