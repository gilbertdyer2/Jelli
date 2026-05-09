# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Store defaults

Do not change existing default values in `src/stores/*.ts` files unless the variable's behavior is directly affected by the current task. Adding new stores or wiring new subscriptions is fine; silently tweaking existing defaults is not.

## Running the Project

### Jelli (Vite + Svelte + TypeScript) — primary project

Node.js is VS-embedded, not in system PATH. Use the full path:

```
# Dev server (hot reload):
"C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Microsoft\VisualStudio\NodeJs\node.exe" ./node_modules/vite/bin/vite.js

# Production build:
"C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Microsoft\VisualStudio\NodeJs\node.exe" ./node_modules/vite/bin/vite.js build

# Install dependencies (first time / after package.json changes):
PATH="/c/Program Files/Microsoft Visual Studio/2022/Community/MSBuild/Microsoft/VisualStudio/NodeJs:$PATH" npm install
```

Dev server runs at `http://localhost:5173`.

### WebGL visualizer (legacy, no build step)

```
npx serve .
```
or
```
python -m http.server
```

---

## Project Structure

### Jelli (Vite app) — `src/`

| Path | Description |
|---|---|
| `src/main.ts` | Svelte app bootstrap |
| `src/App.svelte` | Root component: `<canvas>` + mouse/context-menu handlers |
| `src/app.css` | Global CSS |
| `src/types/index.ts` | All shared TypeScript interfaces |
| `src/stores/physics.ts` | Blob/clam/spring/drift/beat physics constants |
| `src/stores/effects.ts` | Shockwave, polygon, inflate, blob flash, particle trigger, L/R mode, ripple |
| `src/stores/background.ts` | Background color, trail, energy glow, sub-bass band |
| `src/stores/underwater.ts` | Caustics + particle layer parameters |
| `src/stores/dither.ts` | CCTV/dither post-processing parameters |
| `src/stores/speed.ts` | Global `TIMESCALE` multiplier |
| `src/stores/spotlight.ts` | Solo spotlight parameters |
| `src/stores/duolink.ts` | Duo-link particle web parameters |
| `src/stores/threshold.ts` | Beat detector threshold tuning |
| `src/stores/creatures.ts` | Live blob/clam arrays |
| `src/stores/ui.ts` | Panel open, active tab, streaming state, beat log, spawn modal state |
| `src/audio/` | BeatDetector.ts, audioEngine.ts (getDisplayMedia capture) |
| `src/renderer/` | Renderer.ts class + draw/update modules |
| `src/creatures/` | blobFactory.ts, clamFactory.ts, triggerEffects.ts |
| `src/components/` | Svelte UI components (TopBar, BottomPanel, SpawnModal, etc.) |
| `src/utils/` | color.ts, math.ts, sliderConfig.ts |

### Legacy files (root)

| File | Description |
|---|---|
| `audioVisualizer.html` | Original WebGL visualizer (octahedron + diamond tunnel) |
| `visualizer2.html` | Monolithic source that was migrated to `src/` |
| `BeatDetector.js` | `BeatDetector` + `BeatDetectorManager` ES module (used by WebGL visualizer) |
| `beatDetectorUtils.js` | `getSpectralFlux` utility used by BeatDetector |
| `loudnessUtils.js` | Audio analysis utilities (`getLoudness`, `getEMA`, etc.) |
| `audioVisualizer.js` | Main logic for the WebGL visualizer |
| `audioFileList.json` | Fetched at startup to populate the file dropdown |
| `list-audio.js` | Node script to regenerate `audioFileList.json` |
| `Common/` | Third-party WebGL math library (Angel/Shreiner) |

---

## Jelli — src/ app

Migrated from `visualizer2.html` monolith into the Vite+Svelte+TypeScript project under `src/`.

### Architecture overview

