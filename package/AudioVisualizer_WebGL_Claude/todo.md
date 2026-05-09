# Monolith Renderer — Bug & Feature Backlog

---

## Bugs

### #1 — Cache `getUniformLocation` (called every frame)
**Files:** `src/renderer/LichenRenderer.ts` — `_applyBloom()` (lines ~2337–2372), `_applyMotionBlur()` (lines ~2394–2396)

Both post-processing passes call `gl.getUniformLocation()` on every frame rather than caching the results. In `_applyMotionBlur()` this is done through lambda closures (`locBlit`, `locAccum`, `locBlur`) that issue a live GL query each invocation. In `_applyBloom()` the calls are inline per draw. At 3 bloom passes this is ~11 GL API round-trips per frame just for location lookups, in addition to MB's per-frame queries.

**Todo:** Cache all uniform locations as class fields alongside their program handles, populated once at shader compile time. Replace all inline `gl.getUniformLocation(prog, name)` calls in the hot render path with the cached values.

---

### #2 — `_mbAccumInit` not reset on FBO resize (motion blur flash on resize)
**File:** `src/renderer/LichenRenderer.ts` — `_resizeMBFBOs()` and the `_mbAccumInit` guard at line ~2399

When the canvas is resized while motion blur is active, `_resizeMBFBOs(w, h)` reallocates the accumulation texture (clearing its contents), but `_mbAccumInit` is never set back to `false`. The next frame skips the seed step and blends the new scene against an empty accumulation buffer, producing a flash or dirty frame.

**Todo:** Set `this._mbAccumInit = false` inside `_resizeMBFBOs()` so the next frame re-seeds the accumulation buffer cleanly after any resize.

---

### #3 — MB trigger boost only wired to the bass detector; no Hz control
**File:** `src/renderer/LichenRenderer.ts` — `_handleTriggers()` line ~1818; `src/stores/motionblur.ts`

The motion blur trigger boost (`_mbTrigEnv += 1.0`) fires exclusively on `_bassDetector.justTriggered`. Oral arm, membrane shift, and tentacle tint-shift triggers produce no MB response. Additionally, the MB boost has no dedicated beat detector of its own — it is fully coupled to the bass detector's frequency.

**Current MB trigger defaults (maintain these):**
- Trigger Boost: 0.52 (existing `MB_TRIGGER_BOOST` store)
- Trigger Decay: 350 ms (existing `MB_TRIGGER_DECAY` store)
- Reverse Boost: false (existing `MB_REVERSE_BOOST` store)

**Todo:**
- Add `MB_TRIG_HZ` (default: same as current bass detector Hz, i.e. 90 Hz) and `MB_TRIG_RANGE_HZ` (default: 30 Hz) stores to `motionblur.ts`.
- Instantiate a dedicated MB trigger `BeatDetector` in `LichenRenderer` driven by these stores, independent of the bass/oral/membrane detectors.
- Wire `_mbTrigEnv` boost to this dedicated detector instead of `_bassDetector`.
- Expose Hz and range sliders in the Motion Blur control group in `LichenControlsTab.svelte`.

---

### #4 — BeatDetector `triggerDuration` and `octaves` not runtime-updatable; constructor values don't match stores
**Files:** `BeatDetector.js` / `src/audio/BeatDetector.ts`; `src/renderer/LichenRenderer.ts` lines ~187–194; `src/stores/lichen.ts`; `src/components/LichenControlsTab.svelte`

`triggerDuration` (frames the detector stays "active" after a trigger, acting as a refire cooldown) and `octaves` (number of frequency octaves analyzed around `targetHz`) are set at construction and cannot be changed at runtime. The hardcoded constructor values in `LichenRenderer` are also stale relative to the store defaults (e.g. `_oralDetector` is constructed at 60 Hz but the store now says 1000 Hz; `_jellyShiftDetector` at 120 Hz vs. 8000 Hz; `_membraneShiftDetector` at 200 Hz vs. 1000 Hz). The `octaves: 1` hardcoded on `_jellyShiftDetector` is also insufficient for reliable detection at 8000 Hz with a ±1000 Hz range.

