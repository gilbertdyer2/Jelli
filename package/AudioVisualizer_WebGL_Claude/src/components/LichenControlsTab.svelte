<script lang="ts">
  import {
    LICHEN_DECAY_RATE, LICHEN_MAX_PATCHES, LICHEN_GLOW_INTENSITY,
    LICHEN_SPORE_COUNT, LICHEN_SPORE_DRIFT, LICHEN_SPORE_SIZE,
    LICHEN_RIPPLE_SPRING_K, LICHEN_RIPPLE_DAMPING, LICHEN_MONOLITH_TILT,
    LICHEN_GLASS_OPACITY, LICHEN_GLASS_FRONT_OPACITY,
    LICHEN_GLASS_FRESNEL, LICHEN_GLASS_SPECULAR, LICHEN_GLASS_IRIDESCENCE,
    LICHEN_GLASS_TINT_R, LICHEN_GLASS_TINT_G, LICHEN_GLASS_TINT_B,
    LICHEN_LIGHT_X, LICHEN_LIGHT_Y,
    LICHEN_WARM_R, LICHEN_WARM_G, LICHEN_WARM_B,
    LICHEN_COOL_R, LICHEN_COOL_G, LICHEN_COOL_B,
    LICHEN_BG_R, LICHEN_BG_G, LICHEN_BG_B,
    LICHEN_MONOLITH_W, LICHEN_MONOLITH_H, LICHEN_MONOLITH_D,
    LICHEN_BASS_HZ, LICHEN_BASS_RANGE_HZ, LICHEN_BASS_OCTAVES, LICHEN_BASS_TRIGGER_DURATION, LICHEN_BASS_WINDOW,
    LICHEN_MID_HZ, LICHEN_MID_RANGE_HZ, LICHEN_MID_OCTAVES, LICHEN_MID_TRIGGER_DURATION, LICHEN_MID_WINDOW,
    LICHEN_HIGH_HZ, LICHEN_HIGH_RANGE_HZ, LICHEN_HIGH_OCTAVES, LICHEN_HIGH_TRIGGER_DURATION, LICHEN_HIGH_WINDOW,
    LICHEN_ORGANIC_STR,
    PERF_MAX_FPS, PERF_LIVE_FPS, LICHEN_FOLIAGE_ENABLED,
    LICHEN_WIRE_ENABLED, LICHEN_WIRE_R, LICHEN_WIRE_G, LICHEN_WIRE_B, LICHEN_WIRE_A, LICHEN_WIRE_WIDTH,
    LICHEN_CA_ENABLED, LICHEN_CA_INTENSITY, LICHEN_CA_FREQ,
    LICHEN_CA_COL1_R, LICHEN_CA_COL1_G, LICHEN_CA_COL1_B,
    LICHEN_CA_COL2_R, LICHEN_CA_COL2_G, LICHEN_CA_COL2_B,
    JELLY_ENABLED, JELLY_ROUNDNESS,
    JELLY_PROPEL_STR, JELLY_PROPEL_ATTACK, JELLY_PROPEL_DECAY, JELLY_PROPEL_CURVE,
    JELLY_COMPRESS_STR, JELLY_SPRING_K, JELLY_SPRING_DAMPING,
    JELLY_TENT_ENABLED, JELLY_TENT_COUNT, JELLY_TENT_SEGS, JELLY_TENT_RING,
    JELLY_TENT_LENGTH, JELLY_TENT_RADIUS, JELLY_TENT_WAVE_AMP, JELLY_TENT_WAVE_FREQ, JELLY_TENT_WAVE_SPD,
    JELLY_TENT_SPLAY, JELLY_TENT_ATTACH_Y, JELLY_TENT_OPACITY, JELLY_TENT_IRID_STR,
    JELLY_TENT_TINT_R, JELLY_TENT_TINT_G, JELLY_TENT_TINT_B, JELLY_TENT_TINT_BL,
    JELLY_TENT_IDLE_AMP, JELLY_TENT_IDLE_SPEED, JELLY_TENT_RIPPLE_RESP,
    JELLY_TENT_OFFSET_X, JELLY_TENT_OFFSET_Y, JELLY_TENT_OFFSET_Z,
    JELLY_TENT_PHYS_MODE, JELLY_TENT_PHYS_SEGS, JELLY_TENT_PHYS_SEGLEN,
    JELLY_TENT_PHYS_GRAVITY, JELLY_TENT_PHYS_DAMPING, JELLY_TENT_PHYS_JITTER,
    JELLY_TENT_PHYS_WIDTH, JELLY_TENT_PHYS_HEIGHT, JELLY_TENT_PHYS_WHIP,
    JELLY_TENT_PHYS_SPREAD_BOOST, JELLY_TENT_PHYS_SPREAD_DECAY,
    JELLY_TENT_PHYS_GRAVITY_AZ, JELLY_TENT_PHYS_GRAVITY_EL,
    JELLY_TENT_RING_SPREAD,
    ORAL_ENABLED, ORAL_COUNT, ORAL_SEGS, ORAL_SEGLEN, ORAL_WIDTH, ORAL_HEIGHT,
    ORAL_GRAVITY, ORAL_GRAVITY_AZ, ORAL_GRAVITY_EL,
    ORAL_DAMPING, ORAL_JITTER, ORAL_WHIP, ORAL_ATTACH_Y, ORAL_SPREAD_BOOST, ORAL_SPREAD_DECAY, ORAL_BEAT_HZ, ORAL_BEAT_RANGE_HZ, ORAL_OPACITY,
    ORAL_TINT_R, ORAL_TINT_G, ORAL_TINT_B, ORAL_TINT_BL, ORAL_IRID_STR,
    ORAL_FRILL_AMP, ORAL_FRILL_FREQ, ORAL_FRILL_SPEED,
    ORAL_EDGE_TINT_R, ORAL_EDGE_TINT_G, ORAL_EDGE_TINT_B, ORAL_EDGE_BLEND,
    ORAL_TINT_SHIFT_ENABLED, ORAL_TINT_SHIFT_HZ, ORAL_TINT_SHIFT_RANGE_HZ,
    ORAL_TINT_SHIFT_OCTAVES, ORAL_TINT_SHIFT_TRIGGER_DURATION, ORAL_TINT_SHIFT_WINDOW,
    ORAL_TINT_SHIFT_TARGET_R, ORAL_TINT_SHIFT_TARGET_G, ORAL_TINT_SHIFT_TARGET_B,
    ORAL_TINT_SHIFT_ATTACK, ORAL_TINT_SHIFT_DECAY, ORAL_TINT_SHIFT_CURVE,
    ORAL_TWIST_STR, ORAL_TWIST_FREQ, ORAL_TWIST_RAND,
    LICHEN_BG_GRAD_ENABLED, LICHEN_BG_GRAD_SPEED, LICHEN_BG_GRAD_SAT, LICHEN_BG_GRAD_VAL,
    LICHEN_BG_SHIFT_ENABLED, LICHEN_BG_SHIFT_HZ, LICHEN_BG_SHIFT_RANGE_HZ, LICHEN_BG_SHIFT_TARGET_R, LICHEN_BG_SHIFT_TARGET_G, LICHEN_BG_SHIFT_TARGET_B,
    LICHEN_BG_SHIFT_ATTACK, LICHEN_BG_SHIFT_DECAY, LICHEN_BG_SHIFT_CURVE,
    LICHEN_BG_SHIFT_APPLY_DS_TOP, LICHEN_BG_SHIFT_APPLY_DS_BOT,
    JELLY_TINT_SHIFT_ENABLED, JELLY_TINT_SHIFT_HZ, JELLY_TINT_SHIFT_RANGE_HZ,
    JELLY_TINT_SHIFT_OCTAVES, JELLY_TINT_SHIFT_TRIGGER_DURATION, JELLY_TINT_SHIFT_WINDOW,
    JELLY_TINT_SHIFT_TARGET_R, JELLY_TINT_SHIFT_TARGET_G, JELLY_TINT_SHIFT_TARGET_B,
    JELLY_TINT_SHIFT_ATTACK, JELLY_TINT_SHIFT_DECAY, JELLY_TINT_SHIFT_CURVE,
    JELLY_MEMBRANE_ENABLED, JELLY_MEMBRANE_SCALE,
    JELLY_MEMBRANE_OPACITY, JELLY_MEMBRANE_FRONT_OP,
    JELLY_MEMBRANE_TINT_R, JELLY_MEMBRANE_TINT_G, JELLY_MEMBRANE_TINT_B,
    JELLY_MEMBRANE_IRID, JELLY_MEMBRANE_FRESNEL, JELLY_MEMBRANE_SPECULAR,
    JELLY_MEMBRANE_EMISSION, JELLY_MEMBRANE_PULSE_STR,
    JELLY_MEMBRANE_SHIFT_ENABLED, JELLY_MEMBRANE_SHIFT_HZ, JELLY_MEMBRANE_SHIFT_RANGE_HZ,
    JELLY_MEMBRANE_SHIFT_OCTAVES, JELLY_MEMBRANE_SHIFT_TRIGGER_DURATION, JELLY_MEMBRANE_SHIFT_WINDOW,
    JELLY_MEMBRANE_SHIFT_TARGET_R, JELLY_MEMBRANE_SHIFT_TARGET_G, JELLY_MEMBRANE_SHIFT_TARGET_B,
    JELLY_MEMBRANE_SHIFT_ATTACK, JELLY_MEMBRANE_SHIFT_DECAY, JELLY_MEMBRANE_SHIFT_CURVE,
    CAM_AZIMUTH_OFFSET, CAM_ELEVATION_OFFSET, CAM_RADIUS_OFFSET,
    CAM_PAN_X, CAM_PAN_Y, CAM_PAN_Z,
  } from '@stores/lichen';
  import {
    DS_BG_ENABLED, DS_BG_TOP_R, DS_BG_TOP_G, DS_BG_TOP_B,
    DS_BG_BOT_R, DS_BG_BOT_G, DS_BG_BOT_B, DS_BG_VIGNETTE, DS_BG_HORIZON_Y,
    DS_PART_ENABLED, DS_PART_COUNT, DS_PART_SIZE, DS_PART_SPEED, DS_PART_BUOY,
    DS_FOG_DENSITY, DS_BRIGHTNESS, DS_AMBIENT_GLOW, DS_FLICKER_SPEED,
    DS_COL_A_R, DS_COL_A_G, DS_COL_A_B,
    DS_COL_B_R, DS_COL_B_G, DS_COL_B_B, DS_COL_BLEND,
    DS_TRIG_ENABLED, DS_TRIG_HZ, DS_TRIG_RANGE_HZ, DS_BURST_COUNT, DS_BURST_SIZE,
    DS_BURST_BRIGHT, DS_BURST_LIFE, DS_BURST_SPREAD,
    DS_SWIM_ENABLED, DS_SWIM_IMPULSE, DS_SWIM_ATTACK, DS_SWIM_DECAY, DS_SWIM_CURVE,
    DS_SWIM_DRAG, DS_SWIM_MAX_VEL, DS_SWIM_AZ, DS_SWIM_EL,
  } from '@stores/deepsea';
  import { BLOOM_ENABLED, BLOOM_THRESHOLD, BLOOM_STRENGTH, BLOOM_RADIUS, BLOOM_PASSES } from '@stores/bloom';
  import { MB_ENABLED, MB_STRENGTH, MB_SOFTNESS, MB_TRIGGER_BOOST, MB_TRIGGER_DECAY, MB_REVERSE_BOOST, MB_TRIG_HZ, MB_TRIG_RANGE_HZ } from '@stores/motionblur';

  function toHex(r: number, g: number, b: number): string {
    const h = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0');
    return `#${h(r)}${h(g)}${h(b)}`;
  }

  function setFromHex(hex: string, setR: (v:number)=>void, setG: (v:number)=>void, setB: (v:number)=>void): void {
    const n = parseInt(hex.slice(1), 16);
    setR((n >> 16) / 255);
    setG(((n >> 8) & 0xff) / 255);
    setB((n & 0xff) / 255);
  }

  // Organic deformation toggle: cache the last non-zero value so we can restore it
  let _organicEnabled = $LICHEN_ORGANIC_STR > 0;
  let _organicLastNonzero = $LICHEN_ORGANIC_STR > 0 ? $LICHEN_ORGANIC_STR : 1.0;

  function toggleOrganic(enabled: boolean): void {
    _organicEnabled = enabled;
    if (enabled) {
      LICHEN_ORGANIC_STR.set(_organicLastNonzero);
    } else {
      if ($LICHEN_ORGANIC_STR > 0) _organicLastNonzero = $LICHEN_ORGANIC_STR;
      LICHEN_ORGANIC_STR.set(0);
    }
  }

  // Keep _organicEnabled in sync when slider changes the store to nonzero
  LICHEN_ORGANIC_STR.subscribe(v => {
    if (v > 0) {
      _organicLastNonzero = v;
      _organicEnabled = true;
    } else {
      _organicEnabled = false;
    }
  });

  $: glassTintHex = toHex($LICHEN_GLASS_TINT_R, $LICHEN_GLASS_TINT_G, $LICHEN_GLASS_TINT_B);
  $: warmHex      = toHex($LICHEN_WARM_R,        $LICHEN_WARM_G,        $LICHEN_WARM_B);
  $: coolHex      = toHex($LICHEN_COOL_R,        $LICHEN_COOL_G,        $LICHEN_COOL_B);
  $: bgHex        = toHex($LICHEN_BG_R,          $LICHEN_BG_G,          $LICHEN_BG_B);
  $: wireHex      = toHex($LICHEN_WIRE_R,        $LICHEN_WIRE_G,        $LICHEN_WIRE_B);
  $: caCol1Hex    = toHex($LICHEN_CA_COL1_R,     $LICHEN_CA_COL1_G,     $LICHEN_CA_COL1_B);
  $: caCol2Hex    = toHex($LICHEN_CA_COL2_R,     $LICHEN_CA_COL2_G,     $LICHEN_CA_COL2_B);
  $: tentTintHex    = toHex($JELLY_TENT_TINT_R,       $JELLY_TENT_TINT_G,       $JELLY_TENT_TINT_B);
  $: bgShiftHex     = toHex($LICHEN_BG_SHIFT_TARGET_R,    $LICHEN_BG_SHIFT_TARGET_G,    $LICHEN_BG_SHIFT_TARGET_B);
  $: jellyShiftHex  = toHex($JELLY_TINT_SHIFT_TARGET_R,  $JELLY_TINT_SHIFT_TARGET_G,  $JELLY_TINT_SHIFT_TARGET_B);
  $: memTintHex     = toHex($JELLY_MEMBRANE_TINT_R,      $JELLY_MEMBRANE_TINT_G,      $JELLY_MEMBRANE_TINT_B);
  $: memShiftHex    = toHex($JELLY_MEMBRANE_SHIFT_TARGET_R, $JELLY_MEMBRANE_SHIFT_TARGET_G, $JELLY_MEMBRANE_SHIFT_TARGET_B);
  $: oralTintHex    = toHex($ORAL_TINT_R,      $ORAL_TINT_G,      $ORAL_TINT_B);
  $: oralEdgeHex    = toHex($ORAL_EDGE_TINT_R,       $ORAL_EDGE_TINT_G,       $ORAL_EDGE_TINT_B);
  $: oralShiftHex   = toHex($ORAL_TINT_SHIFT_TARGET_R, $ORAL_TINT_SHIFT_TARGET_G, $ORAL_TINT_SHIFT_TARGET_B);
  $: dsBgTopHex     = toHex($DS_BG_TOP_R, $DS_BG_TOP_G, $DS_BG_TOP_B);
  $: dsBgBotHex     = toHex($DS_BG_BOT_R, $DS_BG_BOT_G, $DS_BG_BOT_B);
  $: dsColAHex      = toHex($DS_COL_A_R,  $DS_COL_A_G,  $DS_COL_A_B);
  $: dsColBHex      = toHex($DS_COL_B_R,  $DS_COL_B_G,  $DS_COL_B_B);
