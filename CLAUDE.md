# Pi5 SPI Display Streamer — Project CLAUDE.md

## Overview

Display the Monolith WebGL audio visualizer (Svelte/TypeScript/WebGL2 app in
`package/AudioVisualizer_WebGL_Claude/`) on a Waveshare 1.5" RGB OLED (128x128,
SSD1351, RGB565) connected to a Raspberry Pi 5 at the highest achievable framerate.

---

## Working Practices

- **Source fidelity**: When the user provides a reference (wiki, datasheet, sample code), use it verbatim. Before deviating from or substituting an alternative for a user-provided source, ask to confirm — do not silently use reconstructed or guessed values.
- **Keep docs current**: Update CLAUDE.md (and any README files) as part of the same work that changes hardware, architecture, or behavior — not as a follow-up. These files are the project's ground truth.

---

## Hardware

- **Raspberry Pi 5** running Raspberry Pi OS Bookworm (kernel 6.6)
- **Waveshare 1.5" RGB OLED Module** — SPI, 128x128, SSD1351 controller, RGB565
- **Pi hostname:** `g-rpi`

### Confirmed Pin Map (do not assume or derive — use this table verbatim)

| OLED Signal | Wire color | RPi Board pin | BCM GPIO |
|---|---|---|---|
| VCC | Purple | 3V3 | — |
| GND | White | GND | — |
| RST | Brown | 13 | GPIO 27 |
| DIN (MOSI) | Green | 19 | GPIO 10 |
| DC | Blue | 22 | GPIO 25 |
| CLK (SCLK) | Orange | 23 | GPIO 11 |
| CS (CE0) | Yellow | 24 | GPIO 8 |

Note: No backlight (BL) pin — the OLED is self-illuminating. GPIO 18 is unused.

Use these values verbatim in any device tree overlay, spidev config, or Python driver init.

---

## Hard Constraints

- **RP1 I/O chip** — bcm2835 and WiringPi do NOT work on RPi5. Use lgpio or spidev only.
- **FBCP is dead on Bookworm** — do not attempt.
- **SPI ceiling** — SSD1351 max: 10 MHz (Waveshare reference default). Frame = 32,768 bytes (128x128 RGB565). Theoretical ~25 fps at 10 MHz.

---

## Development Environment

Claude Code runs directly on the Pi (via RPi Connect or an SSH terminal session).
All file reads and writes work normally — no mount restrictions.

### Pi access

    # SSH (key auth, no password prompt):
    ssh gdyer@192.168.1.224

    # Or via Raspberry Pi Connect (browser-based remote access)

---

## Package: AudioVisualizer_WebGL_Claude

Path: `package/AudioVisualizer_WebGL_Claude/` — Vite + Svelte 5 + TypeScript

### Build commands (run on Pi)

    # Standard dev build — uses BeatDetector + Web Audio (for host machine):
    npm run build

    # RPi build — uses VirtualDetector + WebSocket, no audio stack:
    npm run build:rpi
    # (equivalent to: VITE_RPI_MODE=1 vite build)

    # Dev server (host machine only):
    npm run dev

Node.js is system-installed on the Pi; `node` is in PATH.
node_modules are installed for Linux arm64 — do not copy Windows-built node_modules.
The `ws` npm package is installed separately (not in devDependencies) for ws-server.js.

### Store defaults rule

Do not change existing default values in `src/stores/*.ts` unless the variable's
behavior is directly affected by the current task. Adding new stores or wiring new
subscriptions is fine; silently tweaking existing defaults is not.

---

## WebSocket Port — COMPLETE

The RPi build decouples the renderer from audio. The host machine runs BeatDetector
analysis and sends beat triggers over WebSocket; the RPi renders visual-only.

### Architecture

    Windows machine                    Raspberry Pi
    -------------------                ----------------------------------------
    beat_sender.html                   device_client.py
      BeatDetector instances             connects to desktop_server.py
      sends triggers to         ---->    receives trigger packets with fire_at
      desktop_server.py (9002)           relays (with sync delay) to ws-server.js
    desktop_server.py                  ws-server.js (port 8765, local only)
      device registry                    broadcasts to Svelte app in Chromium
      RTT tracking per client
      fire_at scheduling (+80 ms)

### Files created / modified

