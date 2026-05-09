# Package Context — Monolith Visual Port (RPi)

This file briefs a Claude Code instance receiving this project package. It documents the relevant architecture, a prior design conversation, and a concrete plan for the next phase of work.

The full codebase is in the `src/` directory. A general architecture reference is in `CLAUDE.md` at the project root. **However, CLAUDE.md is almost entirely about the Jelli page (Canvas 2D blob/clam system) — ignore that for this task.** This file covers everything needed for the Monolith page specifically.

---

## Scope: the Monolith page only

The app has a page-switcher dropdown in the top bar. There are four pages: Jelli, Synfield, Grove, and **Monolith**. This work concerns **only the Monolith page**. Its internal code name is `lichen` (store key `currentPage === 'lichen'`).

Ignore all files related to Jelli, Synfield, Grove, clams, blobs, shockwaves, caustics, dither, and Canvas 2D rendering. The Monolith page is entirely independent of those systems.

### Relevant files

| File | Description |
|---|---|
| `src/components/LichenView.svelte` | Page entry — mounts the canvas, creates and starts `LichenRenderer` |
| `src/renderer/LichenRenderer.ts` | The entire Monolith renderer (~1800 lines). WebGL, owns all beat detectors, drives the full scene. |
| `src/stores/lichen.ts` | All tunable parameters for the Monolith scene (~250 lines of Svelte writable stores) |
| `src/stores/deepsea.ts` | Parameters for the deep-sea background system |
| `src/stores/bloom.ts` | Bloom post-processing parameters |
| `src/stores/motionblur.ts` | Motion blur parameters |
| `src/renderer/lichenShaders.ts` | GLSL for monolith body + lichen patches + spores |
| `src/renderer/lichenGeometry.ts` | Monolith mesh geometry builder |
| `src/renderer/lichenLichen.ts` | Lichen patch / foliage system logic |
| `src/renderer/lichenParticles.ts` | Spore particle system |
| `src/renderer/jellyGeometry.ts` | Jellyfish bell mesh builder |
| `src/renderer/jellyTentacles.ts` | Tentacle geometry + shaders |
| `src/renderer/physicsTentacleShader.ts` | Physics-mode tentacle shaders |
| `src/renderer/oralArmShader.ts` | Oral arm GLSL |
| `src/renderer/membraneShader.ts` | Inner membrane GLSL |
| `src/renderer/deepSeaShader.ts` | Deep-sea background + particle shaders |
| `src/renderer/DeepSeaSystem.ts` | Deep-sea particle system logic |
| `src/renderer/PhysicsChain.ts` | PBD chain solver (shared by tentacles + oral arms) |
| `src/renderer/foliageSystem.ts` | Foliage/lichen growth system |
| `src/renderer/bloomShader.ts` | Bloom pass shaders |
| `src/renderer/motionBlurShader.ts` | Motion blur accumulation shaders |
| `src/audio/audioEngine.ts` | Audio capture — exports `liveAnalyser` and `liveContext` used by LichenRenderer |
| `src/audio/BeatDetector.ts` | Beat detector class — instantiated inside LichenRenderer |

---

## What the Monolith scene is

A **WebGL** 3D scene rendered to a `<canvas>` via WebGL2. It contains:

- **Glass monolith** — a rounded cuboid with Fresnel glass shading, iridescence, specular highlights, and organic noise surface deformation. On bass beats, ripple waves propagate across its surface. Lichen/foliage patches grow on its faces.
- **Jellyfish** — a 3D bell mesh with glass shading, inner membrane (with emission pulse), physics-based tentacles (PBD ribbon chains), and oral arms (wider ribbon chains with animated frills). Reacts to beats with a propel/compress impulse, tentacle whip, color tint shifts.
- **Spores** — point particles emitted in bursts on high-frequency triggers, drifting through a noise field.
- **Deep-sea background** — gradient sky + slow-rising particle system, optional swim impulse on trigger.
- **Post-processing** — bloom (multi-pass blur + composite), motion blur (accumulation buffer), chromatic aberration (pulsing color fringe).

The renderer is **self-contained in `LichenRenderer.ts`**. It does not use the Jelli snapshot system (`P`), the Jelli store subscriptions, or any Jelli creature/draw modules.

---

## Audio architecture inside LichenRenderer

`LichenRenderer.ts` imports two things from `audioEngine`:

```ts
import { liveAnalyser, liveContext } from '@audio/audioEngine';
```

