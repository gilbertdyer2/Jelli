<script lang="ts">
  import { blobs, clams } from '@stores/creatures';
  import { fmtSliderVal } from '@utils/math';

  function setHz(type: 'blob' | 'clam', i: number, v: number) {
    if (type === 'blob') {
      blobs.update(arr => {
        arr[i].detectorHz = v;
        if (arr[i].detector) {
          arr[i].detector!.targetHz = v;
          arr[i].detector!.reset();
        }
        return arr;
      });
    } else {
      clams.update(arr => {
        arr[i].detectorHz = v;
        if (arr[i].detector) {
          arr[i].detector!.targetHz = v;
          arr[i].detector!.reset();
        }
        return arr;
      });
    }
  }

  function labelColor(hex: string, effectColor: string): string {
    const h = hex.replace('#', '');
    const lr = parseInt(h.slice(0, 2), 16);
    const lg = parseInt(h.slice(2, 4), 16);
    const lb = parseInt(h.slice(4, 6), 16);
    return (0.299 * lr + 0.587 * lg + 0.114 * lb) < 30
      ? (effectColor || '#aaaaaa')
      : hex;
  }

  function commitHz(
    type: 'blob' | 'clam',
    i: number,
    textEl: HTMLInputElement,
    sliderEl: HTMLInputElement
  ) {
    const raw = parseFloat(textEl.value);
    const store = type === 'blob' ? $blobs : $clams;
    if (isNaN(raw)) {
      textEl.value = String(Math.round(store[i]?.detectorHz ?? 100));
      return;
    }
    const v = Math.min(20000, Math.max(20, Math.round(raw)));
    sliderEl.value = String(v);
    setHz(type, i, v);
    textEl.value = String(v);
  }
</script>

<div class="ctrl-group">
  <div class="ctrl-group-label">Frequencies</div>
  {#each $blobs as blob, i}
    <div class="ctrl-row">
      <span
        class="ctrl-label"
        style="color:{labelColor(blob.color, blob.effectColor)}"
        title="{blob.name} Hz"
      >{blob.name} Hz</span>
      <input
        type="range"
        class="ctrl-slider"
        min="20"
        max="20000"
        step="1"
        value={blob.detectorHz}
        oninput={function (this: HTMLInputElement) {
          const v = parseFloat(this.value);
          setHz('blob', i, v);
          const sib = this.nextElementSibling as HTMLInputElement | null;
          if (sib) sib.value = String(Math.round(v));
        }}
      />
      <input
        type="text"
        class="ctrl-val"
        value={Math.round(blob.detectorHz)}
        onblur={function (this: HTMLInputElement) {
          commitHz('blob', i, this, this.previousElementSibling as HTMLInputElement);
        }}
        onkeydown={function (this: HTMLInputElement, e: KeyboardEvent) {
          if (e.key === 'Enter') {
            commitHz('blob', i, this, this.previousElementSibling as HTMLInputElement);
            this.blur();
          }
        }}
      />
    </div>
  {/each}
  {#each $clams as clam, i}
    <div class="ctrl-row">
      <span
        class="ctrl-label"
        style="color:{labelColor(clam.color, clam.effectColor)}"
        title="{clam.name} Hz"
      >{clam.name} Hz</span>
      <input
        type="range"
        class="ctrl-slider"
        min="20"
        max="20000"
        step="1"
        value={clam.detectorHz}
        oninput={function (this: HTMLInputElement) {
          const v = parseFloat(this.value);
          setHz('clam', i, v);
          const sib = this.nextElementSibling as HTMLInputElement | null;
          if (sib) sib.value = String(Math.round(v));
        }}
      />
      <input
        type="text"
        class="ctrl-val"
        value={Math.round(clam.detectorHz)}
        onblur={function (this: HTMLInputElement) {
          commitHz('clam', i, this, this.previousElementSibling as HTMLInputElement);
        }}
        onkeydown={function (this: HTMLInputElement, e: KeyboardEvent) {
          if (e.key === 'Enter') {
            commitHz('clam', i, this, this.previousElementSibling as HTMLInputElement);
            this.blur();
          }
        }}
      />
    </div>
  {/each}
</div>
