"""
desktop_server.py — Audio visualizer desktop server (runs on Windows)

Receives beat trigger events from beat_sender.html, fans them out to registered
device clients (Raspberry Pis) with a scheduled fire_at timestamp for synchronization.
Also serves the control dashboard via the same WebSocket connection.

Usage:
    python desktop_server.py [--port 9000] [--lead-time 80]
"""

import argparse
import asyncio
import dataclasses
import json
import logging
import statistics
import time
from typing import Optional

from websockets.asyncio.server import serve, ServerConnection

HOST = ["0.0.0.0", "::"]   # listen on both IPv4 and IPv6 so browser localhost resolves correctly on Windows
PORT = 9002
LEAD_TIME_MS = 80.0   # How far ahead to schedule fire_at relative to detection time.
                      # Must exceed worst-case one-way latency. 80ms >> typical LAN RTT/2.
PING_INTERVAL = 2.0   # Seconds between server-initiated pings per client.
RTT_WINDOW = 5        # Number of RTT samples to keep for median calculation.


@dataclasses.dataclass
class ClientRecord:
    device_id: str
    device_label: str
    websocket: ServerConnection
    connected_at: float
    subscriptions: list
    mapped_triggers: list
    rtt_samples: list
    rtt_ms: Optional[float]
    ping_seq: int
    ping_pending: dict


