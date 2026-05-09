<script lang="ts">
  import type { SliderGroup as SliderGroupType } from '@utils/sliderConfig';
  import { fmtSliderVal } from '@utils/math';

  let { group }: { group: SliderGroupType } = $props();

  type RangeItem = {
    label: string;
    type?: 'range';
    min: number;
    max: number;
    step: number;
    get(): number;
    set(v: number): void;
  };
  type ToggleItem = {
    label: string;
    type: 'toggle';
    get(): boolean;
    set(v: boolean): void;
  };
  type ColorItem = {
    label: string;
    type: 'color';
    get(): string;
    set(hex: string): void;
  };

  function asRange(item: unknown): RangeItem { return item as RangeItem; }
  function asToggle(item: unknown): ToggleItem { return item as ToggleItem; }
  function asColor(item: unknown): ColorItem { return item as ColorItem; }

  function commitVal(
    item: RangeItem,
    textEl: HTMLInputElement,
    sliderEl: HTMLInputElement
  ) {
    const raw = parseFloat(textEl.value);
    if (isNaN(raw)) {
      textEl.value = fmtSliderVal(item.get(), item.step);
      return;
    }
    const clamped = Math.min(item.max, Math.max(item.min, raw));
    const dec = String(item.step).includes('.')
      ? String(item.step).split('.')[1].length
      : 0;
    const snapped = parseFloat(
      (Math.round(clamped / item.step) * item.step).toFixed(dec)
    );
    item.set(snapped);
    sliderEl.value = String(snapped);
    textEl.value = fmtSliderVal(snapped, item.step);
  }
</script>

<div class="ctrl-group">
  <div class="ctrl-group-label">{group.group}</div>
  {#each group.items as item}
    <div class="ctrl-row">
      <span class="ctrl-label" title={item.label}>{item.label}</span>
      {#if item.type === 'toggle'}
        <label class="ctrl-toggle">
          <input
            type="checkbox"
            checked={asToggle(item).get()}
            onchange={(e) => asToggle(item).set((e.target as HTMLInputElement).checked)}
          />
          <span class="ctrl-toggle-track"></span>
        </label>
      {:else if item.type === 'color'}
        <input
          type="color"
          class="ctrl-color"
          value={asColor(item).get()}
          oninput={(e) => asColor(item).set((e.target as HTMLInputElement).value)}
        />
      {:else}
        {@const r = asRange(item)}
        <input
          type="range"
          class="ctrl-slider"
          min={r.min}
          max={r.max}
          step={r.step}
          value={r.get()}
          oninput={function (this: HTMLInputElement) {
            const v = parseFloat(this.value);
            r.set(v);
            const sib = this.nextElementSibling as HTMLInputElement | null;
            if (sib) sib.value = fmtSliderVal(v, r.step);
          }}
        />
        <input
          type="text"
          class="ctrl-val"
          value={fmtSliderVal(r.get(), r.step)}
          onblur={function (this: HTMLInputElement) {
            const sliderEl = this.previousElementSibling as HTMLInputElement;
            commitVal(r, this, sliderEl);
          }}
          onkeydown={function (this: HTMLInputElement, e: KeyboardEvent) {
            if (e.key === 'Enter') {
              const sliderEl = this.previousElementSibling as HTMLInputElement;
              commitVal(r, this, sliderEl);
              this.blur();
            }
          }}
        />
      {/if}
    </div>
  {/each}
</div>
