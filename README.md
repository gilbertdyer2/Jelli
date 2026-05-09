# Distributed Audio Visualizer

A real-time audio visualizer that reacts to desktop audio and renders on a Raspberry Pi OLED display. Beat detection runs on a Windows desktop and streams trigger events over WebSocket to one or more Pi clients, which animate a WebGL jellyfish visualizer on a 128×128 SPI OLED.

## Hardware

- Raspberry Pi 5
- Waveshare 1.5" RGB OLED (128×128, SSD1351, SPI) ~$20
- 30cm Beamsplitter cube ~$30-35
(The last 2 can be found on Amazon)

## How it works

```
Windows                         Raspberry Pi
-------                         ------------
beat_sender.html                device_client.py
  audio capture (getDisplayMedia)  ← connects to desktop server
  BeatDetector.js (10 freq bands)  receives trigger packets
  → desktop_server.py (port 9002)  relays to local Svelte app

desktop_server.py               Svelte/WebGL visualizer (Chromium)
  device registry                 jellyfish animation reacts to triggers
  RTT-based sync scheduling       → frame_pusher.py → OLED via SPI
  per-device trigger mapping
```

Beat triggers are scheduled with a `fire_at` timestamp so multiple devices animate in sync despite different network latencies.

## Running

See [`launch_instructions_forhumanreading.txt`](launch_instructions_forhumanreading.txt) for the full step-by-step.

**Windows** — start the desktop server, then serve `beat_sender.html`:
```bash
python desktop_server.py          # port 9002
python -m http.server 8000        # open beat_sender.html in Chrome
```

**Raspberry Pi** — start the relay, device client, OLED driver, and Vite preview:
```bash
node package/AudioVisualizer_WebGL_Claude/ws-server.js
python3 device_client.py --server ws://<WINDOWS_IP>:9002
python3 frame_pusher.py
cd package/AudioVisualizer_WebGL_Claude && node ./node_modules/vite/bin/vite.js preview --host --port 5173
chromium --app=http://localhost:5173 --window-size=128,128
```

## Protocol

See [`docs/protocol_design.md`](docs/protocol_design.md) for the full message schema and timing model, and [`docs/system_diagram.md`](docs/system_diagram.md) for the system architecture.

## Dependencies

**Pi:** `pip install websockets lgpio spidev`, Node.js  
**Windows:** `pip install websockets`, Chrome
