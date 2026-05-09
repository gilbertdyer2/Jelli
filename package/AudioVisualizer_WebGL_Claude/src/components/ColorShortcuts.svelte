<script lang="ts">
  import { get } from 'svelte/store';
  import * as Uw from '@stores/underwater';
  import * as Eff from '@stores/effects';
  import * as Bg from '@stores/background';
  import { hexToRgb, rgbToHex } from '@utils/color';

  const swatches = [
    {
      label: 'UW A',
      getValue: () => rgbToHex(get(Uw.UW_BLOB_R1), get(Uw.UW_BLOB_G1), get(Uw.UW_BLOB_B1)),
      setValue: (hex: string) => {
        const [r, g, b] = hexToRgb(hex);
        Uw.UW_BLOB_R1.set(r);
        Uw.UW_BLOB_G1.set(g);
        Uw.UW_BLOB_B1.set(b);
      },
    },
    {
      label: 'UW B',
      getValue: () => rgbToHex(get(Uw.UW_BLOB_R2), get(Uw.UW_BLOB_G2), get(Uw.UW_BLOB_B2)),
      setValue: (hex: string) => {
        const [r, g, b] = hexToRgb(hex);
        Uw.UW_BLOB_R2.set(r);
        Uw.UW_BLOB_G2.set(g);
        Uw.UW_BLOB_B2.set(b);
      },
    },
    {
      label: 'Particle',
      getValue: () => rgbToHex(get(Uw.UW_PARTICLES_R), get(Uw.UW_PARTICLES_G), get(Uw.UW_PARTICLES_B)),
      setValue: (hex: string) => {
        const [r, g, b] = hexToRgb(hex);
        Uw.UW_PARTICLES_R.set(r);
        Uw.UW_PARTICLES_G.set(g);
        Uw.UW_PARTICLES_B.set(b);
      },
    },
    {
      label: 'Flash',
      getValue: () => rgbToHex(get(Eff.BLOB_FLASH_R), get(Eff.BLOB_FLASH_G), get(Eff.BLOB_FLASH_B)),
      setValue: (hex: string) => {
        const [r, g, b] = hexToRgb(hex);
        Eff.BLOB_FLASH_R.set(r);
        Eff.BLOB_FLASH_G.set(g);
        Eff.BLOB_FLASH_B.set(b);
      },
    },
    {
      label: 'Band',
      getValue: () => rgbToHex(get(Bg.SUB_R), get(Bg.SUB_G), get(Bg.SUB_B)),
      setValue: (hex: string) => {
        const [r, g, b] = hexToRgb(hex);
        Bg.SUB_R.set(r);
        Bg.SUB_G.set(g);
        Bg.SUB_B.set(b);
      },
    },
    {
      label: 'BG',
      getValue: () => rgbToHex(get(Bg.BG_R), get(Bg.BG_G), get(Bg.BG_B)),
      setValue: (hex: string) => {
        const [r, g, b] = hexToRgb(hex);
        Bg.BG_R.set(r);
        Bg.BG_G.set(g);
        Bg.BG_B.set(b);
      },
    },
  ];
</script>

<div class="ctrl-group">
  <div class="ctrl-group-label">Colors</div>
  <div class="ctrl-color-grid">
    {#each swatches as s}
      <div class="ctrl-color-cell">
        <span class="ctrl-color-cell-lbl" title={s.label}>{s.label}</span>
        <input
          type="color"
          class="ctrl-color"
          value={s.getValue()}
          oninput={(e) => s.setValue((e.target as HTMLInputElement).value)}
        />
      </div>
    {/each}
  </div>
</div>
