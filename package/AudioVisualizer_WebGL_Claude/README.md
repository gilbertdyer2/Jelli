# AudioVisualizer_WebGL_Claude

Svelte 5 + TypeScript + WebGL2 audio visualizer. Runs on the host machine for development, or in a stripped-down RPi build that streams frames to a 240×240 SPI LCD.

## Running locally (host machine)

```bash
npm run dev        # dev server at http://localhost:5173
npm run build      # production build
```

## Running on the Raspberry Pi 5 LCD

See `launch_instructions_forhumanreading.txt` in the project root for the full walkthrough.

Short version — run these on the Pi:

```bash
# 1. Start LCD driver (port 8766)
python3 /home/gdyer/Documents/lcd-project/frame_pusher.py

# 2. Serve the RPi build
cd /home/gdyer/Documents/lcd-project/package/AudioVisualizer_WebGL_Claude
node ./node_modules/vite/bin/vite.js preview --host --port 5173

# 3. Open Chromium at 240x240
chromium --app=http://localhost:5173 --window-size=240,240
```

Rebuild after source changes:
```bash
npm run build:rpi
```

## Build modes

| Command | Mode | Audio | Frame export |
|---|---|---|---|
| `npm run dev` | Dev | BeatDetector + Web Audio | No |
| `npm run build` | Production | BeatDetector + Web Audio | No |
| `npm run build:rpi` | RPi (`VITE_RPI_MODE=1`) | VirtualDetector + WebSocket | Yes (port 8766) |

## WebSocket ports (RPi build)

| Port | Purpose |
|---|---|
| 8765 | Beat-trigger relay (`ws-server.js`) — receives trigger messages from host machine |
| 8766 | LCD frame stream (`frame_pusher.py`) — receives RGB565 binary frames from browser |

## Test utilities

`push_image.py` (project root) — push a still image or solid colour to the LCD without running the full visualizer stack. Useful for hardware and brightness diagnostics. Stop `frame_pusher.py` first.

```bash
python3 /home/gdyer/Documents/lcd-project/push_image.py image.jpg
python3 /home/gdyer/Documents/lcd-project/push_image.py --fill 000000 --brightness 30
python3 /home/gdyer/Documents/lcd-project/push_image.py --fill ffffff --no-invert
```

Flags: `--brightness 0-100` (backlight PWM), `--gamma FLOAT` (midtone correction), `--fill RRGGBB` (solid colour), `--no-invert` (skip INVON for diagnostics).

## Sending beat triggers to the Pi

```bash
node ws-server.js   # start relay on Pi
```

Then from the host machine:
```python
import asyncio, websockets, json

async def trigger(ids):
    async with websockets.connect('ws://192.168.1.224:8765') as ws:
        await ws.send(json.dumps({'type': 'triggers', 'ids': ids}))

asyncio.run(trigger(['bass', 'membrane']))
```

Trigger IDs: `bass`, `mid`, `high`, `bg_shift`, `oral`, `oral_tint`, `jelly_tint`, `membrane`, `mb_trig`, `ds_trig`
