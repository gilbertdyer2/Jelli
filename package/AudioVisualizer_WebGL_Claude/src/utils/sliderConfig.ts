import { get } from 'svelte/store';
import { TIMESCALE } from '@stores/speed';
import * as Phys from '@stores/physics';
import * as Eff from '@stores/effects';
import * as Bg from '@stores/background';
import * as Uw from '@stores/underwater';
import * as Sp from '@stores/spotlight';
import * as Duo from '@stores/duolink';
import * as Thr from '@stores/threshold';
import * as Dit from '@stores/dither';
import { reinitBlobs } from '@creatures/blobFactory';
import { reinitClams } from '@creatures/clamFactory';
import { invalidateDitherLUT } from '@renderer/drawDither';
import { _duoPair, createDuoParticles } from '@renderer/drawDuoLinks';
import { flashDetector, particleTrigDetector, rippleDetector, bgRandDetector, lrLeftDetector, lrRightDetector } from '@audio/audioEngine';
import { hexToRgb, rgbToHex } from '@utils/color';
import { fmtSliderVal } from '@utils/math';

export type SliderItem =
  | { label: string; type?: 'range'; min: number; max: number; step: number; get(): number; set(v: number): void }
  | { label: string; type: 'toggle'; get(): boolean; set(v: boolean): void }
  | { label: string; type: 'color';  get(): string;  set(hex: string): void };

export interface SliderGroup { group: string; col: 1 | 2 | 3; items: SliderItem[]; }

