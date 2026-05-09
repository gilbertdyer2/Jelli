import { writable } from 'svelte/store';

// ─── Lichen / spore behaviour ─────────────────────────────────────────────────
export const LICHEN_DECAY_RATE      = writable(1.00000);  // health/ms passive drain
export const LICHEN_MAX_PATCHES     = writable(24);        // max simultaneous patches
export const LICHEN_GLOW_INTENSITY  = writable(1.0);       // emissive multiplier
export const LICHEN_SPORE_COUNT     = writable(5);       // max spores per high-freq burst
export const LICHEN_RIPPLE_SPRING_K = writable(5.0);      // displacement spring stiffness
export const LICHEN_RIPPLE_DAMPING  = writable(20.2);       // displacement spring damping
export const LICHEN_MONOLITH_TILT   = writable(8);         // Y-axis rotation degrees
export const CAM_AZIMUTH_OFFSET   = writable(0);    // orbital camera azimuth offset (radians)
export const CAM_ELEVATION_OFFSET = writable(0);    // orbital camera elevation offset (radians)
export const CAM_RADIUS_OFFSET    = writable(0);    // orbital camera radius offset (world units)
export const CAM_PAN_X            = writable(0);    // screen pan X: positive shifts jellyfish right
export const CAM_PAN_Y            = writable(0);    // screen pan Y: positive shifts jellyfish up
export const CAM_PAN_Z            = writable(0);    // world pan Z: positive shifts jellyfish toward camera
export const LICHEN_SPORE_DRIFT     = writable(1.0);       // noise-field strength multiplier
export const LICHEN_SPORE_SIZE      = writable(1.0);       // point size scale

// ─── Glass visual properties ──────────────────────────────────────────────────
export const LICHEN_GLASS_OPACITY       = writable(0.61);  // back/sides overall opacity
export const LICHEN_GLASS_FRONT_OPACITY = writable(0.73);  // front-face sheen over lichen
export const LICHEN_GLASS_FRESNEL       = writable(2.0);   // fresnel strength multiplier
export const LICHEN_GLASS_SPECULAR      = writable(1.4);   // specular intensity
export const LICHEN_GLASS_IRIDESCENCE   = writable(0.09);  // iridescence blend (0–1)
export const LICHEN_GLASS_TINT_R        = writable(0.8000);
export const LICHEN_GLASS_TINT_G        = writable(0.8627);
export const LICHEN_GLASS_TINT_B        = writable(0.8980);
export const LICHEN_LIGHT_X             = writable(2.0);   // key light direction X
export const LICHEN_LIGHT_Y             = writable(-0.9);   // key light direction Y

// ─── Lichen patch colors ──────────────────────────────────────────────────────
export const LICHEN_WARM_R = writable(0.85);  // warm (amber) lichen color
export const LICHEN_WARM_G = writable(0.55);
export const LICHEN_WARM_B = writable(0.08);
export const LICHEN_COOL_R = writable(0.12);  // cool (cyan) lichen color
export const LICHEN_COOL_G = writable(0.88);
export const LICHEN_COOL_B = writable(0.75);

// ─── Monolith dimensions (full W/H/D) ────────────────────────────────────────
export const LICHEN_MONOLITH_W = writable(0.40);  // full width
export const LICHEN_MONOLITH_H = writable(0.40);  // full height
export const LICHEN_MONOLITH_D = writable(0.35);  // full depth

// ─── Beat detector target frequencies ────────────────────────────────────────
export const LICHEN_BASS_HZ               = writable(90);     // bass ripple detector
export const LICHEN_BASS_RANGE_HZ         = writable(30);
export const LICHEN_BASS_OCTAVES          = writable(1);
export const LICHEN_BASS_TRIGGER_DURATION = writable(8);
export const LICHEN_BASS_WINDOW           = writable(9);
export const LICHEN_MID_HZ                = writable(800);    // lichen growth detector
export const LICHEN_MID_RANGE_HZ          = writable(200);
export const LICHEN_MID_OCTAVES           = writable(2);
export const LICHEN_MID_TRIGGER_DURATION  = writable(6);
export const LICHEN_MID_WINDOW            = writable(9);
export const LICHEN_HIGH_HZ               = writable(11000);  // spore burst detector
export const LICHEN_HIGH_RANGE_HZ         = writable(500);
export const LICHEN_HIGH_OCTAVES          = writable(2);
export const LICHEN_HIGH_TRIGGER_DURATION = writable(6);
export const LICHEN_HIGH_WINDOW           = writable(9);