It creates all its own `BeatDetector` instances internally. Each frame it calls `detector.updateData(liveAnalyser, liveContext, freqBuffer)` then checks `detector.justTriggered`.

### Beat detectors owned by LichenRenderer

| Internal name | Default Hz | Trigger effect |
|---|---|---|
| `_bassDetector` | 90 Hz | Monolith surface ripple |
| `_midDetector` | 800 Hz | Lichen patch growth |
| `_highDetector` | 11 000 Hz | Spore burst |
| `_oralDetector` | 1 000 Hz | Oral arm whip impulse |
| `_oralTintShiftDetector` | 1 000 Hz | Oral arm color tint shift |
| `_jellyTintShiftDetector` | 8 000 Hz | Jellyfish + tentacle tint shift |
| `_membraneShiftDetector` | 1 000 Hz | Inner membrane color shift |
| `_bgShiftDetector` | 3 000 Hz | Background color shift |
| `_dsTrigDetector` | (DS_TRIG_HZ store) | Deep-sea particle burst |

All Hz values are live-configurable via the `src/stores/lichen.ts` and `src/stores/deepsea.ts` stores. When a store value changes, the renderer reinitialises the corresponding detector.

### The audio→visual surface

The entire coupling between audio analysis and visuals is:
1. `liveAnalyser` — a Web Audio `AnalyserNode` (or `null` when not streaming)
2. `liveContext` — the `AudioContext` (used to read `currentTime`)
3. Each frame: `detector.updateData(liveAnalyser, liveContext, freqBuffer)` → `detector.justTriggered`

Nothing else crosses the audio/visual boundary.

---

## Goal: RPi visual-only port

Run the Monolith scene on a Raspberry Pi as a dedicated display device. Audio analysis stays on the host machine. Beat triggers are sent over WebSocket from host to RPi.

**Host device:** captures audio, runs beat detectors, sends trigger events by detector ID over WebSocket. No visual rendering.

**Visual device (RPi):** receives trigger events, sets `justTriggered` on the corresponding virtual detector, renders the full Monolith scene. No audio analysis.

The RPi runs Chromium in kiosk mode against a locally-served production build.

```
chromium-browser --kiosk --app=http://localhost:5173
```

