# System Diagram

## Component Overview

```
Windows Desktop Machine
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  Chrome Browser  (localhost:8000/beat_sender.html)                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Audio Capture                                               │   │
│  │    getDisplayMedia() → AudioContext.createAnalyser()         │   │
│  │    BeatDetector.js (10 detector instances)                   │   │
│  │    justTriggered → sendTriggers() → WS send                 │   │
│  │      {"type":"triggers","ids":["bass","mid",...]}            │   │
│  │                                                              │   │
│  │  Control Dashboard                                           │   │
│  │    ← WS recv  {"type":"client_list","clients":[...]}        │   │
│  │    → WS send  {"type":"frequency_map","map":{...}}          │   │
│  │    → WS send  {"type":"dashboard_register"}                 │   │
│  └──────────────────────┬───────────────────────────────────────┘   │
│                         │ WebSocket  ws://localhost:9000             │
│  desktop_server.py      │                                            │
│  ┌──────────────────────▼───────────────────────────────────────┐   │
│  │  VisualServer  (asyncio, port 9000)                          │   │
│  │   • ClientRegistry  dict[device_id → ClientRecord]           │   │
│  │   • Per-client RTT tracking  (ping/pong, 5-sample median)    │   │
│  │   • Trigger fan-out with fire_at scheduling                  │   │
│  │       fire_at = T_detect + 80 ms                             │   │
│  │   • Dashboard push on connect / disconnect / pong            │   │
│  └──────────────────────┬───────────────────────────────────────┘   │
│                         │ WebSocket  ws://WIN_IP:9000                │
└─────────────────────────┼────────────────────────────────────────────┘
                          │
            ┌─────────────┴──────────────┐
            │                            │
  Raspberry Pi 5               (Raspberry Pi N+1, future device)
  ┌──────────────────────────┐
  │                          │
  │  device_client.py        │
  │  ┌────────────────────┐  │
  │  │  DeviceClient      │  │
  │  │  • register on     │  │
  │  │    connect         │  │
  │  │  • RTTEstimator    │  │
  │  │    (ping/pong)     │  │
  │  │  • delay timer per │  │
  │  │    trigger         │  │
  │  └──────────┬─────────┘  │
  │             │ WebSocket   │
  │  ws-server.js (port 8765) │
  │  ┌──────────▼─────────┐  │
  │  │  Node.js relay     │  │
  │  │  broadcasts to all │  │
  │  │  local clients     │  │
  │  └──────────┬─────────┘  │
  │             │ WebSocket   │
  │  Chromium  (port 5173)    │
  │  ┌──────────▼─────────┐  │
  │  │  Svelte/WebGL app  │  │
  │  │  VirtualDetector   │  │
  │  │  → trigger()       │  │
  │  │  → WebGL jellyfish │  │
  │  └──────────┬─────────┘  │
  │             │ Binary WS   │
  │  frame_pusher.py (:8766)  │
  │  ┌──────────▼─────────┐  │
  │  │  RGB565 receiver   │  │
  │  │  → SPI → SSD1351   │  │
  │  │  128×128 OLED      │  │
  │  └────────────────────┘  │
  └──────────────────────────┘
```

---

## Data Flow (numbered sequence)

1. System audio → `getDisplayMedia()` → `AudioContext.createAnalyser()`
2. `BeatDetector.justTriggered` fires → `sendTriggers(["bass"])` → WS text frame to desktop server
3. Server records `server_time = now_ms`, computes `fire_at = now_ms + 80`, looks up each client's `mapped_triggers`
4. Server sends `{"type":"trigger","ids":["bass"],"server_time":T,"fire_at":T+80}` to each subscribed Pi client
5. Client receives at `T + Δ` where `Δ ≈ one_way_latency`; computes `local_wait = (fire_at - server_time) - one_way_ms`; schedules `asyncio.sleep(local_wait / 1000)`
6. After sleep, client sends `{"type":"triggers","ids":["bass"]}` to `localhost:8765`
7. `ws-server.js` broadcasts the message to all local WebSocket clients
8. `wsReceiver.ts` receives the message → calls `virtualDetectors.get("bass").trigger()`
9. Next animation frame: `justTriggered` returns true → `triggerBlobBeat()` fires jellyfish animation
10. `LichenView.svelte` captures canvas → RGBA→RGB565 conversion → binary WS frame to `localhost:8766`
11. `frame_pusher.py` receives 32,768-byte frame → SPI write → SSD1351 OLED display

---

## Port Reference

| Port | Process | Protocol | Direction | Purpose |
|---|---|---|---|---|
| 9002 | `desktop_server.py` | WebSocket | desktop ↔ Pi | Beat triggers + device registry |
| 8765 | `ws-server.js` | WebSocket | Pi-local | Relay triggers to Svelte app |
| 8766 | `frame_pusher.py` | WebSocket (binary) | Pi-local | RGB565 frames to OLED |
| 5173 | Vite preview | HTTP | Pi-local | Serve built Svelte app to Chromium |
| 8000 | `python -m http.server` | HTTP | desktop-local | Serve `beat_sender.html` |

---

## Launch Order

```
# On Raspberry Pi (in separate terminals):
node /path/to/ws-server.js                         # port 8765
python3 device_client.py --server ws://WIN_IP:9000 # connects to Windows, relays to 8765
cd package/AudioVisualizer_WebGL_Claude && node ./node_modules/vite/bin/vite.js preview --host --port 5173
python3 frame_pusher.py                            # port 8766, drives OLED
chromium --app=http://localhost:5173 --window-size=128,128

# On Windows:
python desktop_server.py                           # port 9000
python -m http.server 8000                         # serve beat_sender.html
# Open http://localhost:8000/beat_sender.html in Chrome
```
