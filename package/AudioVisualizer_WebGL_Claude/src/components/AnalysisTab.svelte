<script lang="ts">
  import { onMount } from 'svelte';
  import { beatLogEntries, activeTab, currentPage } from '@stores/ui';
  import { liveAnalyser, liveContext } from '@audio/audioEngine';
  import { blobs } from '@stores/creatures';

  let eqCanvas: HTMLCanvasElement;
  let eqCtx: CanvasRenderingContext2D;
  let eqByteData: Uint8Array | null = null;
  let graphsContainer: HTMLDivElement;
  let graphCanvases: HTMLCanvasElement[] = [];
  let animId: number;

  onMount(() => {
    eqCtx = eqCanvas.getContext('2d')!;
    animId = requestAnimationFrame(drawLoop);
    return () => cancelAnimationFrame(animId);
  });

  function drawLoop() {
    if ($activeTab === 'analysis') {
      drawEQ();
      drawGraphs();
    }
    animId = requestAnimationFrame(drawLoop);
  }

  function drawEQ() {
    const analyser = liveAnalyser;
    const ctx2 = liveContext;
    const w = eqCanvas.clientWidth;
    const h = eqCanvas.clientHeight;
    if (w <= 0 || h <= 0) return;
    if (eqCanvas.width !== w) eqCanvas.width = w;
    if (eqCanvas.height !== h) eqCanvas.height = h;
    eqCtx.fillStyle = '#020208';
    eqCtx.fillRect(0, 0, w, h);
    if (!analyser || !ctx2) {
      eqCtx.fillStyle = 'rgba(100,140,190,0.22)';
      eqCtx.font = '11px Segoe UI, system-ui, sans-serif';
      eqCtx.textAlign = 'center';
      eqCtx.fillText('No audio', w / 2, h / 2 + 4);
      return;
    }
    if (!eqByteData) eqByteData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(eqByteData);
    const binCount = eqByteData.length;
    const sampleRate = ctx2.sampleRate;
    const freqPerBin = sampleRate / (binCount * 2);
    const minFreq = 20;
    const maxFreq = 20000;
    const LABEL_H = 20;
    const barAreaH = h - LABEL_H;
    const barCount = 144;
    const barW = w / barCount;
    for (let bi = 0; bi < barCount; bi++) {
      const fLow  = minFreq * Math.pow(maxFreq / minFreq, bi / barCount);
      const fHigh = minFreq * Math.pow(maxFreq / minFreq, (bi + 1) / barCount);
      let maxVal = 0;
      const lo = Math.floor(fLow / freqPerBin);
      const hi = Math.ceil(fHigh / freqPerBin);
      for (let k = lo; k <= hi && k < binCount; k++) maxVal = Math.max(maxVal, eqByteData[k]);
      const barH = (maxVal / 255) * barAreaH;
      const t = bi / barCount;
      const r = Math.round(30 + t * 80);
      const g = Math.round(140 - t * 40);
      const b = Math.round(220 - t * 80);
      eqCtx.fillStyle = `rgb(${r},${g},${b})`;
      eqCtx.fillRect(bi * barW, barAreaH - barH, barW - 0.5, barH);
    }
  }

  function drawGraphs() {
    if ($currentPage !== 'jelli') return;
    const bs = $blobs;
    // Rebuild graph canvas rows if creature count changed
    while (graphCanvases.length < bs.length) {
      const row = document.createElement('div');
      row.className = 'det-graph-row';
      const lbl = document.createElement('div');
      lbl.className = 'det-graph-lbl';
      const cv = document.createElement('canvas');
      cv.className = 'det-graph-cv';
      row.appendChild(lbl);
      row.appendChild(cv);
      if (graphsContainer) graphsContainer.appendChild(row);
      graphCanvases.push(cv);
    }
    while (graphCanvases.length > bs.length) {
      graphCanvases.pop();
      if (graphsContainer?.lastChild) {
        graphsContainer.removeChild(graphsContainer.lastChild);
      }
    }
    for (let i = 0; i < bs.length; i++) {
      const cv = graphCanvases[i];
      if (!cv) continue;
      const lbl = cv.previousElementSibling as HTMLElement | null;
      if (lbl) {
        lbl.style.color = bs[i].color || '#88aacc';
        lbl.textContent = bs[i].name;
      }
      const gw = cv.clientWidth || 180;
      const gh = cv.clientHeight || 30;
      if (cv.width !== gw) cv.width = gw;
      if (cv.height !== gh) cv.height = gh;
      const gctx = cv.getContext('2d');
      if (!gctx) continue;
      gctx.fillStyle = '#020208';
      gctx.fillRect(0, 0, gw, gh);
      const det = bs[i].detector;
      if (!det) continue;
      const flux = det.currentFlux;
      const maxT = det.maxLoudnessThresh;
      const barH2 = Math.min(gh, (flux / (maxT + 0.0001)) * gh);
      const col = det.justTriggered ? '#00ffaa' : '#3399cc';
      gctx.fillStyle = col;
      gctx.fillRect(0, gh - barH2, gw * 0.6, barH2);
      gctx.strokeStyle = 'rgba(255,200,50,0.55)';
      gctx.lineWidth = 1;
      const tY1 = gh - Math.min(gh, maxT > 0 ? gh * 0.45 : 0);
      gctx.beginPath();
      gctx.moveTo(0, tY1);
      gctx.lineTo(gw * 0.6, tY1);
      gctx.stroke();
    }
  }
</script>

<div id="eq-section">
  <div id="eq-label">Frequency Spectrum</div>
  <canvas id="eq-canvas" bind:this={eqCanvas}></canvas>
</div>
{#if $currentPage === 'jelli'}
<div id="log-section">
  <div id="log-header">
    <span>Beat Trigger Log</span>
    <button id="clear-log-btn" onclick={() => beatLogEntries.set([])}>Clear</button>
  </div>
  <div id="beat-log">
    {#each $beatLogEntries as entry (entry.id)}
      <div class="log-entry">
        <span class="log-time">{entry.time} </span>
        <span class="log-det" style="color:{entry.color}">{entry.name}</span>
        {#if entry.ivl}<span class="log-ivl"> {entry.ivl}</span>{/if}
      </div>
    {/each}
  </div>
</div>
<div id="graphs-section">
  <div id="graphs-label">Detector Levels</div>
  <div id="graphs-container" bind:this={graphsContainer}></div>
</div>
{/if}