| File | Notes |
|---|---|
| src/audio/VirtualDetector.ts | Drop-in for BeatDetector; justTriggered auto-clears on read |
| src/audio/wsReceiver.ts | Replaces audioEngine via Vite alias; exports all same names as stubs |
| src/audio/detectorFactory.ts | Dev shim: re-exports BeatDetector as DetectorClass |
| src/audio/detectorFactory.rpi.ts | RPi shim: VirtualDetector as DetectorClass, registers to virtualDetectors map |
| ws-server.js (project root) | ESM syntax required (package.json "type":"module"); local-only relay — no longer connected to directly by Windows host |
| src/renderer/LichenRenderer.ts | BeatDetector -> DetectorClass; registerDetector calls in init() |
| vite.config.ts | Array alias form; RPi-specific aliases FIRST, before generic @audio alias |
| package.json | Added "build:rpi" script |
| desktop_server.py (project root) | Windows: asyncio WebSocket server port 9002; device registry, RTT tracking, fire_at scheduling, dashboard API |
| device_client.py (project root) | Pi: connects to desktop_server.py, receives trigger packets, applies sync delay, relays to ws-server.js localhost:8765 |
| beat_sender.html (project root) | Updated: connects to desktop_server.py (127.0.0.1:9002) not Pi; added Connected Devices dashboard panel |
| docs/protocol_design.md | All 9 message schemas, timing model, WebSocket-over-UDP rationale |
| docs/system_diagram.md | ASCII system diagram, data flow, port reference |
| tests/test_client_server.py | 14 integration + unit tests (run with python -m unittest) |
| docs/report.md | Report template; fill data section after Wireshark capture |

### Running the WS relay on the Pi

    node /home/gdyer/Documents/lcd-project/package/AudioVisualizer_WebGL_Claude/ws-server.js

Listens on port 8765; broadcasts to local clients only (device_client.py → Svelte app).
No longer connected to directly by the Windows host.

### Trigger message format

    {"type": "triggers", "ids": ["bass", "mid"]}

Detector IDs: bass, mid, high, bg_shift, oral, oral_tint, jelly_tint, membrane, mb_trig, ds_trig

### Key implementation detail: VirtualDetector.justTriggered

_updateAudio() in LichenRenderer early-returns when liveAnalyser is null (RPi mode),
so updateData() is never called on VirtualDetectors. justTriggered uses a read-once
getter that auto-clears _pending on access — triggers fire exactly once per RAF frame.

### Vite alias ordering

More-specific aliases (@audio/audioEngine, @audio/detectorFactory) must appear as
array entries BEFORE the generic @audio directory alias, or Vite resolves the directory
first and the RPi overrides never match.

### Windows host tools (run on Windows machine, not Pi)

| File | Notes |
|---|---|
| desktop_server.py (project root) | Main server — device registry, RTT tracking, trigger scheduling; `pip install websockets` required; default port 9002 (ports 9000 and 9001 are taken on this machine) |
| beat_sender.html (project root) | Audio capture + dashboard UI; connects to desktop_server.py at 127.0.0.1:9002; serve with `python -m http.server 8000` and open in Chrome |
| trigger_gui.py (project root) | Legacy manual trigger sender — still functional but predates desktop_server.py; connects directly to ws-server.js on Pi |

`beat_sender.html` imports `BeatDetector.js` and `beatDetectorUtils.js` from
`./package/AudioVisualizer_WebGL_Claude/` — both files must be present in the Windows
copy of the repo (they are tracked by git after the submodule-to-files conversion).

Note: use `127.0.0.1` (not `localhost`) in the beat_sender.html Host field on Windows —
Chrome resolves `localhost` to `::1` (IPv6) which may not reach the Python server.

---

## OLED Frame Streaming — COMPLETE (Approach A)

The browser captures the WebGL canvas at ~30fps and streams it to the LCD via SPI.

### Architecture

    Browser (Chromium on RPi)              frame_pusher.py
    --------------------------------       --------------------------------
    LichenView.svelte                      WebSocket server, port 8766
      gl.readPixels() after each frame --> receives 32,768-byte RGB565 frames
      RGBA->RGB565 + Y-flip in JS          lgpio: DC/RST (GPIO 25/27); no BL
      send binary over WS port 8766        spidev: SPI0 at 10 MHz, mode 3
                                           SSD1351 SetWindow + WriteRAM push

Port 8766 is dedicated to frame data; port 8765 remains for beat triggers.

### Files created / modified

| File | Notes |
|---|---|
| src/components/LichenView.svelte | Frame export loop (~42 added lines); gated on VITE_RPI_MODE=1 |
| frame_pusher.py (project root) | WebSocket server + full SSD1351 driver via lgpio/spidev; no BL GPIO |
| push_image.py (project root) | New; diagnostic tool — pushes a still image or solid fill to LCD; supports --brightness, --gamma, --fill, --no-invert |

### Key implementation details