// ─── Organic deformation ──────────────────────────────────────────────────────
export const LICHEN_ORGANIC_STR = writable(1.0);  // 0..2, organic noise amplitude

// ─── Wireframe overlay ────────────────────────────────────────────────────────
export const LICHEN_WIRE_ENABLED = writable(false);
export const LICHEN_WIRE_R       = writable(0.4);
export const LICHEN_WIRE_G       = writable(0.8);
export const LICHEN_WIRE_B       = writable(1.0);
export const LICHEN_WIRE_A       = writable(0.8);
export const LICHEN_WIRE_WIDTH   = writable(1.5);   // pixel width

// ─── Chromatic aberration ─────────────────────────────────────────────────────
export const LICHEN_CA_ENABLED   = writable(true);
export const LICHEN_CA_INTENSITY = writable(1.45);   // 0..3
export const LICHEN_CA_FREQ      = writable(1.2);   // pulse rate
export const LICHEN_CA_COL1_R    = writable(0.1255);
export const LICHEN_CA_COL1_G    = writable(0.4039);
export const LICHEN_CA_COL1_B    = writable(0.5725);
export const LICHEN_CA_COL2_R    = writable(0.9686);
export const LICHEN_CA_COL2_G    = writable(0.9686);
export const LICHEN_CA_COL2_B    = writable(0.9696);

// ─── Scene ────────────────────────────────────────────────────────────────────
export const LICHEN_BG_R = writable(0.0078);
export const LICHEN_BG_G = writable(0.0824);
export const LICHEN_BG_B = writable(0.1333);

// ─── Jellyfish tentacles ──────────────────────────────────────────────────────
export const JELLY_TENT_ENABLED   = writable(true);
export const JELLY_TENT_COUNT     = writable(11);      // number of tentacles (1–12)
export const JELLY_TENT_SEGS      = writable(21);     // segments along each tentacle
export const JELLY_TENT_RING      = writable(6);      // tube cross-section sides
export const JELLY_TENT_LENGTH    = writable(0.9);    // world-unit length
export const JELLY_TENT_RADIUS    = writable(0.008);  // tube radius at base
export const JELLY_TENT_WAVE_AMP  = writable(0.10);  // lateral wave amplitude
export const JELLY_TENT_WAVE_FREQ = writable(0.9);   // wavelength cycles along length
export const JELLY_TENT_WAVE_SPD  = writable(0.3);   // wave animation speed
export const JELLY_TENT_SPLAY     = writable(0.15);   // compress splay multiplier
export const JELLY_TENT_ATTACH_Y  = writable(0.6);   // attachment depth (0=equator,1=bottom)
export const JELLY_TENT_OPACITY   = writable(0.61);
export const JELLY_TENT_IRID_STR  = writable(0.35);   // iridescence rim strength
export const JELLY_TENT_TINT_R    = writable(0.4196);   // tint color R
export const JELLY_TENT_TINT_G    = writable(0.4784);   // tint color G
export const JELLY_TENT_TINT_B    = writable(0.7216);   // tint color B
export const JELLY_TENT_TINT_BL   = writable(1.0);  // tint blend (0=pure irid,1=pure tint)
export const JELLY_TENT_IDLE_AMP   = writable(0.04);  // idle sway amplitude (world units)
export const JELLY_TENT_IDLE_SPEED = writable(0.4);   // idle sway speed (same scale as wave speed)
export const JELLY_TENT_RIPPLE_RESP = writable(1.0);  // how much cube ripples drive tentacle sway
export const JELLY_TENT_OFFSET_X  = writable(0.0);   // world-space position offset X
export const JELLY_TENT_OFFSET_Y  = writable(0.0);   // world-space position offset Y
export const JELLY_TENT_OFFSET_Z  = writable(-0.07);   // world-space position offset Z

