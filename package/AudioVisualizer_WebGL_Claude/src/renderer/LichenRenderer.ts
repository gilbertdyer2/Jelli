import { get } from 'svelte/store';
import { liveAnalyser, liveContext } from '@audio/audioEngine';
import { DetectorClass, registerDetector } from '@audio/detectorFactory';
import {
  LICHEN_DECAY_RATE, LICHEN_MAX_PATCHES, LICHEN_GLOW_INTENSITY,
  LICHEN_SPORE_COUNT, LICHEN_RIPPLE_SPRING_K, LICHEN_RIPPLE_DAMPING,
  LICHEN_MONOLITH_TILT, LICHEN_SPORE_DRIFT, LICHEN_SPORE_SIZE,
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
  LICHEN_WIRE_ENABLED, LICHEN_WIRE_R, LICHEN_WIRE_G, LICHEN_WIRE_B, LICHEN_WIRE_A, LICHEN_WIRE_WIDTH,
  LICHEN_CA_ENABLED, LICHEN_CA_INTENSITY, LICHEN_CA_FREQ,
  LICHEN_CA_COL1_R, LICHEN_CA_COL1_G, LICHEN_CA_COL1_B,
  LICHEN_CA_COL2_R, LICHEN_CA_COL2_G, LICHEN_CA_COL2_B,
  JELLY_ENABLED, JELLY_ROUNDNESS, JELLY_PROPEL_STR, JELLY_PROPEL_ATTACK, JELLY_PROPEL_DECAY, JELLY_PROPEL_CURVE,
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
  ORAL_TINT_SHIFT_TARGET_R, ORAL_TINT_SHIFT_TARGET_G, ORAL_TINT_SHIFT_TARGET_B,
  ORAL_TINT_SHIFT_ATTACK, ORAL_TINT_SHIFT_DECAY, ORAL_TINT_SHIFT_CURVE,
  ORAL_TWIST_STR, ORAL_TWIST_FREQ, ORAL_TWIST_RAND,
  PERF_MAX_FPS, PERF_LIVE_FPS, LICHEN_FOLIAGE_ENABLED,
  LICHEN_BG_GRAD_ENABLED, LICHEN_BG_GRAD_SPEED, LICHEN_BG_GRAD_SAT, LICHEN_BG_GRAD_VAL,
  LICHEN_BG_SHIFT_ENABLED, LICHEN_BG_SHIFT_HZ, LICHEN_BG_SHIFT_RANGE_HZ, LICHEN_BG_SHIFT_TARGET_R, LICHEN_BG_SHIFT_TARGET_G, LICHEN_BG_SHIFT_TARGET_B,
  LICHEN_BG_SHIFT_ATTACK, LICHEN_BG_SHIFT_DECAY, LICHEN_BG_SHIFT_CURVE,
  LICHEN_BG_SHIFT_APPLY_DS_TOP, LICHEN_BG_SHIFT_APPLY_DS_BOT,
  JELLY_TINT_SHIFT_ENABLED, JELLY_TINT_SHIFT_HZ, JELLY_TINT_SHIFT_RANGE_HZ, JELLY_TINT_SHIFT_TARGET_R, JELLY_TINT_SHIFT_TARGET_G, JELLY_TINT_SHIFT_TARGET_B,
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
  ORAL_TINT_SHIFT_OCTAVES, ORAL_TINT_SHIFT_TRIGGER_DURATION, ORAL_TINT_SHIFT_WINDOW,
  JELLY_TINT_SHIFT_OCTAVES, JELLY_TINT_SHIFT_TRIGGER_DURATION, JELLY_TINT_SHIFT_WINDOW,
  CAM_AZIMUTH_OFFSET, CAM_ELEVATION_OFFSET, CAM_RADIUS_OFFSET,
  CAM_PAN_X, CAM_PAN_Y, CAM_PAN_Z,
} from '@stores/lichen';
import { MONOLITH_VERT, MONOLITH_FRAG, WIRE_FRAG, LICHEN_VERT, LICHEN_FRAG, SPORE_VERT, SPORE_FRAG } from '@renderer/lichenShaders';
import { MEMBRANE_VERT, MEMBRANE_FRAG } from '@renderer/membraneShader';
import { buildMonolithGeometry, type MonolithGeometry } from '@renderer/lichenGeometry';
import { buildJellyGeometry } from '@renderer/jellyGeometry';
import { buildTentacleGeometry, TENTACLE_VERT, TENTACLE_FRAG, type TentacleGeometry } from '@renderer/jellyTentacles';
import { PHYS_TENT_VERT, PHYS_TENT_FRAG } from '@renderer/physicsTentacleShader';
import { ORAL_VERT, ORAL_FRAG } from '@renderer/oralArmShader';
import { DS_BG_VERT, DS_BG_FRAG, DS_PART_VERT, DS_PART_FRAG } from '@renderer/deepSeaShader';
import { DeepSeaSystem } from '@renderer/DeepSeaSystem';
import { PhysicsChain } from '@renderer/PhysicsChain';
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
import { BLOOM_VERT, BLOOM_THRESHOLD_FRAG, BLOOM_BLUR_FRAG, BLOOM_COMPOSITE_FRAG } from '@renderer/bloomShader';
import { MB_ENABLED, MB_STRENGTH, MB_SOFTNESS, MB_TRIGGER_BOOST, MB_TRIGGER_DECAY, MB_REVERSE_BOOST, MB_TRIG_HZ, MB_TRIG_RANGE_HZ } from '@stores/motionblur';
import { MB_ACCUM_FRAG, MB_BLIT_FRAG } from '@renderer/motionBlurShader';
import {
  type FoliageNode, spawnRunner, spawnLeaf, spawnBloom, boostNode,
  updateFoliage, buildInstanceBuffer, INSTANCE_STRIDE, GPU_MAX_NODES,
  NODE_RUNNER, NODE_LEAF, NODE_BLOOM,
} from '@renderer/foliageSystem';
import {
  emitSpores, updateSpores, packGpuBuffer, reset as resetSpores,
  activeCount as getActiveCount, MAX_SPORES, GPU_STRIDE,
} from '@renderer/lichenParticles';

// ─── Constants ────────────────────────────────────────────────────────────────

const NYQUIST         = 22050;
const NUM_BINS        = 1024;
// GPU_MAX_NODES imported from foliageSystem
const FOV_Y           = 42 * Math.PI / 180;

// ─── Inline matrix math (column-major Float32Array) ──────────────────────────

function mat4Mul(a: Float32Array, b: Float32Array): Float32Array {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k*4+r] * b[c*4+k];
      o[c*4+r] = s;
    }
  return o;
}

function perspective(fovY: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1.0 / Math.tan(fovY * 0.5);
  const nf = 1.0 / (near - far);
  return new Float32Array([
    f/aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far+near)*nf, -1,
    0, 0, 2*far*near*nf, 0,
  ]);
}

type Quat = [number, number, number, number]; // [x, y, z, w]

function quatMul(a: Quat, b: Quat): Quat {
  const [ax, ay, az, aw] = a, [bx, by, bz, bw] = b;
  return [aw*bx+ax*bw+ay*bz-az*by, aw*by-ax*bz+ay*bw+az*bx, aw*bz+ax*by-ay*bx+az*bw, aw*bw-ax*bx-ay*by-az*bz];
}
function quatAxisAngle(ax: number, ay: number, az: number, angle: number): Quat {
  const s = Math.sin(angle * 0.5);
  return [ax*s, ay*s, az*s, Math.cos(angle * 0.5)];
}
function quatRotVec(q: Quat, vx: number, vy: number, vz: number): [number, number, number] {
  const [qx, qy, qz, qw] = q;
  const tx = 2*(qy*vz - qz*vy), ty = 2*(qz*vx - qx*vz), tz = 2*(qx*vy - qy*vx);
  return [vx + qw*tx + qy*tz - qz*ty, vy + qw*ty + qz*tx - qx*tz, vz + qw*tz + qx*ty - qy*tx];
}
function quatNorm(q: Quat): Quat {
  const l = Math.hypot(q[0], q[1], q[2], q[3]);
  return l > 0 ? [q[0]/l, q[1]/l, q[2]/l, q[3]/l] : [0, 0, 0, 1];
}

function lookAt(ex: number, ey: number, ez: number, cx: number, cy: number, cz: number, ux = 0, uy = 1, uz = 0): Float32Array {
  let zx = ex-cx, zy = ey-cy, zz = ez-cz;
  const zl = Math.hypot(zx, zy, zz);
  zx /= zl; zy /= zl; zz /= zl;
  let xx = uy*zz - uz*zy, xy = uz*zx - ux*zz, xz = ux*zy - uy*zx;
  const xl = Math.hypot(xx, xy, xz);
  if (xl > 0) { xx /= xl; xy /= xl; xz /= xl; }
  const yx = zy*xz - zz*xy;
  const yy = zz*xx - zx*xz;
  const yz = zx*xy - zy*xx;
  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx*ex+xy*ey+xz*ez), -(yx*ex+yy*ey+yz*ez), -(zx*ex+zy*ey+zz*ez), 1,
  ]);
}

function makeRotY(rad: number): Float32Array {
  const c = Math.cos(rad), s = Math.sin(rad);
  return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
}

function makeTranslateZ(z: number): Float32Array {
  return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,z,1]);
}

// HSV → RGB for background gradient
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const mod = i % 6;
  if (mod === 0) return [v, t, p];
  if (mod === 1) return [q, v, p];
  if (mod === 2) return [p, v, t];
  if (mod === 3) return [p, q, v];
  if (mod === 4) return [t, p, v];
  return [v, p, q];
}

// ─── Spring ripple ────────────────────────────────────────────────────────────

interface RippleState {
  epicX: number; epicY: number; epicZ: number;
  amplitude: number; velocity: number; age: number;
}

// ─── LichenRenderer ──────────────────────────────────────────────────────────

export class LichenRenderer {
  private _canvas: HTMLCanvasElement;
  private _gl!: WebGL2RenderingContext;
  private _rafId: number | null = null;
  private _lastT   = 0;
  private _elapsed = 0;

  // Performance cap / FPS counter
  private _perfMaxFps  = 0;
  private _lastFrameT  = 0;
  private _fpsHistory: number[] = [];
  private _foliageEnabled = false;

  // Audio
  private _freqData     = new Float32Array(NUM_BINS);
  private _bassDetector = new DetectorClass({ targetHz: 90,    rangeHz: 30,  octaves: 1, triggerDuration: 8, name: 'lichen-bass' });
  private _midDetector  = new DetectorClass({ targetHz: 800,   rangeHz: 200, octaves: 2, triggerDuration: 6, name: 'lichen-mid'  });
  private _highDetector      = new DetectorClass({ targetHz: 11000, rangeHz: 500, octaves: 2, triggerDuration: 6, name: 'lichen-high' });
  private _bgShiftDetector       = new DetectorClass({ targetHz: 60,  rangeHz: 20,  octaves: 1, triggerDuration: 8, name: 'bg-shift'       });
  private _oralDetector          = new DetectorClass({ targetHz: 1000, rangeHz: 250, octaves: 1, triggerDuration: 8, name: 'oral-arms'      });
  private _oralShiftDetector     = new DetectorClass({ targetHz: 1000, rangeHz: 250, octaves: 2, triggerDuration: 8, name: 'oral-shift'    });
  private _jellyShiftDetector    = new DetectorClass({ targetHz: 8000, rangeHz: 1000, octaves: 2, triggerDuration: 6, name: 'jelly-shift'    });
  private _membraneShiftDetector = new DetectorClass({ targetHz: 1000, rangeHz: 250, octaves: 2, triggerDuration: 8, name: 'membrane-shift' });
  private _emissiveSmooth = 0;

  // BG color shift envelope
  private _bgShiftEnabled  = false;
  private _bgShiftPhase: 'idle'|'attack'|'decay' = 'idle';
  private _bgShiftEnvT     = 0;
  private _bgShiftAttack   = 100;
  private _bgShiftDecay    = 800;
  private _bgShiftCurve    = 1.0;
  private _bgShiftTargetR  = 1.0;
  private _bgShiftTargetG  = 0.3;
  private _bgShiftTargetB  = 0.0;
  private _bgShiftT        = 0;
  private _bgShiftApplyDsTop = false;
  private _bgShiftApplyDsBot = false;

  // Jelly tint shift envelope
  private _jellyShiftEnabled  = false;
  private _jellyShiftPhase: 'idle'|'attack'|'decay' = 'idle';
  private _jellyShiftEnvT     = 0;
  private _jellyShiftAttack   = 80;
  private _jellyShiftDecay    = 600;
  private _jellyShiftCurve    = 1.0;
  private _jellyShiftTargetR  = 1.0;
  private _jellyShiftTargetG  = 0.0;
  private _jellyShiftTargetB  = 0.5;
  private _jellyShiftT        = 0;

  // Oral arm tint shift envelope
  private _oralShiftEnabled   = false;
  private _oralShiftPhase: 'idle'|'attack'|'decay' = 'idle';
  private _oralShiftEnvT      = 0;
  private _oralShiftAttack    = 60;
  private _oralShiftDecay     = 500;
  private _oralShiftCurve     = 1.0;
  private _oralShiftTargetR   = 1.0;
  private _oralShiftTargetG   = 1.0;
  private _oralShiftTargetB   = 1.0;
  private _oralShiftT         = 0;

  // Oral arm DNA twist
  private _oralTwistStr  = 0.0;
  private _oralTwistFreq = 2.0;
  private _oralTwistRand = 0.5;

  // ─── Deep Sea system ───────────────────────────────────────────────────────
  private _dsBgEnabled   = true;
  private _dsBgTopR = 0.005; private _dsBgTopG = 0.022; private _dsBgTopB = 0.055;
  private _dsBgBotR = 0.0;   private _dsBgBotG = 0.002; private _dsBgBotB = 0.018;
  private _dsBgVignette  = 0.55;
  private _dsBgHorizonY  = 0.55;
  private _dsPartEnabled = true;
  private _dsTrigEnabled = true;
  private _dsTrigHz      = 60;

  private _ds = new DeepSeaSystem();

  // ─── DS Swim Current ────────────────────────────────────────────────────────
  // ─── Bloom ──────────────────────────────────────────────────────────────────
  private _bloomEnabled    = false;
  private _bloomThreshold  = 0.45;
  private _bloomStrength   = 0.80;
  private _bloomRadius     = 2.0;
  private _bloomPasses     = 2;
  private _bloomW          = 0;
  private _bloomH          = 0;
  private _bloomSceneFBO:   WebGLFramebuffer  | null = null;
  private _bloomSceneTex:   WebGLTexture      | null = null;
  private _bloomDepthRBO:   WebGLRenderbuffer | null = null;
  private _bloomBrightFBO:  WebGLFramebuffer  | null = null;
  private _bloomBrightTex:  WebGLTexture      | null = null;
  private _bloomPingFBO:    WebGLFramebuffer  | null = null;
  private _bloomPingTex:    WebGLTexture      | null = null;
  private _bloomPongFBO:    WebGLFramebuffer  | null = null;
  private _bloomPongTex:    WebGLTexture      | null = null;
  private _bloomThreshProg: WebGLProgram      | null = null;
  private _bloomBlurProg:   WebGLProgram      | null = null;
  private _bloomCompProg:   WebGLProgram      | null = null;

  // Cached uniform locations for bloom programs (populated after shader compile)
  private _bloomUnif_thresh_uScene:     WebGLUniformLocation | null = null;
  private _bloomUnif_thresh_uThreshold: WebGLUniformLocation | null = null;
  private _bloomUnif_blur_uTex:         WebGLUniformLocation | null = null;
  private _bloomUnif_blur_uTexelDir:    WebGLUniformLocation | null = null;
  private _bloomUnif_comp_uScene:       WebGLUniformLocation | null = null;
  private _bloomUnif_comp_uBloom:       WebGLUniformLocation | null = null;
  private _bloomUnif_comp_uStrength:    WebGLUniformLocation | null = null;

  // ─── Motion Blur ─────────────────────────────────────────────────────────────
  private _mbEnabled       = true;
  private _mbStrength      = 0.75;
  private _mbSoftness      = 0.0;
  private _mbTriggerBoost  = 0.4;
  private _mbTriggerDecay  = 350;
  private _mbReverseBoost  = false;
  private _mbTrigEnv       = 0.0;   // runtime: trigger envelope (0-1)
  private _mbAccumInit     = false; // runtime: false until accum seeded
  private _mbTrigDetector  = new DetectorClass({ targetHz: 90, rangeHz: 30, octaves: 1, triggerDuration: 8, name: 'mb-trig' });

  private _mbSceneFBO:  WebGLFramebuffer  | null = null;
  private _mbSceneTex:  WebGLTexture      | null = null;
  private _mbDepthRBO:  WebGLRenderbuffer | null = null;
  private _mbAccumFBO:  WebGLFramebuffer  | null = null;
  private _mbAccumTex:  WebGLTexture      | null = null;
  private _mbPingFBO:   WebGLFramebuffer  | null = null;
  private _mbPingTex:   WebGLTexture      | null = null;
  private _mbW = 0;
  private _mbH = 0;
  private _mbAccumProg: WebGLProgram | null = null;
  private _mbBlitProg:  WebGLProgram | null = null;
  private _mbBlurProg:  WebGLProgram | null = null;

  // Cached uniform locations for motion-blur programs (populated after shader compile)
  private _mbUnif_blit_uTex:        WebGLUniformLocation | null = null;
  private _mbUnif_accum_uAccum:     WebGLUniformLocation | null = null;
  private _mbUnif_accum_uScene:     WebGLUniformLocation | null = null;
  private _mbUnif_accum_uBlend:     WebGLUniformLocation | null = null;
  private _mbUnif_blur_uTex:        WebGLUniformLocation | null = null;
  private _mbUnif_blur_uTexelDir:   WebGLUniformLocation | null = null;

  private _dsSwimEnabled  = false;
  private _dsSwimImpulse  = 0.000050;
  private _dsSwimAttack   = 50;
  private _dsSwimDecay    = 300;
  private _dsSwimCurve    = 1.2;
  private _dsSwimDrag     = 0.002;
  private _dsSwimMaxVel   = 0.005;
  private _dsSwimPhase: 'idle'|'attack'|'decay' = 'idle';
  private _dsSwimEnvT     = 0;
  private _dsSwimVel      = 0;   // current swim speed (world units / ms)

  private _dsTrigDetector = new DetectorClass({ targetHz: 60, rangeHz: 20, octaves: 1, triggerDuration: 8, name: 'deepsea' });

  private _dsBgProg  = 0 as unknown as WebGLProgram;
  private _dsBgVAO   = 0 as unknown as WebGLVertexArrayObject;
  private _dsBgVBO   = 0 as unknown as WebGLBuffer;
  private _dsPartProg = 0 as unknown as WebGLProgram;
  private _dsPartVAO  = 0 as unknown as WebGLVertexArrayObject;
  private _dsPartVBO  = 0 as unknown as WebGLBuffer;

  // Inner membrane appearance
  private _memEnabled    = false;
  private _memScale      = 0.70;
  private _memOpacity    = 0.45;
  private _memFrontOp    = 0.25;
  private _memTintR      = 0.20;
  private _memTintG      = 0.60;
  private _memTintB      = 1.00;
  private _memIrid       = 0.70;
  private _memFresnel    = 1.20;
  private _memSpecular   = 0.80;
  private _memEmission   = 0.25;
  private _memPulseStr   = 0.50;

