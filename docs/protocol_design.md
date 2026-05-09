# Protocol Design

## Overview

This system distributes real-time audio beat triggers from a Windows desktop to one or more Raspberry Pi display devices over a local network. The desktop runs a WebSocket server (`desktop_server.py`, port 9000); Pi devices run a client (`device_client.py`) that connects to it.

**Transport: WebSocket (not UDP)**

WebSocket was chosen over raw UDP for the following reasons:

1. **NAT traversal** — WebSocket operates over TCP and works through NAT without UDP hole-punching or port-forwarding.
2. **Existing library on-device** — The `websockets` Python library is already installed on the Pi and in use by `frame_pusher.py`. No new dependencies needed.
3. **Low event rate** — Beat triggers fire at ≤ 60 events/second and each message is < 200 bytes. TCP's head-of-line blocking and ~40-byte overhead per segment are negligible at this rate.
4. **Connection-oriented device registry** — TCP connection state maps directly to device presence. When a Pi connects, it registers; when the connection drops, the device is automatically removed from the registry. UDP would require a separate keep-alive and timeout mechanism.
5. **No raw socket permissions** — Raw socket access requires elevated privileges on Windows and Linux; WebSocket does not.

Synchronization between devices is achieved at the application layer (scheduled `fire_at` timestamp in each trigger packet), independent of the transport.

---

## System Roles

| Component | File | Machine | Role |
|---|---|---|---|
| Desktop server | `desktop_server.py` | Windows | Beat relay, device registry, synchronization scheduler, dashboard backend |
| Device client | `device_client.py` | Raspberry Pi | Display endpoint, registers capabilities, receives filtered/timed triggers, relays to local Svelte visualizer |
| Dashboard | `beat_sender.html` | Windows browser | Audio capture, beat detection, operator UI, real-time device monitoring, per-device trigger mapping |
| Local relay | `ws-server.js` | Raspberry Pi | Broadcasts triggers from `device_client.py` to the Svelte WebGL app running in Chromium |

---

## Message Schema

All messages are UTF-8 JSON text frames. Timestamps are Unix time in milliseconds (`float`).

### `register` — Client → Server

Sent once immediately after the WebSocket connection is established.

```json
{
  "type": "register",
  "device_id": "rpi-jellyfish-01",
  "device_label": "Pi5 OLED Jellyfish",
  "subscriptions": ["bass", "mid", "high", "bg_shift", "oral",
                    "oral_tint", "jelly_tint", "membrane", "mb_trig", "ds_trig"]
}
```

| Field | Type | Description |
|---|---|---|
| `device_id` | string | Stable identifier (hostname or `--device-id` CLI arg) |
| `device_label` | string | Human-readable name shown in dashboard |
| `subscriptions` | string[] | Trigger IDs this device wants to receive; empty = all |

---

### `ack` — Server → Client

Sent immediately after a successful `register`.

```json
{
  "type": "ack",
  "device_id": "rpi-jellyfish-01",
  "server_time": 1746724800123.4
}
```

| Field | Type | Description |
|---|---|---|
| `device_id` | string | Echoes the registered device_id |
| `server_time` | float | Server's `time.time() * 1000` at send time |

---

### `ping` — Client → Server (RTT measurement)

Sent by the client every 2 seconds.

```json
{
  "type": "ping",
  "seq": 42,
  "t": 1746724800200.1
}
```

| Field | Type | Description |
|---|---|---|
| `seq` | int | Monotonically incrementing sequence number |
| `t` | float | Sender's timestamp at send time (ms) |

---

### `pong` — Server → Client

Reply to `ping`. The server also sends `ping` to the client; the client replies with `pong`.

```json
{
  "type": "pong",
  "seq": 42,
  "t": 1746724800200.1,
  "server_time": 1746724800215.7
}
```

| Field | Type | Description |
|---|---|---|
| `seq` | int | Echoed from the ping |
| `t` | float | Echoed from the ping (allows sender to compute RTT without clock sync) |
| `server_time` | float | Replier's clock at reply time |

RTT is computed by the sender as `now_ms - pong.t`. The client maintains a rolling 5-sample median.

---

### `trigger` — Server → Client

Sent to each subscribed device client when beat_sender.html detects a beat. Includes a `fire_at` timestamp for synchronized playback.

```json
{
  "type": "trigger",
  "ids": ["bass", "mid"],
  "server_time": 1746724800350.0,
  "fire_at": 1746724800430.0
}
```