// ─── Tentacle physics (chain) mode ────────────────────────────────────────────
export const JELLY_TENT_PHYS_MODE         = writable(true);
export const JELLY_TENT_PHYS_SEGS         = writable(27);     // particles per chain (root included)
export const JELLY_TENT_PHYS_SEGLEN       = writable(0.03);   // rest distance between particles (world units)
export const JELLY_TENT_PHYS_GRAVITY      = writable(0.00005);// downward pull (world units / ms²)
export const JELLY_TENT_PHYS_DAMPING      = writable(0.4);   // velocity retention per 60 fps frame
export const JELLY_TENT_PHYS_JITTER       = writable(0.00005); // coherent drift amplitude (world units / ms)
export const JELLY_TENT_PHYS_WIDTH        = writable(0.004); // ribbon half-width at root (world units)
export const JELLY_TENT_PHYS_HEIGHT       = writable(0.004);   // ribbon height offset at root (world units)
export const JELLY_TENT_PHYS_WHIP         = writable(0.10);   // beat whip impulse (world units)
export const JELLY_TENT_PHYS_SPREAD_BOOST = writable(1.30);   // attachment spread multiplier on beat
export const JELLY_TENT_PHYS_SPREAD_DECAY = writable(0.988);  // spread decay per 60 fps frame
export const JELLY_TENT_PHYS_GRAVITY_AZ   = writable(0);      // gravity azimuth degrees (0–360)
export const JELLY_TENT_PHYS_GRAVITY_EL   = writable(0);      // gravity elevation degrees (-90 down, +90 up)
export const JELLY_TENT_RING_SPREAD       = writable(0.0);    // ± radians of random spread from equidistant ring

// ─── Oral arms ────────────────────────────────────────────────────────────────
export const ORAL_ENABLED      = writable(true);
export const ORAL_COUNT        = writable(4);
export const ORAL_SEGS         = writable(13);
export const ORAL_SEGLEN       = writable(0.115);
export const ORAL_WIDTH        = writable(0.025);    // main ribbon half-width at root
export const ORAL_HEIGHT       = writable(0.025);      // ribbon height offset at root (world units)
export const ORAL_GRAVITY      = writable(0.00005);
export const ORAL_GRAVITY_AZ   = writable(0);
export const ORAL_GRAVITY_EL   = writable(0);
export const ORAL_DAMPING      = writable(0.4);
export const ORAL_JITTER       = writable(0.00007);
export const ORAL_WHIP         = writable(0.06);
export const ORAL_ATTACH_Y     = writable(0.0);    // attachment ring radius (0=center,1=full face)
export const ORAL_SPREAD_BOOST = writable(1.1);   // attachment spread multiplier on beat
export const ORAL_SPREAD_DECAY = writable(0.988);  // spread decay per 60 fps frame
export const ORAL_BEAT_HZ       = writable(1000);    // dedicated oral arm beat detector Hz
export const ORAL_BEAT_RANGE_HZ = writable(250);
export const ORAL_OPACITY      = writable(0.70);
export const ORAL_TINT_R       = writable(0.2275);
export const ORAL_TINT_G       = writable(0.2980);
export const ORAL_TINT_B       = writable(0.5098);
export const ORAL_TINT_BL      = writable(0.75);
export const ORAL_IRID_STR     = writable(0.0);
export const ORAL_FRILL_AMP    = writable(1.25);     // frill extent as multiplier of main width
export const ORAL_FRILL_FREQ   = writable(3.5);     // scallop cycles along arm length
export const ORAL_FRILL_SPEED  = writable(0.7);     // frill animation speed multiplier
export const ORAL_EDGE_TINT_R  = writable(1.0);
export const ORAL_EDGE_TINT_G  = writable(1.0);
export const ORAL_EDGE_TINT_B  = writable(1.0);
export const ORAL_EDGE_BLEND   = writable(1.0);     // 0=no edge tint, 1=full edge tint