  // Membrane color shift envelope
  private _memShiftEnabled  = false;
  private _memShiftPhase: 'idle'|'attack'|'decay' = 'idle';
  private _memShiftEnvT     = 0;
  private _memShiftAttack   = 60;
  private _memShiftDecay    = 500;
  private _memShiftCurve    = 1.0;
  private _memShiftTargetR  = 0.9;
  private _memShiftTargetG  = 0.1;
  private _memShiftTargetB  = 0.8;
  private _memShiftT        = 0;

  // Scene state
  private _nodes: FoliageNode[] = [];
  private _idleSporeT  = 0;
  private _idleRippleT = 0;

  // Store snapshots — behaviour
  private _decayRate     = 0.00008;
  private _maxPatches    = 24;
  private _glowIntensity = 1.0;
  private _sporeCount    = 180;
  private _springK       = 18.0;
  private _damping       = 3.2;
  private _tilt          = 8;
  private _sporeDrift    = 1.0;
  private _sporeSize     = 1.0;

  // Store snapshots — glass
  private _glassOpacity      = 0.70;
  private _glassFrontOpacity = 0.28;
  private _glassFresnel      = 1.0;
  private _glassSpecular     = 1.0;
  private _glassIrid         = 0.12;
  private _glassTintR        = 0.20;
  private _glassTintG        = 0.55;
  private _glassTintB        = 0.85;
  private _lightX            = 0.6;
  private _lightY            = 1.0;

  // Store snapshots — colors
  private _warmR = 0.85; private _warmG = 0.55; private _warmB = 0.08;
  private _coolR = 0.12; private _coolG = 0.88; private _coolB = 0.75;
  private _bgR   = 0.01; private _bgG   = 0.01; private _bgB   = 0.04;

  // Store snapshots — monolith dimensions (half-extents)
  private _monolithHalfW = 0.28;
  private _monolithHalfH = 0.70;
  private _monolithHalfD = 0.04;

  // Store snapshots — organic deformation
  private _organicStr = 1.0;

  // Store snapshots — wireframe
  private _wireEnabled = false;
  private _wireR = 0.4; private _wireG = 0.8; private _wireB = 1.0; private _wireA = 0.8;
  private _wireWidth = 1.5;

  // Store snapshots — chromatic aberration
  private _caEnabled   = false;
  private _caIntensity = 1.0;
  private _caFreq      = 1.0;
  private _caCol1R = 1.0; private _caCol1G = 0.2; private _caCol1B = 0.1;
  private _caCol2R = 0.1; private _caCol2G = 0.3; private _caCol2B = 1.0;

  private _ripples: RippleState[] = [];

  // Jellyfish mode
  private _jellyEnabled       = false;
  private _jellyRoundness     = 4.0;
  private _jellyPropelStr     = 0.3;
  private _jellyCompressStr   = 0.6;
  private _jellySpringK       = 8.0;
  private _jellySpringDamping = 4.0;
  private _jellyPropelZ       = 0;
  private _propelPhase: 'idle' | 'attack' | 'decay' = 'idle';
  private _propelEnvT         = 0;   // ms elapsed in current phase
  private _propelAttackMs     = 50;
  private _propelDecayMs      = 400;
  private _propelCurve        = 1.0;
  private _jellyCompressT     = 0;
  private _jellyCompressVel   = 0;
  private _jellyGeo!: MonolithGeometry;

  // Tentacles
  private _tentEnabled  = true;
  private _tentCount    = 6;
  private _tentSegs     = 24;
  private _tentRing     = 6;
  private _tentLength   = 1.0;
  private _tentRadius   = 0.018;
  private _tentWaveAmp  = 0.10;
  private _tentWaveFreq = 1.5;
  private _tentWaveSpd  = 1.5;
  private _tentSplay    = 0.8;
  private _tentAttachY  = 0.3;
  private _tentOpacity  = 0.7;
  private _tentIridStr  = 0.8;
  private _tentTintR    = 0.2;
  private _tentTintG    = 0.7;
  private _tentTintB    = 0.9;
  private _tentTintBl   = 0.15;
  private _tentIdleAmp   = 0.04;
  private _tentIdleSpeed = 0.4;
  private _tentRippleResp = 1.0;
  private _tentOffsetX  = 0.0;
  private _tentOffsetY  = 0.0;
  private _tentOffsetZ  = 0.0;

  // Physics tentacle mode
  private _physMode        = false;
  private _physSegs        = 18;
  private _physWidth       = 0.006;
  private _physHeight      = 0.0;
  // Billboard ribbon VBO data: [x,y,z,segT] per vertex, 2 verts per ring, MAX rings
  private _physRibbonBuf    = new Float32Array(12 * 64 * 2 * 4);

  private _physProg  = 0 as unknown as WebGLProgram;
  private _physVAO   = 0 as unknown as WebGLVertexArrayObject;
  private _physVBO   = 0 as unknown as WebGLBuffer;

  // Oral arms
  private _oralEnabled    = false;
  private _oralCount      = 4;
  private _oralSegs       = 22;
  private _oralWidth      = 0.045;
  private _oralHeight     = 0.0;
  private _oralOpacity    = 0.70;
  private _oralTintR      = 0.35;
  private _oralTintG      = 0.55;
  private _oralTintB      = 0.65;
  private _oralTintBl     = 0.75;
  private _oralIridStr    = 0.45;
  private _oralFrillAmp   = 1.0;
  private _oralFrillFreq  = 3.5;
  private _oralFrillSpeed = 0.7;
  private _oralEdgeTintR  = 0.7;
  private _oralEdgeTintG  = 0.85;
  private _oralEdgeTintB  = 1.0;
  private _oralEdgeBlend  = 0.6;

  // 3 strips × 2 verts/seg × 5 floats/vert
  private _oralRibbonBuf   = new Float32Array(8 * 32 * 3 * 2 * 5);

  // PhysicsChain instances — initialized in _initStores() after store values are read
  private _physChain!: PhysicsChain;
  private _oralChain!: PhysicsChain;

  private _oralProg = 0 as unknown as WebGLProgram;
  private _oralVAO  = 0 as unknown as WebGLVertexArrayObject;
  private _oralVBO  = 0 as unknown as WebGLBuffer;

  // Background gradient
  private _bgGradEnabled = false;
  private _bgGradSpeed   = 30;
  private _bgGradSat     = 0.25;
  private _bgGradVal     = 0.06;
  private _bgGradHue     = 0;     // current hue (0–1, wraps)
  private _bgGradR       = 0.01;
  private _bgGradG       = 0.01;
  private _bgGradB       = 0.04;

  // Orbital camera state (quaternion-based, no gimbal lock)
  private _camQuat: Quat = quatAxisAngle(1, 0, 0, -0.1); // matches original elevation = 0.1 rad
  private _camRadius    = 2.5;
  private _camAzimuthOffset   = 0;
  private _camElevationOffset = 0;
  private _camRadiusOffset    = 0;
  private _camPanX            = 0;
  private _camPanY            = 0;
  private _camPanZ            = 0;
  private _isDragging   = false;
  private _dragLastX    = 0;
  private _dragLastY    = 0;

  private _unsubs: Array<() => void> = [];

  // GL resources
  private _monolithProg  = 0 as unknown as WebGLProgram;
  private _wireProg      = 0 as unknown as WebGLProgram;
  private _lichenProg    = 0 as unknown as WebGLProgram;
  private _sporeProg     = 0 as unknown as WebGLProgram;
  private _membraneProg  = 0 as unknown as WebGLProgram;

  private _monolithVAO   = 0 as unknown as WebGLVertexArrayObject;
  private _monolithVBO   = 0 as unknown as WebGLBuffer;
  private _monolithIBO   = 0 as unknown as WebGLBuffer;

  private _jellyVAO      = 0 as unknown as WebGLVertexArrayObject;
  private _jellyVBO      = 0 as unknown as WebGLBuffer;
  private _jellyIBO      = 0 as unknown as WebGLBuffer;

  private _tentacleProg  = 0 as unknown as WebGLProgram;
  private _tentacleVAO   = 0 as unknown as WebGLVertexArrayObject;
  private _tentacleVBO   = 0 as unknown as WebGLBuffer;
  private _tentacleIBO   = 0 as unknown as WebGLBuffer;
  private _tentacleGeo!: TentacleGeometry;

  private _lichenVAO     = 0 as unknown as WebGLVertexArrayObject;
  private _lichenQuadVBO = 0 as unknown as WebGLBuffer;
  private _lichenInstVBO = 0 as unknown as WebGLBuffer;

  private _sporeVAO      = 0 as unknown as WebGLVertexArrayObject;
  private _sporeVBO      = 0 as unknown as WebGLBuffer;

  private _geo!: MonolithGeometry;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  init(): void {
    registerDetector('bass',       this._bassDetector);
    registerDetector('mid',        this._midDetector);
    registerDetector('high',       this._highDetector);
    registerDetector('bg_shift',   this._bgShiftDetector);
    registerDetector('oral',       this._oralDetector);
    registerDetector('oral_tint',  this._oralShiftDetector);
    registerDetector('jelly_tint', this._jellyShiftDetector);
    registerDetector('membrane',   this._membraneShiftDetector);
    registerDetector('mb_trig',    this._mbTrigDetector);
    registerDetector('ds_trig',    this._dsTrigDetector);
    const gl = this._canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
    if (!gl) { console.error('LichenRenderer: WebGL2 not available'); return; }
    this._gl = gl;

    this._canvas.addEventListener('webglcontextlost',     (e) => { e.preventDefault(); this.stop(); });
    this._canvas.addEventListener('webglcontextrestored', ()  => { this._initGL(); this.start(); });

    this._initStores();
    try { this._initGL(); } catch (e) { console.error('LichenRenderer: _initGL failed:', e); }
    this._initScene();
    this._resize();
    window.addEventListener('resize', this._onResize);
    this._canvas.addEventListener('mousedown',  this._onMouseDown);
    this._canvas.addEventListener('mousemove',  this._onMouseMove);
    window.addEventListener('mouseup',          this._onMouseUp);
    this._canvas.addEventListener('wheel',      this._onWheel, { passive: false });
  }

  start(): void {
    this._lastT = performance.now();
    this._rafId = requestAnimationFrame(t => this._tick(t));
  }

  stop(): void {
    if (this._rafId !== null) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    this._unsubs.forEach(u => u());
    window.removeEventListener('resize', this._onResize);
    this._canvas.removeEventListener('mousedown', this._onMouseDown);
    this._canvas.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup',          this._onMouseUp);
    this._canvas.removeEventListener('wheel',      this._onWheel);
    this._bassDetector.reset();
    this._midDetector.reset();
    this._highDetector.reset();
    this._bgShiftDetector.reset();
    this._jellyShiftDetector.reset();
    this._membraneShiftDetector.reset();
    this._oralDetector.reset();
    this._oralShiftDetector.reset();
    this._dsTrigDetector.reset();
    this._dsSwimPhase = 'idle'; this._dsSwimVel = 0;
    this._bloomW = 0;
    this._mbW = 0; this._mbAccumInit = false;
    resetSpores();
  }

  // ─── Store subscriptions ───────────────────────────────────────────────────

