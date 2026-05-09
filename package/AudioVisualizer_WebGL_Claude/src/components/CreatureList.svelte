<script lang="ts">
  import { blobs, clams } from '@stores/creatures';
  import { spawnModalState } from '@stores/ui';

  function removeBlob(i: number) {
    blobs.update(arr => {
      const b = arr[i];
      if (b?.detector) b.detector.reset();
      return arr.filter((_, idx) => idx !== i);
    });
  }

  function removeClam(i: number) {
    clams.update(arr => {
      const c = arr[i];
      if (c?.detector) c.detector.reset();
      return arr.filter((_, idx) => idx !== i);
    });
  }

  function openSpawnJelli() {
    spawnModalState.set({ open: true, mode: 'spawn', spawnType: 'jelli' });
  }

  function openSpawnClam() {
    spawnModalState.set({ open: true, mode: 'spawn', spawnType: 'clam' });
  }
</script>

<div class="creature-section">
  <div id="jelli-list">
    <span style="width:100%;color:rgba(140,170,215,.4);font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px;display:block">Jellyfish</span>
    {#each $blobs as blob, i}
      <div class="jelli-chip">
        <div class="jelli-dot" style="background:{blob.color}"></div>
        <span>{blob.name}</span>
        <button class="jelli-remove" onclick={() => removeBlob(i)}>×</button>
      </div>
    {/each}
  </div>
  <button class="creature-spawn-btn" onclick={openSpawnJelli}>+ Jellyfish</button>
</div>
<div class="creature-section">
  <div id="clam-list">
    <span style="width:100%;color:rgba(140,170,215,.4);font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px;display:block">Clams</span>
    {#each $clams as clam, i}
      <div class="clam-chip">
        <div class="clam-dot" style="background:{clam.color}"></div>
        <span>{clam.name}</span>
        <button class="clam-remove" onclick={() => removeClam(i)}>×</button>
      </div>
    {/each}
  </div>
  <button class="creature-spawn-btn" onclick={openSpawnClam}>+ Clam</button>
</div>