**Todo:**
- Add property setters for `triggerDuration` and `octaves` on `BeatDetector` (both JS and TS versions) so they can be changed at runtime without a full `reset()`. Changing `octaves` should trigger a reset since it affects the spectral flux calculation window.
- Add corresponding stores to `lichen.ts` for each detector:
  - `ORAL_TINT_SHIFT_OCTAVES`, `ORAL_TINT_SHIFT_TRIGGER_DURATION`
  - `JELLY_TINT_SHIFT_OCTAVES`, `JELLY_TINT_SHIFT_TRIGGER_DURATION`
  - `JELLY_MEMBRANE_SHIFT_OCTAVES`, `JELLY_MEMBRANE_SHIFT_TRIGGER_DURATION`
  - (and for the bass/mid/high detectors used for jellyfish propulsion/lichen growth/spores if desired)
- Update `LichenRenderer` store subscriptions to sync these new stores to the respective detector instances.
- Fix constructor hardcoded values to match store defaults (or remove them and rely entirely on store-driven initialization).
- Expose octaves and trigger duration sliders for each trigger group in `LichenControlsTab.svelte` (alongside the existing Hz and range sliders for each detector group).

---

### #5 — Beat detector peak-detection window size is hardcoded at 9 frames
**Files:** `BeatDetector.js` lines 32, 147; `src/audio/BeatDetector.ts`

The peak-detection window is `new Array(9).fill(0.0)` — hardcoded in both the constructor and `reset()`. The center index `mid` is already computed dynamically as `Math.floor(this._fluxHistory.length / 2)`, so the window size is purely a length parameter. A smaller window (e.g. 5 frames) reduces look-behind latency from ~67 ms to ~33 ms at 60 fps, at the cost of more sensitivity to noise. A larger window (e.g. 13) is more robust but adds lag.

**Todo:**
- Add `windowSize = 9` to the `BeatDetector` constructor parameter list.
- Replace `new Array(9)` with `new Array(this._windowSize)` in both the constructor and `reset()`.
- Add a runtime setter that replaces `_fluxHistory` with a new array of the desired length and calls `reset()`.
- Add corresponding stores (`ORAL_TINT_SHIFT_WINDOW`, `JELLY_TINT_SHIFT_WINDOW`, `JELLY_MEMBRANE_SHIFT_WINDOW`, etc.) and wire them to the respective detectors via subscriptions in `LichenRenderer`.
- Expose per-detector window size sliders in `LichenControlsTab.svelte` (integer, range 3–21, step 2 to keep odd/centered).

---

### #6 — PhysicsChain constraint correction can over-correct after large impulses
**File:** `src/renderer/PhysicsChain.ts` — distance constraint loop

The inextensible distance constraint computes `corr = (dist - segLen) / dist` and applies it as a full positional correction. When `dist` is significantly larger than `segLen` (which can occur immediately after a whip impulse on the tail segments), `corr` approaches 1.0, effectively teleporting the particle to its parent's position. This produces a visible snap/jitter artifact on the frame following a strong whip, and can cascade as each corrected segment violates its own parent's distance constraint.

**Todo:** Clamp the correction fraction, e.g. `const corr = Math.min((dist - segLen) / dist, 0.5)`, or run 2–3 constraint iterations per physics step to distribute the correction smoothly. Consider making the iteration count a configurable parameter.

---

### #7 — `PhysicsChain.whip()` uses `Math.random()` in an O(chains × segments) loop
**File:** `src/renderer/PhysicsChain.ts` — `whip()` method

Each segment in every chain receives 2 random lateral impulse components via `Math.random()`. With 11 chains × 27 segments this is 594 `Math.random()` calls per whip event. The existing `_hash()` method (used elsewhere in the class) provides a cheap deterministic alternative that produces more spatially coherent results (adjacent segments get related impulses rather than fully independent noise).

**Todo:** Replace the `Math.random()` calls in `whip()` with `this._hash(i * some_prime + s * another_prime)` or similar, using the chain index `i` and segment index `s` as inputs. This both reduces RNG overhead and makes whip impulse shapes reproducible/tunable.

---

### #9 — Membrane ripple epicentre incorrectly scaled by `u_memScale`
**File:** `src/renderer/membraneShader.ts` — ripple loop in the vertex shader

