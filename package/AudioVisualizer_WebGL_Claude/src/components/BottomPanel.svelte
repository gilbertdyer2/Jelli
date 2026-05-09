<script lang="ts">
  import { panelOpen, activeTab, currentPage } from '@stores/ui';
  import ControlsTab from './ControlsTab.svelte';
  import SynControlsTab from './SynControlsTab.svelte';
  import GroveControlsTab from './GroveControlsTab.svelte';
  import LichenControlsTab from './LichenControlsTab.svelte';
  import AnalysisTab from './AnalysisTab.svelte';
  import PerformanceTab from './PerformanceTab.svelte';

  let panelHeight = 260;
  let isResizing = false;
  let resizeStartY = 0;
  let resizeStartH = 0;

  function onResizeStart(e: MouseEvent) {
    isResizing = true;
    resizeStartY = e.clientY;
    resizeStartH = panelHeight;
    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeEnd);
  }

  function onResizeMove(e: MouseEvent) {
    if (!isResizing) return;
    const dy = resizeStartY - e.clientY;
    panelHeight = Math.max(80, Math.min(window.innerHeight - 85, resizeStartH + dy));
  }

  function onResizeEnd() {
    isResizing = false;
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
  }
</script>

<div
  id="bottom-panel"
  class:open={$panelOpen}
  class:resizing={isResizing}
  style={$panelOpen ? `height: ${panelHeight}px` : ''}
>
  <div id="panel-resize" onmousedown={onResizeStart}></div>
  <div id="panel-header">
    <div id="panel-toggle" onclick={() => panelOpen.update(v => !v)}>
      <span id="panel-arrow">▲</span>
    </div>
    <div id="panel-tabs">
      <button
        class="panel-tab"
        class:active={$activeTab === 'controls'}
        onclick={() => activeTab.set('controls')}
      >Controls</button>
      <button
        class="panel-tab"
        class:active={$activeTab === 'analysis'}
        onclick={() => activeTab.set('analysis')}
      >Analysis</button>
      <button
        class="panel-tab"
        class:active={$activeTab === 'performance'}
        onclick={() => activeTab.set('performance')}
      >Performance</button>
    </div>
  </div>
  <div id="panel-content">
    <div id="tab-controls" class="tab-pane" class:active={$activeTab === 'controls'}>
      {#if $currentPage === 'jelli'}
        <ControlsTab />
      {:else if $currentPage === 'syn'}
        <SynControlsTab />
      {:else if $currentPage === 'lichen'}
        <LichenControlsTab />
      {:else}
        <GroveControlsTab />
      {/if}
    </div>
    <div id="tab-analysis" class="tab-pane" class:active={$activeTab === 'analysis'}>
      <AnalysisTab />
    </div>
    <div id="tab-performance" class="tab-pane" class:active={$activeTab === 'performance'}>
      <PerformanceTab />
    </div>
  </div>
</div>
