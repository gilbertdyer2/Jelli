"""
tests/test_client_server.py

Integration and unit tests for desktop_server.py and device_client.py.

Run with:
    python -m pytest tests/ -v
  or:
    python -m unittest tests/test_client_server.py -v

Tests spin up a real VisualServer on a local port and connect real WebSocket
clients — no mocks for the networking layer.
"""

import asyncio
import json
import statistics
import sys
import time
import unittest
from pathlib import Path

# Allow imports from project root
sys.path.insert(0, str(Path(__file__).parent.parent))

from desktop_server import VisualServer
from device_client import RTTEstimator

import websockets.asyncio.server as ws_server_mod
from websockets.asyncio.client import connect as ws_connect

TEST_PORT = 19765   # Use a high port unlikely to conflict


# ── Helpers ────────────────────────────────────────────────────────────────────

async def _start_server(lead_time_ms: float = 80.0):
    """Start a VisualServer and return (server_obj, stop_fn)."""
    server = VisualServer(lead_time_ms=lead_time_ms)
    ws_obj = await ws_server_mod.serve(server.handler, "localhost", TEST_PORT)
    return server, ws_obj


def _run(coro):
    """Run a coroutine in a fresh event loop (for use in setUp / test methods)."""
    return asyncio.get_event_loop().run_until_complete(coro)


async def _recv_timeout(ws, timeout: float = 1.0):
    """Receive one message with a timeout; returns None on timeout."""
    try:
        return await asyncio.wait_for(ws.recv(), timeout=timeout)
    except asyncio.TimeoutError:
        return None


async def _register_client(ws, device_id="test-pi", subs=None):
    if subs is None:
        subs = ["bass", "mid"]
    await ws.send(json.dumps({
        "type": "register",
        "device_id": device_id,
        "device_label": f"{device_id} display",
        "subscriptions": subs,
    }))
    raw = await ws.recv()
    return json.loads(raw)


# ── Test class ─────────────────────────────────────────────────────────────────

