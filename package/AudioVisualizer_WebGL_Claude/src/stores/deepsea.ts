import { writable } from 'svelte/store';

// ─── Deep Sea Background ──────────────────────────────────────────────────────
export const DS_BG_ENABLED   = writable(true);
export const DS_BG_TOP_R     = writable(0.005);
export const DS_BG_TOP_G     = writable(0.022);
export const DS_BG_TOP_B     = writable(0.055);
export const DS_BG_BOT_R     = writable(0.0);
export const DS_BG_BOT_G     = writable(0.002);
export const DS_BG_BOT_B     = writable(0.018);
export const DS_BG_VIGNETTE  = writable(0.55);   // 0=none, 1=strong vignette
export const DS_BG_HORIZON_Y = writable(0.55);   // gradient midpoint (0=bottom, 1=top)

// ─── Deep Sea Ambient Particles ───────────────────────────────────────────────
export const DS_PART_ENABLED = writable(true);
export const DS_PART_COUNT   = writable(220);    // ambient particle count
export const DS_PART_SIZE    = writable(14.0);    // base point size (screen pixels at unit depth)
export const DS_PART_SPEED   = writable(0.12);   // flow-field drift speed multiplier
export const DS_PART_BUOY    = writable(0.012);  // upward drift bias
export const DS_FOG_DENSITY  = writable(0.55);   // exp fog density (higher = more fog)
export const DS_BRIGHTNESS   = writable(1.65);   // ambient particle peak brightness
export const DS_AMBIENT_GLOW = writable(0.5);   // floor brightness (never fully dark)
export const DS_FLICKER_SPEED = writable(1.0);   // bioluminescent flicker rate
export const DS_COL_A_R      = writable(0.10);
export const DS_COL_A_G      = writable(0.60);
export const DS_COL_A_B      = writable(1.00);
export const DS_COL_B_R      = writable(0.00);
export const DS_COL_B_G      = writable(0.88);
export const DS_COL_B_B      = writable(0.55);
export const DS_COL_BLEND    = writable(0.5);    // 0=all A, 1=all B

// ─── Deep Sea Trigger (burst) ─────────────────────────────────────────────────
export const DS_TRIG_ENABLED  = writable(true);
export const DS_TRIG_HZ       = writable(60);
export const DS_TRIG_RANGE_HZ = writable(20);
export const DS_BURST_COUNT   = writable(30);    // particles emitted per trigger
export const DS_BURST_SIZE    = writable(1.6);   // burst particle size multiplier
export const DS_BURST_BRIGHT  = writable(2.2);   // burst peak brightness
export const DS_BURST_LIFE    = writable(1400);  // burst particle lifespan (ms)
export const DS_BURST_SPREAD  = writable(2.5);   // spawn radius around origin

// ─── DS Swim Current (propulsion-linked particle drift) ──────────────────────
export const DS_SWIM_ENABLED  = writable(true);
export const DS_SWIM_IMPULSE  = writable(0.000005); // peak propulsive force (world units / ms²)
export const DS_SWIM_ATTACK   = writable(50);       // force rise time (ms)
export const DS_SWIM_DECAY    = writable(150);      // force fall time (ms)
export const DS_SWIM_CURVE    = writable(1.75);      // force curve exponent
export const DS_SWIM_DRAG     = writable(0.0009);    // drag coefficient per ms  (v *= (1−drag)^dt)
export const DS_SWIM_MAX_VEL  = writable(0.0185);    // velocity cap (world units / ms)
export const DS_SWIM_AZ       = writable(180);        // azimuth offset degrees (relative to jelly forward)
export const DS_SWIM_EL       = writable(0);        // elevation offset degrees (0=horiz, −90=down, +90=up)
