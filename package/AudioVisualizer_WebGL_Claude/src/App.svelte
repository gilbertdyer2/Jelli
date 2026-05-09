<script lang="ts">
  import { currentPage } from '@stores/ui';
  import TopBar from '@components/TopBar.svelte';
  import JelliView from '@components/JelliView.svelte';
  import SynView from '@components/SynView.svelte';
  import GroveView from '@components/GroveView.svelte';
  import LichenView from '@components/LichenView.svelte';
  import BottomPanel from '@components/BottomPanel.svelte';
  import SpawnModal from '@components/SpawnModal.svelte';
</script>

<TopBar />

{#if $currentPage === 'jelli'}
  <JelliView />
{:else if $currentPage === 'syn'}
  <SynView />
{:else if $currentPage === 'lichen'}
  <LichenView />
{:else}
  <GroveView />
{/if}

<BottomPanel />
<SpawnModal />
