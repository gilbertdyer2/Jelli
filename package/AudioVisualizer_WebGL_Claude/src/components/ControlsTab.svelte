<script lang="ts">
  import CreatureList from './CreatureList.svelte';
  import FreqSliders from './FreqSliders.svelte';
  import ColorShortcuts from './ColorShortcuts.svelte';
  import SliderGroup from './SliderGroup.svelte';
  import { buildSliderConfig } from '@utils/sliderConfig';
  import { onMount } from 'svelte';
  import type { SliderGroup as SliderGroupType } from '@utils/sliderConfig';

  let canvas: HTMLCanvasElement | null = null;
  let sliderGroups: SliderGroupType[] = [];
  let colsEl: HTMLDivElement;

  $: col1 = sliderGroups.filter(g => g.col === 1);
  $: col2 = sliderGroups.filter(g => g.col === 2);
  $: col3 = sliderGroups.filter(g => g.col === 3);

  // ── Widths ─────────────────────────────────────────────────────────────────
  // cpW: creatures-panel pixel width. null = use CSS default (195px) before JS measures.
  let cpW: number | null = null;
  const MIN_CP_W = 120;

  // w1/w2/w3: column pixel widths. null = use CSS flex:1 before JS measures.
  let w1: number | null = null;
  let w2: number | null = null;
  let w3: number | null = null;
  const MIN_COL_W   = 100;
  const DIVIDER_W   = 5;   // px per inner column divider
  const RT_HANDLE_W = 5;   // px for the right-edge handle

  function initWidths() {
    if (!colsEl) return;
    const total = colsEl.offsetWidth - DIVIDER_W * 2;
    const third = Math.floor(total / 3);
    w1 = third;
    w2 = third;
    w3 = total - third * 2;
  }

  function rescaleCols(newCtrlW: number) {
    if (w1 === null) { initWidths(); return; }
    const newTotal = newCtrlW - DIVIDER_W * 2;
    if (newTotal <= 0) return;
    const oldTotal = w1 + w2! + w3!;
    if (oldTotal <= 0) { initWidths(); return; }
    const r  = newTotal / oldTotal;
    const n1 = Math.max(MIN_COL_W, Math.round(w1 * r));
    const n2 = Math.max(MIN_COL_W, Math.round(w2! * r));
    const n3 = Math.max(MIN_COL_W, newTotal - n1 - n2);
    w1 = n1; w2 = n2; w3 = n3;
  }

  // ── Column-divider drag ────────────────────────────────────────────────────
  let dragging = 0;   // 0=idle, 1=divider1, 2=divider2
  let dragStartX = 0, dragStartA = 0, dragStartB = 0;

  function onDividerDown(which: 1 | 2, e: MouseEvent) {
    dragging   = which;
    dragStartX = e.clientX;
    dragStartA = which === 1 ? w1! : w2!;
    dragStartB = which === 1 ? w2! : w3!;
    document.addEventListener('mousemove', onDividerMove);
    document.addEventListener('mouseup',   onDividerUp);
  }
  function onDividerMove(e: MouseEvent) {
    if (!dragging) return;
    const dx    = e.clientX - dragStartX;
    const total = dragStartA + dragStartB;
    const newA  = Math.max(MIN_COL_W, Math.min(total - MIN_COL_W, dragStartA + dx));
    if (dragging === 1) { w1 = newA; w2 = total - newA; }
    else                { w2 = newA; w3 = total - newA; }
  }
  function onDividerUp() {
    dragging = 0;
    document.removeEventListener('mousemove', onDividerMove);
    document.removeEventListener('mouseup',   onDividerUp);
  }

  // ── Right-edge handle drag ─────────────────────────────────────────────────
  // Dragging LEFT shrinks ctrl-cols (all 3 cols scale proportionally) and
  // expands creatures-panel. Dragging RIGHT does the reverse.
  let draggingRight  = false;
  let rtStartX       = 0;
  let rtStartCpW     = 0;
  let rtStartTotalW  = 0;   // total #tab-controls width, constant during drag

  function onRightHandleDown(e: MouseEvent) {
    if (!colsEl) return;
    draggingRight = true;
    rtStartX      = e.clientX;
    rtStartCpW    = cpW ?? colsEl.closest('#tab-controls')!.clientWidth - colsEl.offsetWidth - RT_HANDLE_W;
    rtStartTotalW = (colsEl.closest('#tab-controls') as HTMLElement).offsetWidth;
    document.addEventListener('mousemove', onRightHandleMove);
    document.addEventListener('mouseup',   onRightHandleUp);
  }
  function onRightHandleMove(e: MouseEvent) {
    if (!draggingRight) return;
    const dx        = e.clientX - rtStartX;
    const maxCpW    = rtStartTotalW - MIN_COL_W * 3 - DIVIDER_W * 2 - RT_HANDLE_W;
    const newCpW    = Math.max(MIN_CP_W, Math.min(maxCpW, rtStartCpW - dx));
    cpW             = newCpW;
    const newCtrlW  = rtStartTotalW - newCpW - RT_HANDLE_W;
    rescaleCols(newCtrlW);
  }
  function onRightHandleUp() {
    draggingRight = false;
    document.removeEventListener('mousemove', onRightHandleMove);
    document.removeEventListener('mouseup',   onRightHandleUp);
  }

  // ── ResizeObserver — handles window resize ─────────────────────────────────
  let resizeObs: ResizeObserver | null = null;

  onMount(() => {
    canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    if (canvas) sliderGroups = buildSliderConfig(canvas);

    resizeObs = new ResizeObserver(entries => {
      if (draggingRight || dragging) return; // handled directly in move handlers
      const newCtrlW = entries[0].contentRect.width;
      if (w1 === null) { initWidths(); return; }
      rescaleCols(newCtrlW);
    });
    if (colsEl) {
      resizeObs.observe(colsEl);
      // Initialize after first layout
      requestAnimationFrame(initWidths);
    }

    return () => {
      resizeObs?.disconnect();
      document.removeEventListener('mousemove', onDividerMove);
      document.removeEventListener('mouseup',   onDividerUp);
      document.removeEventListener('mousemove', onRightHandleMove);
      document.removeEventListener('mouseup',   onRightHandleUp);
    };
  });

  function colStyle(w: number | null): string {
    return w !== null ? `flex: 0 0 ${w}px; width: ${w}px; min-width: 0` : '';
  }