  private _initStores(): void {
    this._decayRate          = get(LICHEN_DECAY_RATE);
    this._maxPatches         = get(LICHEN_MAX_PATCHES);
    this._glowIntensity      = get(LICHEN_GLOW_INTENSITY);
    this._sporeCount         = get(LICHEN_SPORE_COUNT);
    this._springK            = get(LICHEN_RIPPLE_SPRING_K);
    this._damping            = get(LICHEN_RIPPLE_DAMPING);
    this._tilt               = get(LICHEN_MONOLITH_TILT);
    this._sporeDrift         = get(LICHEN_SPORE_DRIFT);
    this._sporeSize          = get(LICHEN_SPORE_SIZE);
    this._glassOpacity       = get(LICHEN_GLASS_OPACITY);
    this._glassFrontOpacity  = get(LICHEN_GLASS_FRONT_OPACITY);
    this._glassFresnel       = get(LICHEN_GLASS_FRESNEL);
    this._glassSpecular      = get(LICHEN_GLASS_SPECULAR);
    this._glassIrid          = get(LICHEN_GLASS_IRIDESCENCE);
    this._glassTintR         = get(LICHEN_GLASS_TINT_R);
    this._glassTintG         = get(LICHEN_GLASS_TINT_G);
    this._glassTintB         = get(LICHEN_GLASS_TINT_B);
    this._lightX             = get(LICHEN_LIGHT_X);
    this._lightY             = get(LICHEN_LIGHT_Y);
    this._warmR = get(LICHEN_WARM_R); this._warmG = get(LICHEN_WARM_G); this._warmB = get(LICHEN_WARM_B);
    this._coolR = get(LICHEN_COOL_R); this._coolG = get(LICHEN_COOL_G); this._coolB = get(LICHEN_COOL_B);
    this._bgR   = get(LICHEN_BG_R);   this._bgG   = get(LICHEN_BG_G);   this._bgB   = get(LICHEN_BG_B);
    this._monolithHalfW = get(LICHEN_MONOLITH_W) / 2;
    this._monolithHalfH = get(LICHEN_MONOLITH_H) / 2;
    this._monolithHalfD = get(LICHEN_MONOLITH_D) / 2;
    this._organicStr    = get(LICHEN_ORGANIC_STR);
    this._wireEnabled   = get(LICHEN_WIRE_ENABLED);
    this._wireR         = get(LICHEN_WIRE_R); this._wireG = get(LICHEN_WIRE_G); this._wireB = get(LICHEN_WIRE_B); this._wireA = get(LICHEN_WIRE_A);
    this._wireWidth     = get(LICHEN_WIRE_WIDTH);
    this._caEnabled     = get(LICHEN_CA_ENABLED);
    this._caIntensity   = get(LICHEN_CA_INTENSITY); this._caFreq = get(LICHEN_CA_FREQ);
    this._caCol1R = get(LICHEN_CA_COL1_R); this._caCol1G = get(LICHEN_CA_COL1_G); this._caCol1B = get(LICHEN_CA_COL1_B);
    this._caCol2R = get(LICHEN_CA_COL2_R); this._caCol2G = get(LICHEN_CA_COL2_G); this._caCol2B = get(LICHEN_CA_COL2_B);
    this._bassDetector.targetHz = get(LICHEN_BASS_HZ);
    (this._bassDetector as any)._rangeHz = get(LICHEN_BASS_RANGE_HZ);
    this._midDetector.targetHz  = get(LICHEN_MID_HZ);
    (this._midDetector as any)._rangeHz  = get(LICHEN_MID_RANGE_HZ);
    this._highDetector.targetHz = get(LICHEN_HIGH_HZ);
    (this._highDetector as any)._rangeHz = get(LICHEN_HIGH_RANGE_HZ);
    this._jellyEnabled       = get(JELLY_ENABLED);
    this._jellyRoundness     = get(JELLY_ROUNDNESS);
    this._jellyPropelStr     = get(JELLY_PROPEL_STR);
    this._propelAttackMs     = get(JELLY_PROPEL_ATTACK);
    this._propelDecayMs      = get(JELLY_PROPEL_DECAY);
    this._propelCurve        = get(JELLY_PROPEL_CURVE);
    this._jellyCompressStr   = get(JELLY_COMPRESS_STR);
    this._jellySpringK       = get(JELLY_SPRING_K);
    this._jellySpringDamping = get(JELLY_SPRING_DAMPING);
    this._tentEnabled  = get(JELLY_TENT_ENABLED);
    this._tentCount    = get(JELLY_TENT_COUNT);
    this._tentSegs     = get(JELLY_TENT_SEGS);
    this._tentRing     = get(JELLY_TENT_RING);
    this._tentLength   = get(JELLY_TENT_LENGTH);
    this._tentRadius   = get(JELLY_TENT_RADIUS);
    this._tentWaveAmp  = get(JELLY_TENT_WAVE_AMP);
    this._tentWaveFreq = get(JELLY_TENT_WAVE_FREQ);
    this._tentWaveSpd  = get(JELLY_TENT_WAVE_SPD);
    this._tentSplay    = get(JELLY_TENT_SPLAY);
    this._tentAttachY  = get(JELLY_TENT_ATTACH_Y);
    this._tentOpacity  = get(JELLY_TENT_OPACITY);
    this._tentIridStr  = get(JELLY_TENT_IRID_STR);
    this._tentTintR    = get(JELLY_TENT_TINT_R);
    this._tentTintG    = get(JELLY_TENT_TINT_G);
    this._tentTintB    = get(JELLY_TENT_TINT_B);
    this._tentTintBl   = get(JELLY_TENT_TINT_BL);
    this._tentIdleAmp   = get(JELLY_TENT_IDLE_AMP);
    this._tentIdleSpeed = get(JELLY_TENT_IDLE_SPEED);
    this._tentRippleResp = get(JELLY_TENT_RIPPLE_RESP);
    this._tentOffsetX  = get(JELLY_TENT_OFFSET_X);
    this._tentOffsetY  = get(JELLY_TENT_OFFSET_Y);
    this._tentOffsetZ  = get(JELLY_TENT_OFFSET_Z);
    this._physMode        = get(JELLY_TENT_PHYS_MODE);
    this._physSegs        = get(JELLY_TENT_PHYS_SEGS);
    this._physWidth       = get(JELLY_TENT_PHYS_WIDTH);
    this._physHeight      = get(JELLY_TENT_PHYS_HEIGHT);
    this._physChain = new PhysicsChain({
      count:         this._tentCount,
      segCount:      this._physSegs,
      segLen:        get(JELLY_TENT_PHYS_SEGLEN),
      gravity:       get(JELLY_TENT_PHYS_GRAVITY),
      gravityAz:     get(JELLY_TENT_PHYS_GRAVITY_AZ),
      gravityEl:     get(JELLY_TENT_PHYS_GRAVITY_EL),
      damping:       get(JELLY_TENT_PHYS_DAMPING),
      jitter:        get(JELLY_TENT_PHYS_JITTER),
      whipStr:       get(JELLY_TENT_PHYS_WHIP),
      spreadBoost:   get(JELLY_TENT_PHYS_SPREAD_BOOST),
      spreadDecay:   get(JELLY_TENT_PHYS_SPREAD_DECAY),
      attachY:       this._tentAttachY,
      offsetX:       this._tentOffsetX,
      offsetY:       this._tentOffsetY,
      offsetZ:       this._tentOffsetZ,
      ringSpread:    get(JELLY_TENT_RING_SPREAD),
      halfStepAngle: false,
    });
    this._oralEnabled     = get(ORAL_ENABLED);
    this._oralCount       = get(ORAL_COUNT);
    this._oralSegs        = get(ORAL_SEGS);
    this._oralWidth       = get(ORAL_WIDTH);
    this._oralHeight      = get(ORAL_HEIGHT);
    this._oralChain = new PhysicsChain({
      count:         this._oralCount,
      segCount:      this._oralSegs,
      segLen:        get(ORAL_SEGLEN),
      gravity:       get(ORAL_GRAVITY),
      gravityAz:     get(ORAL_GRAVITY_AZ),
      gravityEl:     get(ORAL_GRAVITY_EL),
      damping:       get(ORAL_DAMPING),
      jitter:        get(ORAL_JITTER),
      whipStr:       get(ORAL_WHIP),
      spreadBoost:   get(ORAL_SPREAD_BOOST),
      spreadDecay:   get(ORAL_SPREAD_DECAY),
      attachY:       get(ORAL_ATTACH_Y),
      offsetX:       this._tentOffsetX,
      offsetY:       this._tentOffsetY,
      offsetZ:       this._tentOffsetZ,
      ringSpread:    0,
      halfStepAngle: true,
    });
    this._oralDetector.targetHz = get(ORAL_BEAT_HZ);
    (this._oralDetector as any)._rangeHz = get(ORAL_BEAT_RANGE_HZ);
    this._oralOpacity     = get(ORAL_OPACITY);
    this._oralTintR       = get(ORAL_TINT_R);
    this._oralTintG       = get(ORAL_TINT_G);
    this._oralTintB       = get(ORAL_TINT_B);
    this._oralTintBl      = get(ORAL_TINT_BL);
    this._oralIridStr     = get(ORAL_IRID_STR);
    this._oralFrillAmp    = get(ORAL_FRILL_AMP);
    this._oralFrillFreq   = get(ORAL_FRILL_FREQ);
    this._oralFrillSpeed  = get(ORAL_FRILL_SPEED);
    this._oralEdgeTintR   = get(ORAL_EDGE_TINT_R);
    this._oralEdgeTintG   = get(ORAL_EDGE_TINT_G);
    this._oralEdgeTintB   = get(ORAL_EDGE_TINT_B);
    this._oralEdgeBlend   = get(ORAL_EDGE_BLEND);
    this._oralShiftEnabled  = get(ORAL_TINT_SHIFT_ENABLED);
    this._oralShiftDetector.targetHz = get(ORAL_TINT_SHIFT_HZ);
    (this._oralShiftDetector as any)._rangeHz = get(ORAL_TINT_SHIFT_RANGE_HZ);
    this._oralShiftTargetR  = get(ORAL_TINT_SHIFT_TARGET_R);
    this._oralShiftTargetG  = get(ORAL_TINT_SHIFT_TARGET_G);
    this._oralShiftTargetB  = get(ORAL_TINT_SHIFT_TARGET_B);
    this._oralShiftAttack   = get(ORAL_TINT_SHIFT_ATTACK);
    this._oralShiftDecay    = get(ORAL_TINT_SHIFT_DECAY);
    this._oralShiftCurve    = get(ORAL_TINT_SHIFT_CURVE);
    this._oralTwistStr  = get(ORAL_TWIST_STR);
    this._oralTwistFreq = get(ORAL_TWIST_FREQ);
    this._oralTwistRand = get(ORAL_TWIST_RAND);
    this._dsBgEnabled   = get(DS_BG_ENABLED);
    this._dsBgTopR = get(DS_BG_TOP_R); this._dsBgTopG = get(DS_BG_TOP_G); this._dsBgTopB = get(DS_BG_TOP_B);
    this._dsBgBotR = get(DS_BG_BOT_R); this._dsBgBotG = get(DS_BG_BOT_G); this._dsBgBotB = get(DS_BG_BOT_B);
    this._dsBgVignette  = get(DS_BG_VIGNETTE);
    this._dsBgHorizonY  = get(DS_BG_HORIZON_Y);
    this._dsPartEnabled = get(DS_PART_ENABLED);
    this._dsTrigEnabled = get(DS_TRIG_ENABLED);
    this._dsTrigDetector.targetHz = get(DS_TRIG_HZ);
    (this._dsTrigDetector as any)._rangeHz = get(DS_TRIG_RANGE_HZ);
    this._ds.partCount    = get(DS_PART_COUNT);
    this._ds.partSize     = get(DS_PART_SIZE);
    this._ds.partSpeed    = get(DS_PART_SPEED);
    this._ds.partBuoy     = get(DS_PART_BUOY);
    this._ds.fogDensity   = get(DS_FOG_DENSITY);
    this._ds.brightness   = get(DS_BRIGHTNESS);
    this._ds.ambientGlow  = get(DS_AMBIENT_GLOW);
    this._ds.flickerSpeed = get(DS_FLICKER_SPEED);
    this._ds.colAR = get(DS_COL_A_R); this._ds.colAG = get(DS_COL_A_G); this._ds.colAB = get(DS_COL_A_B);
    this._ds.colBR = get(DS_COL_B_R); this._ds.colBG = get(DS_COL_B_G); this._ds.colBB = get(DS_COL_B_B);
    this._ds.colBlend    = get(DS_COL_BLEND);
    this._ds.burstCount  = get(DS_BURST_COUNT);
    this._ds.burstSize   = get(DS_BURST_SIZE);
    this._ds.burstBright = get(DS_BURST_BRIGHT);
    this._ds.burstLife   = get(DS_BURST_LIFE);
    this._ds.burstSpread = get(DS_BURST_SPREAD);
    this._dsSwimEnabled  = get(DS_SWIM_ENABLED);
    this._dsSwimImpulse  = get(DS_SWIM_IMPULSE);
    this._dsSwimAttack   = get(DS_SWIM_ATTACK);
    this._dsSwimDecay    = get(DS_SWIM_DECAY);
    this._dsSwimCurve    = get(DS_SWIM_CURVE);
    this._dsSwimDrag     = get(DS_SWIM_DRAG);
    this._dsSwimMaxVel   = get(DS_SWIM_MAX_VEL);
    this._ds.swimAz      = get(DS_SWIM_AZ);
    this._ds.swimEl      = get(DS_SWIM_EL);
    this._bloomEnabled   = get(BLOOM_ENABLED);
    this._bloomThreshold = get(BLOOM_THRESHOLD);
    this._bloomStrength  = get(BLOOM_STRENGTH);
    this._bloomRadius    = get(BLOOM_RADIUS);
    this._bloomPasses    = get(BLOOM_PASSES);
    this._mbEnabled      = get(MB_ENABLED);
    this._mbStrength     = get(MB_STRENGTH);
    this._mbSoftness     = get(MB_SOFTNESS);
    this._mbTriggerBoost = get(MB_TRIGGER_BOOST);
    this._mbTriggerDecay = get(MB_TRIGGER_DECAY);
    this._mbTrigDetector.targetHz = get(MB_TRIG_HZ);
    (this._mbTrigDetector as any)._rangeHz = get(MB_TRIG_RANGE_HZ);
    this._bgGradEnabled = get(LICHEN_BG_GRAD_ENABLED);
    this._bgGradSpeed   = get(LICHEN_BG_GRAD_SPEED);
    this._bgGradSat     = get(LICHEN_BG_GRAD_SAT);
    this._bgGradVal     = get(LICHEN_BG_GRAD_VAL);
    this._bgShiftEnabled  = get(LICHEN_BG_SHIFT_ENABLED);
    this._bgShiftDetector.targetHz = get(LICHEN_BG_SHIFT_HZ);
    (this._bgShiftDetector as any)._rangeHz = get(LICHEN_BG_SHIFT_RANGE_HZ);
    this._bgShiftTargetR  = get(LICHEN_BG_SHIFT_TARGET_R);
    this._bgShiftTargetG  = get(LICHEN_BG_SHIFT_TARGET_G);
    this._bgShiftTargetB  = get(LICHEN_BG_SHIFT_TARGET_B);
    this._bgShiftAttack      = get(LICHEN_BG_SHIFT_ATTACK);
    this._bgShiftDecay       = get(LICHEN_BG_SHIFT_DECAY);
    this._bgShiftCurve       = get(LICHEN_BG_SHIFT_CURVE);
    this._bgShiftApplyDsTop  = get(LICHEN_BG_SHIFT_APPLY_DS_TOP);
    this._bgShiftApplyDsBot  = get(LICHEN_BG_SHIFT_APPLY_DS_BOT);
    this._jellyShiftEnabled  = get(JELLY_TINT_SHIFT_ENABLED);
    this._jellyShiftDetector.targetHz = get(JELLY_TINT_SHIFT_HZ);
    (this._jellyShiftDetector as any)._rangeHz = get(JELLY_TINT_SHIFT_RANGE_HZ);
    this._jellyShiftTargetR  = get(JELLY_TINT_SHIFT_TARGET_R);
    this._jellyShiftTargetG  = get(JELLY_TINT_SHIFT_TARGET_G);
    this._jellyShiftTargetB  = get(JELLY_TINT_SHIFT_TARGET_B);
    this._jellyShiftAttack   = get(JELLY_TINT_SHIFT_ATTACK);
    this._jellyShiftDecay    = get(JELLY_TINT_SHIFT_DECAY);
    this._jellyShiftCurve    = get(JELLY_TINT_SHIFT_CURVE);
    this._memEnabled    = get(JELLY_MEMBRANE_ENABLED);
    this._memScale      = get(JELLY_MEMBRANE_SCALE);
    this._memOpacity    = get(JELLY_MEMBRANE_OPACITY);
    this._memFrontOp    = get(JELLY_MEMBRANE_FRONT_OP);
    this._memTintR      = get(JELLY_MEMBRANE_TINT_R);
    this._memTintG      = get(JELLY_MEMBRANE_TINT_G);
    this._memTintB      = get(JELLY_MEMBRANE_TINT_B);
    this._memIrid       = get(JELLY_MEMBRANE_IRID);
    this._memFresnel    = get(JELLY_MEMBRANE_FRESNEL);
    this._memSpecular   = get(JELLY_MEMBRANE_SPECULAR);
    this._memEmission   = get(JELLY_MEMBRANE_EMISSION);
    this._memPulseStr   = get(JELLY_MEMBRANE_PULSE_STR);
    this._memShiftEnabled  = get(JELLY_MEMBRANE_SHIFT_ENABLED);
    this._membraneShiftDetector.targetHz = get(JELLY_MEMBRANE_SHIFT_HZ);
    (this._membraneShiftDetector as any)._rangeHz = get(JELLY_MEMBRANE_SHIFT_RANGE_HZ);
    this._memShiftTargetR  = get(JELLY_MEMBRANE_SHIFT_TARGET_R);
    this._memShiftTargetG  = get(JELLY_MEMBRANE_SHIFT_TARGET_G);
    this._memShiftTargetB  = get(JELLY_MEMBRANE_SHIFT_TARGET_B);
    this._memShiftAttack   = get(JELLY_MEMBRANE_SHIFT_ATTACK);
    this._memShiftDecay    = get(JELLY_MEMBRANE_SHIFT_DECAY);
    this._memShiftCurve    = get(JELLY_MEMBRANE_SHIFT_CURVE);

    this._perfMaxFps     = get(PERF_MAX_FPS);
    this._foliageEnabled = get(LICHEN_FOLIAGE_ENABLED);

    this._unsubs = [];
    this._subscribeLichenStores();
    this._subscribeJellyStores();
    this._subscribePhysicsStores();
    this._subscribeDeepSeaStores();
    this._subscribePostFxStores();
    this._subscribeBeatStores();
  }

  private _subscribeLichenStores(): void {
    this._unsubs.push(
      LICHEN_DECAY_RATE.subscribe(v          => { this._decayRate         = v; }),
      LICHEN_MAX_PATCHES.subscribe(v         => { this._maxPatches        = v; }),
      LICHEN_GLOW_INTENSITY.subscribe(v      => { this._glowIntensity     = v; }),
      LICHEN_SPORE_COUNT.subscribe(v         => { this._sporeCount        = v; }),
      LICHEN_RIPPLE_SPRING_K.subscribe(v     => { this._springK           = v; }),
      LICHEN_RIPPLE_DAMPING.subscribe(v      => { this._damping           = v; }),
      LICHEN_MONOLITH_TILT.subscribe(v       => { this._tilt              = v; }),
      CAM_AZIMUTH_OFFSET.subscribe(v   => { this._camAzimuthOffset   = v; }),
      CAM_ELEVATION_OFFSET.subscribe(v => { this._camElevationOffset = v; }),
      CAM_RADIUS_OFFSET.subscribe(v    => { this._camRadiusOffset    = v; }),
      CAM_PAN_X.subscribe(v            => { this._camPanX            = v; }),
      CAM_PAN_Y.subscribe(v            => { this._camPanY            = v; }),
      CAM_PAN_Z.subscribe(v            => { this._camPanZ            = v; }),
      LICHEN_SPORE_DRIFT.subscribe(v         => { this._sporeDrift        = v; }),
      LICHEN_SPORE_SIZE.subscribe(v          => { this._sporeSize         = v; }),
      LICHEN_GLASS_OPACITY.subscribe(v       => { this._glassOpacity      = v; }),
      LICHEN_GLASS_FRONT_OPACITY.subscribe(v => { this._glassFrontOpacity = v; }),
      LICHEN_GLASS_FRESNEL.subscribe(v       => { this._glassFresnel      = v; }),
      LICHEN_GLASS_SPECULAR.subscribe(v      => { this._glassSpecular     = v; }),
      LICHEN_GLASS_IRIDESCENCE.subscribe(v   => { this._glassIrid         = v; }),
      LICHEN_GLASS_TINT_R.subscribe(v        => { this._glassTintR        = v; }),
      LICHEN_GLASS_TINT_G.subscribe(v        => { this._glassTintG        = v; }),
      LICHEN_GLASS_TINT_B.subscribe(v        => { this._glassTintB        = v; }),
      LICHEN_LIGHT_X.subscribe(v             => { this._lightX            = v; }),
      LICHEN_LIGHT_Y.subscribe(v             => { this._lightY            = v; }),
      LICHEN_WARM_R.subscribe(v => { this._warmR = v; }), LICHEN_WARM_G.subscribe(v => { this._warmG = v; }), LICHEN_WARM_B.subscribe(v => { this._warmB = v; }),
      LICHEN_COOL_R.subscribe(v => { this._coolR = v; }), LICHEN_COOL_G.subscribe(v => { this._coolG = v; }), LICHEN_COOL_B.subscribe(v => { this._coolB = v; }),
      LICHEN_BG_R.subscribe(v   => { this._bgR   = v; }), LICHEN_BG_G.subscribe(v   => { this._bgG   = v; }), LICHEN_BG_B.subscribe(v   => { this._bgB   = v; }),
      LICHEN_MONOLITH_W.subscribe(v => { this._monolithHalfW = v / 2; this._rebuildGeometry(); }),
      LICHEN_MONOLITH_H.subscribe(v => { this._monolithHalfH = v / 2; this._rebuildGeometry(); }),
      LICHEN_MONOLITH_D.subscribe(v => { this._monolithHalfD = v / 2; this._rebuildGeometry(); }),
      LICHEN_ORGANIC_STR.subscribe(v => { this._organicStr = v; }),
      LICHEN_WIRE_ENABLED.subscribe(v => { this._wireEnabled = v; }),
      LICHEN_WIRE_R.subscribe(v => { this._wireR = v; }), LICHEN_WIRE_G.subscribe(v => { this._wireG = v; }), LICHEN_WIRE_B.subscribe(v => { this._wireB = v; }),
      LICHEN_WIRE_A.subscribe(v => { this._wireA = v; }),
      LICHEN_WIRE_WIDTH.subscribe(v => { this._wireWidth = v; }),
      LICHEN_CA_ENABLED.subscribe(v   => { this._caEnabled   = v; }),
      LICHEN_CA_INTENSITY.subscribe(v => { this._caIntensity = v; }),
      LICHEN_CA_FREQ.subscribe(v      => { this._caFreq      = v; }),
      LICHEN_CA_COL1_R.subscribe(v => { this._caCol1R = v; }), LICHEN_CA_COL1_G.subscribe(v => { this._caCol1G = v; }), LICHEN_CA_COL1_B.subscribe(v => { this._caCol1B = v; }),
      LICHEN_CA_COL2_R.subscribe(v => { this._caCol2R = v; }), LICHEN_CA_COL2_G.subscribe(v => { this._caCol2G = v; }), LICHEN_CA_COL2_B.subscribe(v => { this._caCol2B = v; }),
      LICHEN_BASS_HZ.subscribe(v               => { this._bassDetector.targetHz       = v; this._bassDetector.reset(); }),
      LICHEN_BASS_RANGE_HZ.subscribe(v         => { (this._bassDetector as any)._rangeHz = v; this._bassDetector.reset(); }),
      LICHEN_BASS_OCTAVES.subscribe(v          => { this._bassDetector.octaves          = v; }),
      LICHEN_BASS_TRIGGER_DURATION.subscribe(v => { this._bassDetector.triggerDuration  = v; }),
      LICHEN_BASS_WINDOW.subscribe(v           => { this._bassDetector.windowSize       = v; }),
      LICHEN_MID_HZ.subscribe(v                => { this._midDetector.targetHz          = v; this._midDetector.reset();  }),
      LICHEN_MID_RANGE_HZ.subscribe(v          => { (this._midDetector as any)._rangeHz  = v; this._midDetector.reset();  }),
      LICHEN_MID_OCTAVES.subscribe(v           => { this._midDetector.octaves           = v; }),
      LICHEN_MID_TRIGGER_DURATION.subscribe(v  => { this._midDetector.triggerDuration   = v; }),
      LICHEN_MID_WINDOW.subscribe(v            => { this._midDetector.windowSize        = v; }),
      LICHEN_HIGH_HZ.subscribe(v               => { this._highDetector.targetHz         = v; this._highDetector.reset(); }),
      LICHEN_HIGH_RANGE_HZ.subscribe(v         => { (this._highDetector as any)._rangeHz = v; this._highDetector.reset(); }),
      LICHEN_HIGH_OCTAVES.subscribe(v          => { this._highDetector.octaves          = v; }),
      LICHEN_HIGH_TRIGGER_DURATION.subscribe(v => { this._highDetector.triggerDuration  = v; }),
      LICHEN_HIGH_WINDOW.subscribe(v           => { this._highDetector.windowSize       = v; }),
      PERF_MAX_FPS.subscribe(v => { this._perfMaxFps = v; }),
      LICHEN_FOLIAGE_ENABLED.subscribe(v => { this._foliageEnabled = v; }),
    );
  }