WebGL2 on RPi 4/5 via Chromium works for this workload. RPi 3 is not recommended (insufficient GPU for this scene's bloom + motion blur passes).

---

## Recommended implementation plan

### Step 1 — VirtualDetector

Create `src/audio/VirtualDetector.ts`. Drop-in for `BeatDetector` — same interface, no audio dependency:

```ts
export class VirtualDetector {
  justTriggered: boolean = false;

  // Called each frame by LichenRenderer — clears the flag (same timing as BeatDetector)
  updateData(..._args: any[]): void {
    this.justTriggered = false;
  }

  // Called by the WebSocket receiver when a trigger message arrives
  trigger(): void {
    this.justTriggered = true;
  }
}
```

`BeatDetector.updateData()` clears `justTriggered` at the top of each call before re-evaluating audio. `VirtualDetector` does the same: it clears on `updateData()` and sets on `trigger()`, so the flag is `true` for exactly one frame.

### Step 2 — wsReceiver.ts

Create `src/audio/wsReceiver.ts`. Exports the same two names `LichenRenderer` imports from `audioEngine`:

```ts
export const liveAnalyser: null = null;
export const liveContext:  null = null;
```

Additionally exports a registry of `VirtualDetector` instances keyed by trigger ID:

```ts
export const virtualDetectors: Map<string, VirtualDetector> = new Map();
```

The WebSocket client populates this map at startup and handles incoming messages:

```ts
const ws = new WebSocket('ws://[rpi-ip]:8765');
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.type === 'triggers') {
    for (const id of msg.ids) {
      virtualDetectors.get(id)?.trigger();
    }
  }
};
```

### Step 3 — Adapt LichenRenderer

`LichenRenderer.ts` currently creates `BeatDetector` instances inline. For the RPi build, it needs to use `VirtualDetector` instead and register them in `virtualDetectors`.

The cleanest approach is a Vite alias that swaps the detector constructor based on build mode:

**`src/audio/detectorFactory.ts`** (new file):
```ts
// In dev/host mode: re-export BeatDetector unchanged
export { BeatDetector as DetectorClass } from './BeatDetector';
export function registerDetector(_id: string, _det: any) {}
```

**`src/audio/detectorFactory.rpi.ts`** (RPi build):
```ts
export { VirtualDetector as DetectorClass } from './VirtualDetector';
import { virtualDetectors } from './wsReceiver';
export function registerDetector(id: string, det: any) {
  virtualDetectors.set(id, det);
}
```

Then in `LichenRenderer.ts`, replace direct `new BeatDetector(...)` with `new DetectorClass(...)` and call `registerDetector(id, det)` after each construction.

In `vite.config.ts`, add the alias switch:

```ts
'@audio/detectorFactory': process.env.VITE_RPI_MODE
  ? path.resolve('./src/audio/detectorFactory.rpi.ts')
  : path.resolve('./src/audio/detectorFactory.ts'),
```

Build for RPi: `VITE_RPI_MODE=1 vite build`

### Step 4 — Wire protocol

The host sends JSON over WebSocket, batched per audio analysis frame:

```json
{ "type": "triggers", "ids": ["bass", "high"] }
```

Trigger IDs map to detector registration names. Suggested canonical IDs:

| ID | Detector |
|---|---|
| `bass` | `_bassDetector` — monolith ripple |
| `mid` | `_midDetector` — lichen growth |
| `high` | `_highDetector` — spore burst |
| `oral` | `_oralDetector` — oral arm whip |
| `oral_tint` | `_oralTintShiftDetector` — oral tint shift |
| `jelly_tint` | `_jellyTintShiftDetector` — jellyfish tint shift |
| `membrane` | `_membraneShiftDetector` — membrane color shift |
| `bg_shift` | `_bgShiftDetector` — background color shift |
| `ds_trig` | `_dsTrigDetector` — deep-sea particle burst |

Optional config messages for pushing parameter changes from host to RPi:

```json
{ "type": "config", "param": "LICHEN_MONOLITH_TILT", "value": 12 }
```

The receiver handles this by calling the corresponding Svelte store setter. All visual parameters will update automatically since `LichenRenderer` reads stores directly.

### Step 5 — WebSocket topology

**RPi as WebSocket server** is recommended. The RPi is the always-on display endpoint. The host connects to it and pushes trigger messages. If the connection drops, the RPi keeps rendering (scene continues animating, triggers just pause until reconnect).

Run a minimal Node.js WebSocket server on the RPi (`ws` package, ~15 lines) alongside the static file server.

### Step 6 — liveAnalyser null-guard

`LichenRenderer.ts` already has null-checks before calling `liveAnalyser.getFloatFrequencyData(...)`. With `liveAnalyser = null` (from `wsReceiver.ts`), those blocks are skipped automatically — `detector.updateData(null, null, buffer)` still runs each frame (clearing `justTriggered`), and `trigger()` from WebSocket sets it in between frames. No changes needed to the renderer's main loop.

---

## What the host app needs

A separate, minimal app (not in this repo). It needs:

1. Audio capture via `getDisplayMedia`
2. An instance of `BeatDetector` per trigger ID (reuse `src/audio/BeatDetector.ts` or the legacy `BeatDetector.js`)
3. Each frame: call `detector.updateData()`, collect `justTriggered` flags, batch into one WebSocket message
4. A simple UI to configure detector Hz values per ID — infrequent, not per-frame
5. A WebSocket client connecting to the RPi server

The host has no knowledge of visual state. The only shared contract between host and RPi is the trigger ID strings.

---

## Summary: files to create or modify

| File | Action | Notes |
|---|---|---|
| `src/audio/VirtualDetector.ts` | **Create** | No-audio drop-in for BeatDetector |
| `src/audio/wsReceiver.ts` | **Create** | Exports `liveAnalyser=null`, `liveContext=null`, WebSocket client, detector registry |
| `src/audio/detectorFactory.ts` | **Create** | Dev-mode shim — re-exports BeatDetector, no-op registerDetector |
| `src/audio/detectorFactory.rpi.ts` | **Create** | RPi shim — exports VirtualDetector, registers into wsReceiver map |
| `src/renderer/LichenRenderer.ts` | **Modify** | Replace `new BeatDetector(...)` with `new DetectorClass(...)`, call `registerDetector(id, det)` after each |
| `vite.config.ts` | **Modify** | Add alias for `@audio/detectorFactory` and `@audio/audioEngine` conditioned on `VITE_RPI_MODE` |
| Everything else | **No change** | All shaders, geometry, physics, stores, and draw logic are fully portable |