</script>

<div
  id="creatures-panel"
  style={cpW !== null ? `width: ${cpW}px` : ''}
>
  <CreatureList />
</div>

<div
  id="ctrl-cols"
  bind:this={colsEl}
  class:resizing={dragging !== 0}
  class:resizing-h={draggingRight}
>

  <div class="ctrl-col" style={colStyle(w1)}>
    <div class="ctrl-col-header">Jellyfish</div>
    <div class="ctrl-col-scroll">
      <FreqSliders />
      {#each col1 as group}
        <SliderGroup {group} />
      {/each}
    </div>
  </div>

  <div class="ctrl-col-divider" onmousedown={(e) => onDividerDown(1, e)}></div>

  <div class="ctrl-col" style={colStyle(w2)}>
    <div class="ctrl-col-header">Beat &amp; Clam</div>
    <div class="ctrl-col-scroll">
      {#each col2 as group}
        <SliderGroup {group} />
      {/each}
    </div>
  </div>

  <div class="ctrl-col-divider" onmousedown={(e) => onDividerDown(2, e)}></div>

  <div class="ctrl-col" style={colStyle(w3)}>
    <div class="ctrl-col-header">Scene</div>
    <div class="ctrl-col-scroll">
      <ColorShortcuts />
      {#each col3 as group}
        <SliderGroup {group} />
      {/each}
    </div>
  </div>

</div>

<div id="ctrl-right-handle" onmousedown={onRightHandleDown}></div>