class TestClientServer(unittest.IsolatedAsyncioTestCase):
    """Integration tests for VisualServer.

    Each test creates and tears down its own server instance to avoid state bleed.
    """

    async def asyncSetUp(self):
        self._server_obj, self._ws_obj = await _start_server()

    async def asyncTearDown(self):
        self._ws_obj.close()
        await self._ws_obj.wait_closed()

    # TC-01: register → ack roundtrip
    async def test_01_register_and_ack(self):
        async with ws_connect(f"ws://localhost:{TEST_PORT}") as ws:
            ack = await _register_client(ws, "pi-tc01")
        self.assertEqual(ack["type"], "ack")
        self.assertEqual(ack["device_id"], "pi-tc01")
        self.assertIsInstance(ack["server_time"], float)
        now_ms = time.time() * 1000
        self.assertAlmostEqual(ack["server_time"], now_ms, delta=2000)

    # TC-02: registered client appears in client_list
    async def test_02_client_appears_in_client_list(self):
        async with ws_connect(f"ws://localhost:{TEST_PORT}") as device_ws:
            await _register_client(device_ws, "pi-tc02", subs=["bass"])

            async with ws_connect(f"ws://localhost:{TEST_PORT}") as dash_ws:
                await dash_ws.send(json.dumps({"type": "dashboard_register"}))
                raw = await _recv_timeout(dash_ws, timeout=1.0)
                msg = json.loads(raw)

        self.assertEqual(msg["type"], "client_list")
        ids = [c["device_id"] for c in msg["clients"]]
        self.assertIn("pi-tc02", ids)
        entry = next(c for c in msg["clients"] if c["device_id"] == "pi-tc02")
        self.assertEqual(entry["subscriptions"], ["bass"])

    # TC-03: trigger routed to subscribed client; fire_at > server_time
    async def test_03_trigger_routed_to_client(self):
        async with ws_connect(f"ws://localhost:{TEST_PORT}") as client_ws:
            await _register_client(client_ws, "pi-tc03", subs=["bass"])

            async with ws_connect(f"ws://localhost:{TEST_PORT}") as sender_ws:
                await sender_ws.send(json.dumps({"type": "triggers", "ids": ["bass"]}))

            raw = await _recv_timeout(client_ws, timeout=1.0)
            msg = json.loads(raw)

        self.assertEqual(msg["type"], "trigger")
        self.assertIn("bass", msg["ids"])
        self.assertGreater(msg["fire_at"], msg["server_time"])

    # TC-04: trigger filtered for client with non-matching subscription
    async def test_04_trigger_filtered_by_subscription(self):
        async with ws_connect(f"ws://localhost:{TEST_PORT}") as client_ws:
            await _register_client(client_ws, "pi-tc04", subs=["bass"])

            async with ws_connect(f"ws://localhost:{TEST_PORT}") as sender_ws:
                await sender_ws.send(json.dumps({"type": "triggers", "ids": ["high", "membrane"]}))

            raw = await _recv_timeout(client_ws, timeout=0.5)

        self.assertIsNone(raw, "Client should receive nothing for non-subscribed triggers")

    # TC-05: frequency_map override changes routing
    async def test_05_frequency_map_override(self):
        device_id = "pi-tc05"
        async with ws_connect(f"ws://localhost:{TEST_PORT}") as client_ws:
            await _register_client(client_ws, device_id, subs=["bass", "mid"])

            # Override: only bass
            async with ws_connect(f"ws://localhost:{TEST_PORT}") as dash_ws:
                await dash_ws.send(json.dumps({
                    "type": "frequency_map",
                    "map": {device_id: ["bass"]},
                }))
                # Consume any dashboard messages
                await _recv_timeout(dash_ws, timeout=0.3)

            # Consume the frequency_map broadcast that client receives
            await _recv_timeout(client_ws, timeout=0.3)

            # Send trigger with both bass and mid
            async with ws_connect(f"ws://localhost:{TEST_PORT}") as sender_ws:
                await sender_ws.send(json.dumps({"type": "triggers", "ids": ["bass", "mid"]}))

            raw = await _recv_timeout(client_ws, timeout=1.0)
            msg = json.loads(raw)

        self.assertEqual(msg["type"], "trigger")
        self.assertIn("bass", msg["ids"])
        self.assertNotIn("mid", msg["ids"])

    # TC-06: ping/pong updates rtt_ms in client_list
    async def test_06_ping_pong_updates_rtt(self):
        async with ws_connect(f"ws://localhost:{TEST_PORT}") as client_ws:
            await _register_client(client_ws, "pi-tc06")

            # Manually handle a server ping (server pings every 2s, but we
            # can also send a pong with a known seq to seed the server's RTT)
            # Wait briefly for server to send a ping
            raw = await _recv_timeout(client_ws, timeout=3.5)
            self.assertIsNotNone(raw, "Expected server ping within 3.5s")
            ping_msg = json.loads(raw)
            self.assertEqual(ping_msg["type"], "ping")

            # Reply with pong
            await client_ws.send(json.dumps({
                "type": "pong",
                "seq": ping_msg["seq"],
                "t": ping_msg["t"],
                "server_time": time.time() * 1000,
            }))

            # Request client_list and check rtt_ms is populated
            async with ws_connect(f"ws://localhost:{TEST_PORT}") as dash_ws:
                await dash_ws.send(json.dumps({"type": "get_clients"}))
                raw = await _recv_timeout(dash_ws, timeout=1.0)
                msg = json.loads(raw)

        entry = next((c for c in msg["clients"] if c["device_id"] == "pi-tc06"), None)
        self.assertIsNotNone(entry)
        self.assertIsNotNone(entry["rtt_ms"])
        self.assertGreater(entry["rtt_ms"], 0)

    # TC-09: client disconnect removes entry from client_list
    async def test_09_disconnect_removes_client(self):
        async with ws_connect(f"ws://localhost:{TEST_PORT}") as client_ws:
            await _register_client(client_ws, "pi-tc09")
        # client_ws is now closed

        await asyncio.sleep(0.3)  # allow server cleanup task to run

        async with ws_connect(f"ws://localhost:{TEST_PORT}") as dash_ws:
            await dash_ws.send(json.dumps({"type": "get_clients"}))
            raw = await _recv_timeout(dash_ws, timeout=1.0)
            msg = json.loads(raw)

        ids = [c["device_id"] for c in msg["clients"]]
        self.assertNotIn("pi-tc09", ids)

    # TC-10: multi-client independent routing
    async def test_10_multi_client_routing(self):
        async with ws_connect(f"ws://localhost:{TEST_PORT}") as ws_a:
            async with ws_connect(f"ws://localhost:{TEST_PORT}") as ws_b:
                await _register_client(ws_a, "pi-tc10-a", subs=["bass"])
                await _register_client(ws_b, "pi-tc10-b", subs=["mid"])

                async with ws_connect(f"ws://localhost:{TEST_PORT}") as sender:
                    await sender.send(json.dumps({"type": "triggers", "ids": ["bass", "mid"]}))

                raw_a = await _recv_timeout(ws_a, timeout=1.0)
                raw_b = await _recv_timeout(ws_b, timeout=1.0)

        msg_a = json.loads(raw_a)
        msg_b = json.loads(raw_b)

        self.assertIn("bass", msg_a["ids"])
        self.assertNotIn("mid", msg_a["ids"])

        self.assertIn("mid", msg_b["ids"])
        self.assertNotIn("bass", msg_b["ids"])

    # TC-11: fire_at is in the future when packet arrives (on loopback)
    async def test_11_fire_at_in_future(self):
        async with ws_connect(f"ws://localhost:{TEST_PORT}") as client_ws:
            await _register_client(client_ws, "pi-tc11", subs=["bass"])

            async with ws_connect(f"ws://localhost:{TEST_PORT}") as sender:
                await sender.send(json.dumps({"type": "triggers", "ids": ["bass"]}))

            raw = await _recv_timeout(client_ws, timeout=1.0)

        recv_time = time.time() * 1000
        msg = json.loads(raw)
        # fire_at must be after the packet arrived (even on loopback)
        self.assertGreater(msg["fire_at"], recv_time,
                           "fire_at should be in the future when packet is received")


