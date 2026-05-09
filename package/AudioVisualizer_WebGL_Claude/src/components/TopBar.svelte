<script lang="ts">
  import { streaming, status, currentPage } from '@stores/ui';
  import { startCapture, stopCapture } from '@audio/audioEngine';

  function handleClick() {
    if ($streaming) {
      stopCapture();
    } else {
      startCapture();
    }
  }
</script>

<div id="ui-bar">
  <select id="page-select" bind:value={$currentPage}>
    <option value="jelli">Jelli</option>
    <option value="syn">Synfield</option>
    <option value="grove">Grove</option>
    <option value="lichen">Monolith</option>
  </select>
  <button
    id="live-btn"
    class:active={$streaming}
    onclick={handleClick}
  >
    {$streaming ? 'Stop' : 'Start Capture'}
  </button>
  <span id="status">{$status}</span>
</div>