</script>

<div id="lichen-ctrl-cols">

  <!-- Column 1: Glass -->
  <div class="ctrl-col">
    <div class="ctrl-col-header">Glass</div>
    <div class="ctrl-col-scroll">

      <div class="ctrl-group">
        <div class="ctrl-group-label">Opacity</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Body opacity</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$LICHEN_GLASS_OPACITY} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$LICHEN_GLASS_OPACITY} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Front sheen</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$LICHEN_GLASS_FRONT_OPACITY} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$LICHEN_GLASS_FRONT_OPACITY} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Shading</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Fresnel</span>
          <input class="ctrl-slider" type="range" min="0" max="3" step="0.05" bind:value={$LICHEN_GLASS_FRESNEL} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$LICHEN_GLASS_FRESNEL} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Specular</span>
          <input class="ctrl-slider" type="range" min="0" max="3" step="0.05" bind:value={$LICHEN_GLASS_SPECULAR} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$LICHEN_GLASS_SPECULAR} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Iridescence</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$LICHEN_GLASS_IRIDESCENCE} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$LICHEN_GLASS_IRIDESCENCE} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Glass Tint</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Color</span>
          <input class="ctrl-color" type="color"
            value={glassTintHex}
            on:input={(e) => setFromHex(e.currentTarget.value, LICHEN_GLASS_TINT_R.set, LICHEN_GLASS_TINT_G.set, LICHEN_GLASS_TINT_B.set)} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Light</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Light X</span>
          <input class="ctrl-slider" type="range" min="-2" max="2" step="0.05" bind:value={$LICHEN_LIGHT_X} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$LICHEN_LIGHT_X} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Light Y</span>
          <input class="ctrl-slider" type="range" min="-2" max="2" step="0.05" bind:value={$LICHEN_LIGHT_Y} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$LICHEN_LIGHT_Y} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Wireframe</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Enabled</span>
          <input type="checkbox" bind:checked={$LICHEN_WIRE_ENABLED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Color</span>
          <input class="ctrl-color" type="color"
            value={wireHex}
            on:input={(e) => setFromHex(e.currentTarget.value, LICHEN_WIRE_R.set, LICHEN_WIRE_G.set, LICHEN_WIRE_B.set)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Alpha</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$LICHEN_WIRE_A} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$LICHEN_WIRE_A} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Width px</span>
          <input class="ctrl-slider" type="range" min="0.5" max="6" step="0.1" bind:value={$LICHEN_WIRE_WIDTH} />
          <input class="ctrl-val" type="number" step="0.1" bind:value={$LICHEN_WIRE_WIDTH} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Chrom. Aberration</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Enabled</span>
          <input type="checkbox" bind:checked={$LICHEN_CA_ENABLED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Intensity</span>
          <input class="ctrl-slider" type="range" min="0" max="3" step="0.05" bind:value={$LICHEN_CA_INTENSITY} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$LICHEN_CA_INTENSITY} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Frequency</span>
          <input class="ctrl-slider" type="range" min="0" max="10" step="0.1" bind:value={$LICHEN_CA_FREQ} />
          <input class="ctrl-val" type="number" step="0.1" bind:value={$LICHEN_CA_FREQ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Fringe 1</span>
          <input class="ctrl-color" type="color"
            value={caCol1Hex}
            on:input={(e) => setFromHex(e.currentTarget.value, LICHEN_CA_COL1_R.set, LICHEN_CA_COL1_G.set, LICHEN_CA_COL1_B.set)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Fringe 2</span>
          <input class="ctrl-color" type="color"
            value={caCol2Hex}
            on:input={(e) => setFromHex(e.currentTarget.value, LICHEN_CA_COL2_R.set, LICHEN_CA_COL2_G.set, LICHEN_CA_COL2_B.set)} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Ripple</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Spring K</span>
          <input class="ctrl-slider" type="range" min="5" max="40" step="0.5" bind:value={$LICHEN_RIPPLE_SPRING_K} />
          <input class="ctrl-val" type="number" step="0.5" bind:value={$LICHEN_RIPPLE_SPRING_K} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Damping</span>
          <input class="ctrl-slider" type="range" min="0.5" max="8" step="0.1" bind:value={$LICHEN_RIPPLE_DAMPING} />
          <input class="ctrl-val" type="number" step="0.1" bind:value={$LICHEN_RIPPLE_DAMPING} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Tilt °</span>
          <input class="ctrl-slider" type="range" min="0" max="20" step="1" bind:value={$LICHEN_MONOLITH_TILT} />
          <input class="ctrl-val" type="number" step="1" bind:value={$LICHEN_MONOLITH_TILT} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Camera</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Pan X</span>
          <input class="ctrl-slider" type="range" min="-1" max="1" step="0.01" bind:value={$CAM_PAN_X} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$CAM_PAN_X} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Pan Y</span>
          <input class="ctrl-slider" type="range" min="-1" max="1" step="0.01" bind:value={$CAM_PAN_Y} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$CAM_PAN_Y} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Pan Z</span>
          <input class="ctrl-slider" type="range" min="-1" max="1" step="0.01" bind:value={$CAM_PAN_Z} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$CAM_PAN_Z} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Azimuth</span>
          <input class="ctrl-slider" type="range" min="-3.14" max="3.14" step="0.01" bind:value={$CAM_AZIMUTH_OFFSET} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$CAM_AZIMUTH_OFFSET} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Elevation</span>
          <input class="ctrl-slider" type="range" min="-1.57" max="1.57" step="0.01" bind:value={$CAM_ELEVATION_OFFSET} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$CAM_ELEVATION_OFFSET} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Radius</span>
          <input class="ctrl-slider" type="range" min="-2" max="5" step="0.05" bind:value={$CAM_RADIUS_OFFSET} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$CAM_RADIUS_OFFSET} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Dimensions</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Width</span>
          <input class="ctrl-slider" type="range" min="0.1" max="2.0" step="0.01" bind:value={$LICHEN_MONOLITH_W} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$LICHEN_MONOLITH_W} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Height</span>
          <input class="ctrl-slider" type="range" min="0.1" max="3.0" step="0.01" bind:value={$LICHEN_MONOLITH_H} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$LICHEN_MONOLITH_H} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Depth</span>
          <input class="ctrl-slider" type="range" min="0.01" max="0.5" step="0.005" bind:value={$LICHEN_MONOLITH_D} />
          <input class="ctrl-val" type="number" step="0.005" bind:value={$LICHEN_MONOLITH_D} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Performance</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Live FPS</span>
          <span class="ctrl-val" style="font-variant-numeric: tabular-nums;">{$PERF_LIVE_FPS}</span>
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">FPS Cap (0=off)</span>
          <input class="ctrl-slider" type="range" min="0" max="240" step="1" bind:value={$PERF_MAX_FPS} />
          <input class="ctrl-val" type="number" step="1" min="0" max="240" bind:value={$PERF_MAX_FPS} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Organic Deform</span>
          <input type="checkbox" checked={_organicEnabled} on:change={e => toggleOrganic(e.currentTarget.checked)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Chrom. Aberration</span>
          <input type="checkbox" bind:checked={$LICHEN_CA_ENABLED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Foliage (high GPU)</span>
          <input type="checkbox" bind:checked={$LICHEN_FOLIAGE_ENABLED} />
        </div>
      </div>

    </div>
  </div>

  <!-- Column 2: Lichen -->
  <div class="ctrl-col">
    <div class="ctrl-col-header">Lichen</div>
    <div class="ctrl-col-scroll">

      <div class="ctrl-group">
        <div class="ctrl-group-label">Detectors</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Bass Hz</span>
          <input class="ctrl-slider" type="range" min="20" max="500" step="1" bind:value={$LICHEN_BASS_HZ} />
          <input class="ctrl-val" type="number" step="1" bind:value={$LICHEN_BASS_HZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Bass Range Hz</span>
          <input class="ctrl-slider" type="range" min="1" max="500" step="1" bind:value={$LICHEN_BASS_RANGE_HZ} />
          <input class="ctrl-val" type="number" step="1" bind:value={$LICHEN_BASS_RANGE_HZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Bass Octaves</span>
          <input class="ctrl-slider" type="range" min="1" max="8" step="1" bind:value={$LICHEN_BASS_OCTAVES} />
          <input class="ctrl-val" type="number" step="1" bind:value={$LICHEN_BASS_OCTAVES} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Bass Duration</span>
          <input class="ctrl-slider" type="range" min="1" max="30" step="1" bind:value={$LICHEN_BASS_TRIGGER_DURATION} />
          <input class="ctrl-val" type="number" step="1" bind:value={$LICHEN_BASS_TRIGGER_DURATION} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Bass Window</span>
          <input class="ctrl-slider" type="range" min="3" max="21" step="2" bind:value={$LICHEN_BASS_WINDOW} />
          <input class="ctrl-val" type="number" step="2" bind:value={$LICHEN_BASS_WINDOW} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Mid Hz</span>
          <input class="ctrl-slider" type="range" min="100" max="5000" step="10" bind:value={$LICHEN_MID_HZ} />
          <input class="ctrl-val" type="number" step="10" bind:value={$LICHEN_MID_HZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Mid Range Hz</span>
          <input class="ctrl-slider" type="range" min="10" max="1000" step="10" bind:value={$LICHEN_MID_RANGE_HZ} />
          <input class="ctrl-val" type="number" step="10" bind:value={$LICHEN_MID_RANGE_HZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Mid Octaves</span>
          <input class="ctrl-slider" type="range" min="1" max="8" step="1" bind:value={$LICHEN_MID_OCTAVES} />
          <input class="ctrl-val" type="number" step="1" bind:value={$LICHEN_MID_OCTAVES} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Mid Duration</span>
          <input class="ctrl-slider" type="range" min="1" max="30" step="1" bind:value={$LICHEN_MID_TRIGGER_DURATION} />
          <input class="ctrl-val" type="number" step="1" bind:value={$LICHEN_MID_TRIGGER_DURATION} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Mid Window</span>
          <input class="ctrl-slider" type="range" min="3" max="21" step="2" bind:value={$LICHEN_MID_WINDOW} />
          <input class="ctrl-val" type="number" step="2" bind:value={$LICHEN_MID_WINDOW} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">High Hz</span>
          <input class="ctrl-slider" type="range" min="2000" max="20000" step="100" bind:value={$LICHEN_HIGH_HZ} />
          <input class="ctrl-val" type="number" step="100" bind:value={$LICHEN_HIGH_HZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">High Range Hz</span>
          <input class="ctrl-slider" type="range" min="50" max="5000" step="50" bind:value={$LICHEN_HIGH_RANGE_HZ} />
          <input class="ctrl-val" type="number" step="50" bind:value={$LICHEN_HIGH_RANGE_HZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">High Octaves</span>
          <input class="ctrl-slider" type="range" min="1" max="8" step="1" bind:value={$LICHEN_HIGH_OCTAVES} />
          <input class="ctrl-val" type="number" step="1" bind:value={$LICHEN_HIGH_OCTAVES} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">High Duration</span>
          <input class="ctrl-slider" type="range" min="1" max="30" step="1" bind:value={$LICHEN_HIGH_TRIGGER_DURATION} />
          <input class="ctrl-val" type="number" step="1" bind:value={$LICHEN_HIGH_TRIGGER_DURATION} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">High Window</span>
          <input class="ctrl-slider" type="range" min="3" max="21" step="2" bind:value={$LICHEN_HIGH_WINDOW} />
          <input class="ctrl-val" type="number" step="2" bind:value={$LICHEN_HIGH_WINDOW} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Shape</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Organic Deform</span>
          <input type="checkbox" checked={_organicEnabled} on:change={e => toggleOrganic(e.currentTarget.checked)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Organic Str</span>
          <input class="ctrl-slider" type="range" min="0" max="2" step="0.05" bind:value={$LICHEN_ORGANIC_STR} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$LICHEN_ORGANIC_STR} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Behaviour</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Max Patches</span>
          <input class="ctrl-slider" type="range" min="4" max="48" step="1" bind:value={$LICHEN_MAX_PATCHES} />
          <input class="ctrl-val" type="number" step="1" bind:value={$LICHEN_MAX_PATCHES} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Glow</span>
          <input class="ctrl-slider" type="range" min="0.1" max="3" step="0.05" bind:value={$LICHEN_GLOW_INTENSITY} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$LICHEN_GLOW_INTENSITY} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Decay Rate</span>
          <input class="ctrl-slider" type="range" min="0" max="0.0003" step="0.000005" bind:value={$LICHEN_DECAY_RATE} />
          <input class="ctrl-val" type="number" step="0.000005" bind:value={$LICHEN_DECAY_RATE} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Warm Color</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Color</span>
          <input class="ctrl-color" type="color"
            value={warmHex}
            on:input={(e) => setFromHex(e.currentTarget.value, LICHEN_WARM_R.set, LICHEN_WARM_G.set, LICHEN_WARM_B.set)} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Cool Color</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Color</span>
          <input class="ctrl-color" type="color"
            value={coolHex}
            on:input={(e) => setFromHex(e.currentTarget.value, LICHEN_COOL_R.set, LICHEN_COOL_G.set, LICHEN_COOL_B.set)} />
        </div>
      </div>

    </div>
  </div>

  <!-- Column 3: Spores + Scene -->
  <div class="ctrl-col">
    <div class="ctrl-col-header">Spores &amp; Scene</div>
    <div class="ctrl-col-scroll">

      <div class="ctrl-group">
        <div class="ctrl-group-label">Spores</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Burst Count</span>
          <input class="ctrl-slider" type="range" min="10" max="400" step="5" bind:value={$LICHEN_SPORE_COUNT} />
          <input class="ctrl-val" type="number" step="5" bind:value={$LICHEN_SPORE_COUNT} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Drift</span>
          <input class="ctrl-slider" type="range" min="0" max="3" step="0.05" bind:value={$LICHEN_SPORE_DRIFT} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$LICHEN_SPORE_DRIFT} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Size</span>
          <input class="ctrl-slider" type="range" min="0.1" max="4" step="0.05" bind:value={$LICHEN_SPORE_SIZE} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$LICHEN_SPORE_SIZE} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Background</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Color</span>
          <input class="ctrl-color" type="color"
            value={bgHex}
            on:input={(e) => setFromHex(e.currentTarget.value, LICHEN_BG_R.set, LICHEN_BG_G.set, LICHEN_BG_B.set)} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">BG Gradient</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Enabled</span>
          <input type="checkbox" bind:checked={$LICHEN_BG_GRAD_ENABLED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Speed °/s</span>
          <input class="ctrl-slider" type="range" min="1" max="360" step="1" bind:value={$LICHEN_BG_GRAD_SPEED} />
          <input class="ctrl-val" type="number" step="1" bind:value={$LICHEN_BG_GRAD_SPEED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Saturation</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$LICHEN_BG_GRAD_SAT} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$LICHEN_BG_GRAD_SAT} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Brightness</span>
          <input class="ctrl-slider" type="range" min="0" max="0.3" step="0.005" bind:value={$LICHEN_BG_GRAD_VAL} />
          <input class="ctrl-val" type="number" step="0.005" bind:value={$LICHEN_BG_GRAD_VAL} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">BG Color Shift</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Enabled</span>
          <input type="checkbox" bind:checked={$LICHEN_BG_SHIFT_ENABLED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Trigger Hz</span>
          <input class="ctrl-slider" type="range" min="20" max="20000" step="1" bind:value={$LICHEN_BG_SHIFT_HZ} />
          <input class="ctrl-val" type="number" step="1" bind:value={$LICHEN_BG_SHIFT_HZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Range Hz</span>
          <input class="ctrl-slider" type="range" min="1" max="500" step="1" bind:value={$LICHEN_BG_SHIFT_RANGE_HZ} />
          <input class="ctrl-val" type="number" step="1" bind:value={$LICHEN_BG_SHIFT_RANGE_HZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Target Color</span>
          <input class="ctrl-color" type="color"
            value={bgShiftHex}
            on:input={(e) => setFromHex(e.currentTarget.value, LICHEN_BG_SHIFT_TARGET_R.set, LICHEN_BG_SHIFT_TARGET_G.set, LICHEN_BG_SHIFT_TARGET_B.set)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Attack ms</span>
          <input class="ctrl-slider" type="range" min="0" max="1000" step="10" bind:value={$LICHEN_BG_SHIFT_ATTACK} />
          <input class="ctrl-val" type="number" step="10" bind:value={$LICHEN_BG_SHIFT_ATTACK} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Decay ms</span>
          <input class="ctrl-slider" type="range" min="50" max="3000" step="10" bind:value={$LICHEN_BG_SHIFT_DECAY} />
          <input class="ctrl-val" type="number" step="10" bind:value={$LICHEN_BG_SHIFT_DECAY} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Curve</span>
          <input class="ctrl-slider" type="range" min="0.2" max="4" step="0.05" bind:value={$LICHEN_BG_SHIFT_CURVE} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$LICHEN_BG_SHIFT_CURVE} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Deep Sea Top</span>
          <input type="checkbox" bind:checked={$LICHEN_BG_SHIFT_APPLY_DS_TOP} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Deep Sea Bottom</span>
          <input type="checkbox" bind:checked={$LICHEN_BG_SHIFT_APPLY_DS_BOT} />
        </div>
      </div>

    </div>
  </div>

  <!-- Column 4: Jellyfish -->
  <div class="ctrl-col">
    <div class="ctrl-col-header">Jellyfish</div>
    <div class="ctrl-col-scroll">

      <div class="ctrl-group">
        <div class="ctrl-group-label">Mode</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Enabled</span>
          <input type="checkbox" bind:checked={$JELLY_ENABLED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Roundness</span>
          <input class="ctrl-slider" type="range" min="2" max="12" step="0.1" bind:value={$JELLY_ROUNDNESS} />
          <input class="ctrl-val" type="number" step="0.1" bind:value={$JELLY_ROUNDNESS} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Beat Animation</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Propel Str</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$JELLY_PROPEL_STR} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$JELLY_PROPEL_STR} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Propel Attack</span>
          <input class="ctrl-slider" type="range" min="0" max="500" step="5" bind:value={$JELLY_PROPEL_ATTACK} />
          <input class="ctrl-val" type="number" step="5" bind:value={$JELLY_PROPEL_ATTACK} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Propel Decay</span>
          <input class="ctrl-slider" type="range" min="50" max="2000" step="10" bind:value={$JELLY_PROPEL_DECAY} />
          <input class="ctrl-val" type="number" step="10" bind:value={$JELLY_PROPEL_DECAY} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Propel Curve</span>
          <input class="ctrl-slider" type="range" min="0.2" max="4" step="0.05" bind:value={$JELLY_PROPEL_CURVE} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$JELLY_PROPEL_CURVE} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Compress Str</span>
          <input class="ctrl-slider" type="range" min="0" max="1.5" step="0.01" bind:value={$JELLY_COMPRESS_STR} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$JELLY_COMPRESS_STR} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Spring K</span>
          <input class="ctrl-slider" type="range" min="1" max="30" step="0.5" bind:value={$JELLY_SPRING_K} />
          <input class="ctrl-val" type="number" step="0.5" bind:value={$JELLY_SPRING_K} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Damping</span>
          <input class="ctrl-slider" type="range" min="0.5" max="12" step="0.1" bind:value={$JELLY_SPRING_DAMPING} />
          <input class="ctrl-val" type="number" step="0.1" bind:value={$JELLY_SPRING_DAMPING} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Tentacles</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Enabled</span>
          <input type="checkbox" bind:checked={$JELLY_TENT_ENABLED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Count</span>
          <input class="ctrl-slider" type="range" min="1" max="12" step="1" bind:value={$JELLY_TENT_COUNT} />
          <input class="ctrl-val" type="number" step="1" bind:value={$JELLY_TENT_COUNT} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Length</span>
          <input class="ctrl-slider" type="range" min="0.1" max="3" step="0.05" bind:value={$JELLY_TENT_LENGTH} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$JELLY_TENT_LENGTH} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Radius</span>
          <input class="ctrl-slider" type="range" min="0.003" max="0.06" step="0.001" bind:value={$JELLY_TENT_RADIUS} />
          <input class="ctrl-val" type="number" step="0.001" bind:value={$JELLY_TENT_RADIUS} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Spread</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.05" bind:value={$JELLY_TENT_ATTACH_Y} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$JELLY_TENT_ATTACH_Y} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Ring Spread</span>
          <input class="ctrl-slider" type="range" min="0" max="1.5" step="0.01" bind:value={$JELLY_TENT_RING_SPREAD} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$JELLY_TENT_RING_SPREAD} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Wave Amp</span>
          <input class="ctrl-slider" type="range" min="0" max="0.5" step="0.01" bind:value={$JELLY_TENT_WAVE_AMP} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$JELLY_TENT_WAVE_AMP} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Wave Freq</span>
          <input class="ctrl-slider" type="range" min="0.1" max="5" step="0.1" bind:value={$JELLY_TENT_WAVE_FREQ} />
          <input class="ctrl-val" type="number" step="0.1" bind:value={$JELLY_TENT_WAVE_FREQ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Wave Speed</span>
          <input class="ctrl-slider" type="range" min="0" max="5" step="0.1" bind:value={$JELLY_TENT_WAVE_SPD} />
          <input class="ctrl-val" type="number" step="0.1" bind:value={$JELLY_TENT_WAVE_SPD} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Splay</span>
          <input class="ctrl-slider" type="range" min="0" max="3" step="0.05" bind:value={$JELLY_TENT_SPLAY} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$JELLY_TENT_SPLAY} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Opacity</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$JELLY_TENT_OPACITY} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$JELLY_TENT_OPACITY} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Irid Str</span>
          <input class="ctrl-slider" type="range" min="0" max="2" step="0.05" bind:value={$JELLY_TENT_IRID_STR} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$JELLY_TENT_IRID_STR} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Tint Color</span>
          <input class="ctrl-color" type="color"
            value={tentTintHex}
            on:input={(e) => setFromHex(e.currentTarget.value, JELLY_TENT_TINT_R.set, JELLY_TENT_TINT_G.set, JELLY_TENT_TINT_B.set)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Tint Blend</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$JELLY_TENT_TINT_BL} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$JELLY_TENT_TINT_BL} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Idle Amp</span>
          <input class="ctrl-slider" type="range" min="0" max="0.3" step="0.005" bind:value={$JELLY_TENT_IDLE_AMP} />
          <input class="ctrl-val" type="number" step="0.005" bind:value={$JELLY_TENT_IDLE_AMP} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Idle Speed</span>
          <input class="ctrl-slider" type="range" min="0" max="3" step="0.05" bind:value={$JELLY_TENT_IDLE_SPEED} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$JELLY_TENT_IDLE_SPEED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Ripple Response</span>
          <input class="ctrl-slider" type="range" min="0" max="5" step="0.1" bind:value={$JELLY_TENT_RIPPLE_RESP} />
          <input class="ctrl-val" type="number" step="0.1" bind:value={$JELLY_TENT_RIPPLE_RESP} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Offset X</span>
          <input class="ctrl-slider" type="range" min="-1" max="1" step="0.01" bind:value={$JELLY_TENT_OFFSET_X} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$JELLY_TENT_OFFSET_X} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Offset Y</span>
          <input class="ctrl-slider" type="range" min="-1" max="1" step="0.01" bind:value={$JELLY_TENT_OFFSET_Y} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$JELLY_TENT_OFFSET_Y} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Offset Z</span>
          <input class="ctrl-slider" type="range" min="-1" max="1" step="0.01" bind:value={$JELLY_TENT_OFFSET_Z} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$JELLY_TENT_OFFSET_Z} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Tube Segs</span>
          <input class="ctrl-slider" type="range" min="6" max="40" step="1" bind:value={$JELLY_TENT_SEGS} />
          <input class="ctrl-val" type="number" step="1" bind:value={$JELLY_TENT_SEGS} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Tube Sides</span>
          <input class="ctrl-slider" type="range" min="3" max="10" step="1" bind:value={$JELLY_TENT_RING} />
          <input class="ctrl-val" type="number" step="1" bind:value={$JELLY_TENT_RING} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Physics Tentacles</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Physics Mode</span>
          <input type="checkbox" bind:checked={$JELLY_TENT_PHYS_MODE} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Segments</span>
          <input class="ctrl-slider" type="range" min="4" max="40" step="1" bind:value={$JELLY_TENT_PHYS_SEGS} />
          <input class="ctrl-val" type="number" step="1" bind:value={$JELLY_TENT_PHYS_SEGS} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Seg Length</span>
          <input class="ctrl-slider" type="range" min="0.01" max="0.25" step="0.005" bind:value={$JELLY_TENT_PHYS_SEGLEN} />
          <input class="ctrl-val" type="number" step="0.005" bind:value={$JELLY_TENT_PHYS_SEGLEN} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Gravity</span>
          <input class="ctrl-slider" type="range" min="0" max="0.001" step="0.00001" bind:value={$JELLY_TENT_PHYS_GRAVITY} />
          <input class="ctrl-val" type="number" step="0.00001" bind:value={$JELLY_TENT_PHYS_GRAVITY} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Damping</span>
          <input class="ctrl-slider" type="range" min="0.5" max="0.999" step="0.005" bind:value={$JELLY_TENT_PHYS_DAMPING} />
          <input class="ctrl-val" type="number" step="0.005" bind:value={$JELLY_TENT_PHYS_DAMPING} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Jitter</span>
          <input class="ctrl-slider" type="range" min="0" max="0.005" step="0.0001" bind:value={$JELLY_TENT_PHYS_JITTER} />
          <input class="ctrl-val" type="number" step="0.0001" bind:value={$JELLY_TENT_PHYS_JITTER} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Ribbon Width</span>
          <input class="ctrl-slider" type="range" min="0.001" max="0.04" step="0.001" bind:value={$JELLY_TENT_PHYS_WIDTH} />
          <input class="ctrl-val" type="number" step="0.001" bind:value={$JELLY_TENT_PHYS_WIDTH} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Ribbon Height</span>
          <input class="ctrl-slider" type="range" min="0" max="0.1" step="0.001" bind:value={$JELLY_TENT_PHYS_HEIGHT} />
          <input class="ctrl-val" type="number" step="0.001" bind:value={$JELLY_TENT_PHYS_HEIGHT} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Whip</span>
          <input class="ctrl-slider" type="range" min="0" max="0.5" step="0.01" bind:value={$JELLY_TENT_PHYS_WHIP} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$JELLY_TENT_PHYS_WHIP} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Beat Spread</span>
          <input class="ctrl-slider" type="range" min="1" max="3" step="0.05" bind:value={$JELLY_TENT_PHYS_SPREAD_BOOST} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$JELLY_TENT_PHYS_SPREAD_BOOST} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Spread Decay</span>
          <input class="ctrl-slider" type="range" min="0.9" max="0.9999" step="0.001" bind:value={$JELLY_TENT_PHYS_SPREAD_DECAY} />
          <input class="ctrl-val" type="number" step="0.001" bind:value={$JELLY_TENT_PHYS_SPREAD_DECAY} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Gravity Azimuth</span>
          <input class="ctrl-slider" type="range" min="0" max="360" step="1" bind:value={$JELLY_TENT_PHYS_GRAVITY_AZ} />
          <input class="ctrl-val" type="number" step="1" bind:value={$JELLY_TENT_PHYS_GRAVITY_AZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Gravity Elevation</span>
          <input class="ctrl-slider" type="range" min="-90" max="90" step="1" bind:value={$JELLY_TENT_PHYS_GRAVITY_EL} />
          <input class="ctrl-val" type="number" step="1" bind:value={$JELLY_TENT_PHYS_GRAVITY_EL} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Oral Arms</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Enabled</span>
          <input type="checkbox" bind:checked={$ORAL_ENABLED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Count</span>
          <input class="ctrl-slider" type="range" min="1" max="8" step="1" bind:value={$ORAL_COUNT} />
          <input class="ctrl-val" type="number" step="1" bind:value={$ORAL_COUNT} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Segments</span>
          <input class="ctrl-slider" type="range" min="4" max="40" step="1" bind:value={$ORAL_SEGS} />
          <input class="ctrl-val" type="number" step="1" bind:value={$ORAL_SEGS} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Seg Length</span>
          <input class="ctrl-slider" type="range" min="0.01" max="0.15" step="0.005" bind:value={$ORAL_SEGLEN} />
          <input class="ctrl-val" type="number" step="0.005" bind:value={$ORAL_SEGLEN} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Width</span>
          <input class="ctrl-slider" type="range" min="0.005" max="0.15" step="0.005" bind:value={$ORAL_WIDTH} />
          <input class="ctrl-val" type="number" step="0.005" bind:value={$ORAL_WIDTH} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Height</span>
          <input class="ctrl-slider" type="range" min="0" max="0.1" step="0.001" bind:value={$ORAL_HEIGHT} />
          <input class="ctrl-val" type="number" step="0.001" bind:value={$ORAL_HEIGHT} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Gravity</span>
          <input class="ctrl-slider" type="range" min="0" max="0.001" step="0.00001" bind:value={$ORAL_GRAVITY} />
          <input class="ctrl-val" type="number" step="0.00001" bind:value={$ORAL_GRAVITY} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Gravity Azimuth</span>
          <input class="ctrl-slider" type="range" min="0" max="360" step="1" bind:value={$ORAL_GRAVITY_AZ} />
          <input class="ctrl-val" type="number" step="1" bind:value={$ORAL_GRAVITY_AZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Gravity Elevation</span>
          <input class="ctrl-slider" type="range" min="-90" max="90" step="1" bind:value={$ORAL_GRAVITY_EL} />
          <input class="ctrl-val" type="number" step="1" bind:value={$ORAL_GRAVITY_EL} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Damping</span>
          <input class="ctrl-slider" type="range" min="0.5" max="0.9999" step="0.01" bind:value={$ORAL_DAMPING} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$ORAL_DAMPING} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Jitter</span>
          <input class="ctrl-slider" type="range" min="0" max="0.002" step="0.00001" bind:value={$ORAL_JITTER} />
          <input class="ctrl-val" type="number" step="0.00001" bind:value={$ORAL_JITTER} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Whip</span>
          <input class="ctrl-slider" type="range" min="0" max="0.5" step="0.01" bind:value={$ORAL_WHIP} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$ORAL_WHIP} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Attach Radius</span>
          <input class="ctrl-slider" type="range" min="0" max="2" step="0.01" bind:value={$ORAL_ATTACH_Y} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$ORAL_ATTACH_Y} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Beat Hz</span>
          <input class="ctrl-slider" type="range" min="20" max="20000" step="1" bind:value={$ORAL_BEAT_HZ} />
          <input class="ctrl-val" type="number" step="1" bind:value={$ORAL_BEAT_HZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Beat Range Hz</span>
          <input class="ctrl-slider" type="range" min="1" max="500" step="1" bind:value={$ORAL_BEAT_RANGE_HZ} />
          <input class="ctrl-val" type="number" step="1" bind:value={$ORAL_BEAT_RANGE_HZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Spread Boost</span>
          <input class="ctrl-slider" type="range" min="1" max="3" step="0.01" bind:value={$ORAL_SPREAD_BOOST} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$ORAL_SPREAD_BOOST} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Spread Decay</span>
          <input class="ctrl-slider" type="range" min="0.9" max="1" step="0.001" bind:value={$ORAL_SPREAD_DECAY} />
          <input class="ctrl-val" type="number" step="0.001" bind:value={$ORAL_SPREAD_DECAY} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Opacity</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$ORAL_OPACITY} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$ORAL_OPACITY} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Tint</span>
          <input class="ctrl-color" type="color"
            value={oralTintHex}
            on:input={(e) => setFromHex(e.currentTarget.value, ORAL_TINT_R.set, ORAL_TINT_G.set, ORAL_TINT_B.set)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Tint Blend</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$ORAL_TINT_BL} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$ORAL_TINT_BL} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Iridescence</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$ORAL_IRID_STR} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$ORAL_IRID_STR} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Frill Amplitude</span>
          <input class="ctrl-slider" type="range" min="0" max="3" step="0.05" bind:value={$ORAL_FRILL_AMP} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$ORAL_FRILL_AMP} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Frill Frequency</span>
          <input class="ctrl-slider" type="range" min="0.5" max="10" step="0.1" bind:value={$ORAL_FRILL_FREQ} />
          <input class="ctrl-val" type="number" step="0.1" bind:value={$ORAL_FRILL_FREQ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Frill Speed</span>
          <input class="ctrl-slider" type="range" min="0" max="3" step="0.05" bind:value={$ORAL_FRILL_SPEED} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$ORAL_FRILL_SPEED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Edge Tint</span>
          <input class="ctrl-color" type="color"
            value={oralEdgeHex}
            on:input={(e) => setFromHex(e.currentTarget.value, ORAL_EDGE_TINT_R.set, ORAL_EDGE_TINT_G.set, ORAL_EDGE_TINT_B.set)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Edge Blend</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$ORAL_EDGE_BLEND} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$ORAL_EDGE_BLEND} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Oral Arm Tint Shift</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Enabled</span>
          <input type="checkbox" bind:checked={$ORAL_TINT_SHIFT_ENABLED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Trigger Hz</span>
          <input class="ctrl-slider" type="range" min="20" max="20000" step="1" bind:value={$ORAL_TINT_SHIFT_HZ} />
          <input class="ctrl-val" type="number" step="1" bind:value={$ORAL_TINT_SHIFT_HZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Range Hz</span>
          <input class="ctrl-slider" type="range" min="10" max="1000" step="10" bind:value={$ORAL_TINT_SHIFT_RANGE_HZ} />
          <input class="ctrl-val" type="number" step="10" bind:value={$ORAL_TINT_SHIFT_RANGE_HZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Octaves</span>
          <input class="ctrl-slider" type="range" min="1" max="8" step="1" bind:value={$ORAL_TINT_SHIFT_OCTAVES} />
          <input class="ctrl-val" type="number" step="1" bind:value={$ORAL_TINT_SHIFT_OCTAVES} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Duration</span>
          <input class="ctrl-slider" type="range" min="1" max="30" step="1" bind:value={$ORAL_TINT_SHIFT_TRIGGER_DURATION} />
          <input class="ctrl-val" type="number" step="1" bind:value={$ORAL_TINT_SHIFT_TRIGGER_DURATION} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Window</span>
          <input class="ctrl-slider" type="range" min="3" max="21" step="2" bind:value={$ORAL_TINT_SHIFT_WINDOW} />
          <input class="ctrl-val" type="number" step="2" bind:value={$ORAL_TINT_SHIFT_WINDOW} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Target Color</span>
          <input class="ctrl-color" type="color"
            value={oralShiftHex}
            on:input={(e) => setFromHex(e.currentTarget.value, ORAL_TINT_SHIFT_TARGET_R.set, ORAL_TINT_SHIFT_TARGET_G.set, ORAL_TINT_SHIFT_TARGET_B.set)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Attack</span>
          <input class="ctrl-slider" type="range" min="10" max="2000" step="10" bind:value={$ORAL_TINT_SHIFT_ATTACK} />
          <input class="ctrl-val" type="number" step="10" bind:value={$ORAL_TINT_SHIFT_ATTACK} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Decay</span>
          <input class="ctrl-slider" type="range" min="10" max="5000" step="10" bind:value={$ORAL_TINT_SHIFT_DECAY} />
          <input class="ctrl-val" type="number" step="10" bind:value={$ORAL_TINT_SHIFT_DECAY} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Curve</span>
          <input class="ctrl-slider" type="range" min="0.1" max="4" step="0.05" bind:value={$ORAL_TINT_SHIFT_CURVE} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$ORAL_TINT_SHIFT_CURVE} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Oral Arm Twist</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Strength</span>
          <input class="ctrl-slider" type="range" min="0" max="3" step="0.05" bind:value={$ORAL_TWIST_STR} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$ORAL_TWIST_STR} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Frequency</span>
          <input class="ctrl-slider" type="range" min="0.1" max="8" step="0.1" bind:value={$ORAL_TWIST_FREQ} />
          <input class="ctrl-val" type="number" step="0.1" bind:value={$ORAL_TWIST_FREQ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Randomness</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$ORAL_TWIST_RAND} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$ORAL_TWIST_RAND} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Jelly Tint Shift</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Enabled</span>
          <input type="checkbox" bind:checked={$JELLY_TINT_SHIFT_ENABLED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Trigger Hz</span>
          <input class="ctrl-slider" type="range" min="20" max="20000" step="1" bind:value={$JELLY_TINT_SHIFT_HZ} />
          <input class="ctrl-val" type="number" step="1" bind:value={$JELLY_TINT_SHIFT_HZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Range Hz</span>
          <input class="ctrl-slider" type="range" min="1" max="200" step="1" bind:value={$JELLY_TINT_SHIFT_RANGE_HZ} />
          <input class="ctrl-val" type="number" step="1" bind:value={$JELLY_TINT_SHIFT_RANGE_HZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Octaves</span>
          <input class="ctrl-slider" type="range" min="1" max="8" step="1" bind:value={$JELLY_TINT_SHIFT_OCTAVES} />
          <input class="ctrl-val" type="number" step="1" bind:value={$JELLY_TINT_SHIFT_OCTAVES} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Duration</span>
          <input class="ctrl-slider" type="range" min="1" max="30" step="1" bind:value={$JELLY_TINT_SHIFT_TRIGGER_DURATION} />
          <input class="ctrl-val" type="number" step="1" bind:value={$JELLY_TINT_SHIFT_TRIGGER_DURATION} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Window</span>
          <input class="ctrl-slider" type="range" min="3" max="21" step="2" bind:value={$JELLY_TINT_SHIFT_WINDOW} />
          <input class="ctrl-val" type="number" step="2" bind:value={$JELLY_TINT_SHIFT_WINDOW} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Target Color</span>
          <input class="ctrl-color" type="color"
            value={jellyShiftHex}
            on:input={(e) => setFromHex(e.currentTarget.value, JELLY_TINT_SHIFT_TARGET_R.set, JELLY_TINT_SHIFT_TARGET_G.set, JELLY_TINT_SHIFT_TARGET_B.set)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Attack ms</span>
          <input class="ctrl-slider" type="range" min="0" max="1000" step="10" bind:value={$JELLY_TINT_SHIFT_ATTACK} />
          <input class="ctrl-val" type="number" step="10" bind:value={$JELLY_TINT_SHIFT_ATTACK} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Decay ms</span>
          <input class="ctrl-slider" type="range" min="50" max="3000" step="10" bind:value={$JELLY_TINT_SHIFT_DECAY} />
          <input class="ctrl-val" type="number" step="10" bind:value={$JELLY_TINT_SHIFT_DECAY} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Curve</span>
          <input class="ctrl-slider" type="range" min="0.2" max="4" step="0.05" bind:value={$JELLY_TINT_SHIFT_CURVE} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$JELLY_TINT_SHIFT_CURVE} />
        </div>
      </div>

    </div>
  </div>

  <!-- Column 5: Inner Membrane -->
  <div class="ctrl-col">
    <div class="ctrl-col-header">Membrane</div>
    <div class="ctrl-col-scroll">

      <div class="ctrl-group">
        <div class="ctrl-group-label">Toggle</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Enabled</span>
          <input type="checkbox" bind:checked={$JELLY_MEMBRANE_ENABLED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Scale</span>
          <input class="ctrl-slider" type="range" min="0.2" max="0.98" step="0.01" bind:value={$JELLY_MEMBRANE_SCALE} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$JELLY_MEMBRANE_SCALE} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Opacity</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Body opacity</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$JELLY_MEMBRANE_OPACITY} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$JELLY_MEMBRANE_OPACITY} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Front sheen</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$JELLY_MEMBRANE_FRONT_OP} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$JELLY_MEMBRANE_FRONT_OP} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Shading</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Fresnel</span>
          <input class="ctrl-slider" type="range" min="0" max="3" step="0.05" bind:value={$JELLY_MEMBRANE_FRESNEL} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$JELLY_MEMBRANE_FRESNEL} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Specular</span>
          <input class="ctrl-slider" type="range" min="0" max="3" step="0.05" bind:value={$JELLY_MEMBRANE_SPECULAR} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$JELLY_MEMBRANE_SPECULAR} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Iridescence</span>
          <input class="ctrl-slider" type="range" min="0" max="2" step="0.01" bind:value={$JELLY_MEMBRANE_IRID} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$JELLY_MEMBRANE_IRID} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Tint</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Color</span>
          <input class="ctrl-color" type="color"
            value={memTintHex}
            on:input={(e) => setFromHex(e.currentTarget.value, JELLY_MEMBRANE_TINT_R.set, JELLY_MEMBRANE_TINT_G.set, JELLY_MEMBRANE_TINT_B.set)} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Emission</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Base glow</span>
          <input class="ctrl-slider" type="range" min="0" max="2" step="0.05" bind:value={$JELLY_MEMBRANE_EMISSION} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$JELLY_MEMBRANE_EMISSION} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Pulse str</span>
          <input class="ctrl-slider" type="range" min="0" max="3" step="0.05" bind:value={$JELLY_MEMBRANE_PULSE_STR} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$JELLY_MEMBRANE_PULSE_STR} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Color Shift</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Enabled</span>
          <input type="checkbox" bind:checked={$JELLY_MEMBRANE_SHIFT_ENABLED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Trigger Hz</span>
          <input class="ctrl-slider" type="range" min="20" max="20000" step="1" bind:value={$JELLY_MEMBRANE_SHIFT_HZ} />
          <input class="ctrl-val" type="number" step="1" bind:value={$JELLY_MEMBRANE_SHIFT_HZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Range Hz</span>
          <input class="ctrl-slider" type="range" min="1" max="500" step="1" bind:value={$JELLY_MEMBRANE_SHIFT_RANGE_HZ} />
          <input class="ctrl-val" type="number" step="1" bind:value={$JELLY_MEMBRANE_SHIFT_RANGE_HZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Octaves</span>
          <input class="ctrl-slider" type="range" min="1" max="8" step="1" bind:value={$JELLY_MEMBRANE_SHIFT_OCTAVES} />
          <input class="ctrl-val" type="number" step="1" bind:value={$JELLY_MEMBRANE_SHIFT_OCTAVES} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Duration</span>
          <input class="ctrl-slider" type="range" min="1" max="30" step="1" bind:value={$JELLY_MEMBRANE_SHIFT_TRIGGER_DURATION} />
          <input class="ctrl-val" type="number" step="1" bind:value={$JELLY_MEMBRANE_SHIFT_TRIGGER_DURATION} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Window</span>
          <input class="ctrl-slider" type="range" min="3" max="21" step="2" bind:value={$JELLY_MEMBRANE_SHIFT_WINDOW} />
          <input class="ctrl-val" type="number" step="2" bind:value={$JELLY_MEMBRANE_SHIFT_WINDOW} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Target Color</span>
          <input class="ctrl-color" type="color"
            value={memShiftHex}
            on:input={(e) => setFromHex(e.currentTarget.value, JELLY_MEMBRANE_SHIFT_TARGET_R.set, JELLY_MEMBRANE_SHIFT_TARGET_G.set, JELLY_MEMBRANE_SHIFT_TARGET_B.set)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Attack ms</span>
          <input class="ctrl-slider" type="range" min="0" max="1000" step="10" bind:value={$JELLY_MEMBRANE_SHIFT_ATTACK} />
          <input class="ctrl-val" type="number" step="10" bind:value={$JELLY_MEMBRANE_SHIFT_ATTACK} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Decay ms</span>
          <input class="ctrl-slider" type="range" min="50" max="3000" step="10" bind:value={$JELLY_MEMBRANE_SHIFT_DECAY} />
          <input class="ctrl-val" type="number" step="10" bind:value={$JELLY_MEMBRANE_SHIFT_DECAY} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Curve</span>
          <input class="ctrl-slider" type="range" min="0.2" max="4" step="0.05" bind:value={$JELLY_MEMBRANE_SHIFT_CURVE} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$JELLY_MEMBRANE_SHIFT_CURVE} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Deep Sea Background</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Enabled</span>
          <input type="checkbox" bind:checked={$DS_BG_ENABLED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Top Color</span>
          <input class="ctrl-color" type="color" value={dsBgTopHex}
            on:input={(e) => setFromHex(e.currentTarget.value, DS_BG_TOP_R.set, DS_BG_TOP_G.set, DS_BG_TOP_B.set)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Bottom Color</span>
          <input class="ctrl-color" type="color" value={dsBgBotHex}
            on:input={(e) => setFromHex(e.currentTarget.value, DS_BG_BOT_R.set, DS_BG_BOT_G.set, DS_BG_BOT_B.set)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Vignette</span>
          <input class="ctrl-slider" type="range" min="0" max="1.5" step="0.01" bind:value={$DS_BG_VIGNETTE} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$DS_BG_VIGNETTE} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Horizon Y</span>
          <input class="ctrl-slider" type="range" min="0.05" max="1.5" step="0.01" bind:value={$DS_BG_HORIZON_Y} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$DS_BG_HORIZON_Y} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Deep Sea Particles</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Enabled</span>
          <input type="checkbox" bind:checked={$DS_PART_ENABLED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Count</span>
          <input class="ctrl-slider" type="range" min="0" max="400" step="1" bind:value={$DS_PART_COUNT} />
          <input class="ctrl-val" type="number" step="1" bind:value={$DS_PART_COUNT} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Size</span>
          <input class="ctrl-slider" type="range" min="1" max="30" step="0.5" bind:value={$DS_PART_SIZE} />
          <input class="ctrl-val" type="number" step="0.5" bind:value={$DS_PART_SIZE} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Drift Speed</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$DS_PART_SPEED} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$DS_PART_SPEED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Buoyancy</span>
          <input class="ctrl-slider" type="range" min="0" max="0.2" step="0.001" bind:value={$DS_PART_BUOY} />
          <input class="ctrl-val" type="number" step="0.001" bind:value={$DS_PART_BUOY} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Fog Density</span>
          <input class="ctrl-slider" type="range" min="0" max="3" step="0.01" bind:value={$DS_FOG_DENSITY} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$DS_FOG_DENSITY} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Brightness</span>
          <input class="ctrl-slider" type="range" min="0" max="3" step="0.01" bind:value={$DS_BRIGHTNESS} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$DS_BRIGHTNESS} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Ambient Glow</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$DS_AMBIENT_GLOW} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$DS_AMBIENT_GLOW} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Flicker Speed</span>
          <input class="ctrl-slider" type="range" min="0" max="5" step="0.1" bind:value={$DS_FLICKER_SPEED} />
          <input class="ctrl-val" type="number" step="0.1" bind:value={$DS_FLICKER_SPEED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Color A</span>
          <input class="ctrl-color" type="color" value={dsColAHex}
            on:input={(e) => setFromHex(e.currentTarget.value, DS_COL_A_R.set, DS_COL_A_G.set, DS_COL_A_B.set)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Color B</span>
          <input class="ctrl-color" type="color" value={dsColBHex}
            on:input={(e) => setFromHex(e.currentTarget.value, DS_COL_B_R.set, DS_COL_B_G.set, DS_COL_B_B.set)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Color Blend</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$DS_COL_BLEND} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$DS_COL_BLEND} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Deep Sea Trigger</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Enabled</span>
          <input type="checkbox" bind:checked={$DS_TRIG_ENABLED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Trigger Hz</span>
          <input class="ctrl-slider" type="range" min="20" max="20000" step="1" bind:value={$DS_TRIG_HZ} />
          <input class="ctrl-val" type="number" step="1" bind:value={$DS_TRIG_HZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Range Hz</span>
          <input class="ctrl-slider" type="range" min="1" max="200" step="1" bind:value={$DS_TRIG_RANGE_HZ} />
          <input class="ctrl-val" type="number" step="1" bind:value={$DS_TRIG_RANGE_HZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Burst Count</span>
          <input class="ctrl-slider" type="range" min="1" max="80" step="1" bind:value={$DS_BURST_COUNT} />
          <input class="ctrl-val" type="number" step="1" bind:value={$DS_BURST_COUNT} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Burst Size</span>
          <input class="ctrl-slider" type="range" min="0.5" max="4" step="0.1" bind:value={$DS_BURST_SIZE} />
          <input class="ctrl-val" type="number" step="0.1" bind:value={$DS_BURST_SIZE} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Burst Bright</span>
          <input class="ctrl-slider" type="range" min="0.5" max="5" step="0.1" bind:value={$DS_BURST_BRIGHT} />
          <input class="ctrl-val" type="number" step="0.1" bind:value={$DS_BURST_BRIGHT} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Burst Life (ms)</span>
          <input class="ctrl-slider" type="range" min="100" max="5000" step="50" bind:value={$DS_BURST_LIFE} />
          <input class="ctrl-val" type="number" step="50" bind:value={$DS_BURST_LIFE} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Burst Spread</span>
          <input class="ctrl-slider" type="range" min="0.1" max="5" step="0.1" bind:value={$DS_BURST_SPREAD} />
          <input class="ctrl-val" type="number" step="0.1" bind:value={$DS_BURST_SPREAD} />
        </div>
      </div>

      <!-- DS Swim Current -->
      <div class="ctrl-group">
        <div class="ctrl-group-header">
          <span class="ctrl-group-title">DS Swim Current</span>
          <label class="ctrl-toggle"><input type="checkbox" bind:checked={$DS_SWIM_ENABLED} /><span class="toggle-track"></span></label>
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Impulse</span>
          <input class="ctrl-slider" type="range" min="0" max="0.0005" step="0.000005" bind:value={$DS_SWIM_IMPULSE} />
          <input class="ctrl-val" type="number" step="0.000005" bind:value={$DS_SWIM_IMPULSE} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Attack (ms)</span>
          <input class="ctrl-slider" type="range" min="10" max="1000" step="10" bind:value={$DS_SWIM_ATTACK} />
          <input class="ctrl-val" type="number" step="10" bind:value={$DS_SWIM_ATTACK} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Decay (ms)</span>
          <input class="ctrl-slider" type="range" min="100" max="5000" step="50" bind:value={$DS_SWIM_DECAY} />
          <input class="ctrl-val" type="number" step="50" bind:value={$DS_SWIM_DECAY} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Curve</span>
          <input class="ctrl-slider" type="range" min="0.1" max="3" step="0.05" bind:value={$DS_SWIM_CURVE} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$DS_SWIM_CURVE} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Drag</span>
          <input class="ctrl-slider" type="range" min="0" max="0.02" step="0.0001" bind:value={$DS_SWIM_DRAG} />
          <input class="ctrl-val" type="number" step="0.0001" bind:value={$DS_SWIM_DRAG} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Max Speed</span>
          <input class="ctrl-slider" type="range" min="0" max="0.03" step="0.0005" bind:value={$DS_SWIM_MAX_VEL} />
          <input class="ctrl-val" type="number" step="0.0005" bind:value={$DS_SWIM_MAX_VEL} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Azimuth Offset</span>
          <input class="ctrl-slider" type="range" min="-180" max="180" step="1" bind:value={$DS_SWIM_AZ} />
          <input class="ctrl-val" type="number" step="1" bind:value={$DS_SWIM_AZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Elevation Offset</span>
          <input class="ctrl-slider" type="range" min="-90" max="90" step="1" bind:value={$DS_SWIM_EL} />
          <input class="ctrl-val" type="number" step="1" bind:value={$DS_SWIM_EL} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Bloom</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Enabled</span>
          <input type="checkbox" bind:checked={$BLOOM_ENABLED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Threshold</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$BLOOM_THRESHOLD} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$BLOOM_THRESHOLD} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Strength</span>
          <input class="ctrl-slider" type="range" min="0" max="3" step="0.05" bind:value={$BLOOM_STRENGTH} />
          <input class="ctrl-val" type="number" step="0.05" bind:value={$BLOOM_STRENGTH} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Softness</span>
          <input class="ctrl-slider" type="range" min="0.5" max="8" step="0.1" bind:value={$BLOOM_RADIUS} />
          <input class="ctrl-val" type="number" step="0.1" bind:value={$BLOOM_RADIUS} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Passes</span>
          <input class="ctrl-slider" type="range" min="1" max="4" step="1" bind:value={$BLOOM_PASSES} />
          <input class="ctrl-val" type="number" step="1" bind:value={$BLOOM_PASSES} />
        </div>
      </div>

      <div class="ctrl-group">
        <div class="ctrl-group-label">Motion Blur</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Enabled</span>
          <input type="checkbox" bind:checked={$MB_ENABLED} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Strength</span>
          <input class="ctrl-slider" type="range" min="0" max="0.98" step="0.01" bind:value={$MB_STRENGTH} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$MB_STRENGTH} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Softness</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$MB_SOFTNESS} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$MB_SOFTNESS} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Trigger Boost</span>
          <input class="ctrl-slider" type="range" min="0" max="1" step="0.01" bind:value={$MB_TRIGGER_BOOST} />
          <input class="ctrl-val" type="number" step="0.01" bind:value={$MB_TRIGGER_BOOST} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Trigger Decay ms</span>
          <input class="ctrl-slider" type="range" min="50" max="2000" step="10" bind:value={$MB_TRIGGER_DECAY} />
          <input class="ctrl-val" type="number" step="10" bind:value={$MB_TRIGGER_DECAY} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Reverse Boost</span>
          <input type="checkbox" bind:checked={$MB_REVERSE_BOOST} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Trig Hz</span>
          <input class="ctrl-slider" type="range" min="20" max="16000" step="1" bind:value={$MB_TRIG_HZ} />
          <input class="ctrl-val" type="number" step="1" bind:value={$MB_TRIG_HZ} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Trig Range Hz</span>
          <input class="ctrl-slider" type="range" min="5" max="2000" step="1" bind:value={$MB_TRIG_RANGE_HZ} />
          <input class="ctrl-val" type="number" step="1" bind:value={$MB_TRIG_RANGE_HZ} />
        </div>
      </div>

    </div>
  </div>

</div>

<style>
  #lichen-ctrl-cols {
    flex: 1;
    display: flex;
    flex-direction: row;
    min-height: 0;
    overflow: hidden;
    border-left: 1px solid rgba(100, 180, 255, 0.08);
  }

  .ctrl-color {
    width: 40px;
    height: 24px;
    padding: 0;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 3px;
    background: none;
    cursor: pointer;
  }
</style>
