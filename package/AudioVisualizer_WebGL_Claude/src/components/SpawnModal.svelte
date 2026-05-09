<script lang="ts">
  import { spawnModalState } from '@stores/ui';
  import { blobs, clams } from '@stores/creatures';
  import { createBlobGeometry } from '@creatures/blobFactory';
  import { createClamGeometry } from '@creatures/clamFactory';
  import { ensureDetectors } from '@audio/audioEngine';
  import { hexToRgb } from '@utils/color';
  import type { EffectType } from '@types';

  let name = $state('Jelli');
  let hz = $state(100);
  let color = $state('#00c8ff');
  let effect = $state<EffectType>('none');
  let effectColor = $state('#00c8ff');
  let effectSpeed = $state(1.0);
  let kickScale = $state(1.0);

  // Populate fields when modal opens
  $effect(() => {
    const s = $spawnModalState;
    if (!s.open) return;
    if (s.mode === 'edit' && s.creature) {
      name = s.creature.name;
      hz = s.creature.detectorHz;
      color = s.creature.color;
      effect = s.creature.effect as EffectType;
      effectColor = s.creature.effectColor;
      effectSpeed = s.creature.effectSpeed ?? 1.0;
      kickScale = s.creature.kickScale ?? 1.0;
    } else {
      name = s.spawnType === 'clam' ? 'Clam' : 'Jelli';
      hz = 100;
      color = '#00c8ff';
      effect = 'none';
      effectColor = '#00c8ff';
      effectSpeed = 1.0;
      kickScale = 1.0;
    }
  });

  function hzParams(h: number): { rangeHz: number; octaves: number; duration: number } {
    if (h < 200)       return { rangeHz: 15,  octaves: 1, duration: 8 };
    else if (h < 1000) return { rangeHz: 60,  octaves: 2, duration: 8 };
    else if (h < 5000) return { rangeHz: 200, octaves: 2, duration: 6 };
    else               return { rangeHz: 500, octaves: 2, duration: 6 };
  }

  function confirm() {
    const s = $spawnModalState;
    const p = hzParams(hz);
    const cfg = {
      name,
      detectorHz: hz,
      detectorRangeHz: p.rangeHz,
      detectorOctaves: p.octaves,
      detectorDuration: p.duration,
      color,
      effect,
      effectColor,
      effectSpeed,
      kickScale,
    };
    const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;

    if (s.mode === 'edit' && s.creature) {
      const c = s.creature;
      c.name = name;
      c.color = color;
      const [r, g, b] = hexToRgb(color);
      c.colorR = r; c.colorG = g; c.colorB = b;
      c.effect = effect;
      c.effectColor = effectColor;
      const [er, eg, eb] = hexToRgb(effectColor);
      c.effectR = er; c.effectG = eg; c.effectB = eb;
      c.effectSpeed = effectSpeed;
      c.kickScale = kickScale;
      if (c.detectorHz !== hz) {
        c.detectorHz = hz;
        if (c.detector) {
          c.detector.targetHz = hz;
          c.detector.reset();
        }
      }
      // Trigger store reactivity
      if (s.spawnType === 'clam') {
        clams.update(arr => [...arr]);
      } else {
        blobs.update(arr => [...arr]);
      }
    } else {
      if (s.spawnType === 'clam') {
        const clam = createClamGeometry(cfg, canvas.width, canvas.height);
        clams.update(arr => [...arr, clam]);
      } else {
        const blob = createBlobGeometry(cfg, canvas.width, canvas.height);
        blobs.update(arr => [...arr, blob]);
      }
      ensureDetectors();
    }

    spawnModalState.update(v => ({ ...v, open: false }));
  }

  function cancel() {
    spawnModalState.update(v => ({ ...v, open: false }));
  }
</script>

<div id="spawn-modal" class:open={$spawnModalState.open}>
  <div id="spawn-card">
    <h3 id="spawn-modal-title">
      {$spawnModalState.mode === 'edit'
        ? ($spawnModalState.spawnType === 'clam' ? 'Edit Clam' : 'Edit Jellyfish')
        : ($spawnModalState.spawnType === 'clam' ? 'New Clam' : 'New Jellyfish')}
    </h3>
    <div class="sp-row">
      <span class="sp-lbl">Name</span>
      <input type="text" bind:value={name} maxlength="20" />
    </div>
    <div class="sp-row">
      <span class="sp-lbl">Hz</span>
      <input type="number" bind:value={hz} min="20" max="20000" />
    </div>
    <div class="sp-row">
      <span class="sp-lbl">Body Color</span>
      <input type="color" bind:value={color} />
    </div>
    <div class="sp-row">
      <span class="sp-lbl">Effect</span>
      <select bind:value={effect}>
        <option value="none">None</option>
        <option value="shockwave">Shockwave Ring</option>
        <option value="polygon">Polygon Flash</option>
        <option value="sparks">Spark Burst</option>
      </select>
    </div>
    <div class="sp-row">
      <span class="sp-lbl">Effect Color</span>
      <input type="color" bind:value={effectColor} />
    </div>
    <div class="sp-row">
      <span class="sp-lbl">Effect Speed</span>
      <input type="range" min="0.2" max="5" step="0.1" bind:value={effectSpeed} />
      <span class="sp-val">{effectSpeed.toFixed(1)}x</span>
    </div>
    <div class="sp-row">
      <span class="sp-lbl">Kick Scale</span>
      <input type="range" min="0.1" max="3" step="0.1" bind:value={kickScale} />
      <span class="sp-val">{kickScale.toFixed(1)}x</span>
    </div>
    <div id="spawn-actions">
      <button id="spawn-cancel" onclick={cancel}>Cancel</button>
      <button id="spawn-ok" onclick={confirm}>
        {$spawnModalState.mode === 'edit' ? 'Apply' : 'Spawn'}
      </button>
    </div>
  </div>
</div>