- **Canvas 2D** rendering (no WebGL)
- **N jellyfish** (blobs) + **N clams** — dynamic creature lists, spawnable/removable at runtime
- Default creatures defined in `DEFAULT_BLOBS` (`src/creatures/blobFactory.ts`): 2 jellyfish + 1 `subD` background wash
- Each creature owns its own `BeatDetector` instance with configurable Hz, range, octaves, duration
- **Bottom panel** (expandable, resizable, tabbed): Controls (sliders), Analysis (EQ + beat log + detector graphs), Performance (FPS/stats)
- **Top bar**: Start/Stop live audio capture button + status indicator

### Creatures

#### Default jellyfish (`DEFAULT_BLOBS`)

| Name | Default Hz | Color | Effect | Notes |
|---|---|---|---|---|
| `high` | 12 000 Hz | cyan | sparks | 1.8× speed, kick 0.7× |
| `bass` | 60 Hz | white | shockwave | 0.7× speed, kick 0.8× |

`subD` at 150 Hz drives the background wash only (no blob rendered).

All detector parameters (Hz, range, octaves, duration) are live-adjustable per creature. Changing a frequency calls `detector.targetHz = v; detector.reset()`. New creatures can be spawned via the modal UI.

#### Clams

A separate creature type with a two-shell geometry. Clams are stored in `clams[]` parallel to `blobs[]`. On beat trigger: shells snap open (`openVel` impulse), creature launches upward with lateral spread and random spin, then falls under gravity with water drag. Clam physics constants are prefixed `CLAM_`.

### Jellyfish (blob) structure

Each blob holds:
- `cx, cy` — center position
- `cvx, cvy` — slow drift velocity (random walk)
- `bkx, bky` — beat kick velocity (decays at `BLOB_BEAT_KICK_DECAY`)
- `angle, targetAngle` — current/target facing angle (EMA at `ROTATION_SMOOTH = 0.04`)
- `expandScale` — transient bell expansion (set via `expandRemaining` drain)
- `inflateScale` — persistent size multiplier that accumulates on beat + decays to 1
- `tentacleSpreadScale` — transient root spread multiplier; set to `TENTACLE_SPREAD_BOOST` on beat, decays at `TENTACLE_SPREAD_DECAY` each frame
- `energy` — propulsion energy; recharges each frame up to `ENERGY_MAX`, spent on trigger
- `thrustRemaining, expandRemaining` — pending impulse/expansion drained at `KICK_ACCEL` rate
- `rimParticles` — 10 rim arc particles + 18 interior fill particles (all have `rx, ry, rim`); `rimOnly` is a cached filtered array
- `tentacles` — 7 chains of `BLOB_PARTICLE_COUNT` particles using PBD physics (`px, py`)
- `idlePhase` — phase for sinusoidal bell breathing
- `color, colorR, colorG, colorB` — body hex color and extracted RGB components
- `effect` — beat effect type: `'none'`, `'shockwave'`, `'polygon'`, `'sparks'`
- `effectColor, effectR, effectG, effectB` — effect color (independent of body color)
- `effectSpeed` — speed multiplier for the spawned effect
- `kickScale` — per-creature beat propulsion multiplier
- `name, detectorHz, detectorRangeHz, detectorOctaves, detectorDuration` — creature detector config
- `detector` — live `BeatDetector` instance
- `activitySmooth, soloMs, spotlightAlpha` — solo-mode spotlight state
- `triggerTimes` — recent beat trigger timestamps (used by duo-link sync detection)

### Physics

**Bell rim** — springs toward `(center + rotate(rx,ry, angle) × bellScale)` where:
```
bellScale = (1 + idlePulse + expandScale × BLOB_EXPAND_SCALE) × inflateScale
```