# ── Unit tests (no server needed) ─────────────────────────────────────────────

class TestRTTEstimator(unittest.TestCase):
    # TC-07: RTTEstimator median calculation
    def test_07_median_calculation(self):
        est = RTTEstimator()
        for v in [10.0, 20.0, 30.0, 40.0, 50.0]:
            est.record(v)
        self.assertAlmostEqual(est.rtt_ms, 30.0)
        self.assertAlmostEqual(est.one_way_ms, 15.0)

    def test_07b_rolling_window(self):
        est = RTTEstimator()
        for v in [10.0, 20.0, 30.0, 40.0, 50.0]:
            est.record(v)
        # Adding a 6th value should drop the oldest (10.0)
        est.record(60.0)
        # Remaining: [20, 30, 40, 50, 60] → median = 40
        self.assertAlmostEqual(est.rtt_ms, 40.0)

    def test_07c_has_estimate(self):
        est = RTTEstimator()
        self.assertFalse(est.has_estimate())
        est.record(5.0)
        self.assertTrue(est.has_estimate())

    # TC-08: fire_at delay computation with known RTT
    def test_08_delay_computation(self):
        est = RTTEstimator()
        for _ in range(5):
            est.record(20.0)   # RTT = 20 ms, one_way = 10 ms

        # Simulate trigger: server_time=1000, fire_at=1080 (lead=80ms)
        server_time = 1000.0
        fire_at = 1080.0

        remaining = fire_at - server_time          # 80 ms
        local_wait_ms = remaining - est.one_way_ms # 80 - 10 = 70 ms
        delay_s = max(0.0, local_wait_ms / 1000.0)

        self.assertAlmostEqual(delay_s, 0.070, places=4)

    def test_08b_late_packet_clamps_to_zero(self):
        est = RTTEstimator()
        for _ in range(5):
            est.record(200.0)  # RTT = 200 ms, one_way = 100 ms

        server_time = 1000.0
        fire_at = 1080.0  # lead = 80 ms but one_way = 100 ms → negative

        remaining = fire_at - server_time
        local_wait_ms = remaining - est.one_way_ms
        delay_s = max(0.0, local_wait_ms / 1000.0)

        self.assertEqual(delay_s, 0.0, "Late packets should clamp delay to zero, not go negative")


if __name__ == "__main__":
    unittest.main(verbosity=2)