  private _subscribeJellyStores(): void {
    this._unsubs.push(
      JELLY_ENABLED.subscribe(v        => { this._jellyEnabled       = v; }),
      JELLY_ROUNDNESS.subscribe(v      => { this._jellyRoundness     = v; this._rebuildJellyGeometry(); }),
      JELLY_PROPEL_STR.subscribe(v    => { this._jellyPropelStr  = v; }),
      JELLY_PROPEL_ATTACK.subscribe(v => { this._propelAttackMs  = v; }),
      JELLY_PROPEL_DECAY.subscribe(v  => { this._propelDecayMs   = v; }),
      JELLY_PROPEL_CURVE.subscribe(v  => { this._propelCurve     = v; }),
      JELLY_COMPRESS_STR.subscribe(v   => { this._jellyCompressStr   = v; }),
      JELLY_SPRING_K.subscribe(v       => { this._jellySpringK       = v; }),
      JELLY_SPRING_DAMPING.subscribe(v => { this._jellySpringDamping = v; }),
      JELLY_TENT_ENABLED.subscribe(v   => { this._tentEnabled  = v; }),
      JELLY_TENT_COUNT.subscribe(v     => { this._tentCount = v; this._rebuildTentacleGeometry(); this._physChain.cfg.count = v; this._physChain.resize(); }),
      JELLY_TENT_SEGS.subscribe(v      => { this._tentSegs     = v; this._rebuildTentacleGeometry(); }),
      JELLY_TENT_RING.subscribe(v      => { this._tentRing     = v; this._rebuildTentacleGeometry(); }),
      JELLY_TENT_LENGTH.subscribe(v    => { this._tentLength   = v; }),
      JELLY_TENT_RADIUS.subscribe(v    => { this._tentRadius   = v; }),
      JELLY_TENT_WAVE_AMP.subscribe(v  => { this._tentWaveAmp  = v; }),
      JELLY_TENT_WAVE_FREQ.subscribe(v => { this._tentWaveFreq = v; }),
      JELLY_TENT_WAVE_SPD.subscribe(v  => { this._tentWaveSpd  = v; }),
      JELLY_TENT_SPLAY.subscribe(v     => { this._tentSplay    = v; }),
      JELLY_TENT_ATTACH_Y.subscribe(v  => { this._tentAttachY  = v; this._physChain.cfg.attachY = v; }),
      JELLY_TENT_OPACITY.subscribe(v   => { this._tentOpacity  = v; }),
      JELLY_TENT_IRID_STR.subscribe(v  => { this._tentIridStr  = v; }),
      JELLY_TENT_TINT_R.subscribe(v    => { this._tentTintR    = v; }),
      JELLY_TENT_TINT_G.subscribe(v    => { this._tentTintG    = v; }),
      JELLY_TENT_TINT_B.subscribe(v    => { this._tentTintB    = v; }),
      JELLY_TENT_TINT_BL.subscribe(v   => { this._tentTintBl   = v; }),
      JELLY_TENT_IDLE_AMP.subscribe(v    => { this._tentIdleAmp    = v; }),
      JELLY_TENT_IDLE_SPEED.subscribe(v  => { this._tentIdleSpeed  = v; }),
      JELLY_TENT_RIPPLE_RESP.subscribe(v => { this._tentRippleResp = v; }),
      JELLY_TENT_OFFSET_X.subscribe(v  => { this._tentOffsetX  = v; this._physChain.cfg.offsetX = v; this._oralChain.cfg.offsetX = v; }),
      JELLY_TENT_OFFSET_Y.subscribe(v  => { this._tentOffsetY  = v; this._physChain.cfg.offsetY = v; this._oralChain.cfg.offsetY = v; }),
      JELLY_TENT_OFFSET_Z.subscribe(v  => { this._tentOffsetZ  = v; this._physChain.cfg.offsetZ = v; this._oralChain.cfg.offsetZ = v; }),
    );
  }

  private _subscribePhysicsStores(): void {
    this._unsubs.push(
      JELLY_TENT_PHYS_MODE.subscribe(v         => { this._physMode = v; this._physChain.ready = false; }),
      JELLY_TENT_PHYS_SEGS.subscribe(v         => { this._physSegs = v; this._physChain.cfg.segCount = v; this._physChain.resize(); }),
      JELLY_TENT_PHYS_SEGLEN.subscribe(v       => { this._physChain.cfg.segLen    = v; }),
      JELLY_TENT_PHYS_GRAVITY.subscribe(v      => { this._physChain.cfg.gravity   = v; }),
      JELLY_TENT_PHYS_DAMPING.subscribe(v      => { this._physChain.cfg.damping   = v; }),
      JELLY_TENT_PHYS_JITTER.subscribe(v       => { this._physChain.cfg.jitter    = v; }),
      JELLY_TENT_PHYS_WIDTH.subscribe(v        => { this._physWidth  = v; }),
      JELLY_TENT_PHYS_HEIGHT.subscribe(v       => { this._physHeight = v; }),
      JELLY_TENT_PHYS_WHIP.subscribe(v         => { this._physChain.cfg.whipStr    = v; }),
      JELLY_TENT_PHYS_SPREAD_BOOST.subscribe(v => { this._physChain.cfg.spreadBoost = v; }),
      JELLY_TENT_PHYS_SPREAD_DECAY.subscribe(v => { this._physChain.cfg.spreadDecay = v; }),
      JELLY_TENT_PHYS_GRAVITY_AZ.subscribe(v   => { this._physChain.cfg.gravityAz  = v; }),
      JELLY_TENT_PHYS_GRAVITY_EL.subscribe(v   => { this._physChain.cfg.gravityEl  = v; }),
      JELLY_TENT_RING_SPREAD.subscribe(v => { this._physChain.cfg.ringSpread = v; this._physChain.ready = false; this._oralChain.ready = false; }),
      ORAL_ENABLED.subscribe(v     => { this._oralEnabled = v; }),
      ORAL_COUNT.subscribe(v       => { this._oralCount = v; this._oralChain.cfg.count = v; this._oralChain.resize(); this._reallocOralBuffers(); }),
      ORAL_SEGS.subscribe(v        => { this._oralSegs  = v; this._oralChain.cfg.segCount = v; this._oralChain.resize(); this._reallocOralBuffers(); }),
      ORAL_SEGLEN.subscribe(v      => { this._oralChain.cfg.segLen     = v; }),
      ORAL_WIDTH.subscribe(v       => { this._oralWidth  = v; }),
      ORAL_HEIGHT.subscribe(v      => { this._oralHeight = v; }),
      ORAL_GRAVITY.subscribe(v     => { this._oralChain.cfg.gravity    = v; }),
      ORAL_GRAVITY_AZ.subscribe(v  => { this._oralChain.cfg.gravityAz  = v; }),
      ORAL_GRAVITY_EL.subscribe(v  => { this._oralChain.cfg.gravityEl  = v; }),
      ORAL_DAMPING.subscribe(v      => { this._oralChain.cfg.damping   = v; }),
      ORAL_JITTER.subscribe(v       => { this._oralChain.cfg.jitter    = v; }),
      ORAL_WHIP.subscribe(v         => { this._oralChain.cfg.whipStr   = v; }),
      ORAL_ATTACH_Y.subscribe(v     => { this._oralChain.cfg.attachY   = v; this._oralChain.ready = false; }),
      ORAL_SPREAD_BOOST.subscribe(v => { this._oralChain.cfg.spreadBoost = v; }),
      ORAL_SPREAD_DECAY.subscribe(v => { this._oralChain.cfg.spreadDecay = v; }),
      ORAL_BEAT_HZ.subscribe(v            => { this._oralDetector.targetHz = v; this._oralDetector.reset(); }),
      ORAL_BEAT_RANGE_HZ.subscribe(v      => { (this._oralDetector as any)._rangeHz = v; this._oralDetector.reset(); }),
      ORAL_OPACITY.subscribe(v     => { this._oralOpacity    = v; }),
      ORAL_TINT_R.subscribe(v      => { this._oralTintR      = v; }),
      ORAL_TINT_G.subscribe(v      => { this._oralTintG      = v; }),
      ORAL_TINT_B.subscribe(v      => { this._oralTintB      = v; }),
      ORAL_TINT_BL.subscribe(v     => { this._oralTintBl     = v; }),
      ORAL_IRID_STR.subscribe(v    => { this._oralIridStr    = v; }),
      ORAL_FRILL_AMP.subscribe(v   => { this._oralFrillAmp   = v; }),
      ORAL_FRILL_FREQ.subscribe(v  => { this._oralFrillFreq  = v; }),
      ORAL_FRILL_SPEED.subscribe(v => { this._oralFrillSpeed = v; }),
      ORAL_EDGE_TINT_R.subscribe(v => { this._oralEdgeTintR  = v; }),
      ORAL_EDGE_TINT_G.subscribe(v => { this._oralEdgeTintG  = v; }),
      ORAL_EDGE_TINT_B.subscribe(v => { this._oralEdgeTintB  = v; }),
      ORAL_EDGE_BLEND.subscribe(v  => { this._oralEdgeBlend  = v; }),
      ORAL_TWIST_STR.subscribe(v  => { this._oralTwistStr  = v; }),
      ORAL_TWIST_FREQ.subscribe(v => { this._oralTwistFreq = v; }),
      ORAL_TWIST_RAND.subscribe(v => { this._oralTwistRand = v; }),
    );
  }

  private _subscribeDeepSeaStores(): void {
    this._unsubs.push(
      DS_BG_ENABLED.subscribe(v   => { this._dsBgEnabled   = v; }),
      DS_BG_TOP_R.subscribe(v => { this._dsBgTopR = v; }), DS_BG_TOP_G.subscribe(v => { this._dsBgTopG = v; }), DS_BG_TOP_B.subscribe(v => { this._dsBgTopB = v; }),
      DS_BG_BOT_R.subscribe(v => { this._dsBgBotR = v; }), DS_BG_BOT_G.subscribe(v => { this._dsBgBotG = v; }), DS_BG_BOT_B.subscribe(v => { this._dsBgBotB = v; }),
      DS_BG_VIGNETTE.subscribe(v  => { this._dsBgVignette  = v; }),
      DS_BG_HORIZON_Y.subscribe(v => { this._dsBgHorizonY  = v; }),
      DS_PART_ENABLED.subscribe(v => { this._dsPartEnabled = v; }),
      DS_PART_COUNT.subscribe(v   => { this._ds.partCount = v; this._ds['_totalSlots'] = 0; }),
      DS_PART_SIZE.subscribe(v    => { this._ds.partSize     = v; }),
      DS_PART_SPEED.subscribe(v   => { this._ds.partSpeed    = v; }),
      DS_PART_BUOY.subscribe(v    => { this._ds.partBuoy     = v; }),
      DS_FOG_DENSITY.subscribe(v  => { this._ds.fogDensity   = v; }),
      DS_BRIGHTNESS.subscribe(v   => { this._ds.brightness   = v; }),
      DS_AMBIENT_GLOW.subscribe(v => { this._ds.ambientGlow  = v; }),
      DS_FLICKER_SPEED.subscribe(v => { this._ds.flickerSpeed = v; }),
      DS_COL_A_R.subscribe(v => { this._ds.colAR = v; }), DS_COL_A_G.subscribe(v => { this._ds.colAG = v; }), DS_COL_A_B.subscribe(v => { this._ds.colAB = v; }),
      DS_COL_B_R.subscribe(v => { this._ds.colBR = v; }), DS_COL_B_G.subscribe(v => { this._ds.colBG = v; }), DS_COL_B_B.subscribe(v => { this._ds.colBB = v; }),
      DS_COL_BLEND.subscribe(v    => { this._ds.colBlend    = v; }),
      DS_TRIG_ENABLED.subscribe(v => { this._dsTrigEnabled = v; }),
      DS_TRIG_HZ.subscribe(v            => { this._dsTrigDetector.targetHz = v; this._dsTrigDetector.reset(); }),
      DS_TRIG_RANGE_HZ.subscribe(v      => { (this._dsTrigDetector as any)._rangeHz = v; this._dsTrigDetector.reset(); }),
      DS_BURST_COUNT.subscribe(v  => { this._ds.burstCount  = v; }),
      DS_BURST_SIZE.subscribe(v   => { this._ds.burstSize   = v; }),
      DS_BURST_BRIGHT.subscribe(v => { this._ds.burstBright = v; }),
      DS_BURST_LIFE.subscribe(v   => { this._ds.burstLife   = v; }),
      DS_BURST_SPREAD.subscribe(v => { this._ds.burstSpread = v; }),
      DS_SWIM_ENABLED.subscribe(v  => { this._dsSwimEnabled  = v; }),
      DS_SWIM_IMPULSE.subscribe(v  => { this._dsSwimImpulse  = v; }),
      DS_SWIM_ATTACK.subscribe(v   => { this._dsSwimAttack   = v; }),
      DS_SWIM_DECAY.subscribe(v    => { this._dsSwimDecay    = v; }),
      DS_SWIM_CURVE.subscribe(v    => { this._dsSwimCurve    = v; }),
      DS_SWIM_DRAG.subscribe(v     => { this._dsSwimDrag     = v; }),
      DS_SWIM_MAX_VEL.subscribe(v  => { this._dsSwimMaxVel   = v; }),
      DS_SWIM_AZ.subscribe(v       => { this._ds.swimAz      = v; }),
      DS_SWIM_EL.subscribe(v       => { this._ds.swimEl      = v; }),
    );
  }

  private _subscribePostFxStores(): void {
    this._unsubs.push(
      BLOOM_ENABLED.subscribe(v    => { this._bloomEnabled   = v; if (v) this._resizeBloomFBOs(this._bloomW || this._canvas.width, this._bloomH || this._canvas.height); }),
      BLOOM_THRESHOLD.subscribe(v  => { this._bloomThreshold = v; }),
      BLOOM_STRENGTH.subscribe(v   => { this._bloomStrength  = v; }),
      BLOOM_RADIUS.subscribe(v     => { this._bloomRadius    = v; }),
      BLOOM_PASSES.subscribe(v     => { this._bloomPasses    = v; }),
      MB_ENABLED.subscribe(v       => { this._mbEnabled      = v; if (v) this._resizeMBFBOs(this._mbW || this._canvas.width, this._mbH || this._canvas.height); else this._mbAccumInit = false; }),
      MB_STRENGTH.subscribe(v      => { this._mbStrength     = v; }),
      MB_SOFTNESS.subscribe(v      => { this._mbSoftness     = v; }),
      MB_TRIGGER_BOOST.subscribe(v => { this._mbTriggerBoost = v; }),
      MB_TRIGGER_DECAY.subscribe(v => { this._mbTriggerDecay = v; }),
      MB_REVERSE_BOOST.subscribe(v => { this._mbReverseBoost = v; }),
      MB_TRIG_HZ.subscribe(v       => { this._mbTrigDetector.targetHz = v; this._mbTrigDetector.reset(); }),
      MB_TRIG_RANGE_HZ.subscribe(v => { (this._mbTrigDetector as any)._rangeHz = v; this._mbTrigDetector.reset(); }),
    );
  }

  private _subscribeBeatStores(): void {
    this._unsubs.push(
      LICHEN_BG_GRAD_ENABLED.subscribe(v => { this._bgGradEnabled = v; }),
      LICHEN_BG_GRAD_SPEED.subscribe(v   => { this._bgGradSpeed   = v; }),
      LICHEN_BG_GRAD_SAT.subscribe(v     => { this._bgGradSat     = v; }),
      LICHEN_BG_GRAD_VAL.subscribe(v     => { this._bgGradVal     = v; }),
      LICHEN_BG_SHIFT_ENABLED.subscribe(v  => { this._bgShiftEnabled  = v; }),
      LICHEN_BG_SHIFT_HZ.subscribe(v       => { this._bgShiftDetector.targetHz = v; this._bgShiftDetector.reset(); }),
      LICHEN_BG_SHIFT_RANGE_HZ.subscribe(v => { (this._bgShiftDetector as any)._rangeHz = v; this._bgShiftDetector.reset(); }),
      LICHEN_BG_SHIFT_TARGET_R.subscribe(v => { this._bgShiftTargetR  = v; }),
      LICHEN_BG_SHIFT_TARGET_G.subscribe(v => { this._bgShiftTargetG  = v; }),
      LICHEN_BG_SHIFT_TARGET_B.subscribe(v => { this._bgShiftTargetB  = v; }),
      LICHEN_BG_SHIFT_ATTACK.subscribe(v        => { this._bgShiftAttack      = v; }),
      LICHEN_BG_SHIFT_DECAY.subscribe(v         => { this._bgShiftDecay       = v; }),
      LICHEN_BG_SHIFT_CURVE.subscribe(v         => { this._bgShiftCurve       = v; }),
      LICHEN_BG_SHIFT_APPLY_DS_TOP.subscribe(v  => { this._bgShiftApplyDsTop  = v; }),
      LICHEN_BG_SHIFT_APPLY_DS_BOT.subscribe(v  => { this._bgShiftApplyDsBot  = v; }),
      JELLY_TINT_SHIFT_ENABLED.subscribe(v          => { this._jellyShiftEnabled  = v; }),
      JELLY_TINT_SHIFT_HZ.subscribe(v               => { this._jellyShiftDetector.targetHz = v; this._jellyShiftDetector.reset(); }),
      JELLY_TINT_SHIFT_RANGE_HZ.subscribe(v         => { (this._jellyShiftDetector as any)._rangeHz = v; this._jellyShiftDetector.reset(); }),
      JELLY_TINT_SHIFT_OCTAVES.subscribe(v          => { this._jellyShiftDetector.octaves          = v; }),
      JELLY_TINT_SHIFT_TRIGGER_DURATION.subscribe(v => { this._jellyShiftDetector.triggerDuration  = v; }),
      JELLY_TINT_SHIFT_WINDOW.subscribe(v           => { this._jellyShiftDetector.windowSize       = v; }),
      JELLY_TINT_SHIFT_TARGET_R.subscribe(v         => { this._jellyShiftTargetR  = v; }),
      JELLY_TINT_SHIFT_TARGET_G.subscribe(v => { this._jellyShiftTargetG  = v; }),
      JELLY_TINT_SHIFT_TARGET_B.subscribe(v => { this._jellyShiftTargetB  = v; }),
      JELLY_TINT_SHIFT_ATTACK.subscribe(v   => { this._jellyShiftAttack   = v; }),
      JELLY_TINT_SHIFT_DECAY.subscribe(v    => { this._jellyShiftDecay    = v; }),
      JELLY_TINT_SHIFT_CURVE.subscribe(v    => { this._jellyShiftCurve    = v; }),
      ORAL_TINT_SHIFT_ENABLED.subscribe(v          => { this._oralShiftEnabled  = v; }),
      ORAL_TINT_SHIFT_HZ.subscribe(v               => { this._oralShiftDetector.targetHz = v; this._oralShiftDetector.reset(); }),
      ORAL_TINT_SHIFT_RANGE_HZ.subscribe(v         => { (this._oralShiftDetector as any)._rangeHz = v; this._oralShiftDetector.reset(); }),
      ORAL_TINT_SHIFT_OCTAVES.subscribe(v          => { this._oralShiftDetector.octaves          = v; }),
      ORAL_TINT_SHIFT_TRIGGER_DURATION.subscribe(v => { this._oralShiftDetector.triggerDuration  = v; }),
      ORAL_TINT_SHIFT_WINDOW.subscribe(v           => { this._oralShiftDetector.windowSize       = v; }),
      ORAL_TINT_SHIFT_TARGET_R.subscribe(v         => { this._oralShiftTargetR  = v; }),
      ORAL_TINT_SHIFT_TARGET_G.subscribe(v => { this._oralShiftTargetG  = v; }),
      ORAL_TINT_SHIFT_TARGET_B.subscribe(v => { this._oralShiftTargetB  = v; }),
      ORAL_TINT_SHIFT_ATTACK.subscribe(v   => { this._oralShiftAttack   = v; }),
      ORAL_TINT_SHIFT_DECAY.subscribe(v    => { this._oralShiftDecay    = v; }),
      ORAL_TINT_SHIFT_CURVE.subscribe(v    => { this._oralShiftCurve    = v; }),
      JELLY_MEMBRANE_ENABLED.subscribe(v   => { this._memEnabled    = v; }),
      JELLY_MEMBRANE_SCALE.subscribe(v     => { this._memScale      = v; }),
      JELLY_MEMBRANE_OPACITY.subscribe(v   => { this._memOpacity    = v; }),
      JELLY_MEMBRANE_FRONT_OP.subscribe(v  => { this._memFrontOp    = v; }),
      JELLY_MEMBRANE_TINT_R.subscribe(v    => { this._memTintR      = v; }),
      JELLY_MEMBRANE_TINT_G.subscribe(v    => { this._memTintG      = v; }),
      JELLY_MEMBRANE_TINT_B.subscribe(v    => { this._memTintB      = v; }),
      JELLY_MEMBRANE_IRID.subscribe(v      => { this._memIrid       = v; }),
      JELLY_MEMBRANE_FRESNEL.subscribe(v   => { this._memFresnel    = v; }),
      JELLY_MEMBRANE_SPECULAR.subscribe(v  => { this._memSpecular   = v; }),
      JELLY_MEMBRANE_EMISSION.subscribe(v  => { this._memEmission   = v; }),
      JELLY_MEMBRANE_PULSE_STR.subscribe(v => { this._memPulseStr   = v; }),
      JELLY_MEMBRANE_SHIFT_ENABLED.subscribe(v          => { this._memShiftEnabled  = v; }),
      JELLY_MEMBRANE_SHIFT_HZ.subscribe(v               => { this._membraneShiftDetector.targetHz = v; this._membraneShiftDetector.reset(); }),
      JELLY_MEMBRANE_SHIFT_RANGE_HZ.subscribe(v         => { (this._membraneShiftDetector as any)._rangeHz = v; this._membraneShiftDetector.reset(); }),
      JELLY_MEMBRANE_SHIFT_OCTAVES.subscribe(v          => { this._membraneShiftDetector.octaves          = v; }),
      JELLY_MEMBRANE_SHIFT_TRIGGER_DURATION.subscribe(v => { this._membraneShiftDetector.triggerDuration  = v; }),
      JELLY_MEMBRANE_SHIFT_WINDOW.subscribe(v           => { this._membraneShiftDetector.windowSize       = v; }),
      JELLY_MEMBRANE_SHIFT_TARGET_R.subscribe(v         => { this._memShiftTargetR  = v; }),
      JELLY_MEMBRANE_SHIFT_TARGET_G.subscribe(v => { this._memShiftTargetG  = v; }),
      JELLY_MEMBRANE_SHIFT_TARGET_B.subscribe(v => { this._memShiftTargetB  = v; }),
      JELLY_MEMBRANE_SHIFT_ATTACK.subscribe(v   => { this._memShiftAttack   = v; }),
      JELLY_MEMBRANE_SHIFT_DECAY.subscribe(v    => { this._memShiftDecay    = v; }),
      JELLY_MEMBRANE_SHIFT_CURVE.subscribe(v    => { this._memShiftCurve    = v; }),
    );
  }