**Tentacles (PBD chain)** — position-based dynamics, NOT spring-toward-target:
- `ivx = (x - px) × BLOB_DAMPING` (implicit velocity with water drag)
- `px = x; x += ivx + jitter + trailing_bias`
- Distance constraint: project `x` to `TENTACLE_SEG_LEN` from parent each frame
- Root (si=0) snaps to its rotated attachment point on the bell opening, scaled by `bellScale × tentacleSpreadScale`
- Trailing direction: `(-sinA, cosA)` — opposite to head, so tentacles flow behind

**Orientation** — `blob.angle` EMA-tracks `targetAngle`:
- Free drift: `targetAngle = atan2(totalVx, -totalVy)` when speed > 0.08 px/frame
- While dragged: `targetAngle = atan2(cursorDx, -cursorDy)` (cursor direction, stable)

**Energy propulsion** — on trigger:
1. `thrustRemaining = blob.energy × BLOB_BEAT_KICK × blob.kickScale`
2. `blob.energy = 0`
3. Each frame: drain `t = thrustRemaining × KICK_ACCEL`, add to `bkx/bky` in head direction
4. Energy recharges: `energy = min(energy + ENERGY_RECHARGE, ENERGY_MAX)`

**Inflate/deflate** — on trigger (when `INFLATE_ENABLED`):
- `inflateScale += INFLATE_BOOST`, capped at `INFLATE_MAX`
- Each frame: `inflateScale = 1 + (inflateScale - 1) × INFLATE_DECAY`

**Drag interaction** — mousedown on canvas within 130px of a blob center:
- `DRAG_SPRING_K = 0.005` — spring pull toward cursor each frame
- Brownian jitter suppressed; drift max raised to 6 px/frame
- Edge repulsion and kick-bounce skipped while held

### Beat trigger sequence (`triggerBlobBeat(index)`)

1. `expandRemaining = 1.0` (queued bell expansion)
2. `tentacleSpreadScale = TENTACLE_SPREAD_BOOST` (queued tentacle fan-out)
3. `inflateScale += INFLATE_BOOST` (if enabled)
4. `thrustRemaining = energy × BLOB_BEAT_KICK × kickScale; energy = 0` (queued forward propulsion)
5. Tentacle whip: `chain[si].py += whip; chain[si].px -= lateral` (PBD impulse in head-space)
6. `triggerBlobEffect(blob)` — routes to `spawnShockwave`, `spawnPolygon`, or `spawnSparks` based on `blob.effect`
7. `blob.triggerTimes.push(now)` — timestamp stored for duo-link sync detection

### Spotlight (solo mode)