// ─── Oral arm tint shift (triggered) ─────────────────────────────────────────
export const ORAL_TINT_SHIFT_ENABLED          = writable(true);
export const ORAL_TINT_SHIFT_HZ               = writable(1000);
export const ORAL_TINT_SHIFT_RANGE_HZ         = writable(250);
export const ORAL_TINT_SHIFT_OCTAVES          = writable(2);
export const ORAL_TINT_SHIFT_TRIGGER_DURATION = writable(8);
export const ORAL_TINT_SHIFT_WINDOW           = writable(9);
export const ORAL_TINT_SHIFT_TARGET_R         = writable(0.5843);
export const ORAL_TINT_SHIFT_TARGET_G         = writable(0.5176);
export const ORAL_TINT_SHIFT_TARGET_B         = writable(0.8235);
export const ORAL_TINT_SHIFT_ATTACK           = writable(60);   // ms
export const ORAL_TINT_SHIFT_DECAY            = writable(500);  // ms
export const ORAL_TINT_SHIFT_CURVE            = writable(1.0);

// ─── Oral arm DNA twist ───────────────────────────────────────────────────────
export const ORAL_TWIST_STR  = writable(0.0);   // twist strength (0=none, full rotation in radians)
export const ORAL_TWIST_FREQ = writable(2.0);   // twist cycles along arm length
export const ORAL_TWIST_RAND = writable(0.5);   // per-arm random phase offset (0=all same, 1=random)

// ─── Jellyfish mode ───────────────────────────────────────────────────────────
export const JELLY_ENABLED        = writable(true);
export const JELLY_ROUNDNESS      = writable(2.0);   // n param: 2=sphere, 10=near-cube
export const JELLY_PROPEL_STR     = writable(0.08);   // peak propel Z displacement
export const JELLY_PROPEL_ATTACK  = writable(0);    // attack time (ms)
export const JELLY_PROPEL_DECAY   = writable(220);   // decay time (ms)
export const JELLY_PROPEL_CURVE   = writable(1.15);   // ramp exponent (1=linear, <1=fast-in, >1=slow-in)
export const JELLY_COMPRESS_STR   = writable(0.71);   // compress impulse strength
export const JELLY_SPRING_K       = writable(8.0);   // spring stiffness
export const JELLY_SPRING_DAMPING = writable(1.4);   // spring damping

// ─── Background color shift (triggered) ──────────────────────────────────────
export const LICHEN_BG_SHIFT_ENABLED  = writable(true);
export const LICHEN_BG_SHIFT_HZ       = writable(3000);
export const LICHEN_BG_SHIFT_RANGE_HZ = writable(20);
export const LICHEN_BG_SHIFT_TARGET_R = writable(0.0157);
export const LICHEN_BG_SHIFT_TARGET_G = writable(0.1059);
export const LICHEN_BG_SHIFT_TARGET_B = writable(0.1647);
export const LICHEN_BG_SHIFT_ATTACK         = writable(170);  // ms
export const LICHEN_BG_SHIFT_DECAY          = writable(1530);  // ms
export const LICHEN_BG_SHIFT_CURVE          = writable(1.6);  // ramp exponent
export const LICHEN_BG_SHIFT_APPLY_DS_TOP   = writable(false); // apply shift to deep sea top color
export const LICHEN_BG_SHIFT_APPLY_DS_BOT   = writable(false); // apply shift to deep sea bottom color

