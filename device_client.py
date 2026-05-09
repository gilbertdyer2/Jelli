"""
device_client.py — Audio visualizer device client (runs on Raspberry Pi)

Connects to the desktop server (desktop_server.py), registers this device,
receives beat trigger packets with scheduled fire_at timestamps, and relays
them to the local ws-server.js relay (localhost:8765) with sync-corrected timing.

Usage:
    python device_client.py --server ws://192.168.1.XXX:9000 [options]

    --server      Desktop server WebSocket URL (required)
    --device-id   Stable device identifier (default: hostname)
    --label       Human-readable display name for the dashboard
    --local-relay Local ws-server.js URL (default: ws://localhost:8765)
    --subs        Space-separated trigger IDs to subscribe to (default: all)
"""

import argparse
import asyncio
import json
import logging
import socket
import statistics
import time

from websockets.asyncio.client import connect

ALL_TRIGGER_IDS = [
    "bass", "mid", "high", "bg_shift", "oral",
    "oral_tint", "jelly_tint", "membrane", "mb_trig", "ds_trig",
]
LOCAL_RELAY_DEFAULT = "ws://localhost:8765"
PING_INTERVAL = 2.0
RTT_WINDOW = 5


class RTTEstimator:
    def __init__(self):
        self._samples: list[float] = []
        self.rtt_ms: float = 0.0
        self.one_way_ms: float = 0.0

    def record(self, rtt: float) -> None:
        self._samples.append(rtt)
        if len(self._samples) > RTT_WINDOW:
            self._samples.pop(0)
        self.rtt_ms = statistics.median(self._samples)
        self.one_way_ms = self.rtt_ms / 2.0

    def has_estimate(self) -> bool:
        return len(self._samples) > 0


class DeviceClient:
    def __init__(self, server_url: str, device_id: str,
                 device_label: str, subscriptions: list[str],
                 local_relay: str = LOCAL_RELAY_DEFAULT):
        self.server_url = server_url
        self.device_id = device_id
        self.device_label = device_label
        self.subscriptions = list(subscriptions)
        self.local_relay = local_relay
        self._rtt = RTTEstimator()
        self._ping_seq = 0
        self._ping_pending: dict[int, float] = {}
        self._local_ws = None

    async def run(self) -> None:
        while True:
            try:
                await self._connect_and_serve()
            except Exception as e:
                logging.warning("Disconnected: %s — retrying in 3s", e)
                await asyncio.sleep(3)

    async def _connect_and_serve(self) -> None:
        async with connect(self.server_url) as ws:
            logging.info("Connected to server: %s", self.server_url)
            await self._register(ws)
            async with connect(self.local_relay) as local_ws:
                self._local_ws = local_ws
                logging.info("Connected to local relay: %s", self.local_relay)
                await asyncio.gather(
                    self._ping_loop(ws),
                    self._message_loop(ws),
                )

    async def _register(self, ws) -> None:
        await ws.send(json.dumps({
            "type": "register",
            "device_id": self.device_id,
            "device_label": self.device_label,
            "subscriptions": self.subscriptions,
        }))
        raw = await ws.recv()
        ack = json.loads(raw)
        if ack.get("type") != "ack":
            raise RuntimeError(f"Expected ack, got: {ack.get('type')}")
        logging.info("Registered as '%s'. Server time: %.1f ms",
                     self.device_id, ack.get("server_time", 0))

    async def _ping_loop(self, ws) -> None:
        while True:
            await asyncio.sleep(PING_INTERVAL)
            seq = self._ping_seq
            self._ping_seq += 1
            t = time.time() * 1000
            self._ping_pending[seq] = t
            try:
                await ws.send(json.dumps({"type": "ping", "seq": seq, "t": t}))
            except Exception:
                break

    async def _message_loop(self, ws) -> None:
        async for raw in ws:
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue
            mtype = msg.get("type")
            if mtype == "trigger":
                await self._handle_trigger(msg)
            elif mtype == "pong":
                self._handle_pong(msg)
            elif mtype == "ping":
                await ws.send(json.dumps({
                    "type": "pong",
                    "seq": msg["seq"],
                    "t": msg["t"],
                    "server_time": time.time() * 1000,
                }))
            elif mtype == "frequency_map":
                new_map = msg.get("map", {})
                if self.device_id in new_map:
                    self.subscriptions = new_map[self.device_id]
                    logging.info("Trigger map updated: %s", self.subscriptions)

    async def _handle_trigger(self, msg: dict) -> None:
        fire_at = msg.get("fire_at", 0.0)
        server_time = msg.get("server_time", fire_at)

        if self._rtt.has_estimate():
            remaining = fire_at - server_time
            local_wait_ms = remaining - self._rtt.one_way_ms
        else:
            local_wait_ms = 0.0

        delay_s = max(0.0, local_wait_ms / 1000.0)
        logging.debug("trigger %s: wait=%.1f ms (one_way=%.1f ms)",
                      msg.get("ids"), local_wait_ms, self._rtt.one_way_ms)
        asyncio.create_task(self._fire_after(delay_s, msg.get("ids", [])))

    async def _fire_after(self, delay_s: float, ids: list) -> None:
        if delay_s > 0:
            await asyncio.sleep(delay_s)
        await self._relay_to_local(ids)

    async def _relay_to_local(self, ids: list) -> None:
        if self._local_ws is None:
            return
        try:
            await self._local_ws.send(json.dumps({"type": "triggers", "ids": ids}))
        except Exception as e:
            logging.warning("Local relay failed: %s", e)

    def _handle_pong(self, msg: dict) -> None:
        seq = msg.get("seq")
        if seq not in self._ping_pending:
            return
        send_t = self._ping_pending.pop(seq)
        rtt = time.time() * 1000 - send_t
        self._rtt.record(rtt)
        logging.debug("RTT sample: %.2f ms (median=%.2f ms)", rtt, self._rtt.rtt_ms)


async def main(args: argparse.Namespace) -> None:
    client = DeviceClient(
        server_url=args.server,
        device_id=args.device_id,
        device_label=args.label,
        subscriptions=args.subs,
        local_relay=args.local_relay,
    )
    await client.run()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Audio visualizer device client")
    parser.add_argument("--server", default="ws://localhost:9000",
                        help="Desktop server WebSocket URL")
    parser.add_argument("--device-id", default=socket.gethostname(),
                        help="Stable device identifier (default: hostname)")
    parser.add_argument("--label", default=f"{socket.gethostname()} jellyfish display",
                        help="Human-readable name shown in dashboard")
    parser.add_argument("--local-relay", default=LOCAL_RELAY_DEFAULT,
                        help="Local ws-server.js relay URL")
    parser.add_argument("--subs", nargs="*", default=ALL_TRIGGER_IDS,
                        metavar="TRIGGER_ID",
                        help="Trigger IDs to subscribe to (default: all)")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    asyncio.run(main(args))