| Field | Type | Description |
|---|---|---|
| `ids` | string[] | Trigger IDs that fired (filtered to this device's `mapped_triggers`) |
| `server_time` | float | Server clock when the beat was detected |
| `fire_at` | float | Server-clock ms when all devices should fire their visual |

`fire_at = server_time + LEAD_TIME_MS` (default 80 ms). See Timing Model below.

---

### `frequency_map` — Dashboard → Server → Clients

Sent by the dashboard when the operator changes which trigger IDs are assigned to which device. The server stores the mapping and forwards it to all connected device clients.

```json
{
  "type": "frequency_map",
  "map": {
    "rpi-jellyfish-01": ["bass", "mid", "high"],
    "rpi-jellyfish-02": ["membrane", "mb_trig"]
  }
}
```

| Field | Type | Description |
|---|---|---|
| `map` | object | Keys: device_id. Values: list of trigger IDs assigned to that device |

---

### `dashboard_register` — Dashboard → Server

Sent by `beat_sender.html` on connect to identify itself as the dashboard. The server then pushes `client_list` updates proactively (on connect/disconnect/pong events) without waiting for a poll.

```json
{
  "type": "dashboard_register"
}
```

---

### `get_clients` — Dashboard → Server

Polls for the current client list. The dashboard sends this on load and every 5 seconds as a fallback.

```json
{
  "type": "get_clients"
}
```

---

### `client_list` — Server → Dashboard

```json
{
  "type": "client_list",
  "clients": [
    {
      "device_id": "rpi-jellyfish-01",
      "device_label": "Pi5 OLED Jellyfish",
      "connected_at": 1746724790000.0,
      "rtt_ms": 4.2,
      "subscriptions": ["bass", "mid", "high"],
      "mapped_triggers": ["bass", "mid", "high"]
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `connected_at` | float | Server timestamp when `register` was received |
| `rtt_ms` | float\|null | Median RTT from server ping; null until first pong |
| `subscriptions` | string[] | What the device registered for |
| `mapped_triggers` | string[] | Current dashboard assignment (defaults to `subscriptions`) |

---

## Connection Lifecycle

```
Client                          Server
  |------- TCP handshake -------->|
  |------- WS upgrade ----------->|
  |------- register ------------->|
  |<------ ack -------------------|   (server spawns ping_loop task)
  |                               |
  |------- ping (seq=0) --------->|
  |<------ pong (seq=0) ----------|   (server updates rtt_ms, pushes client_list to dashboard)
  |                               |
  |<------ trigger + fire_at -----|   (from beat_sender.html beat event)
  |  asyncio.sleep(fire_delay)    |
  |  relay to localhost:8765      |
  |                               |
  |------- ping (seq=1) --------->|
  ...
  |   (TCP close / error)         |
  |                               |   (server removes from registry, pushes client_list)
```

---

## Timing Model

**Goal:** Multiple Pi clients fire their visual animation at the same wall-clock moment, regardless of individual network latency.

**Server side:**
```
T_detect  = time.time() * 1000          # ms, server clock
fire_at   = T_detect + LEAD_TIME_MS     # default: T_detect + 80 ms
```

`LEAD_TIME_MS` must exceed the worst-case one-way latency. On a typical home LAN, RTT < 10 ms, so one-way latency < 5 ms. 80 ms provides a 75 ms margin.

**Client side** (on receiving a trigger packet at local time `T_recv`):
```
remaining    = fire_at - server_time    # how long the server intended to wait (≈ 80 ms)
local_wait   = remaining - one_way_ms   # subtract our estimated one-way latency
delay        = max(0, local_wait) / 1000.0
asyncio.sleep(delay)                    # then relay to local visualizer
```

**Example with two clients on LAN:**

| Client | RTT | one_way | remaining | local_wait | fires at (wall clock) |
|---|---|---|---|---|---|
| Pi A | 4 ms | 2 ms | 80 ms | 78 ms | T_detect + 80 ms |
| Pi B | 10 ms | 5 ms | 80 ms | 75 ms | T_detect + 80 ms |

Both clients fire within ~3 ms of each other — imperceptible to the human eye.

**Before first pong:** The client has no RTT estimate yet. It fires immediately on receipt (best-effort, no synchronization). Full synchronization activates within ~2 seconds of connection (after the first ping/pong exchange).

---

## Port Reference

| Port | Process | Protocol | Direction | Purpose |
|---|---|---|---|---|
| 9002 | `desktop_server.py` | WebSocket | desktop ↔ Pi | Beat triggers, device registry, dashboard API |
| 8765 | `ws-server.js` | WebSocket | Pi-local | Relay triggers from `device_client.py` to Svelte app |
| 8766 | `frame_pusher.py` | WebSocket (binary) | Pi-local | RGB565 frames from Svelte app to OLED |
| 5173 | Vite preview | HTTP | Pi-local | Serve built Svelte app to Chromium |
| 8000 | `python -m http.server` | HTTP | desktop-local | Serve `beat_sender.html` |

---

## Trigger ID Reference

| ID | Target Hz | Description |
|---|---|---|
| bass | 60 | Kick drum fundamental |
| mid | 375 | Mid-range (snare body) |
| high | 12000 | High frequency (hi-hat, cymbals) |
| membrane | 200 | Low-mid membrane |
| mb_trig | 150 | Membrane trigger variant |
| bg_shift | 100 | Background color shift |
| oral | 500 | Vocal/oral body |
| oral_tint | 800 | Vocal overtone tint |
| jelly_tint | 2000 | Jellyfish color tint |
| ds_trig | 5000 | High-mid detail trigger |