- `gl.readPixels()` used (not `canvas.getImageData()`) since the canvas has a WebGL2 context.
- `gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null)` called before readPixels to ensure canvas is the read target.
- Export RAF is registered after `renderer.start()`, so it fires after LichenRenderer's RAF in the same batch — drawing buffer is still valid, no `preserveDrawingBuffer: true` needed.
- Y-flip and RGBA→RGB565 are combined into a single loop in JavaScript (zero-copy path).
- `spi.writebytes2()` used instead of `writebytes()` — accepts bytes slices directly; 4096-byte chunks.
- SSD1351 requires **SPI mode 3** (CPOL=1, CPHA=1); ST7789 used mode 0 — this is a critical difference.
- Init sequence verbatim from Waveshare reference: `External/OLED_Module_Code/RaspberryPi/python/lib/waveshare_OLED/OLED_1in5_rgb.py`.
- No backlight GPIO; OLED is self-illuminating. GPIO 18 is not claimed or driven.
- Y-flip in JS is preserved from the ST7789 implementation. If image appears vertically flipped on first hardware test, toggle bit 4 of the 0xA0 remap parameter (0x74 → 0x64) in `oled_init()`, or remove the Y-flip loop in LichenView.svelte.
- `websockets` Python library installed at `~/.local/lib/python3.13/site-packages/` via `pip3 install --user --break-system-packages websockets`.

### Running the LCD visualizer

See `launch_instructions_forhumanreading.txt` for the full step-by-step.

Quick reference:

    # ── Windows (run first) ──────────────────────────────────────────────────

    # 1. Desktop server (device registry + trigger scheduler)
    python desktop_server.py
    # (default port 9002; ports 9000 and 9001 are taken on this machine)

    # 2. Serve beat_sender.html
    python -m http.server 8000
    # Open http://localhost:8000/beat_sender.html in Chrome
    # Host field: 127.0.0.1  Port field: 9002

    # ── Raspberry Pi (5 terminals) ───────────────────────────────────────────

    # 3. Local trigger relay (Svelte app connects to this)
    node /home/gdyer/Documents/lcd-project/package/AudioVisualizer_WebGL_Claude/ws-server.js

    # 4. Device client (connects to Windows server, relays triggers to ws-server.js)
    python3 /home/gdyer/Documents/lcd-project/device_client.py --server ws://192.168.1.172:9002

    # 5. LCD frame driver
    python3 /home/gdyer/Documents/lcd-project/frame_pusher.py

    # 6. Serve the RPi build
    cd /home/gdyer/Documents/lcd-project/package/AudioVisualizer_WebGL_Claude
    node ./node_modules/vite/bin/vite.js preview --host --port 5173

    # 7. Open Chromium
    chromium --app=http://localhost:5173 --window-size=128,128

Rebuild after source changes:

    cd /home/gdyer/Documents/lcd-project/package/AudioVisualizer_WebGL_Claude && npm run build:rpi

---

## Implementation Roadmap

### Approach A — Canvas Capture + Python spidev — COMPLETE

See "LCD Frame Streaming" section above.

### Approach B — DRM/KMS st7789 Kernel Driver (NEXT)

Linux 6.6 includes drm/tiny/st7789.c via mipi-dbi. With a device tree overlay the LCD
becomes a real KMS display. cage Wayland compositor + Chromium kiosk renders directly
to it via DMA SPI — zero app code changes beyond the WebSocket port.

Expected: 30-45 fps. Requires a ~20-line DT overlay using the confirmed pin map above.

### Approach C — Native GLES (if needed)

Full C++ renderer rewrite using EGL+GBM. ~45-60 fps. High effort — only if 45 fps
becomes a hard requirement after Approach B.

---

## Verification Baseline

    # Confirm OLED hardware is wired correctly (runs Waveshare test pattern):
    python3 /home/gdyer/Documents/lcd-project/External/OLED_Module_Code/RaspberryPi/python/example/OLED_1in5_rgb_test.py

    # Confirm frame_pusher.py dependencies are installed:
    python3 -c "import websockets, lgpio, spidev; print('ok')"

    # Push a test image or solid fill to OLED (stop frame_pusher.py first):
    python3 /home/gdyer/Documents/lcd-project/push_image.py --fill 000000   # pure black
    python3 /home/gdyer/Documents/lcd-project/push_image.py image.jpg        # still image

---

## Detailed App Internals

See `package/AudioVisualizer_WebGL_Claude/CLAUDE.md` for full documentation:
- Blob/clam physics, beat trigger sequence, render loop draw order
- BeatDetector threshold formula and known issues
- Slider groups, spawn modal, underwater system, dither post-processing
- Audio engine detector table, duo-link, spotlight mode