class VisualServer:
    def __init__(self, lead_time_ms: float = LEAD_TIME_MS):
        self._clients: dict[str, ClientRecord] = {}
        self._dashboard_ws: set[ServerConnection] = set()
        self._lock = asyncio.Lock()
        self._lead_time_ms = lead_time_ms

    async def handler(self, ws: ServerConnection) -> None:
        device_id: Optional[str] = None
        try:
            async for raw in ws:
                try:
                    msg = json.loads(raw)
                except json.JSONDecodeError:
                    logging.warning("Received non-JSON message, ignoring")
                    continue
                mtype = msg.get("type")
                if mtype == "register":
                    device_id = await self._handle_register(ws, msg)
                elif mtype == "dashboard_register":
                    await self._handle_dashboard_register(ws)
                elif mtype == "triggers":
                    await self._handle_triggers(msg)
                elif mtype == "pong":
                    await self._handle_pong(msg)
                elif mtype == "get_clients":
                    await self._handle_get_clients(ws)
                elif mtype == "frequency_map":
                    await self._handle_frequency_map(msg)
                else:
                    logging.debug("Unknown message type: %s", mtype)
        except Exception as e:
            logging.warning("Connection closed with error: %s", e)
        finally:
            await self._cleanup(ws, device_id)

    async def _handle_register(self, ws: ServerConnection, msg: dict) -> str:
        device_id = msg.get("device_id", f"device-{id(ws)}")
        subs = msg.get("subscriptions", [])
        record = ClientRecord(
            device_id=device_id,
            device_label=msg.get("device_label", device_id),
            websocket=ws,
            connected_at=time.time() * 1000,
            subscriptions=list(subs),
            mapped_triggers=list(subs),
            rtt_samples=[],
            rtt_ms=None,
            ping_seq=0,
            ping_pending={},
        )
        async with self._lock:
            self._clients[device_id] = record
        await ws.send(json.dumps({
            "type": "ack",
            "device_id": device_id,
            "server_time": time.time() * 1000,
        }))
        asyncio.create_task(self._ping_loop(device_id))
        await self._push_client_list_to_dashboard()
        logging.info("Device registered: %s (%s)", device_id, record.device_label)
        return device_id

    async def _handle_triggers(self, msg: dict) -> None:
        ids: list = msg.get("ids", [])
        if not ids:
            return
        server_now = time.time() * 1000
        fire_at = server_now + self._lead_time_ms

        async with self._lock:
            snapshot = list(self._clients.values())

        for record in snapshot:
            effective = [tid for tid in ids if tid in record.mapped_triggers]
            if not effective:
                continue
            packet = json.dumps({
                "type": "trigger",
                "ids": effective,
                "server_time": server_now,
                "fire_at": fire_at,
            })
            try:
                await record.websocket.send(packet)
            except Exception as e:
                logging.warning("Failed to send trigger to %s: %s", record.device_id, e)

    async def _handle_dashboard_register(self, ws: ServerConnection) -> None:
        async with self._lock:
            self._dashboard_ws.add(ws)
        await self._handle_get_clients(ws)
        logging.info("Dashboard connected")

    async def _handle_get_clients(self, ws: ServerConnection) -> None:
        payload = json.dumps(self._build_client_list())
        try:
            await ws.send(payload)
        except Exception as e:
            logging.warning("Failed to send client_list: %s", e)

    async def _handle_frequency_map(self, msg: dict) -> None:
        new_map: dict = msg.get("map", {})
        async with self._lock:
            for device_id, triggers in new_map.items():
                if device_id in self._clients:
                    self._clients[device_id].mapped_triggers = list(triggers)
            snapshot = list(self._clients.values())
        # Broadcast updated map to all device clients so they can filter locally
        payload = json.dumps({"type": "frequency_map", "map": new_map})
        for record in snapshot:
            try:
                await record.websocket.send(payload)
            except Exception:
                pass
        await self._push_client_list_to_dashboard()
        logging.info("Frequency map updated: %s", new_map)

    async def _handle_pong(self, msg: dict) -> None:
        seq = msg.get("seq")
        now = time.time() * 1000
        async with self._lock:
            for record in self._clients.values():
                if seq in record.ping_pending:
                    send_t = record.ping_pending.pop(seq)
                    rtt = now - send_t
                    record.rtt_samples.append(rtt)
                    if len(record.rtt_samples) > RTT_WINDOW:
                        record.rtt_samples.pop(0)
                    record.rtt_ms = statistics.median(record.rtt_samples)
                    logging.debug("RTT %s: %.2f ms (median=%.2f)",
                                  record.device_id, rtt, record.rtt_ms)
                    break
        await self._push_client_list_to_dashboard()

    async def _ping_loop(self, device_id: str) -> None:
        while True:
            await asyncio.sleep(PING_INTERVAL)
            async with self._lock:
                record = self._clients.get(device_id)
            if record is None:
                break
            seq = record.ping_seq
            record.ping_seq += 1
            t = time.time() * 1000
            record.ping_pending[seq] = t
            try:
                await record.websocket.send(json.dumps(
                    {"type": "ping", "seq": seq, "t": t}
                ))
            except Exception:
                break

    async def _cleanup(self, ws: ServerConnection, device_id: Optional[str]) -> None:
        async with self._lock:
            if device_id and device_id in self._clients:
                del self._clients[device_id]
                logging.info("Device disconnected: %s", device_id)
            self._dashboard_ws.discard(ws)
        if device_id:
            await self._push_client_list_to_dashboard()

    async def _push_client_list_to_dashboard(self) -> None:
        if not self._dashboard_ws:
            return
        payload = json.dumps(self._build_client_list())
        dead: set[ServerConnection] = set()
        for ws in self._dashboard_ws:
            try:
                await ws.send(payload)
            except Exception:
                dead.add(ws)
        if dead:
            async with self._lock:
                self._dashboard_ws -= dead

    def _build_client_list(self) -> dict:
        return {
            "type": "client_list",
            "clients": [
                {
                    "device_id": r.device_id,
                    "device_label": r.device_label,
                    "connected_at": r.connected_at,
                    "rtt_ms": r.rtt_ms,
                    "subscriptions": r.subscriptions,
                    "mapped_triggers": r.mapped_triggers,
                }
                for r in self._clients.values()
            ],
        }


async def main(port: int, lead_time_ms: float) -> None:
    server = VisualServer(lead_time_ms=lead_time_ms)
    logging.info("Desktop server starting on 0.0.0.0+[::] :%d (lead_time=%.0f ms)", port, lead_time_ms)
    async with serve(server.handler, HOST, port):
        await asyncio.Future()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Audio visualizer desktop server")
    parser.add_argument("--port", type=int, default=PORT, help="WebSocket port (default 9000)")
    parser.add_argument("--lead-time", type=float, default=LEAD_TIME_MS,
                        help="Trigger schedule lookahead in ms (default 80)")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    asyncio.run(main(port=args.port, lead_time_ms=args.lead_time))