  // ─── WebGL initialisation ──────────────────────────────────────────────────

  private _initGL(): void {
    const gl = this._gl;

    this._monolithProg = this._buildProgram(MONOLITH_VERT, MONOLITH_FRAG);
    this._wireProg     = this._buildProgram(MONOLITH_VERT, WIRE_FRAG);
    this._lichenProg   = this._buildProgram(LICHEN_VERT,   LICHEN_FRAG);
    this._sporeProg    = this._buildProgram(SPORE_VERT,    SPORE_FRAG);
    try {
      this._tentacleProg = this._buildProgram(TENTACLE_VERT, TENTACLE_FRAG);
    } catch (e) {
      console.warn('LichenRenderer: tentacle shader compile failed, tentacles disabled:', e);
    }

    try {
      this._membraneProg = this._buildProgram(MEMBRANE_VERT, MEMBRANE_FRAG);
    } catch (e) {
      console.warn('LichenRenderer: membrane shader compile failed, membrane disabled:', e);
    }

    try {
      this._physProg = this._buildProgram(PHYS_TENT_VERT, PHYS_TENT_FRAG);
    } catch (e) {
      console.warn('LichenRenderer: physics tentacle shader compile failed:', e);
    }

    // ── Physics tentacle VAO (dynamic ribbon, [x,y,z,segT] × vertex) ──
    this._physVAO = gl.createVertexArray()!;
    this._physVBO = gl.createBuffer()!;
    gl.bindVertexArray(this._physVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._physVBO);
    gl.bufferData(gl.ARRAY_BUFFER, this._physRibbonBuf.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 12);
    gl.bindVertexArray(null);

    // ── Oral arm VAO (dynamic ribbon, [x,y,z,segT,edgeT] × vertex) ──
    try {
      this._oralProg = this._buildProgram(ORAL_VERT, ORAL_FRAG);
    } catch (e) {
      console.warn('LichenRenderer: oral arm shader compile failed:', e);
    }
    this._oralVAO = gl.createVertexArray()!;
    this._oralVBO = gl.createBuffer()!;
    gl.bindVertexArray(this._oralVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._oralVBO);
    gl.bufferData(gl.ARRAY_BUFFER, this._oralRibbonBuf.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 20, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 20, 16);
    gl.bindVertexArray(null);

    // ── Deep Sea background quad ──────────────────────────────────────────────
    try { this._dsBgProg = this._buildProgram(DS_BG_VERT, DS_BG_FRAG); } catch (e) { console.warn('DS bg shader:', e); }
    this._dsBgVAO = gl.createVertexArray()!;
    this._dsBgVBO = gl.createBuffer()!;
    gl.bindVertexArray(this._dsBgVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._dsBgVBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, 1,1, -1,-1, 1,1, -1,1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    gl.bindVertexArray(null);

    // ── Deep Sea particle VAO (dynamic [x,y,z,size,bright,blend] × particle) ──
    try { this._dsPartProg = this._buildProgram(DS_PART_VERT, DS_PART_FRAG); } catch (e) { console.warn('DS part shader:', e); }
    this._dsPartVAO = gl.createVertexArray()!;
    this._dsPartVBO = gl.createBuffer()!;
    gl.bindVertexArray(this._dsPartVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._dsPartVBO);
    gl.bufferData(gl.ARRAY_BUFFER, this._ds.gpuBuf.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 24, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 24, 16);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 24, 20);
    gl.bindVertexArray(null);

    // ── Bloom post-processing programs (no VAO — reuse _dsBgVAO) ──────────────
    try { this._bloomThreshProg = this._buildProgram(BLOOM_VERT, BLOOM_THRESHOLD_FRAG); } catch (e) { console.warn('Bloom threshold shader:', e); }
    try { this._bloomBlurProg   = this._buildProgram(BLOOM_VERT, BLOOM_BLUR_FRAG);      } catch (e) { console.warn('Bloom blur shader:', e); }
    try { this._bloomCompProg   = this._buildProgram(BLOOM_VERT, BLOOM_COMPOSITE_FRAG); } catch (e) { console.warn('Bloom composite shader:', e); }

    // ── Motion blur programs (reuse _dsBgVAO) ─────────────────────────────────
    try { this._mbAccumProg = this._buildProgram(BLOOM_VERT, MB_ACCUM_FRAG); } catch (e) { console.warn('MB accum shader:', e); }
    try { this._mbBlitProg  = this._buildProgram(BLOOM_VERT, MB_BLIT_FRAG);  } catch (e) { console.warn('MB blit shader:', e); }
    try { this._mbBlurProg  = this._buildProgram(BLOOM_VERT, BLOOM_BLUR_FRAG); } catch (e) { console.warn('MB blur shader:', e); }

    // ── Cache uniform locations for bloom and motion-blur hot paths ───────────
    if (this._bloomThreshProg) {
      this._bloomUnif_thresh_uScene     = gl.getUniformLocation(this._bloomThreshProg, 'u_scene');
      this._bloomUnif_thresh_uThreshold = gl.getUniformLocation(this._bloomThreshProg, 'u_threshold');
    }
    if (this._bloomBlurProg) {
      this._bloomUnif_blur_uTex      = gl.getUniformLocation(this._bloomBlurProg, 'u_tex');
      this._bloomUnif_blur_uTexelDir = gl.getUniformLocation(this._bloomBlurProg, 'u_texelDir');
    }
    if (this._bloomCompProg) {
      this._bloomUnif_comp_uScene    = gl.getUniformLocation(this._bloomCompProg, 'u_scene');
      this._bloomUnif_comp_uBloom    = gl.getUniformLocation(this._bloomCompProg, 'u_bloom');
      this._bloomUnif_comp_uStrength = gl.getUniformLocation(this._bloomCompProg, 'u_strength');
    }
    if (this._mbBlitProg) {
      this._mbUnif_blit_uTex      = gl.getUniformLocation(this._mbBlitProg, 'u_tex');
    }
    if (this._mbAccumProg) {
      this._mbUnif_accum_uAccum = gl.getUniformLocation(this._mbAccumProg, 'u_accum');
      this._mbUnif_accum_uScene = gl.getUniformLocation(this._mbAccumProg, 'u_scene');
      this._mbUnif_accum_uBlend = gl.getUniformLocation(this._mbAccumProg, 'u_blend');
    }
    if (this._mbBlurProg) {
      this._mbUnif_blur_uTex      = gl.getUniformLocation(this._mbBlurProg, 'u_tex');
      this._mbUnif_blur_uTexelDir = gl.getUniformLocation(this._mbBlurProg, 'u_texelDir');
    }

    this._geo = buildMonolithGeometry(this._monolithHalfW, this._monolithHalfH, this._monolithHalfD);

    // ── Monolith VAO ──
    this._monolithVAO = gl.createVertexArray()!;
    this._monolithVBO = gl.createBuffer()!;
    this._monolithIBO = gl.createBuffer()!;

    gl.bindVertexArray(this._monolithVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._monolithVBO);
    gl.bufferData(gl.ARRAY_BUFFER, this._geo.vertexData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._monolithIBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._geo.indexData, gl.STATIC_DRAW);

    const S = 9 * 4;
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, S, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, S, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, S, 24);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, S, 32);
    gl.bindVertexArray(null);

    // ── Jelly VAO (same vertex layout as monolith) ──
    this._jellyGeo = buildJellyGeometry(this._monolithHalfW, this._monolithHalfH, this._monolithHalfD, this._jellyRoundness);
    this._jellyVAO = gl.createVertexArray()!;
    this._jellyVBO = gl.createBuffer()!;
    this._jellyIBO = gl.createBuffer()!;

    gl.bindVertexArray(this._jellyVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._jellyVBO);
    gl.bufferData(gl.ARRAY_BUFFER, this._jellyGeo.vertexData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._jellyIBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._jellyGeo.indexData, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, S, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, S, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, S, 24);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, S, 32);
    gl.bindVertexArray(null);

    // ── Tentacle VAO (4 float attribs: tentIdx, segT, ringTheta, ringR) ──
    this._tentacleGeo  = buildTentacleGeometry(this._tentCount, this._tentSegs, this._tentRing);
    this._tentacleVAO  = gl.createVertexArray()!;
    this._tentacleVBO  = gl.createBuffer()!;
    this._tentacleIBO  = gl.createBuffer()!;

    gl.bindVertexArray(this._tentacleVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._tentacleVBO);
    gl.bufferData(gl.ARRAY_BUFFER, this._tentacleGeo.vertexData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._tentacleIBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._tentacleGeo.indexData, gl.STATIC_DRAW);
    const TS = 16; // 4 floats × 4 bytes — packed as vec4 a_data at location 0
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, TS, 0);
    gl.bindVertexArray(null);

    // ── Lichen VAO ──
    const quadVerts = new Float32Array([-1,-1, 1,-1, 1,1, -1,-1, 1,1, -1,1]);
    this._lichenVAO     = gl.createVertexArray()!;
    this._lichenQuadVBO = gl.createBuffer()!;
    this._lichenInstVBO = gl.createBuffer()!;

    gl.bindVertexArray(this._lichenVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._lichenQuadVBO);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this._lichenInstVBO);
    gl.bufferData(gl.ARRAY_BUFFER, GPU_MAX_NODES * INSTANCE_STRIDE * 4, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, INSTANCE_STRIDE*4, 0);
    gl.vertexAttribDivisor(1, 1);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, INSTANCE_STRIDE*4, 16);
    gl.vertexAttribDivisor(2, 1);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.FLOAT, false, INSTANCE_STRIDE*4, 32);
    gl.vertexAttribDivisor(3, 1);
    gl.bindVertexArray(null);

    // ── Spore VAO ──
    this._sporeVAO = gl.createVertexArray()!;
    this._sporeVBO = gl.createBuffer()!;

    gl.bindVertexArray(this._sporeVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._sporeVBO);
    gl.bufferData(gl.ARRAY_BUFFER, MAX_SPORES * GPU_STRIDE * 4, gl.DYNAMIC_DRAW);
    const SS = GPU_STRIDE * 4;
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, SS, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, SS, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, SS, 16);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, SS, 20);
    gl.bindVertexArray(null);
  }

  // ─── Geometry rebuild ──────────────────────────────────────────────────────

  private _rebuildGeometry(): void {
    if (!this._gl || !this._monolithVBO) return;
    const gl = this._gl;
    this._geo = buildMonolithGeometry(this._monolithHalfW, this._monolithHalfH, this._monolithHalfD);
    gl.bindVertexArray(this._monolithVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._monolithVBO);
    gl.bufferData(gl.ARRAY_BUFFER, this._geo.vertexData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._monolithIBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._geo.indexData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    this._rebuildJellyGeometry();
  }

  private _rebuildTentacleGeometry(): void {
    if (!this._gl || !this._tentacleVBO) return;
    const gl = this._gl;
    this._tentacleGeo = buildTentacleGeometry(this._tentCount, this._tentSegs, this._tentRing);
    gl.bindVertexArray(this._tentacleVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._tentacleVBO);
    gl.bufferData(gl.ARRAY_BUFFER, this._tentacleGeo.vertexData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._tentacleIBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._tentacleGeo.indexData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  private _rebuildJellyGeometry(): void {
    if (!this._gl || !this._jellyVBO) return;
    const gl = this._gl;
    this._jellyGeo = buildJellyGeometry(this._monolithHalfW, this._monolithHalfH, this._monolithHalfD, this._jellyRoundness);
    gl.bindVertexArray(this._jellyVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._jellyVBO);
    gl.bufferData(gl.ARRAY_BUFFER, this._jellyGeo.vertexData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._jellyIBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._jellyGeo.indexData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  // Build camera-aligned ribbon VBO from current physics chain positions.
  // Positions are in object space; camX/Y/Z are in world space.
  private _buildPhysicsRibbon(camX: number, camY: number, camZ: number): void {
    const nSeg  = this._physSegs;
    const nTent = this._tentCount;

    // Camera right in world space: cross(up=(0,1,0), −camDir) = cross((0,1,0),(−cx,−cy,−cz)/camLen)
    const camLen = Math.hypot(camX, camY, camZ);
    if (camLen < 1e-6) return;
    // right_world = (camFwdZ, 0, −camFwdX) where camFwd = −camPos/camLen
    const rwX = -camZ / camLen;
    const rwZ =  camX / camLen;
    const rLen = Math.hypot(rwX, rwZ);
    if (rLen < 1e-6) return;
    const nrwX = rwX / rLen, nrwZ = rwZ / rLen;

    // Transform world right to object space via rotY(−tilt)
    const tiltRad = -this._tilt * Math.PI / 180;
    const cosT = Math.cos(tiltRad), sinT = Math.sin(tiltRad);
    const roX = cosT * nrwX + sinT * nrwZ;
    const roZ = -sinT * nrwX + cosT * nrwZ;
    // roY = 0 (rotation around Y axis preserves Y)

    const buf = this._physRibbonBuf;
    let vi = 0;

    for (let t = 0; t < nTent; t++) {
      for (let s = 0; s < nSeg; s++) {
        const idx  = (t * nSeg + s) * 3;
        const px   = this._physChain.chainsCur[idx], py = this._physChain.chainsCur[idx + 1], pz = this._physChain.chainsCur[idx + 2];
        const segT = s / (nSeg - 1);
        // Taper: full width at root, zero at tip
        const hw   = this._physWidth  * Math.sqrt(Math.max(0, 1.0 - segT));
        const hh   = this._physHeight * Math.sqrt(Math.max(0, 1.0 - segT));

        // Left ribbon vertex
        buf[vi++] = px + roX * hw;
        buf[vi++] = py + hh;
        buf[vi++] = pz + roZ * hw;
        buf[vi++] = segT;

        // Right ribbon vertex
        buf[vi++] = px - roX * hw;
        buf[vi++] = py - hh;
        buf[vi++] = pz - roZ * hw;
        buf[vi++] = segT;
      }
    }

    const gl = this._gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this._physVBO);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, buf.subarray(0, vi));
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  // ─── Oral arm physics ────────────────────────────────────────────────────────

  private _reallocOralBuffers(): void {
    this._oralRibbonBuf = new Float32Array(Math.max(this._oralCount, 8) * Math.max(this._oralSegs, 32) * 3 * 2 * 5);
    // GL objects may not exist yet if called before _initGL (store subscriptions fire early)
    if (!this._oralVBO) return;
    const gl = this._gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this._oralVBO);
    gl.bufferData(gl.ARRAY_BUFFER, this._oralRibbonBuf.byteLength, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  // Build oral arm ribbon: 3 strips per arm (body + left frill + right frill).
  // Vertex layout: [x, y, z, segT, edgeT] — 5 floats, stride 20.
  private _buildOralArmRibbon(camX: number, camY: number, camZ: number): void {
    const nSeg = this._oralSegs;
    const nArm = this._oralCount;

    const camLen = Math.hypot(camX, camY, camZ);
    if (camLen < 1e-6) return;
    const nrwX = -camZ / camLen;
    const nrwZ =  camX / camLen;
    const rLen = Math.hypot(nrwX, nrwZ);
    if (rLen < 1e-6) return;
    const rnwX = nrwX / rLen, rnwZ = nrwZ / rLen;

    const tiltRad = -this._tilt * Math.PI / 180;
    const cosT = Math.cos(tiltRad), sinT = Math.sin(tiltRad);
    const roX = cosT * rnwX + sinT * rnwZ;
    const roZ = -sinT * rnwX + cosT * rnwZ;

    const buf = this._oralRibbonBuf;
    // Buffer layout: for each arm, strip0 (body), strip1 (left frill), strip2 (right frill)
    // Each strip = nSeg * 2 verts * 5 floats
    const vertsPerStrip = nSeg * 2;
    const floatsPerStrip = vertsPerStrip * 5;

    for (let a = 0; a < nArm; a++) {
      const armBase = a * 3 * floatsPerStrip;

      // Strip offsets within arm
      const s0 = armBase;                    // body
      const s1 = armBase + floatsPerStrip;   // left frill
      const s2 = armBase + 2 * floatsPerStrip; // right frill

      // Per-arm random phase offset for twist (golden angle)
      const armTwistOffset = a * 2.39996 * this._oralTwistRand;

      for (let s = 0; s < nSeg; s++) {
        const idx     = (a * nSeg + s) * 3;
        const spX     = this._oralChain.chainsCur[idx];
        const spY     = this._oralChain.chainsCur[idx + 1];
        const spZ     = this._oralChain.chainsCur[idx + 2];
        const segFrac = s / (nSeg - 1);

        // DNA twist: rotate the right vector around Y by a per-segment angle
        const twistAngle = segFrac * this._oralTwistFreq * 6.28318 * this._oralTwistStr + armTwistOffset;
        const cosA = Math.cos(twistAngle), sinA = Math.sin(twistAngle);
        const trX = roX * cosA - roZ * sinA;
        const trZ = roX * sinA + roZ * cosA;

        // Main ribbon half-width tapers from root (full) to tip (zero)
        const mainHW = this._oralWidth  * Math.sqrt(Math.max(0, 1.0 - segFrac));
        const hh     = this._oralHeight * Math.sqrt(Math.max(0, 1.0 - segFrac));

        // Frill width: scalloped sinusoidal profile — collapses to zero at petal notches
        const frillPhase = this._elapsed * 0.0007 * this._oralFrillSpeed
                         + segFrac * this._oralFrillFreq * 6.2832
                         + a * 1.7;
        const frillW = mainHW * this._oralFrillAmp * Math.max(0, Math.sin(frillPhase));

        const vi = s * 2 * 5;

        // Strip 0: body ribbon — left then right
        buf[s0 + vi + 0] = spX - trX * mainHW; buf[s0 + vi + 1] = spY + hh; buf[s0 + vi + 2] = spZ - trZ * mainHW; buf[s0 + vi + 3] = segFrac; buf[s0 + vi + 4] = 0.0;
        buf[s0 + vi + 5] = spX + trX * mainHW; buf[s0 + vi + 6] = spY - hh; buf[s0 + vi + 7] = spZ + trZ * mainHW; buf[s0 + vi + 8] = segFrac; buf[s0 + vi + 9] = 0.0;

        // Strip 1: left frill — inner (body edge) then outer (frill tip)
        buf[s1 + vi + 0] = spX - trX * mainHW;            buf[s1 + vi + 1] = spY + hh; buf[s1 + vi + 2] = spZ - trZ * mainHW;            buf[s1 + vi + 3] = segFrac; buf[s1 + vi + 4] = 0.0;
        buf[s1 + vi + 5] = spX - trX * (mainHW + frillW); buf[s1 + vi + 6] = spY + hh; buf[s1 + vi + 7] = spZ - trZ * (mainHW + frillW); buf[s1 + vi + 8] = segFrac; buf[s1 + vi + 9] = 1.0;

        // Strip 2: right frill — inner (body edge) then outer (frill tip)
        buf[s2 + vi + 0] = spX + trX * mainHW;            buf[s2 + vi + 1] = spY - hh; buf[s2 + vi + 2] = spZ + trZ * mainHW;            buf[s2 + vi + 3] = segFrac; buf[s2 + vi + 4] = 0.0;
        buf[s2 + vi + 5] = spX + trX * (mainHW + frillW); buf[s2 + vi + 6] = spY - hh; buf[s2 + vi + 7] = spZ + trZ * (mainHW + frillW); buf[s2 + vi + 8] = segFrac; buf[s2 + vi + 9] = 1.0;
      }
    }

    const gl = this._gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this._oralVBO);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, buf.subarray(0, nArm * 3 * floatsPerStrip));
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  // ─── Mouse / wheel (orbital camera) ────────────────────────────────────────

  private _onMouseDown = (e: MouseEvent): void => {
    this._isDragging = true;
    this._dragLastX  = e.clientX;
    this._dragLastY  = e.clientY;
  };

  private _onMouseMove = (e: MouseEvent): void => {
    if (!this._isDragging) return;
    const dx = e.clientX - this._dragLastX;
    const dy = e.clientY - this._dragLastY;
    this._dragLastX = e.clientX;
    this._dragLastY = e.clientY;
    // Yaw around world Y (matches original azimuth sign convention)
    let q = quatMul(quatAxisAngle(0, 1, 0, -dx * 0.005), this._camQuat);
    // Pitch around camera's current right axis — free orbit, no pole snap
    const [rx, ry, rz] = quatRotVec(q, 1, 0, 0);
    this._camQuat = quatNorm(quatMul(quatAxisAngle(rx, ry, rz, -dy * 0.005), q));
  };

  private _onMouseUp = (): void => { this._isDragging = false; };

  private _onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this._camRadius = Math.max(0.01, this._camRadius + e.deltaY * 0.002);
  };

  // ─── Scene setup ───────────────────────────────────────────────────────────

  private _initScene(): void {
    // Seed nodes across several faces so the cube feels overgrown from the start
    spawnRunner(this._nodes, this._maxPatches, 0.35, 0.45, 0.20, 0);  // front
    spawnRunner(this._nodes, this._maxPatches, 0.60, 0.55, 0.80, 1);  // back
    spawnLeaf(this._nodes,   this._maxPatches, 0.50, 0.38, 0.50, 2);  // right
    spawnLeaf(this._nodes,   this._maxPatches, 0.45, 0.60, 0.35, 3);  // left
    for (const n of this._nodes) { n.health = 0.7; n.growthT = 0.8; }
  }

  // Callback used by updateFoliage for organic spread — preserves the parent face
  private _spawnChildNode = (u: number, v: number, colorT: number, type: number, face: number): void => {
    if (this._nodes.length >= this._maxPatches) return;
    if (type === NODE_RUNNER)     spawnRunner(this._nodes, this._maxPatches, u, v, colorT, face);
    else if (type === NODE_LEAF)  spawnLeaf(this._nodes,   this._maxPatches, u, v, colorT, face);
    else if (type === NODE_BLOOM) spawnBloom(this._nodes,  this._maxPatches, u, v, colorT, face);
  };

  // ─── Resize ────────────────────────────────────────────────────────────────

  private _onResize = (): void => this._resize();

  private _resizeBloomFBOs(w: number, h: number): void {
    if (w === this._bloomW && h === this._bloomH && this._bloomSceneFBO !== null) return;
    this._bloomW = w; this._bloomH = h;
    const gl = this._gl;
    const hw = Math.max(1, w >> 1), hh = Math.max(1, h >> 1);

    const makeTex = (tw: number, th: number): WebGLTexture => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, tw, th, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
      return t;
    };
    const makeFBO = (tex: WebGLTexture): WebGLFramebuffer => {
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return fbo;
    };

    // Scene FBO — full res, with depth renderbuffer
    if (this._bloomSceneTex)  { gl.deleteTexture(this._bloomSceneTex); }
    if (this._bloomDepthRBO)  { gl.deleteRenderbuffer(this._bloomDepthRBO); }
    if (this._bloomSceneFBO)  { gl.deleteFramebuffer(this._bloomSceneFBO); }
    this._bloomSceneTex = makeTex(w, h);
    this._bloomDepthRBO = gl.createRenderbuffer()!;
    gl.bindRenderbuffer(gl.RENDERBUFFER, this._bloomDepthRBO);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    this._bloomSceneFBO = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._bloomSceneFBO);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._bloomSceneTex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this._bloomDepthRBO);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Bright / ping / pong FBOs — half res, no depth
    if (this._bloomBrightTex) { gl.deleteTexture(this._bloomBrightTex); }
    if (this._bloomBrightFBO) { gl.deleteFramebuffer(this._bloomBrightFBO); }
    if (this._bloomPingTex)   { gl.deleteTexture(this._bloomPingTex); }
    if (this._bloomPingFBO)   { gl.deleteFramebuffer(this._bloomPingFBO); }
    if (this._bloomPongTex)   { gl.deleteTexture(this._bloomPongTex); }
    if (this._bloomPongFBO)   { gl.deleteFramebuffer(this._bloomPongFBO); }
    this._bloomBrightTex = makeTex(hw, hh); this._bloomBrightFBO = makeFBO(this._bloomBrightTex);
    this._bloomPingTex   = makeTex(hw, hh); this._bloomPingFBO   = makeFBO(this._bloomPingTex);
    this._bloomPongTex   = makeTex(hw, hh); this._bloomPongFBO   = makeFBO(this._bloomPongTex);
  }

  private _resizeMBFBOs(w: number, h: number): void {
    if (w === this._mbW && h === this._mbH && this._mbSceneFBO !== null) return;
    this._mbW = w; this._mbH = h;
    const gl = this._gl;

    const makeTex = (tw: number, th: number): WebGLTexture => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, tw, th, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
      return t;
    };
    const makeColorFBO = (tex: WebGLTexture): WebGLFramebuffer => {
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return fbo;
    };

    // Scene FBO — full res, with depth (needed for scene geometry rendering)
    if (this._mbSceneTex) { gl.deleteTexture(this._mbSceneTex); }
    if (this._mbDepthRBO) { gl.deleteRenderbuffer(this._mbDepthRBO); }
    if (this._mbSceneFBO) { gl.deleteFramebuffer(this._mbSceneFBO); }
    this._mbSceneTex = makeTex(w, h);
    this._mbDepthRBO = gl.createRenderbuffer()!;
    gl.bindRenderbuffer(gl.RENDERBUFFER, this._mbDepthRBO);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    this._mbSceneFBO = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._mbSceneFBO);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._mbSceneTex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this._mbDepthRBO);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Accum and ping FBOs — full res, color-only
    if (this._mbAccumTex) { gl.deleteTexture(this._mbAccumTex); }
    if (this._mbAccumFBO) { gl.deleteFramebuffer(this._mbAccumFBO); }
    if (this._mbPingTex)  { gl.deleteTexture(this._mbPingTex); }
    if (this._mbPingFBO)  { gl.deleteFramebuffer(this._mbPingFBO); }
    this._mbAccumTex = makeTex(w, h); this._mbAccumFBO = makeColorFBO(this._mbAccumTex);
    this._mbPingTex  = makeTex(w, h); this._mbPingFBO  = makeColorFBO(this._mbPingTex);

    this._mbAccumInit = false;
  }

  private _resize(): void {
    const w = this._canvas.clientWidth, h = this._canvas.clientHeight;
    if (this._canvas.width !== w || this._canvas.height !== h) {
      this._canvas.width = w; this._canvas.height = h;
    }
    this._gl.viewport(0, 0, w, h);
    if (this._mbEnabled)    this._resizeMBFBOs(w, h);
    if (this._bloomEnabled) this._resizeBloomFBOs(w, h);
  }

  // ─── Main tick ─────────────────────────────────────────────────────────────

  private _tick(now: number): void {
    const dt = Math.min(now - this._lastT, 50);

    // ── FPS cap: skip frame if too soon ───────────────────────────────────────
    if (this._perfMaxFps > 0 && (now - this._lastFrameT) < (1000 / this._perfMaxFps)) {
      this._rafId = requestAnimationFrame(t => this._tick(t));
      return;
    }
    this._lastFrameT = now;

    // ── Rolling FPS counter (last 60 dt samples) ──────────────────────────────
    if (dt > 0) {
      this._fpsHistory.push(dt);
      if (this._fpsHistory.length > 60) this._fpsHistory.shift();
      if (this._fpsHistory.length > 0) {
        const sum = this._fpsHistory.reduce((a, b) => a + b, 0);
        PERF_LIVE_FPS.set(Math.round(this._fpsHistory.length * 1000 / sum));
      }
    }

    this._lastT    = now;
    this._elapsed += dt;
    const dtS = dt * 0.001;

    this._resize();
    this._updateAudio();
    this._handleTriggers();

    this._updateRipples(dtS);

    // Jellyfish spring dynamics
    if (this._jellyEnabled) {
      // Propel envelope (attack → decay)
      if (this._propelPhase !== 'idle') {
        this._propelEnvT += dt;
        if (this._propelPhase === 'attack') {
          const t = Math.min(this._propelEnvT / Math.max(this._propelAttackMs, 1), 1);
          this._jellyPropelZ = this._jellyPropelStr * Math.pow(t, this._propelCurve);
          if (t >= 1) { this._propelPhase = 'decay'; this._propelEnvT = 0; }
        } else {
          const t = Math.min(this._propelEnvT / Math.max(this._propelDecayMs, 1), 1);
          this._jellyPropelZ = this._jellyPropelStr * Math.pow(1 - t, this._propelCurve);
          if (t >= 1) { this._propelPhase = 'idle'; this._jellyPropelZ = 0; }
        }
      }

      const compForce = -this._jellySpringK * 2.5 * this._jellyCompressT - this._jellySpringDamping * 1.5 * this._jellyCompressVel;
      this._jellyCompressVel += compForce * dtS;
      this._jellyCompressT   += this._jellyCompressVel * dtS;
      this._jellyCompressT    = Math.max(-0.15, Math.min(1.0, this._jellyCompressT));
    }

    // MB trigger envelope decay
    if (this._mbTrigEnv > 0) {
      this._mbTrigEnv *= Math.exp(-dt * Math.LN2 / Math.max(1, this._mbTriggerDecay));
      if (this._mbTrigEnv < 0.001) this._mbTrigEnv = 0;
    }

    // DS swim: propulsive force (attack→decay envelope) adds to velocity; drag always decays it
    if (this._dsSwimPhase !== 'idle') {
      this._dsSwimEnvT += dt;
      let force = 0;
      if (this._dsSwimPhase === 'attack') {
        const t = Math.min(this._dsSwimEnvT / Math.max(this._dsSwimAttack, 1), 1);
        force = this._dsSwimImpulse * Math.pow(t, this._dsSwimCurve);
        if (t >= 1) { this._dsSwimPhase = 'decay'; this._dsSwimEnvT = 0; }
      } else {
        const t = Math.min(this._dsSwimEnvT / Math.max(this._dsSwimDecay, 1), 1);
        force = this._dsSwimImpulse * Math.pow(1 - t, this._dsSwimCurve);
        if (t >= 1) { this._dsSwimPhase = 'idle'; }
      }
      this._dsSwimVel += force * dt;
    }
    // Drag — always active; velocity carries over between beats
    this._dsSwimVel *= Math.pow(Math.max(0, 1 - this._dsSwimDrag), dt);
    this._dsSwimVel  = Math.min(this._dsSwimVel, this._dsSwimMaxVel);

    // Background gradient advance
    if (this._bgGradEnabled) {
      this._bgGradHue = (this._bgGradHue + this._bgGradSpeed * dtS * (1 / 360)) % 1;
      const [r, g, b] = hsvToRgb(this._bgGradHue, this._bgGradSat, this._bgGradVal);
      this._bgGradR = r; this._bgGradG = g; this._bgGradB = b;
    }

    // BG color shift envelope
    if (this._bgShiftPhase !== 'idle') {
      this._bgShiftEnvT += dt;
      if (this._bgShiftPhase === 'attack') {
        const t = Math.min(this._bgShiftEnvT / Math.max(this._bgShiftAttack, 1), 1);
        this._bgShiftT = Math.pow(t, this._bgShiftCurve);
        if (t >= 1) { this._bgShiftPhase = 'decay'; this._bgShiftEnvT = 0; }
      } else {
        const t = Math.min(this._bgShiftEnvT / Math.max(this._bgShiftDecay, 1), 1);
        this._bgShiftT = Math.pow(1 - t, this._bgShiftCurve);
        if (t >= 1) { this._bgShiftPhase = 'idle'; this._bgShiftT = 0; }
      }
    }

    // Jelly tint shift envelope
    if (this._jellyShiftPhase !== 'idle') {
      this._jellyShiftEnvT += dt;
      if (this._jellyShiftPhase === 'attack') {
        const t = Math.min(this._jellyShiftEnvT / Math.max(this._jellyShiftAttack, 1), 1);
        this._jellyShiftT = Math.pow(t, this._jellyShiftCurve);
        if (t >= 1) { this._jellyShiftPhase = 'decay'; this._jellyShiftEnvT = 0; }
      } else {
        const t = Math.min(this._jellyShiftEnvT / Math.max(this._jellyShiftDecay, 1), 1);
        this._jellyShiftT = Math.pow(1 - t, this._jellyShiftCurve);
        if (t >= 1) { this._jellyShiftPhase = 'idle'; this._jellyShiftT = 0; }
      }
    }

    if (this._memShiftPhase !== 'idle') {
      this._memShiftEnvT += dt;
      if (this._memShiftPhase === 'attack') {
        const t = Math.min(this._memShiftEnvT / Math.max(this._memShiftAttack, 1), 1);
        this._memShiftT = Math.pow(t, this._memShiftCurve);
        if (t >= 1) { this._memShiftPhase = 'decay'; this._memShiftEnvT = 0; }
      } else {
        const t = Math.min(this._memShiftEnvT / Math.max(this._memShiftDecay, 1), 1);
        this._memShiftT = Math.pow(1 - t, this._memShiftCurve);
        if (t >= 1) { this._memShiftPhase = 'idle'; this._memShiftT = 0; }
      }
    }

    if (this._oralShiftPhase !== 'idle') {
      this._oralShiftEnvT += dt;
      if (this._oralShiftPhase === 'attack') {
        const t = Math.min(this._oralShiftEnvT / Math.max(this._oralShiftAttack, 1), 1);
        this._oralShiftT = Math.pow(t, this._oralShiftCurve);
        if (t >= 1) { this._oralShiftPhase = 'decay'; this._oralShiftEnvT = 0; }
      } else {
        const t = Math.min(this._oralShiftEnvT / Math.max(this._oralShiftDecay, 1), 1);
        this._oralShiftT = Math.pow(1 - t, this._oralShiftCurve);
        if (t >= 1) { this._oralShiftPhase = 'idle'; this._oralShiftT = 0; }
      }
    }

    const idleBreath = 0.5 + 0.5 * Math.sin(this._elapsed * 0.0008);

    // Physics tentacle simulation
    const compVal = Math.max(0, this._jellyCompressT);
    if (this._jellyEnabled && this._tentEnabled && this._physMode) {
      if (!this._physChain.ready) this._physChain.init(compVal, this._monolithHalfW, this._monolithHalfH, this._monolithHalfD);
      this._physChain.update(dt, compVal, this._elapsed, this._monolithHalfW, this._monolithHalfH, this._monolithHalfD);
    }

    // Oral arm simulation
    if (this._oralEnabled && this._jellyEnabled) {
      if (!this._oralChain.ready) this._oralChain.init(compVal, this._monolithHalfW, this._monolithHalfH, this._monolithHalfD);
      this._oralChain.update(dt, compVal, this._elapsed, this._monolithHalfW, this._monolithHalfH, this._monolithHalfD);
    }

    // Deep sea particle simulation
    if (this._dsPartEnabled) {
      this._ds.update(dt, this._elapsed, this._tilt, this._dsSwimVel);
      const gl = this._gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this._dsPartVBO);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._ds.gpuBuf.subarray(0, this._ds.aliveCount * 6));
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    updateFoliage(this._nodes, dt, this._emissiveSmooth, this._decayRate, idleBreath, this._spawnChildNode);
    updateSpores(dtS, this._elapsed);

    this._idleSporeT += dt;
    if (this._idleSporeT > 700 && this._nodes.length > 0) {
      this._idleSporeT = 0;
      const n = this._nodes[Math.floor(Math.random() * this._nodes.length)];
      emitSpores(n.u, n.v, 1, n.colorT, this._sporeDrift * 0.3, this._monolithHalfW, this._monolithHalfH, this._monolithHalfD);
    }

    this._idleRippleT += dt;
    if (this._idleRippleT > 9000) {
      this._idleRippleT = 0;
      this._addRipple(Math.random(), Math.random(), 0.012);
    }

    this._draw(idleBreath);
    if (this._mbEnabled)    this._applyMotionBlur();
    if (this._bloomEnabled) this._applyBloom(this._mbEnabled ? this._mbAccumTex : null);
    this._rafId = requestAnimationFrame(t => this._tick(t));
  }

  // ─── Audio update ──────────────────────────────────────────────────────────

  private _updateAudio(): void {
    const analyser = liveAnalyser, ctx = liveContext;
    if (!analyser || !ctx) return;

    if (this._freqData.length !== analyser.frequencyBinCount)
      this._freqData = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(this._freqData);

    this._bassDetector.updateData(analyser, ctx, this._freqData);
    this._midDetector.updateData(analyser, ctx, this._freqData);
    this._highDetector.updateData(analyser, ctx, this._freqData);
    if (this._bgShiftEnabled)    this._bgShiftDetector.updateData(analyser, ctx, this._freqData);
    if (this._jellyShiftEnabled) this._jellyShiftDetector.updateData(analyser, ctx, this._freqData);
    if (this._memShiftEnabled)   this._membraneShiftDetector.updateData(analyser, ctx, this._freqData);
    if (this._oralEnabled)       this._oralDetector.updateData(analyser, ctx, this._freqData);
    if (this._oralShiftEnabled)  this._oralShiftDetector.updateData(analyser, ctx, this._freqData);
    if (this._dsTrigEnabled)     this._dsTrigDetector.updateData(analyser, ctx, this._freqData);
    if (this._mbEnabled)         this._mbTrigDetector.updateData(analyser, ctx, this._freqData);
    const lo = Math.round(300  * NUM_BINS / NYQUIST);
    const hi = Math.round(3000 * NUM_BINS / NYQUIST);
    let rms = 0;
    for (let i = lo; i < hi && i < this._freqData.length; i++) {
      const db = this._freqData[i];
      if (db > -100) rms += Math.pow(10, db / 20);
    }
    rms = Math.min(1, rms / Math.max(1, hi - lo) / 0.08);
    this._emissiveSmooth += (rms - this._emissiveSmooth) * 0.08;
  }

  // ─── Beat response ─────────────────────────────────────────────────────────

  private _handleTriggers(): void {
    if (this._bassDetector.justTriggered) {
      // Jellyfish compress + propel impulse
      if (this._jellyEnabled) {
        this._jellyCompressVel += this._jellyCompressStr * 10.0;
        this._propelPhase = 'attack'; this._propelEnvT = 0;
        // Physics tentacle whip
        if (this._tentEnabled && this._physMode && this._physChain.ready) {
          this._physChain.whip();
        }
      }
      // DS swim current
      if (this._dsSwimEnabled) {
        this._dsSwimPhase = 'attack';
        this._dsSwimEnvT  = 0;
      }
      // MB trigger boost on bass
      // (moved to dedicated _mbTrigDetector below)
      // Bass → runner on a random face + surface ripple
      this._addRipple(Math.random(), Math.random(), 0.045);
      const colorT = Math.random() < 0.5 ? 0.15 + Math.random() * 0.3 : 0.6 + Math.random() * 0.3;
      const face   = Math.floor(Math.random() * 6);
      spawnRunner(this._nodes, this._maxPatches, 0.1 + Math.random() * 0.8, 0.1 + Math.random() * 0.8, colorT, face);
    }
    if (this._midDetector.justTriggered) {
      // Mid → leaf near a mature runner on the same face, else random face
      const colorT  = this._midDetector.parameter > 0.5 ? 0.70 + Math.random() * 0.25 : 0.05 + Math.random() * 0.30;
      const runners = this._nodes.filter(n => n.type === NODE_RUNNER && n.growthT > 0.4);
      if (runners.length > 0) {
        const r    = runners[Math.floor(Math.random() * runners.length)];
        const frac = 0.4 + Math.random() * 0.6;
        const leafU = r.u + Math.cos(r.growthDir) * r.size * 3.8 * frac + (Math.random() - 0.5) * 0.08;
        const leafV = r.v + Math.sin(r.growthDir) * r.size * 3.8 * frac + (Math.random() - 0.5) * 0.08;
        spawnLeaf(this._nodes, this._maxPatches, leafU, leafV, colorT, r.face);
      } else {
        spawnLeaf(this._nodes, this._maxPatches, 0.1 + Math.random() * 0.8, 0.1 + Math.random() * 0.8, colorT, Math.floor(Math.random() * 6));
      }
      if (this._nodes.length > 0) {
        boostNode(this._nodes[Math.floor(Math.random() * this._nodes.length)], 0.25);
      }
    }
    if (this._highDetector.justTriggered) {
      // High → bloom bursts spread across several faces + spore burst
      const colorT = Math.random();
      for (let i = 0; i < 3; i++) {
        const face     = Math.floor(Math.random() * 6);
        const leafNodes = this._nodes.filter(n => n.type === NODE_LEAF && n.face === face);
        if (leafNodes.length > 0) {
          const src = leafNodes[Math.floor(Math.random() * leafNodes.length)];
          spawnBloom(this._nodes, this._maxPatches, src.u + (Math.random() - 0.5) * 0.12, src.v + (Math.random() - 0.5) * 0.12, colorT, face);
        } else {
          spawnBloom(this._nodes, this._maxPatches, 0.15 + Math.random() * 0.7, 0.15 + Math.random() * 0.7, colorT, face);
        }
      }
      if (this._nodes.length > 0) {
        const src = this._nodes[Math.floor(Math.random() * this._nodes.length)];
        emitSpores(src.u, src.v, Math.round(this._sporeCount * this._highDetector.parameter), src.colorT, this._sporeDrift, this._monolithHalfW, this._monolithHalfH, this._monolithHalfD);
      }
    }
    if (this._bgShiftEnabled && this._bgShiftDetector.justTriggered) {
      // Retrigger from current level to avoid snapping to zero
      const invC = this._bgShiftCurve > 0 ? 1 / this._bgShiftCurve : 1;
      const equivFrac = Math.pow(Math.max(this._bgShiftT, 0), invC);
      this._bgShiftPhase = 'attack';
      this._bgShiftEnvT = equivFrac * Math.max(this._bgShiftAttack, 1);
    }
    if (this._jellyShiftEnabled && this._jellyShiftDetector.justTriggered) {
      const invC = this._jellyShiftCurve > 0 ? 1 / this._jellyShiftCurve : 1;
      const equivFrac = Math.pow(Math.max(this._jellyShiftT, 0), invC);
      this._jellyShiftPhase = 'attack';
      this._jellyShiftEnvT = equivFrac * Math.max(this._jellyShiftAttack, 1);
    }
    if (this._memShiftEnabled && this._membraneShiftDetector.justTriggered) {
      const invC = this._memShiftCurve > 0 ? 1 / this._memShiftCurve : 1;
      const equivFrac = Math.pow(Math.max(this._memShiftT, 0), invC);
      this._memShiftPhase = 'attack';
      this._memShiftEnvT = equivFrac * Math.max(this._memShiftAttack, 1);
    }
    if (this._oralEnabled && this._oralDetector.justTriggered && this._oralChain.ready) {
      this._oralChain.whip();
    }
    if (this._dsTrigEnabled && this._dsTrigDetector.justTriggered && this._dsPartEnabled) {
      this._ds.triggerBurst();
    }
    if (this._oralShiftEnabled && this._oralShiftDetector.justTriggered) {
      const invC = this._oralShiftCurve > 0 ? 1 / this._oralShiftCurve : 1;
      const equivFrac = Math.pow(Math.max(this._oralShiftT, 0), invC);
      this._oralShiftPhase = 'attack';
      this._oralShiftEnvT = equivFrac * Math.max(this._oralShiftAttack, 1);
    }
    if (this._mbEnabled && this._mbTrigDetector.justTriggered) {
      this._mbTrigEnv = Math.min(1.0, this._mbTrigEnv + 1.0);
    }
  }

  // ─── Ripple spring ODE ─────────────────────────────────────────────────────

  private _addRipple(u: number, v: number, amp: number): void {
    if (this._ripples.length >= 4) this._ripples.shift();
    this._ripples.push({
      epicX: -this._monolithHalfW + u * this._monolithHalfW * 2,
      epicY: -this._monolithHalfH + v * this._monolithHalfH * 2,
      epicZ:  this._monolithHalfD,
      amplitude: amp, velocity: 0, age: 0,
    });
  }

  private _updateRipples(dtS: number): void {
    for (let i = this._ripples.length - 1; i >= 0; i--) {
      const r = this._ripples[i];
      const force = -this._springK * r.amplitude - this._damping * r.velocity;
      r.velocity  += force * dtS;
      r.amplitude += r.velocity * dtS;
      r.age       += dtS;
      if (Math.abs(r.amplitude) < 0.0005 && Math.abs(r.velocity) < 0.0005 && r.age > 0.5)
        this._ripples.splice(i, 1);
    }
  }

  // ─── Draw ──────────────────────────────────────────────────────────────────
  // Draw order to ensure lichen is always visible through the glass:
  //   1. Other faces (back, sides) — depth write ON, establish depth
  //   2. Lichen patches — depth test OFF, always renders on top of back glass
  //   3. Front face glass sheen — depth test OFF, low alpha translucent overlay over lichen
  //   4. Spores — depth test OFF, additive

  private _draw(idleBreath: number): void {
    const gl = this._gl;
    const w = this._canvas.width, h = this._canvas.height;
    if (w === 0 || h === 0) return;

    // Redirect scene to FBO when motion blur or bloom is active
    // MB takes priority (it has its own scene FBO with depth; bloom reads MB accum when both active)
    if (this._mbEnabled) {
      if (!this._mbSceneFBO || w !== this._mbW || h !== this._mbH) {
        this._resizeMBFBOs(w, h);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._mbSceneFBO ?? null);
    } else if (this._bloomEnabled) {
      if (!this._bloomSceneFBO || w !== this._bloomW || h !== this._bloomH) {
        this._resizeBloomFBOs(w, h);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._bloomSceneFBO ?? null);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    const baseR = this._bgGradEnabled ? this._bgGradR : this._bgR;
    const baseG = this._bgGradEnabled ? this._bgGradG : this._bgG;
    const baseB = this._bgGradEnabled ? this._bgGradB : this._bgB;
    const bgR = baseR + (this._bgShiftTargetR - baseR) * this._bgShiftT;
    const bgG = baseG + (this._bgShiftTargetG - baseG) * this._bgShiftT;
    const bgB = baseB + (this._bgShiftTargetB - baseB) * this._bgShiftT;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND);

    // ── Deep Sea background gradient quad ─────────────────────────────────────
    if (this._dsBgEnabled && this._dsBgProg) {
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(false);
      gl.blendFunc(gl.ONE, gl.ZERO); // opaque write
      gl.useProgram(this._dsBgProg);
      const dsTopR = this._bgShiftApplyDsTop ? this._dsBgTopR + (this._bgShiftTargetR - this._dsBgTopR) * this._bgShiftT : this._dsBgTopR;
      const dsTopG = this._bgShiftApplyDsTop ? this._dsBgTopG + (this._bgShiftTargetG - this._dsBgTopG) * this._bgShiftT : this._dsBgTopG;
      const dsTopB = this._bgShiftApplyDsTop ? this._dsBgTopB + (this._bgShiftTargetB - this._dsBgTopB) * this._bgShiftT : this._dsBgTopB;
      const dsBotR = this._bgShiftApplyDsBot ? this._dsBgBotR + (this._bgShiftTargetR - this._dsBgBotR) * this._bgShiftT : this._dsBgBotR;
      const dsBotG = this._bgShiftApplyDsBot ? this._dsBgBotG + (this._bgShiftTargetG - this._dsBgBotG) * this._bgShiftT : this._dsBgBotG;
      const dsBotB = this._bgShiftApplyDsBot ? this._dsBgBotB + (this._bgShiftTargetB - this._dsBgBotB) * this._bgShiftT : this._dsBgBotB;
      gl.uniform3f(gl.getUniformLocation(this._dsBgProg, 'u_colorTop'), dsTopR, dsTopG, dsTopB);
      gl.uniform3f(gl.getUniformLocation(this._dsBgProg, 'u_colorBot'), dsBotR, dsBotG, dsBotB);
      gl.uniform1f(gl.getUniformLocation(this._dsBgProg, 'u_vignette'),  this._dsBgVignette);
      gl.uniform1f(gl.getUniformLocation(this._dsBgProg, 'u_horizonY'),  this._dsBgHorizonY);
      gl.bindVertexArray(this._dsBgVAO);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.bindVertexArray(null);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    } else {
      // Fallback: solid color background
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(false);
      gl.blendFunc(gl.ONE, gl.ZERO);
      gl.clearColor(bgR, bgG, bgB, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }

    // Select active geometry based on mode
    const activeVAO = this._jellyEnabled ? this._jellyVAO : this._monolithVAO;
    const activeGeo = this._jellyEnabled ? this._jellyGeo  : this._geo;

    // Jellyfish propel: translate along Z axis
    const rotM  = makeRotY(this._tilt * Math.PI / 180);
    const model  = this._jellyEnabled
      ? mat4Mul(rotM, makeTranslateZ(this._jellyPropelZ))
      : rotM;
    // Apply store offsets as additional rotations on top of mouse-driven quat
    let _q = this._camQuat;
    if (this._camAzimuthOffset !== 0)
      _q = quatMul(quatAxisAngle(0, 1, 0, this._camAzimuthOffset), _q);
    if (this._camElevationOffset !== 0) {
      const [rx, ry, rz] = quatRotVec(_q, 1, 0, 0);
      _q = quatMul(quatAxisAngle(rx, ry, rz, this._camElevationOffset), _q);
    }
    const _r = this._camRadius + this._camRadiusOffset;
    const [camX, camY, camZ] = quatRotVec(_q, 0, 0, _r);
    const [upX,  upY,  upZ]  = quatRotVec(_q, 0, 1, 0);
    // Pan: negate X/Y so positive = jellyfish shifts right/up; Z is world-space depth offset
    const pX = -this._camPanX, pY = -this._camPanY, pZ = this._camPanZ;
    const view   = lookAt(camX + pX, camY + pY, camZ + pZ, pX, pY, pZ, upX, upY, upZ);
    const proj   = perspective(FOV_Y, w / h, 0.1, 20);
    const mvp    = mat4Mul(mat4Mul(proj, view), model);

    // Pack ripple data once, reuse for both glass passes
    const rippleData = new Float32Array(16);
    const rippleAges = new Float32Array(4);
    for (let i = 0; i < this._ripples.length && i < 4; i++) {
      const r = this._ripples[i];
      rippleData[i*4+0] = r.epicX;
      rippleData[i*4+1] = r.epicY;
      rippleData[i*4+2] = r.epicZ;
      rippleData[i*4+3] = r.amplitude;
      rippleAges[i]     = r.age;
    }
    const rippleCount = Math.min(this._ripples.length, 4);

    const lichenGlow  = this._glowIntensity * this._emissiveSmooth;
    const lightDir    = [this._lightX, this._lightY, 1.2];
    const lightLen    = Math.hypot(...lightDir as [number,number,number]);

    // ── Helper: set MONOLITH_VERT uniforms on any program ──────────────────
    const compressVal = this._jellyEnabled ? Math.max(0, this._jellyCompressT) : 0.0;
    const setVertUniforms = (prog: WebGLProgram): void => {
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'u_MVP'),         false, mvp);
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'u_modelMatrix'), false, model);
      gl.uniform1f(gl.getUniformLocation(prog, 'u_time'),       this._elapsed);
      gl.uniform1f(gl.getUniformLocation(prog, 'u_idleBreath'), idleBreath);
      gl.uniform4fv(gl.getUniformLocation(prog, 'u_rippleParams[0]'), rippleData);
      gl.uniform1fv(gl.getUniformLocation(prog, 'u_rippleAges[0]'),   rippleAges);
      gl.uniform1i(gl.getUniformLocation(prog, 'u_rippleCount'),  rippleCount);
      gl.uniform1f(gl.getUniformLocation(prog, 'u_organicStr'),   this._organicStr);
      gl.uniform1f(gl.getUniformLocation(prog, 'u_compress'),     compressVal);
    };

    // ── Helper: set MONOLITH_FRAG glass uniforms ────────────────────────────
    const mp = this._monolithProg;
    const setMonolithUniforms = (opacityMult: number): void => {
      setVertUniforms(mp);
      gl.uniform1f(gl.getUniformLocation(mp, 'u_lichenGlow'),  lichenGlow);
      gl.uniform3f(gl.getUniformLocation(mp, 'u_cameraPos'),   camX, camY, camZ);
      gl.uniform1f(gl.getUniformLocation(mp, 'u_opacityMult'), opacityMult);
      gl.uniform1f(gl.getUniformLocation(mp, 'u_fresnelStr'),  this._glassFresnel);
      gl.uniform1f(gl.getUniformLocation(mp, 'u_specStr'),     this._glassSpecular);
      gl.uniform1f(gl.getUniformLocation(mp, 'u_iridStr'),     this._glassIrid);
      const st = this._jellyShiftT;
      gl.uniform3f(gl.getUniformLocation(mp, 'u_glassTint'),
        this._glassTintR + (this._jellyShiftTargetR - this._glassTintR) * st,
        this._glassTintG + (this._jellyShiftTargetG - this._glassTintG) * st,
        this._glassTintB + (this._jellyShiftTargetB - this._glassTintB) * st);
      gl.uniform3f(gl.getUniformLocation(mp, 'u_lightDir'),    lightDir[0]/lightLen, lightDir[1]/lightLen, lightDir[2]/lightLen);
      gl.uniform1i(gl.getUniformLocation(mp, 'u_caEnabled'),   this._caEnabled ? 1 : 0);
      gl.uniform1f(gl.getUniformLocation(mp, 'u_caIntensity'), this._caIntensity);
      gl.uniform1f(gl.getUniformLocation(mp, 'u_caFreq'),      this._caFreq);
      gl.uniform3f(gl.getUniformLocation(mp, 'u_caCol1'),      this._caCol1R, this._caCol1G, this._caCol1B);
      gl.uniform3f(gl.getUniformLocation(mp, 'u_caCol2'),      this._caCol2R, this._caCol2G, this._caCol2B);
    };

    const total = activeGeo.totalIndexCount;

    // ── Pass 1: Far glass (back-facing from camera) ────────────────────────
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
    gl.depthMask(false);
    gl.enable(gl.DEPTH_TEST);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(mp);
    setMonolithUniforms(this._glassOpacity);

    gl.bindVertexArray(activeVAO);
    gl.drawElements(gl.TRIANGLES, total, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);

    // ── Pass 1b: Tentacles (when jelly enabled) ────────────────────────────
    if (this._jellyEnabled && this._tentEnabled) {
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      // Shared tint (applies jelly tint shift to both modes)
      const tintR = this._tentTintR + (this._jellyShiftTargetR - this._tentTintR) * this._jellyShiftT;
      const tintG = this._tentTintG + (this._jellyShiftTargetG - this._tentTintG) * this._jellyShiftT;
      const tintB = this._tentTintB + (this._jellyShiftTargetB - this._tentTintB) * this._jellyShiftT;

      if (this._physMode && this._physProg && this._physChain.ready) {
        // ── Physics ribbon mode ──────────────────────────────────────────
        this._buildPhysicsRibbon(camX, camY, camZ);

        gl.disable(gl.CULL_FACE);
        const pp = this._physProg;
        gl.useProgram(pp);
        gl.uniformMatrix4fv(gl.getUniformLocation(pp, 'u_MVP'),  false, mvp);
        gl.uniform1f(gl.getUniformLocation(pp, 'u_time'),        this._elapsed);
        gl.uniform3f(gl.getUniformLocation(pp, 'u_tintColor'),   tintR, tintG, tintB);
        gl.uniform1f(gl.getUniformLocation(pp, 'u_tintBlend'),   this._tentTintBl);
        gl.uniform1f(gl.getUniformLocation(pp, 'u_opacity'),     this._tentOpacity);
        gl.uniform1f(gl.getUniformLocation(pp, 'u_iridStr'),     this._tentIridStr);

        gl.bindVertexArray(this._physVAO);
        const vertsPerTent = this._physSegs * 2; // 2 verts per ring (left + right)
        for (let t = 0; t < this._tentCount; t++) {
          gl.drawArrays(gl.TRIANGLE_STRIP, t * vertsPerTent, vertsPerTent);
        }
        gl.bindVertexArray(null);

      } else if (!this._physMode && this._tentacleProg && this._tentacleGeo?.indexCount > 0) {
        // ── Tube (shader-driven) mode ────────────────────────────────────
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        const tp = this._tentacleProg;
        gl.useProgram(tp);
        gl.uniformMatrix4fv(gl.getUniformLocation(tp, 'u_MVP'),         false, mvp);
        gl.uniformMatrix4fv(gl.getUniformLocation(tp, 'u_modelMatrix'), false, model);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_time'),         this._elapsed);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_compress'),     compressVal);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_propelZ'),      this._jellyPropelZ);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_halfW'),        this._monolithHalfW);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_halfH'),        this._monolithHalfH);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_halfD'),        this._monolithHalfD);
        gl.uniform1i(gl.getUniformLocation(tp, 'u_tentCount'),    this._tentCount);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_tentLength'),   this._tentLength);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_tentRadius'),   this._tentRadius);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_tentWaveAmp'),  this._tentWaveAmp);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_tentWaveFreq'), this._tentWaveFreq);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_tentWaveSpeed'), this._tentWaveSpd);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_tentSplay'),    this._tentSplay);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_tentAttachY'),  this._tentAttachY);
        gl.uniform3f(gl.getUniformLocation(tp, 'u_tintColor'),    tintR, tintG, tintB);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_tintBlend'),    this._tentTintBl);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_tentOffsetX'), this._tentOffsetX);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_tentOffsetY'), this._tentOffsetY);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_tentOffsetZ'), this._tentOffsetZ);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_idleAmp'),     this._tentIdleAmp);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_idleSpeed'),   this._tentIdleSpeed);
        const rippleEnergy = this._ripples.reduce((s, r) => s + Math.abs(r.amplitude), 0);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_rippleEnergy'), rippleEnergy);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_rippleResp'),   this._tentRippleResp);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_opacity'),      this._tentOpacity);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_lightX'),       this._lightX);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_lightY'),       this._lightY);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_iridStr'),      this._tentIridStr);
        gl.uniform1f(gl.getUniformLocation(tp, 'u_ringSpread'),   this._physChain.cfg.ringSpread);

        gl.bindVertexArray(this._tentacleVAO);
        gl.drawElements(gl.TRIANGLES, this._tentacleGeo.indexCount, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
      }
    }

    // ── Pass 1c: Oral arms ───────────────────────────────────────────────────
    if (this._oralEnabled && this._jellyEnabled && this._oralProg && this._oralChain.ready) {
      this._buildOralArmRibbon(camX, camY, camZ);
      gl.disable(gl.CULL_FACE);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      const op = this._oralProg;
      gl.useProgram(op);
      gl.uniformMatrix4fv(gl.getUniformLocation(op, 'u_MVP'),  false, mvp);
      gl.uniform1f(gl.getUniformLocation(op, 'u_time'),        this._elapsed);
      const oralST = this._oralShiftT;
      gl.uniform3f(gl.getUniformLocation(op, 'u_tintColor'),
        this._oralTintR + (this._oralShiftTargetR - this._oralTintR) * oralST,
        this._oralTintG + (this._oralShiftTargetG - this._oralTintG) * oralST,
        this._oralTintB + (this._oralShiftTargetB - this._oralTintB) * oralST);
      gl.uniform1f(gl.getUniformLocation(op, 'u_tintBlend'),   this._oralTintBl);
      gl.uniform1f(gl.getUniformLocation(op, 'u_opacity'),     this._oralOpacity);
      gl.uniform1f(gl.getUniformLocation(op, 'u_iridStr'),     this._oralIridStr);
      gl.uniform3f(gl.getUniformLocation(op, 'u_edgeTint'),    this._oralEdgeTintR, this._oralEdgeTintG, this._oralEdgeTintB);
      gl.uniform1f(gl.getUniformLocation(op, 'u_edgeBlend'),   this._oralEdgeBlend);

      gl.bindVertexArray(this._oralVAO);
      const vertsPerStrip = this._oralSegs * 2;
      for (let a = 0; a < this._oralCount; a++) {
        for (let s = 0; s < 3; s++) { // body + left frill + right frill
          gl.drawArrays(gl.TRIANGLE_STRIP, (a * 3 + s) * vertsPerStrip, vertsPerStrip);
        }
      }
      gl.bindVertexArray(null);
    }

    // ── Pass 2: Foliage (depth OFF, additive glow — visible through glass) ────
    // Foliage is cube-face-mapped so skip it in jellyfish mode
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);  // additive: overlapping nodes accumulate glow

    if (this._foliageEnabled && this._nodes.length > 0 && !this._jellyEnabled) {
      const instBuf = buildInstanceBuffer(this._nodes);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._lichenInstVBO);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, instBuf);

      gl.useProgram(this._lichenProg);
      const lp = this._lichenProg;
      // Ripple / organic / breath — reuses the same helper that drives the glass shader
      setVertUniforms(lp);
      gl.uniform1f(gl.getUniformLocation(lp, 'u_halfW'),     this._monolithHalfW);
      gl.uniform1f(gl.getUniformLocation(lp, 'u_halfH'),     this._monolithHalfH);
      gl.uniform1f(gl.getUniformLocation(lp, 'u_halfD'),     this._monolithHalfD);
      gl.uniform3f(gl.getUniformLocation(lp, 'u_warmColor'), this._warmR, this._warmG, this._warmB);
      gl.uniform3f(gl.getUniformLocation(lp, 'u_coolColor'), this._coolR, this._coolG, this._coolB);

      gl.bindVertexArray(this._lichenVAO);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this._nodes.length);
      gl.bindVertexArray(null);
    }

    // ── Pass 2.5: Inner membrane (back then front) ────────────────────────
    if (this._jellyEnabled && this._memEnabled && this._membraneProg) {
      const memTintR = this._memTintR + (this._memShiftTargetR - this._memTintR) * this._memShiftT;
      const memTintG = this._memTintG + (this._memShiftTargetG - this._memTintG) * this._memShiftT;
      const memTintB = this._memTintB + (this._memShiftTargetB - this._memTintB) * this._memShiftT;
      const emitPulse = this._emissiveSmooth * this._memPulseStr;
      const mpp = this._membraneProg;

      // Pre-scale ripple epicentres by _memScale so the membrane shader
      // receives coordinates already in membrane space (bug #9 fix).
      const memRippleData = new Float32Array(16);
      for (let i = 0; i < rippleCount; i++) {
        memRippleData[i*4+0] = rippleData[i*4+0] * this._memScale;
        memRippleData[i*4+1] = rippleData[i*4+1] * this._memScale;
        memRippleData[i*4+2] = rippleData[i*4+2] * this._memScale;
        memRippleData[i*4+3] = rippleData[i*4+3]; // amplitude unchanged
      }

      const setMemUniforms = (opMult: number): void => {
        setVertUniforms(mpp);
        // Override ripple params with pre-scaled epicentres for the membrane pass
        gl.uniform4fv(gl.getUniformLocation(mpp, 'u_rippleParams[0]'), memRippleData);
        gl.uniform3f(gl.getUniformLocation(mpp, 'u_cameraPos'),  camX, camY, camZ);
        gl.uniform1f(gl.getUniformLocation(mpp, 'u_opacityMult'), opMult);
        gl.uniform1f(gl.getUniformLocation(mpp, 'u_fresnelStr'),  this._memFresnel);
        gl.uniform1f(gl.getUniformLocation(mpp, 'u_specStr'),     this._memSpecular);
        gl.uniform1f(gl.getUniformLocation(mpp, 'u_iridStr'),     this._memIrid);
        gl.uniform3f(gl.getUniformLocation(mpp, 'u_memTint'),     memTintR, memTintG, memTintB);
        gl.uniform3f(gl.getUniformLocation(mpp, 'u_lightDir'),    lightDir[0]/lightLen, lightDir[1]/lightLen, lightDir[2]/lightLen);
        gl.uniform1f(gl.getUniformLocation(mpp, 'u_emission'),    this._memEmission);
        gl.uniform1f(gl.getUniformLocation(mpp, 'u_emitPulse'),   emitPulse);
        gl.uniform1f(gl.getUniformLocation(mpp, 'u_memScale'),    this._memScale);
      };

      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      // Far membrane (back-facing from camera)
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.FRONT);
      gl.useProgram(mpp);
      setMemUniforms(this._memOpacity);
      gl.bindVertexArray(activeVAO);
      gl.drawElements(gl.TRIANGLES, total, gl.UNSIGNED_SHORT, 0);
      gl.bindVertexArray(null);

      // Near membrane (front-facing from camera)
      gl.cullFace(gl.BACK);
      setMemUniforms(this._memFrontOp);
      gl.bindVertexArray(activeVAO);
      gl.drawElements(gl.TRIANGLES, total, gl.UNSIGNED_SHORT, 0);
      gl.bindVertexArray(null);
    }

    // ── Pass 3: Near glass (front-facing from camera) ─────────────────────
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(mp);
    setMonolithUniforms(this._glassFrontOpacity);

    gl.bindVertexArray(activeVAO);
    gl.drawElements(gl.TRIANGLES, total, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);

    // ── Pass 4: Wireframe overlay ─────────────────────────────────────────
    if (this._wireEnabled) {
      gl.disable(gl.CULL_FACE);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(this._wireProg);
      setVertUniforms(this._wireProg);
      const wp = this._wireProg;
      gl.uniform4f(gl.getUniformLocation(wp, 'u_wireColor'), this._wireR, this._wireG, this._wireB, this._wireA);
      gl.uniform1f(gl.getUniformLocation(wp, 'u_wireWidth'), this._wireWidth);
      gl.bindVertexArray(activeVAO);
      gl.drawElements(gl.TRIANGLES, total, gl.UNSIGNED_SHORT, 0);
      gl.bindVertexArray(null);
    }

    // ── Pass 5: Spores (additive) ─────────────────────────────────────────
    const sporeCount = getActiveCount;
    if (sporeCount > 0) {
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

      const sporeBuf = packGpuBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this._sporeVBO);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, sporeBuf.subarray(0, sporeCount * GPU_STRIDE));

      gl.useProgram(this._sporeProg);
      const sp = this._sporeProg;
      gl.uniformMatrix4fv(gl.getUniformLocation(sp, 'u_MVP'),       false, mvp);
      gl.uniform1f(gl.getUniformLocation(sp, 'u_sizeScale'),        this._sporeSize);
      gl.uniform3f(gl.getUniformLocation(sp, 'u_warmColor'),        this._warmR, this._warmG, this._warmB);
      gl.uniform3f(gl.getUniformLocation(sp, 'u_coolColor'),        this._coolR, this._coolG, this._coolB);

      gl.bindVertexArray(this._sporeVAO);
      gl.drawArrays(gl.POINTS, 0, sporeCount);
      gl.bindVertexArray(null);
    }

    // ── Pass 6: Deep Sea particles (additive, depth-tested, no depth write) ──
    if (this._dsPartEnabled && this._dsPartProg && this._ds.aliveCount > 0) {
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(false);
      gl.blendFunc(gl.ONE, gl.ONE);  // additive blending for bioluminescent glow
      gl.disable(gl.CULL_FACE);
      const pv = mat4Mul(proj, view); // world-space PV (no model rotation)
      gl.useProgram(this._dsPartProg);
      const dp = this._dsPartProg;
      gl.uniformMatrix4fv(gl.getUniformLocation(dp, 'u_PV'),        false, pv);
      gl.uniform1f(gl.getUniformLocation(dp, 'u_baseSize'),         this._ds.partSize);
      gl.uniform1f(gl.getUniformLocation(dp, 'u_fogDensity'),       this._ds.fogDensity);
      gl.uniform3f(gl.getUniformLocation(dp, 'u_colorA'),           this._ds.colAR, this._ds.colAG, this._ds.colAB);
      gl.uniform3f(gl.getUniformLocation(dp, 'u_colorB'),           this._ds.colBR, this._ds.colBG, this._ds.colBB);
      gl.uniform1f(gl.getUniformLocation(dp, 'u_ambientGlow'),      this._ds.ambientGlow);
      gl.bindVertexArray(this._dsPartVAO);
      gl.drawArrays(gl.POINTS, 0, this._ds.aliveCount);
      gl.bindVertexArray(null);
      gl.depthMask(true);
    }

    gl.disable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
  }

  private _applyBloom(sceneTexOverride: WebGLTexture | null = null): void {
    if (!this._bloomEnabled || !this._bloomThreshProg || !this._bloomBlurProg || !this._bloomCompProg) return;
    // When MB is active, bloom reads the accumulated frame; otherwise the dedicated bloom scene FBO
    const sceneTex = sceneTexOverride ?? this._bloomSceneTex;
    if (!sceneTex) return;
    const gl = this._gl;
    // Use MB dimensions when MB is active (it owns the scene), otherwise bloom dimensions
    const w = this._mbEnabled ? this._mbW : this._bloomW;
    const h = this._mbEnabled ? this._mbH : this._bloomH;
    const hw = Math.max(1, w >> 1), hh = Math.max(1, h >> 1);

    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.blendFunc(gl.ONE, gl.ZERO);
    gl.bindVertexArray(this._dsBgVAO);

    // Pass A — threshold extraction (scene → bright, half res)
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._bloomBrightFBO);
    gl.viewport(0, 0, hw, hh);
    gl.useProgram(this._bloomThreshProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneTex);
    gl.uniform1i(this._bloomUnif_thresh_uScene, 0);
    gl.uniform1f(this._bloomUnif_thresh_uThreshold, this._bloomThreshold);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Passes B+C — separable Gaussian blur (ping-pong)
    let srcTex: WebGLTexture = this._bloomBrightTex!;
    for (let p = 0; p < this._bloomPasses; p++) {
      // H blur: src → ping
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._bloomPingFBO);
      gl.useProgram(this._bloomBlurProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, srcTex);
      gl.uniform1i(this._bloomUnif_blur_uTex, 0);
      gl.uniform2f(this._bloomUnif_blur_uTexelDir, this._bloomRadius / hw, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // V blur: ping → pong
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._bloomPongFBO);
      gl.bindTexture(gl.TEXTURE_2D, this._bloomPingTex);
      gl.uniform2f(this._bloomUnif_blur_uTexelDir, 0, this._bloomRadius / hh);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      srcTex = this._bloomPongTex!;
    }

    // Pass D — composite (scene + pong → default framebuffer)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w, h);
    gl.useProgram(this._bloomCompProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneTex);
    gl.uniform1i(this._bloomUnif_comp_uScene, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, srcTex);
    gl.uniform1i(this._bloomUnif_comp_uBloom, 1);
    gl.uniform1f(this._bloomUnif_comp_uStrength, this._bloomStrength);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindVertexArray(null);
    gl.activeTexture(gl.TEXTURE0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
  }

  // ─── Motion blur ───────────────────────────────────────────────────────────

  private _applyMotionBlur(): void {
    if (!this._mbAccumProg || !this._mbBlitProg) return;
    if (!this._mbSceneTex || !this._mbAccumTex || !this._mbPingTex) return;
    const gl = this._gl;
    const w = this._mbW, h = this._mbH;

    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(this._dsBgVAO);

    // Seed accumulation buffer on first frame (blend=1 → full new frame, no ghost)
    if (!this._mbAccumInit) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._mbAccumFBO);
      gl.viewport(0, 0, w, h);
      gl.useProgram(this._mbBlitProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this._mbSceneTex);
      gl.uniform1i(this._mbUnif_blit_uTex, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      this._mbAccumInit = true;
    } else {
      // Compute blend factor: low = more persistence (longer trail)
      const base  = 1.0 - this._mbStrength;
      const boost = this._mbTrigEnv * this._mbTriggerBoost;
      const blend = Math.max(0.02, Math.min(0.98, base * (this._mbReverseBoost ? 1.0 + boost : 1.0 - boost)));

      // Softness: pre-blur the accumulation buffer (H then V, ping-pong back to accum)
      if (this._mbSoftness > 0 && this._mbBlurProg) {
        const radius = this._mbSoftness * 4.0;
        // H pass: _mbAccumTex → _mbPingFBO
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._mbPingFBO);
        gl.viewport(0, 0, w, h);
        gl.useProgram(this._mbBlurProg);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._mbAccumTex);
        gl.uniform1i(this._mbUnif_blur_uTex, 0);
        gl.uniform2f(this._mbUnif_blur_uTexelDir, radius / w, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        // V pass: _mbPingTex → _mbAccumFBO (writes blurred result back into accum)
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._mbAccumFBO);
        gl.bindTexture(gl.TEXTURE_2D, this._mbPingTex);
        gl.uniform2f(this._mbUnif_blur_uTexelDir, 0, radius / h);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      // Blend: mix(accum, scene, blend) → _mbPingFBO
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._mbPingFBO);
      gl.viewport(0, 0, w, h);
      gl.useProgram(this._mbAccumProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this._mbAccumTex);
      gl.uniform1i(this._mbUnif_accum_uAccum, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this._mbSceneTex);
      gl.uniform1i(this._mbUnif_accum_uScene, 1);
      gl.uniform1f(this._mbUnif_accum_uBlend, blend);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Swap: blit _mbPingTex → _mbAccumFBO (accum now holds new blended result)
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._mbAccumFBO);
      gl.useProgram(this._mbBlitProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this._mbPingTex);
      gl.uniform1i(this._mbUnif_blit_uTex, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // Output to screen only when bloom is not compositing (bloom will read _mbAccumTex instead)
    if (!this._bloomEnabled) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      gl.useProgram(this._mbBlitProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this._mbAccumTex);
      gl.uniform1i(this._mbUnif_blit_uTex, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    gl.bindVertexArray(null);
    gl.activeTexture(gl.TEXTURE0);
    gl.enable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
  }

  // ─── Shader helpers ────────────────────────────────────────────────────────

  private _buildProgram(vertSrc: string, fragSrc: string): WebGLProgram {
    const gl = this._gl;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, this._compileShader(gl.VERTEX_SHADER,   vertSrc));
    gl.attachShader(prog, this._compileShader(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      throw new Error('LichenRenderer: link error: ' + gl.getProgramInfoLog(prog));
    return prog;
  }

  private _compileShader(type: number, src: string): WebGLShader {
    const gl = this._gl;
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
      throw new Error('LichenRenderer: shader compile:\n' + gl.getShaderInfoLog(sh));
    return sh;
  }
}