Ripple epicentres (`u_rippleParams[i].xyz`) are set from model-space coordinates on the outer shell, then multiplied by `u_memScale` in the membrane shader:
```glsl
vec3 epic = u_rippleParams[i].xyz * u_memScale;
```
The membrane vertex positions are already scaled inward by `u_memScale`, so the epicentre scaling creates a non-linear offset between where the outer shell ripple originates and where the inner membrane ripple appears. For `u_memScale = 0.89` the epicentres drift inward by 11%, causing visible misalignment between the outer glass ripples and the inner membrane ripples.

**Todo:** Pass a separate set of ripple epicentre uniforms pre-scaled for the membrane (computed CPU-side as `epicentre * u_memScale`), or remove the `* u_memScale` from the shader and scale the uniform values before upload. Either approach eliminates the coordinate space mismatch.

---

## Features / Performance Settings

### Max FPS Cap (user-configurable)
**File:** `src/renderer/LichenRenderer.ts` — `_tick()` / rAF scheduling; `src/stores/lichen.ts` (or new `src/stores/performance.ts`); `src/components/LichenControlsTab.svelte`

The renderer runs at the display's native refresh rate (120/144 Hz on modern monitors). On high-refresh displays this doubles or triples the number of draw calls per second with no perceptible quality gain for this content, wasting GPU and CPU cycles.

**Todo:**
- Add a `PERF_MAX_FPS` store (writable, default `0` = uncapped; range 1–240).
- In `_tick()`, track `_lastT` and skip rendering if `(now - _lastT) < (1000 / targetFps)` when a cap is set (still call `requestAnimationFrame` to reschedule but return early).
- Expose as a numeric input or slider (labeled "FPS Cap", 0 = uncapped) in a new Performance group in `LichenControlsTab.svelte`. Include a live FPS readout (computed from rolling average of `dt` values) so users can see actual render rate.

---

### Disable Organic Deformation (performance toggle)
**File:** `src/renderer/LichenRenderer.ts` — shader upload of `u_organicStr`; `src/stores/lichen.ts` — `LICHEN_ORGANIC_STR`

`LICHEN_ORGANIC_STR` already exists as a store and is likely exposed as a slider, but it is not surfaced as an explicit on/off toggle. The organic noise function runs in the vertex shader for all geometry (monolith, membrane, foliage quads) and uses a 3-octave sinusoidal FBM (~6 `sin()` calls per vertex per frame). Setting it to 0 eliminates this cost entirely but requires the user to find and drag a slider to zero.

**Todo:** Add a dedicated "Organic Deformation" checkbox to `LichenControlsTab.svelte` that sets `LICHEN_ORGANIC_STR` to 0 when disabled and restores the previous non-zero value when re-enabled. Label it clearly as a performance toggle.

---

### Chromatic Aberration Toggle (`CA_ENABLED`)
**File:** `src/renderer/lichenShaders.ts` — `MONOLITH_FRAG`; `src/stores/lichen.ts` — `LICHEN_CA_ENABLED`

When CA is enabled, the main shell fragment shader runs 2 extra `normalize()`, 1 `cross()`, and 2 `pow()` Fresnel calculations per fragment on every rendered pixel of the monolith. `LICHEN_CA_ENABLED` store and toggle already exist but should be confirmed present and prominently labelled as a performance option.

**Todo:** Verify the CA enabled checkbox is present in `LichenControlsTab.svelte` and grouped with other performance/quality settings. If not yet exposed, add it.

---

### Disable Foliage Entirely (remove unused render cost)
**Files:** `src/renderer/LichenRenderer.ts` — lichen/foliage draw call; `src/renderer/lichenShaders.ts`; `src/stores/lichen.ts`; `src/components/LichenControlsTab.svelte`

Foliage (the instanced lichen patch draw — runners, leaves, blooms) is currently rendered every frame but is visually unused in the Monolith/jellyfish scene. The draw is expensive due to per-instance type branching in the fragment shader (`LICHEN_FRAG`) causing warp divergence across runner/leaf/bloom node types, with the bloom type costing ~50 ALU ops per fragment including `atan()`, `exp()`, and multi-tap hash noise. Removing it from the render loop entirely eliminates this cost.

**Todo:**
- Add a `LICHEN_FOLIAGE_ENABLED` store (writable bool, default `false`).
- Guard the foliage draw call in `LichenRenderer._draw()` behind `if (this._foliageEnabled)`.
- Expose as a checkbox in `LichenControlsTab.svelte` (off by default since foliage is currently unused, with a note that enabling it adds significant GPU cost).