When a single creature is the only one actively triggering for ≥ `SOLO_THRESHOLD_MS` (default 4 s), a soft radial glow (using the creature's color) fades in behind it.

- `activitySmooth` — per-frame decaying activity signal (`SOLO_ACTIVITY_DECAY`)
- `soloMs` — accumulated milliseconds as sole active creature
- `spotlightAlpha` — rendered glow opacity, fades in/out at `SPOTLIGHT_FADE_IN/OUT`
- `updateSpotlights(dt)` / `drawSpotlights()` — called each frame before blobs

Constants: `SPOTLIGHT_ENABLED`, `SOLO_THRESHOLD_MS`, `SPOTLIGHT_MAX_ALPHA`, `SPOTLIGHT_RADIUS_MULT`, `SPOTLIGHT_FADE_IN`, `SPOTLIGHT_FADE_OUT`, `SOLO_ACTIVITY_DECAY`, `SOLO_ACTIVITY_THRESH`.

### Duo link

When two creatures trigger in temporal sync (within `DUO_SYNC_TOLERANCE` ms, minimum `DUO_SYNC_MIN_MATCHES` times over a `DUO_SYNC_WINDOW` ms rolling window), a drifting particle web appears connecting them.

- 32 particles distributed along the pair axis, spring toward their home positions
- Rendered as 5 color bands × 3 alpha tiers, proximity-weighted edges
- `updateDuoLinks(dt)` / `drawDuoLinks()` — called each frame

Constants: `DUO_LINK_ENABLED`, `DUO_THRESHOLD_MS`, `DUO_LINK_MAX_ALPHA`, `DUO_SYNC_WINDOW`, `DUO_SYNC_TOLERANCE`, `DUO_SYNC_MIN_MATCHES`, `DUO_LINK_EDGE_DIST`, `DUO_LINK_PARTICLE_COUNT`, `DUO_LINK_SPREAD`, `DUO_FADE_IN`, `DUO_FADE_OUT`.

### Render loop

Draw order each frame (`Renderer.ts _tick`):
1. Audio data update (all blob detectors + subD + flashDetector + particleTrigDetector + rippleDetector + bgRandDetector + lrLeft/Right)
2. Compute `bgEnergySmooth` from RMS
3. `drawBackground` — background fill + trail + energy overlay + sub-bass band
4. `updateUnderwater(dt)` — caustic oscillation, flash phases, particle drift
5. `drawUnderwater(ctx)` — caustics (screen blend) + particles
6. Beat trigger checks → `triggerBlobBeat` / `triggerClamBeat`, beat log, `triggerBlobFlash` / `triggerParticleCurrent` / `triggerLRFlash` / `triggerBgRand` / `spawnRipple`
7. `updateSpotlights(dt)`
8. `updateDuoLinks(dt)`
9. `updateBlobs()` — all jellyfish physics
10. `updateClams()` — all clam physics
11. `drawSpotlights()`
12. `drawDuoLinks()`
13. `drawClams()`
14. `drawBlobs()` — tentacles → hull fill → web edges → rim glow → dots
15. `drawShockwaves()`, `drawPolygonFlash()`, `drawSparks()`, `drawRipples()`
16. Dither post-processing (if `DITHER_ENABLED`) — pixelate + quantize + scanlines + tint
17. Panel UI when open

### Bottom panel slider groups

Organized into three columns in `ControlsTab.svelte` (all config via `src/utils/sliderConfig.ts`):

| Group | Key controls |
|---|---|
| Speed | Timescale (global physics + animation speed multiplier) |
| Frequencies | Per-creature Hz (dynamically built for all blobs + clams) |
| Particles | Count (tentacle segs), Bell Radius, Rest Radius, Edge Dist, Node Radius |
| Spring | Spring K, Damping, Jitter |
| Drift | Drift Max, Drift Accel, Edge Margin, Top Clear |
| Beat | Kick Scale, Kick Accel, Kick Decay, Max Energy, Recharge Rate, Expand Scale, Expand Decay, Spread Boost, Spread Decay |
| Threshold | Idle Decay Rate, Freq Decay Bias (synced to all detectors at runtime via `syncThresholdParams()`) |
| Inflate | Enabled (toggle), Boost, Decay, Max |
| Effects | Wave Speed, Wave Max R, Poly Scale, Poly Rate |
| Clam | Shell Width/Height/Depth, Lip Gap, Snap Force/Spread, Gravity, Water Drag, Spin Decay, Edge Dist |
| Background | Band Height, Max Opacity, Color R/G/B, Energy Glow |
| Background Rnd | Enabled, Hz, Range, Slope, Fade In/Out |
| Blob Flash | Enabled, Hz, Color, Random toggle, Slope, Fade In/Out, Apply-all toggle |
| Particle Trigger | Enabled, Hz, Boost, Slope, Fade In/Out |
| L/R Mode | Enabled, Hz, Window, Flash Slope, Center Reduction, Fade In/Out, Left Color, Right Color |
| Ripple | Enabled, Hz, Max Radius, Speed, Alpha, Ring Count, Wavelength |
| Underwater | Caustics Enabled/Alpha/Speed, Particles Enabled/Alpha/Speed, Color A/B (RGB), Particle Color (RGB) |
| Dither (CCTV) | Enabled, Pixel Size, Levels, Opacity, Tint Enabled/Color/Strength, Scanlines Enabled/Alpha/Gap |
| Spotlight | Enabled, Solo Time, Max Opacity, Radius, Fade Speed |
| Duo Link | Enabled, Sync Window/Tolerance/Min Matches, Appear Delay, Max Opacity, Edge Dist, Particles, Spread Radius, Fade Speed |

### Spawn modal

`SpawnModal.svelte` handles both spawn and edit modes. Fields: name, Hz, body color, effect type, effect color, effect speed, kick scale. Detector range/octaves/duration are auto-calculated from the chosen frequency tier:

| Hz range | rangeHz | octaves | duration |
|---|---|---|---|
| < 200 | 15 | 1 | 8 frames |
| 200–999 | 60 | 2 | 8 frames |
| 1 000–4 999 | 200 | 2 | 6 frames |
| ≥ 5 000 | 500 | 2 | 6 frames |

Creatures can be removed via chip UI in `CreatureList.svelte`.

### Audio engine detectors

`src/audio/audioEngine.ts` manages all BeatDetector instances:

| Detector | Purpose |
|---|---|
| `subD` | 150 Hz — background wash gradient |
| `flashDetector` | Caustic blob flash (configurable Hz) |
| `particleTrigDetector` | Triggers underwater particle current animation |
| `rippleDetector` | Spawns water ripple rings |
| `bgRandDetector` | Triggers background color randomization |
| `lrLeftDetector` / `lrRightDetector` | Stereo channel split for positional L/R flash |

`startCapture()` uses `ChannelSplitter` to route L/R channels separately. `syncThresholdParams()` pushes threshold slider values to all detector instances simultaneously.

### Underwater system

Rendered each frame via `src/renderer/drawUnderwater.ts` using `screen` composite blend mode:

- **Caustics** — 10 procedural ellipses oscillating via independent sin/cos waves; color interpolates between two palette colors (`UW_BLOB_R1/G1/B1` → `R2/G2/B2`). Flash triggers: `triggerBlobFlash()` (all or random caustics, fixed or random color) and `triggerLRFlash(side, canvasW)` (per-caustic positional weight based on stereo channel and X position).
- **Particles** — 80 small arcs drifting at `_uwCurrentAngle` (slowly rotating); `triggerParticleCurrent()` injects a timed speed burst with configurable fade-in/out slopes. `bgEnergySmooth` boosts particle speed proportionally.

### Dither / CCTV post-processing

Final render pass when `DITHER_ENABLED` (store in `src/stores/dither.ts`):
- Reads canvas pixels, downsamples by `DITHER_PIXEL_SIZE` blocks, quantizes RGB to `DITHER_LEVELS` levels
- Optional color tint (`DITHER_TINT_R/G/B`, `DITHER_TINT_STR`)
- Optional scanlines every `DITHER_SCAN_GAP` rows at `DITHER_SCAN_ALPHA` opacity
- Pre-computed LUT for performance; call `invalidateDitherLUT()` after changing levels or tint

### Stereo L/R mode

When `LR_MODE_ENABLED`, `audioEngine.ts` splits the live stream via `ChannelSplitter` into two `BeatDetector` instances. The renderer tracks `_lrLeftLastTrig` / `_lrRightLastTrig` timestamps; within `LR_WINDOW_MS`, an exclusive trigger (only L or only R) calls `triggerLRFlash(side, canvasW)` with per-caustic positional weights. When L/R mode is active, base blob-flash intensity is reduced by `LR_CENTER_REDUCTION`.

### Timescale

`TIMESCALE` store (`src/stores/speed.ts`, default 2.4) — multiplies the `dt` passed to all physics and animation update functions, enabling real-time speed control of the entire scene.

### Snapshot system

`src/renderer/snapshot.ts` exports `P` (a `PhysicsSnapshot` object with ~150 parameters) and `initStoreSnapshots()`. Called once in `Renderer.init()`, it subscribes every store to update `P` on change. The hot render loop reads `P.PARAM` as plain object property access instead of going through Svelte store subscriptions.

---

## BeatDetector.js — Beat detection internals

### Threshold formula (line 75)

```js
const loudEnough = centerVal >= Math.max(this._maxLoudness * 0.45, this._avgPeakLoudness * 0.1);
```

- `_maxLoudness * 0.45` — primary gate: flux must reach 45% of the recent peak maximum
- `_avgPeakLoudness * 0.1` — silence-protection floor: prevents the threshold from collapsing to near-zero after `_maxLoudness` has decayed during a long quiet period; `_avgPeakLoudness` is a running mean of past triggered peaks and is **never time-decayed**

### `_maxLoudness` decay (line 56)

```js
this._maxLoudness *= 0.9995;   // unconditional, every frame
this._maxLoudness = Math.max(this._maxLoudness, loudness);
```

Decay rate: 0.9995/frame ≈ **23-second half-life at 60 fps**. After a loud transient, `_maxLoudness` stays elevated for ~20–30 s, which can suppress triggers in quieter sections that follow (see Known Issues below).

### Adaptive threshold properties

Two runtime-settable properties are synced from `src/audio/audioEngine.ts` `syncThresholdParams()` to all detector instances via the Threshold slider group:

- `idleDecayRate` — multiplier on idle decay speed (default `IDLE_DECAY_RATE = 2.0`)
- `freqDecayBias` — low-frequency bias for threshold decay (default `FREQ_DECAY_BIAS = 0.5`)

### Peak detection (line 74)

```js
const isPeak = centerVal > 0 && this._fluxHistory.every((v, i) => i === mid || v < centerVal);
```

9-frame window; the center frame (index 4) must be a strict global maximum. At 60 fps this is a ~150 ms window (~75 ms look-behind).

### `reset()` behaviour

Called by the Jelli app on: frequency slider adjustment, live-mode toggle, and creature removal. Zeroes `_maxLoudness`, `_avgLoudness`, `_avgPeakLoudness`, `_fluxHistory`, and all counters. After reset the threshold rebuilds from 0, which is why detection works reliably at the start of each new playback session.

### Known issues / open bugs

- **`_maxLoudness` anchoring** — loud content anchors `_maxLoudness` high for ~20–30 s. If a quieter section follows within that window, its beats may fall below `0.45 × max` and not trigger. This manifests as section-specific dropout that depends on what audio played immediately before, rather than elapsed time since reset.
- **`_avgPeakLoudness` accumulation without reset** — because `_avgPeakLoudness` is never time-decayed, repeated playback without explicit reset can inflate the floor term, suppressing triggers in relatively quiet songs or sections.
- **No section-adaptive component** — the current `0.45 × max` threshold has no term that tracks the *current* section's signal level. The original formula (`0.5×max + 0.2×avg`) provided partial downward adaptation in quiet sections via `_avgLoudness`; the replacement removed that.

---

## audioVisualizer.html — Original WebGL visualizer

### Entry point
Loads WebGL shaders inline (`<script type="x-shader/...">` tags), imports Common library as classic scripts, then imports `loudnessUtils.js` and `audioVisualizer.js` as ES modules.

### Beat detection
Uses `BeatDetector` / `BeatDetectorManager` from `BeatDetector.js`. Two detectors:
- `bassListener` — 58 Hz, ±10 Hz, 1 octave, 8 frames
- `midListener` — 375 Hz, ±60 Hz, 3 octaves, 10 frames

### Render loop
`audioVisualizer.js:716` — called via `setTimeout + requestAnimFrame` at ~10 ms/frame.
Draws: octahedron (solid) → outline → inner wireframes → diamond tunnel (20 instanced rings) → screen shake.

### Smooth mode
Double-smoothed EMA chain (Twixtor-style) for cube rotation and tunnel zoom.