// ─── Jellyfish + tentacle tint shift (triggered) ─────────────────────────────
export const JELLY_TINT_SHIFT_ENABLED          = writable(true);
export const JELLY_TINT_SHIFT_HZ               = writable(8000);
export const JELLY_TINT_SHIFT_RANGE_HZ         = writable(1000);
export const JELLY_TINT_SHIFT_OCTAVES          = writable(2);
export const JELLY_TINT_SHIFT_TRIGGER_DURATION = writable(6);
export const JELLY_TINT_SHIFT_WINDOW           = writable(9);
export const JELLY_TINT_SHIFT_TARGET_R         = writable(0.8431);
export const JELLY_TINT_SHIFT_TARGET_G         = writable(0.8431);
export const JELLY_TINT_SHIFT_TARGET_B         = writable(0.8784);
export const JELLY_TINT_SHIFT_ATTACK           = writable(0);    // ms
export const JELLY_TINT_SHIFT_DECAY            = writable(110);  // ms
export const JELLY_TINT_SHIFT_CURVE            = writable(0.75);  // ramp exponent

// ─── Inner membrane ───────────────────────────────────────────────────────────
export const JELLY_MEMBRANE_ENABLED   = writable(true);
export const JELLY_MEMBRANE_SCALE     = writable(0.89);   // inner size (0.2–0.98)
export const JELLY_MEMBRANE_OPACITY   = writable(0.96);   // back-face opacity mult
export const JELLY_MEMBRANE_FRONT_OP  = writable(0.64);   // front-face opacity mult
export const JELLY_MEMBRANE_TINT_R    = writable(0.0745);
export const JELLY_MEMBRANE_TINT_G    = writable(0.2941);
export const JELLY_MEMBRANE_TINT_B    = writable(0.3255);
export const JELLY_MEMBRANE_IRID      = writable(0.22);   // iridescence strength
export const JELLY_MEMBRANE_FRESNEL   = writable(0.95);   // fresnel strength
export const JELLY_MEMBRANE_SPECULAR  = writable(1.5);   // specular intensity
export const JELLY_MEMBRANE_EMISSION  = writable(0.25);   // base inner glow (0–2)
export const JELLY_MEMBRANE_PULSE_STR = writable(0.50);   // audio-reactive emission multiplier

// ─── Inner membrane color shift (triggered) ───────────────────────────────────
export const JELLY_MEMBRANE_SHIFT_ENABLED          = writable(true);
export const JELLY_MEMBRANE_SHIFT_HZ               = writable(1000);
export const JELLY_MEMBRANE_SHIFT_RANGE_HZ         = writable(250);
export const JELLY_MEMBRANE_SHIFT_OCTAVES          = writable(2);
export const JELLY_MEMBRANE_SHIFT_TRIGGER_DURATION = writable(8);
export const JELLY_MEMBRANE_SHIFT_WINDOW           = writable(9);
export const JELLY_MEMBRANE_SHIFT_TARGET_R         = writable(0.5843);
export const JELLY_MEMBRANE_SHIFT_TARGET_G         = writable(0.5176);
export const JELLY_MEMBRANE_SHIFT_TARGET_B         = writable(0.8235);
export const JELLY_MEMBRANE_SHIFT_ATTACK           = writable(60);   // ms
export const JELLY_MEMBRANE_SHIFT_DECAY            = writable(500);  // ms
export const JELLY_MEMBRANE_SHIFT_CURVE            = writable(1.0);

// ─── Performance controls ─────────────────────────────────────────────────────
export const PERF_MAX_FPS        = writable(0);     // 0 = uncapped, otherwise cap in fps
export const PERF_LIVE_FPS       = writable(0);     // updated each frame by renderer
export const LICHEN_FOLIAGE_ENABLED = writable(false); // foliage/lichen patches (high GPU cost)

// ─── Background gradient (lichen scene) ──────────────────────────────────────
export const LICHEN_BG_GRAD_ENABLED = writable(false);
export const LICHEN_BG_GRAD_SPEED   = writable(30);    // degrees per second (1–360)
export const LICHEN_BG_GRAD_SAT     = writable(0.25);  // saturation of gradient colors (0–1)
export const LICHEN_BG_GRAD_VAL     = writable(0.06);  // brightness of gradient colors (0–1)