export function buildSliderConfig(canvas: HTMLCanvasElement): SliderGroup[] {
  return [
    // ── Column 1: Jellyfish physics ──────────────────────────────────────────
    { group: 'Speed', col: 1, items: [
      { label: 'Timescale', min: 0.1, max: 3.0, step: 0.05, get: () => get(TIMESCALE), set: (v: number) => TIMESCALE.set(v) },
    ]},
    { group: 'Threshold', col: 1, items: [
      { label: 'Idle Decay Rate', min: 0.5, max: 6.0,    step: 0.5,     get: () => get(Thr.IDLE_DECAY_RATE), set: v => Thr.IDLE_DECAY_RATE.set(v) },
      { label: 'Freq Decay Bias', min: 0,   max: 2.0,    step: 0.1,     get: () => get(Thr.FREQ_DECAY_BIAS), set: v => Thr.FREQ_DECAY_BIAS.set(v) },
      { label: 'Noise Floor',     min: 0,   max: 0.0005, step: 0.00002, get: () => get(Thr.MIN_FLUX_FLOOR),  set: v => Thr.MIN_FLUX_FLOOR.set(v) },
    ]},
    { group: 'Particles', col: 1, items: [
      { label: 'Count',       min: 5,   max: 60,  step: 1,   get: () => get(Phys.BLOB_PARTICLE_COUNT), set: v => { Phys.BLOB_PARTICLE_COUNT.set(v);  reinitBlobs(canvas.width, canvas.height); } },
      { label: 'Bell Radius', min: 5,   max: 200, step: 5,   get: () => get(Phys.BELL_RADIUS),         set: v => { Phys.BELL_RADIUS.set(v);          reinitBlobs(canvas.width, canvas.height); } },
      { label: 'Rest Radius', min: 1,   max: 180, step: 1,   get: () => get(Phys.BLOB_REST_RADIUS),    set: v => Phys.BLOB_REST_RADIUS.set(v) },
      { label: 'Edge Dist',   min: 5,   max: 240, step: 1,   get: () => get(Phys.BLOB_EDGE_DIST),      set: v => Phys.BLOB_EDGE_DIST.set(v) },
      { label: 'Node Radius', min: 0.1, max: 12,  step: 0.1, get: () => get(Phys.NODE_BASE_RADIUS),    set: v => Phys.NODE_BASE_RADIUS.set(v) },
    ]},
    { group: 'Spring', col: 1, items: [
      { label: 'Spring K', min: 0.005, max: 0.25, step: 0.005, get: () => get(Phys.BLOB_SPRING_K),  set: v => Phys.BLOB_SPRING_K.set(v) },
      { label: 'Damping',  min: 0.70,  max: 0.99, step: 0.01,  get: () => get(Phys.BLOB_DAMPING),   set: v => Phys.BLOB_DAMPING.set(v) },
      { label: 'Jitter',   min: 0,     max: 0.5,  step: 0.005, get: () => get(Phys.BLOB_JITTER),    set: v => Phys.BLOB_JITTER.set(v) },
    ]},
    { group: 'Drift', col: 1, items: [
      { label: 'Drift Max',     min: 0.05,  max: 3.0,  step: 0.05,  get: () => get(Phys.BLOB_DRIFT_MAX),   set: v => Phys.BLOB_DRIFT_MAX.set(v) },
      { label: 'Drift Accel',   min: 0.001, max: 0.05, step: 0.001, get: () => get(Phys.BLOB_DRIFT_ACCEL), set: v => Phys.BLOB_DRIFT_ACCEL.set(v) },
      { label: 'Edge Margin',   min: 0,     max: 300,  step: 5,     get: () => get(Phys.BLOB_MARGIN),      set: v => Phys.BLOB_MARGIN.set(v) },
      { label: 'Top Clear',     min: 0,     max: 200,  step: 5,     get: () => get(Phys.TOP_CLEAR),        set: v => Phys.TOP_CLEAR.set(v) },
      { label: 'Drag Momentum', min: 0,     max: 6.0,  step: 0.05,  get: () => get(Phys.DRAG_MOMENTUM),    set: v => Phys.DRAG_MOMENTUM.set(v) },
    ]},

    // ── Column 2: Beat response & Clam ───────────────────────────────────────
    { group: 'Beat', col: 2, items: [
      { label: 'Kick Scale',    min: 0,     max: 12,    step: 0.1,   get: () => get(Phys.BLOB_BEAT_KICK),        set: v => Phys.BLOB_BEAT_KICK.set(v) },
      { label: 'Kick Accel',    min: 0.05,  max: 1.0,   step: 0.05,  get: () => get(Phys.KICK_ACCEL),            set: v => Phys.KICK_ACCEL.set(v) },
      { label: 'Kick Decay',    min: 0.70,  max: 0.99,  step: 0.01,  get: () => get(Phys.BLOB_BEAT_KICK_DECAY),  set: v => Phys.BLOB_BEAT_KICK_DECAY.set(v) },
      { label: 'Max Energy',    min: 0.1,   max: 5.0,   step: 0.1,   get: () => get(Phys.ENERGY_MAX),            set: v => Phys.ENERGY_MAX.set(v) },
      { label: 'Recharge Rate', min: 0.001, max: 0.05,  step: 0.001, get: () => get(Phys.ENERGY_RECHARGE),       set: v => Phys.ENERGY_RECHARGE.set(v) },
      { label: 'Expand Scale',  min: 0,     max: 2.0,   step: 0.05,  get: () => get(Phys.BLOB_EXPAND_SCALE),     set: v => Phys.BLOB_EXPAND_SCALE.set(v) },
      { label: 'Expand Decay',  min: 0.70,  max: 0.99,  step: 0.01,  get: () => get(Phys.BLOB_EXPAND_DECAY),     set: v => Phys.BLOB_EXPAND_DECAY.set(v) },
      { label: 'Spread Boost',  min: 1.0,   max: 2.5,   step: 0.05,  get: () => get(Phys.TENTACLE_SPREAD_BOOST), set: v => Phys.TENTACLE_SPREAD_BOOST.set(v) },
      { label: 'Spread Decay',  min: 0.900, max: 0.999, step: 0.005, get: () => get(Phys.TENTACLE_SPREAD_DECAY), set: v => Phys.TENTACLE_SPREAD_DECAY.set(v) },
    ]},
    { group: 'Inflate', col: 2, items: [
      { label: 'Enabled', type: 'toggle',                          get: () => get(Eff.INFLATE_ENABLED), set: v => Eff.INFLATE_ENABLED.set(v) },
      { label: 'Boost',   min: 0.001, max: 0.2,    step: 0.002,   get: () => get(Eff.INFLATE_BOOST),   set: v => Eff.INFLATE_BOOST.set(v) },
      { label: 'Decay',   min: 0.95,  max: 0.9995, step: 0.0005,  get: () => get(Eff.INFLATE_DECAY),   set: v => Eff.INFLATE_DECAY.set(v) },
      { label: 'Max',     min: 1.0,   max: 3.0,    step: 0.05,    get: () => get(Eff.INFLATE_MAX),     set: v => Eff.INFLATE_MAX.set(v) },
    ]},
    { group: 'Effects', col: 2, items: [
      { label: 'Wave Speed', min: 0.5, max: 12,  step: 0.5,  get: () => get(Eff.SHOCKWAVE_SPEED),     set: v => Eff.SHOCKWAVE_SPEED.set(v) },
      { label: 'Wave Max R', min: 50,  max: 600, step: 10,   get: () => get(Eff.SHOCKWAVE_MAX_R),     set: v => Eff.SHOCKWAVE_MAX_R.set(v) },
      { label: 'Poly Scale', min: 50,  max: 700, step: 10,   get: () => get(Eff.POLYGON_MAX_SCALE),   set: v => Eff.POLYGON_MAX_SCALE.set(v) },
      { label: 'Poly Rate',  min: 0.5, max: 20,  step: 0.5,  get: () => get(Eff.POLYGON_EXPAND_RATE), set: v => Eff.POLYGON_EXPAND_RATE.set(v) },
    ]},
    { group: 'Clam', col: 2, items: [
      { label: 'Shell Width',   min: 20,   max: 300,   step: 1,     get: () => get(Phys.CLAM_SHELL_W),    set: v => { Phys.CLAM_SHELL_W.set(v);    reinitClams(canvas.width, canvas.height); } },
      { label: 'Upper Height',  min: 10,   max: 200,   step: 1,     get: () => get(Phys.CLAM_SHELL_H),    set: v => { Phys.CLAM_SHELL_H.set(v);    reinitClams(canvas.width, canvas.height); } },
      { label: 'Lower Depth',   min: 5,    max: 150,   step: 1,     get: () => get(Phys.CLAM_SHELL_BLOW), set: v => { Phys.CLAM_SHELL_BLOW.set(v); reinitClams(canvas.width, canvas.height); } },
      { label: 'Max Lip Gap',   min: 5,    max: 100,   step: 1,     get: () => get(Phys.CLAM_LIP_OPEN),   set: v => Phys.CLAM_LIP_OPEN.set(v) },
      { label: 'Snap Force',    min: 0.5,  max: 12,    step: 0.5,   get: () => get(Phys.CLAM_SNAP_FORCE), set: v => Phys.CLAM_SNAP_FORCE.set(v) },
      { label: 'Snap Spring',   min: 0.02, max: 0.60,  step: 0.01,  get: () => get(Phys.CLAM_SNAP_SPRING),set: v => Phys.CLAM_SNAP_SPRING.set(v) },
      { label: 'Water Gravity', min: 0.01, max: 0.3,   step: 0.005, get: () => get(Phys.CLAM_GRAVITY),    set: v => Phys.CLAM_GRAVITY.set(v) },
      { label: 'Water Drag',    min: 0.80, max: 0.999, step: 0.002, get: () => get(Phys.CLAM_WATER_DRAG), set: v => Phys.CLAM_WATER_DRAG.set(v) },
      { label: 'Spin Max',      min: 0,    max: 0.15,  step: 0.005, get: () => get(Phys.CLAM_SPIN_MAX),   set: v => Phys.CLAM_SPIN_MAX.set(v) },
      { label: 'Edge Dist',     min: 5,    max: 200,   step: 5,     get: () => get(Phys.CLAM_EDGE_DIST),  set: v => Phys.CLAM_EDGE_DIST.set(v) },
    ]},

    // ── Column 3: Scene & atmosphere ─────────────────────────────────────────
    { group: 'Background', col: 3, items: [
      { label: 'BG Color', type: 'color',
        get: () => rgbToHex(get(Bg.BG_R), get(Bg.BG_G), get(Bg.BG_B)),
        set: hex => { const [r, g, b] = hexToRgb(hex); Bg.BG_R.set(r); Bg.BG_G.set(g); Bg.BG_B.set(b); } },
      { label: 'Trail',       min: 0.05, max: 1.0, step: 0.01, get: () => get(Bg.BG_TRAIL_ALPHA),     set: v => Bg.BG_TRAIL_ALPHA.set(v) },
      { label: 'Energy Glow', min: 0,    max: 0.5, step: 0.01, get: () => get(Bg.BG_ENERGY_MAX_ALPHA), set: v => Bg.BG_ENERGY_MAX_ALPHA.set(v) },
      { label: 'Band Color', type: 'color',
        get: () => rgbToHex(get(Bg.SUB_R), get(Bg.SUB_G), get(Bg.SUB_B)),
        set: hex => { const [r, g, b] = hexToRgb(hex); Bg.SUB_R.set(r); Bg.SUB_G.set(g); Bg.SUB_B.set(b); } },
      { label: 'Band Height', min: 0.05, max: 1.0, step: 0.01, get: () => get(Bg.SUB_BAND_HEIGHT),    set: v => Bg.SUB_BAND_HEIGHT.set(v) },
      { label: 'Band Opacity', min: 0.0, max: 1.0, step: 0.01, get: () => get(Bg.SUB_MAX_ALPHA),      set: v => Bg.SUB_MAX_ALPHA.set(v) },
      { label: 'Color Randomize',  type: 'toggle',                          get: () => get(Eff.BG_RANDOMIZE_ENABLED),  set: v => Eff.BG_RANDOMIZE_ENABLED.set(v) },
      { label: 'Randomize Hz',     min: 20,  max: 20000, step: 1,           get: () => get(Eff.BG_RANDOMIZE_HZ),        set: v => {
        Eff.BG_RANDOMIZE_HZ.set(v);
        if (bgRandDetector) { bgRandDetector.targetHz = v; bgRandDetector.reset(); }
      }},
      { label: 'Randomize Range',  min: 1,   max: 128,   step: 1,           get: () => get(Eff.BG_RANDOMIZE_RANGE),     set: v => Eff.BG_RANDOMIZE_RANGE.set(v) },
      { label: 'Randomize Slope',  min: 0.1, max: 4.0,   step: 0.1,         get: () => get(Eff.BG_RANDOMIZE_SLOPE),     set: v => Eff.BG_RANDOMIZE_SLOPE.set(v) },
      { label: 'Randomize Fade In (ms)',  min: 0, max: 2000, step: 10,      get: () => get(Eff.BG_RANDOMIZE_FADE_IN),   set: v => Eff.BG_RANDOMIZE_FADE_IN.set(v) },
      { label: 'Randomize Fade Out (ms)', min: 0, max: 5000, step: 10,      get: () => get(Eff.BG_RANDOMIZE_FADE_OUT),  set: v => Eff.BG_RANDOMIZE_FADE_OUT.set(v) },
    ]},
    { group: 'Spotlight', col: 3, items: [
      { label: 'Enabled',       type: 'toggle',                          get: () => get(Sp.SPOTLIGHT_ENABLED),        set: v => Sp.SPOTLIGHT_ENABLED.set(v) },
      { label: 'Solo Time (s)', min: 0.5,  max: 15,   step: 0.5,        get: () => get(Sp.SOLO_THRESHOLD_MS) / 1000, set: v => Sp.SOLO_THRESHOLD_MS.set(v * 1000) },
      { label: 'Max Opacity',   min: 0.01, max: 0.50, step: 0.01,       get: () => get(Sp.SPOTLIGHT_MAX_ALPHA),      set: v => Sp.SPOTLIGHT_MAX_ALPHA.set(v) },
      { label: 'Radius',        min: 1.0,  max: 8.0,  step: 0.25,       get: () => get(Sp.SPOTLIGHT_RADIUS_MULT),    set: v => Sp.SPOTLIGHT_RADIUS_MULT.set(v) },
      { label: 'Fade Speed',    min: 0.005, max: 0.10, step: 0.005,     get: () => get(Sp.SPOTLIGHT_FADE_IN),        set: v => { Sp.SPOTLIGHT_FADE_IN.set(v); Sp.SPOTLIGHT_FADE_OUT.set(v * 0.5); } },
    ]},
    { group: 'Duo Link', col: 3, items: [
      { label: 'Enabled',             type: 'toggle',                       get: () => get(Duo.DUO_LINK_ENABLED),         set: v => Duo.DUO_LINK_ENABLED.set(v) },
      { label: 'Sync Window (s)',     min: 1,    max: 15,   step: 0.5,     get: () => get(Duo.DUO_SYNC_WINDOW),          set: v => Duo.DUO_SYNC_WINDOW.set(v) },
      { label: 'Sync Tolerance (ms)', min: 25,   max: 1000, step: 25,      get: () => get(Duo.DUO_SYNC_TOLERANCE),       set: v => Duo.DUO_SYNC_TOLERANCE.set(v) },
      { label: 'Min Matches',         min: 1,    max: 20,   step: 1,       get: () => get(Duo.DUO_SYNC_MIN_MATCHES),     set: v => Duo.DUO_SYNC_MIN_MATCHES.set(v) },
      { label: 'Appear Delay (s)',    min: 0.5,  max: 15,   step: 0.5,     get: () => get(Duo.DUO_THRESHOLD_MS) / 1000, set: v => Duo.DUO_THRESHOLD_MS.set(v * 1000) },
      { label: 'Max Opacity',         min: 0.01, max: 0.50, step: 0.01,   get: () => get(Duo.DUO_LINK_MAX_ALPHA),       set: v => Duo.DUO_LINK_MAX_ALPHA.set(v) },
      { label: 'Edge Dist',           min: 5,    max: 300,  step: 5,      get: () => get(Duo.DUO_LINK_EDGE_DIST),       set: v => Duo.DUO_LINK_EDGE_DIST.set(v) },
      { label: 'Particles',           min: 10,   max: 80,   step: 2,      get: () => get(Duo.DUO_LINK_PARTICLE_COUNT),  set: v => {
        Duo.DUO_LINK_PARTICLE_COUNT.set(v);
        if (_duoPair) _duoPair.particles = createDuoParticles(_duoPair.blobA, _duoPair.blobB);
      }},
      { label: 'Spread Radius',       min: 0.2,  max: 4.0,  step: 0.1,   get: () => get(Duo.DUO_LINK_SPREAD),          set: v => {
        Duo.DUO_LINK_SPREAD.set(v);
        if (_duoPair) _duoPair.particles = createDuoParticles(_duoPair.blobA, _duoPair.blobB);
      }},
      { label: 'Fade Speed',          min: 0.005, max: 0.10, step: 0.005, get: () => get(Duo.DUO_FADE_IN),              set: v => { Duo.DUO_FADE_IN.set(v); Duo.DUO_FADE_OUT.set(v * 0.5); } },
    ]},
    { group: 'Underwater', col: 3, items: [
      { label: 'Caustics',       type: 'toggle',                        get: () => get(Uw.UW_CAUSTICS_ENABLED),  set: v => Uw.UW_CAUSTICS_ENABLED.set(v) },
      { label: 'Caustic Alpha',  min: 0, max: 0.12,  step: 0.002,      get: () => get(Uw.UW_CAUSTICS_ALPHA),    set: v => Uw.UW_CAUSTICS_ALPHA.set(v) },
      { label: 'Caustic Speed',  min: 0, max: 0.001, step: 0.00002,    get: () => get(Uw.UW_CAUSTICS_SPEED),    set: v => Uw.UW_CAUSTICS_SPEED.set(v) },
      { label: 'Color A', type: 'color',
        get: () => rgbToHex(get(Uw.UW_BLOB_R1), get(Uw.UW_BLOB_G1), get(Uw.UW_BLOB_B1)),
        set: hex => { const [r, g, b] = hexToRgb(hex); Uw.UW_BLOB_R1.set(r); Uw.UW_BLOB_G1.set(g); Uw.UW_BLOB_B1.set(b); } },
      { label: 'Color B', type: 'color',
        get: () => rgbToHex(get(Uw.UW_BLOB_R2), get(Uw.UW_BLOB_G2), get(Uw.UW_BLOB_B2)),
        set: hex => { const [r, g, b] = hexToRgb(hex); Uw.UW_BLOB_R2.set(r); Uw.UW_BLOB_G2.set(g); Uw.UW_BLOB_B2.set(b); } },
      { label: 'Particles',      type: 'toggle',                        get: () => get(Uw.UW_PARTICLES_ENABLED), set: v => Uw.UW_PARTICLES_ENABLED.set(v) },
      { label: 'Particle Color', type: 'color',
        get: () => rgbToHex(get(Uw.UW_PARTICLES_R), get(Uw.UW_PARTICLES_G), get(Uw.UW_PARTICLES_B)),
        set: hex => { const [r, g, b] = hexToRgb(hex); Uw.UW_PARTICLES_R.set(r); Uw.UW_PARTICLES_G.set(g); Uw.UW_PARTICLES_B.set(b); } },
      { label: 'Particle Alpha', min: 0, max: 1.0,   step: 0.02,       get: () => get(Uw.UW_PARTICLES_ALPHA),   set: v => Uw.UW_PARTICLES_ALPHA.set(v) },
      { label: 'Current Speed',  min: 0, max: 1.5,   step: 0.02,       get: () => get(Uw.UW_PARTICLES_SPEED),   set: v => Uw.UW_PARTICLES_SPEED.set(v) },
    ]},
    { group: 'Particle Current', col: 3, items: [
      { label: 'Enabled',         type: 'toggle', get: () => get(Uw.UW_PARTICLES_ENABLED),        set: v => Uw.UW_PARTICLES_ENABLED.set(v) },
      { label: 'Beat Trigger',    type: 'toggle', get: () => get(Eff.PARTICLE_TRIGGER_ENABLED),  set: v => Eff.PARTICLE_TRIGGER_ENABLED.set(v) },
      { label: 'Hz',              min: 20,  max: 20000, step: 1,    get: () => get(Eff.PARTICLE_TRIGGER_HZ), set: v => {
        Eff.PARTICLE_TRIGGER_HZ.set(v);
        if (particleTrigDetector) { particleTrigDetector.targetHz = v; particleTrigDetector.reset(); }
      }},
      { label: 'Boost',           min: 0,   max: 8,     step: 0.05, get: () => get(Eff.PARTICLE_TRIGGER_BOOST),    set: v => Eff.PARTICLE_TRIGGER_BOOST.set(v) },
      { label: 'Slope',           min: 0.1, max: 4.0,   step: 0.1,  get: () => get(Eff.PARTICLE_TRIGGER_SLOPE),    set: v => Eff.PARTICLE_TRIGGER_SLOPE.set(v) },
      { label: 'Fade In (ms)',    min: 10,  max: 2000,  step: 10,   get: () => get(Eff.PARTICLE_TRIGGER_FADE_IN),  set: v => Eff.PARTICLE_TRIGGER_FADE_IN.set(v) },
      { label: 'Fade Out (ms)',   min: 10,  max: 5000,  step: 10,   get: () => get(Eff.PARTICLE_TRIGGER_FADE_OUT), set: v => Eff.PARTICLE_TRIGGER_FADE_OUT.set(v) },
      { label: 'Energy Response', type: 'toggle', get: () => get(Eff.PARTICLE_ENERGY_ENABLED),   set: v => Eff.PARTICLE_ENERGY_ENABLED.set(v) },
      { label: 'Energy Min',      min: 0,   max: 5,     step: 0.05, get: () => get(Eff.PARTICLE_ENERGY_MIN),       set: v => Eff.PARTICLE_ENERGY_MIN.set(v) },
      { label: 'Energy Max',      min: 0,   max: 10,    step: 0.05, get: () => get(Eff.PARTICLE_ENERGY_MAX),       set: v => Eff.PARTICLE_ENERGY_MAX.set(v) },
    ]},
    { group: 'Ripple', col: 3, items: [
      { label: 'Enabled',       type: 'toggle',                          get: () => get(Eff.RIPPLE_ENABLED),    set: v => Eff.RIPPLE_ENABLED.set(v) },
      { label: 'Hz',            min: 20, max: 20000, step: 1,            get: () => get(Eff.RIPPLE_HZ),         set: v => {
        Eff.RIPPLE_HZ.set(v);
        if (rippleDetector) { rippleDetector.targetHz = v; rippleDetector.reset(); }
      }},
      { label: 'Max Radius',    min: 50,  max: 800,  step: 10,           get: () => get(Eff.RIPPLE_MAX_R),      set: v => Eff.RIPPLE_MAX_R.set(v) },
      { label: 'Speed',         min: 0.5, max: 10,   step: 0.1,          get: () => get(Eff.RIPPLE_SPEED),      set: v => Eff.RIPPLE_SPEED.set(v) },
      { label: 'Opacity',       min: 0.01, max: 0.5, step: 0.005,        get: () => get(Eff.RIPPLE_ALPHA),      set: v => Eff.RIPPLE_ALPHA.set(v) },
      { label: 'Brighten',      min: 1,   max: 60,   step: 1,            get: () => get(Eff.RIPPLE_BRIGHTEN),   set: v => Eff.RIPPLE_BRIGHTEN.set(v) },
      { label: 'Ring Count',    min: 1,   max: 8,    step: 1,            get: () => get(Eff.RIPPLE_RING_COUNT), set: v => Eff.RIPPLE_RING_COUNT.set(v) },
      { label: 'Wavelength',    min: 10,  max: 200,  step: 5,            get: () => get(Eff.RIPPLE_WAVELENGTH), set: v => Eff.RIPPLE_WAVELENGTH.set(v) },
    ]},
    { group: 'Blob Flash', col: 3, items: [
      { label: 'Enabled',       type: 'toggle', get: () => get(Eff.BLOB_FLASH_ENABLED), set: v => Eff.BLOB_FLASH_ENABLED.set(v) },
      { label: 'Hz',            min: 20,  max: 20000, step: 1,   get: () => get(Eff.BLOB_FLASH_HZ), set: v => {
        Eff.BLOB_FLASH_HZ.set(v);
        if (flashDetector) { flashDetector.targetHz = v; flashDetector.reset(); }
      }},
      { label: 'Color', type: 'color',
        get: () => rgbToHex(get(Eff.BLOB_FLASH_R), get(Eff.BLOB_FLASH_G), get(Eff.BLOB_FLASH_B)),
        set: hex => { const [r, g, b] = hexToRgb(hex); Eff.BLOB_FLASH_R.set(r); Eff.BLOB_FLASH_G.set(g); Eff.BLOB_FLASH_B.set(b); } },
      { label: 'Random Color',  type: 'toggle', get: () => get(Eff.BLOB_FLASH_RANDOM), set: v => Eff.BLOB_FLASH_RANDOM.set(v) },
      { label: 'Slope',         min: 0.1, max: 4.0,  step: 0.1,  get: () => get(Eff.BLOB_FLASH_SLOPE),    set: v => Eff.BLOB_FLASH_SLOPE.set(v) },
      { label: 'Fade In (ms)',  min: 10,  max: 2000, step: 10,   get: () => get(Eff.BLOB_FLASH_FADE_IN),  set: v => Eff.BLOB_FLASH_FADE_IN.set(v) },
      { label: 'Fade Out (ms)', min: 10,  max: 5000, step: 10,   get: () => get(Eff.BLOB_FLASH_FADE_OUT), set: v => Eff.BLOB_FLASH_FADE_OUT.set(v) },
      { label: 'Affect All',    type: 'toggle', get: () => get(Eff.BLOB_FLASH_ALL),     set: v => Eff.BLOB_FLASH_ALL.set(v) },
    ]},
    { group: 'Blob Flash L/R', col: 3, items: [
      { label: 'L/R Mode',             type: 'toggle',                         get: () => get(Eff.LR_MODE_ENABLED),     set: v => Eff.LR_MODE_ENABLED.set(v) },
      { label: 'Hz',                   min: 20, max: 20000, step: 1,           get: () => get(Eff.LR_HZ),               set: v => {
        Eff.LR_HZ.set(v);
        if (lrLeftDetector)  { lrLeftDetector.targetHz  = v; lrLeftDetector.reset(); }
        if (lrRightDetector) { lrRightDetector.targetHz = v; lrRightDetector.reset(); }
      }},
      { label: 'Exclusivity Window (ms)', min: 10, max: 500, step: 10,        get: () => get(Eff.LR_WINDOW_MS),         set: v => Eff.LR_WINDOW_MS.set(v) },
      { label: 'Position Slope',       min: 0.1, max: 5.0, step: 0.1,         get: () => get(Eff.LR_FLASH_SLOPE),       set: v => Eff.LR_FLASH_SLOPE.set(v) },
      { label: 'Center Reduction',     min: 0,   max: 1.0, step: 0.05,        get: () => get(Eff.LR_CENTER_REDUCTION),  set: v => Eff.LR_CENTER_REDUCTION.set(v) },
      { label: 'Fade In (ms)',         min: 10,  max: 2000, step: 10,          get: () => get(Eff.LR_FADE_IN),           set: v => Eff.LR_FADE_IN.set(v) },
      { label: 'Fade Out (ms)',        min: 10,  max: 5000, step: 10,          get: () => get(Eff.LR_FADE_OUT),          set: v => Eff.LR_FADE_OUT.set(v) },
      { label: 'Left Color',  type: 'color',
        get: () => rgbToHex(get(Eff.LR_LEFT_R),  get(Eff.LR_LEFT_G),  get(Eff.LR_LEFT_B)),
        set: hex => { const [r, g, b] = hexToRgb(hex); Eff.LR_LEFT_R.set(r);  Eff.LR_LEFT_G.set(g);  Eff.LR_LEFT_B.set(b); } },
      { label: 'Right Color', type: 'color',
        get: () => rgbToHex(get(Eff.LR_RIGHT_R), get(Eff.LR_RIGHT_G), get(Eff.LR_RIGHT_B)),
        set: hex => { const [r, g, b] = hexToRgb(hex); Eff.LR_RIGHT_R.set(r); Eff.LR_RIGHT_G.set(g); Eff.LR_RIGHT_B.set(b); } },
    ]},
    { group: 'Dither', col: 3, items: [
      { label: 'Enabled',        type: 'toggle', get: () => get(Dit.DITHER_ENABLED),       set: v => Dit.DITHER_ENABLED.set(v) },
      { label: 'Pixel Size',     min: 2,   max: 8,   step: 1,    get: () => get(Dit.DITHER_PIXEL_SIZE),  set: v => { Dit.DITHER_PIXEL_SIZE.set(v);  invalidateDitherLUT(); } },
      { label: 'Color Levels',   min: 2,   max: 64,  step: 1,    get: () => get(Dit.DITHER_LEVELS),      set: v => { Dit.DITHER_LEVELS.set(v);      invalidateDitherLUT(); } },
      { label: 'Opacity',        min: 0.1, max: 1.0, step: 0.01, get: () => get(Dit.DITHER_OPACITY),     set: v => Dit.DITHER_OPACITY.set(v) },
      { label: 'Phosphor Tint',  type: 'toggle', get: () => get(Dit.DITHER_TINT_ENABLED), set: v => { Dit.DITHER_TINT_ENABLED.set(v); invalidateDitherLUT(); } },
      { label: 'Tint Color', type: 'color',
        get: () => rgbToHex(get(Dit.DITHER_TINT_R), get(Dit.DITHER_TINT_G), get(Dit.DITHER_TINT_B)),
        set: hex => { const [r, g, b] = hexToRgb(hex); Dit.DITHER_TINT_R.set(r); Dit.DITHER_TINT_G.set(g); Dit.DITHER_TINT_B.set(b); invalidateDitherLUT(); } },
      { label: 'Tint Strength',  min: 0,   max: 1,   step: 0.01, get: () => get(Dit.DITHER_TINT_STR),    set: v => { Dit.DITHER_TINT_STR.set(v);   invalidateDitherLUT(); } },
      { label: 'Scanlines',      type: 'toggle', get: () => get(Dit.DITHER_SCAN_ENABLED), set: v => Dit.DITHER_SCAN_ENABLED.set(v) },
      { label: 'Scanline Alpha', min: 0,   max: 0.8, step: 0.01, get: () => get(Dit.DITHER_SCAN_ALPHA),  set: v => Dit.DITHER_SCAN_ALPHA.set(v) },
      { label: 'Scanline Gap',   min: 2,   max: 8,   step: 1,    get: () => get(Dit.DITHER_SCAN_GAP),    set: v => Dit.DITHER_SCAN_GAP.set(v) },
    ]},
  ];
}
