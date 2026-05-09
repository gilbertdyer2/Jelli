import asyncio
import logging
import time
import spidev
import lgpio
import websockets

DC_PIN  = 25
RST_PIN = 27

SPI_BUS     = 0
SPI_DEVICE  = 0
SPI_FREQ    = 10_000_000

WIDTH       = 128
HEIGHT      = 128
FRAME_BYTES = WIDTH * HEIGHT * 2   # 32,768
WS_PORT     = 8766
CHUNK_SIZE  = 4096

h = lgpio.gpiochip_open(0)
lgpio.gpio_claim_output(h, DC_PIN,  0)
lgpio.gpio_claim_output(h, RST_PIN, 1)

spi = spidev.SpiDev()
spi.open(SPI_BUS, SPI_DEVICE)
spi.max_speed_hz = SPI_FREQ
spi.mode = 0b11


def send_cmd(cmd: int, data_bytes: bytes | None = None) -> None:
    lgpio.gpio_write(h, DC_PIN, 0)
    spi.writebytes2(bytes([cmd]))
    if data_bytes:
        lgpio.gpio_write(h, DC_PIN, 1)
        spi.writebytes2(data_bytes)


def oled_init() -> None:
    lgpio.gpio_write(h, RST_PIN, 1); time.sleep(0.1)
    lgpio.gpio_write(h, RST_PIN, 0); time.sleep(0.1)
    lgpio.gpio_write(h, RST_PIN, 1); time.sleep(0.1)

    send_cmd(0xFD, bytes([0x12]))               # command lock unlock
    send_cmd(0xFD, bytes([0xB1]))               # command lock unlock
    send_cmd(0xAE)                               # display off
    send_cmd(0xA4)                               # normal display mode
    send_cmd(0x15, bytes([0x00, 0x7F]))         # set column address 0-127
    send_cmd(0x75, bytes([0x00, 0x7F]))         # set row address 0-127
    send_cmd(0xB3, bytes([0xF1]))               # front clock divider
    send_cmd(0xCA, bytes([0x7F]))               # MUX ratio: 127
    send_cmd(0xA0, bytes([0x74]))               # remap & color depth (65K, BGR sub-pixel)
    send_cmd(0xA1, bytes([0x00]))               # display start line: 0
    send_cmd(0xA2, bytes([0x00]))               # display offset: 0
    send_cmd(0xAB)                               # function selection
    send_cmd(0x01)                               # (verbatim from Waveshare reference: sent as command)
    send_cmd(0xB4, bytes([0xA0, 0xB5, 0x55]))  # segment low voltage (VSL)
    send_cmd(0xC1, bytes([0xC8, 0x80, 0xC0]))  # contrast A, B, C
    send_cmd(0xC7, bytes([0x0F]))               # master contrast: max
    send_cmd(0xB1, bytes([0x32]))               # phase 1 & 2 period
    send_cmd(0xB2, bytes([0xA4, 0x00, 0x00]))  # display enhancement
    send_cmd(0xBB, bytes([0x17]))               # pre-charge voltage
    send_cmd(0xB6, bytes([0x01]))               # second pre-charge period
    send_cmd(0xBE, bytes([0x05]))               # VCOMH voltage
    send_cmd(0xA6)                               # normal display (not inverted)
    time.sleep(0.1)
    send_cmd(0xAF)                               # display on


def set_window(xs: int, ys: int, xe: int, ye: int) -> None:
    send_cmd(0x15, bytes([xs, xe - 1]))  # column start, end (inclusive)
    send_cmd(0x75, bytes([ys, ye - 1]))  # row start, end (inclusive)
    send_cmd(0x5C)                        # write RAM


def push_frame(frame: bytes | bytearray) -> None:
    set_window(0, 0, WIDTH, HEIGHT)
    lgpio.gpio_write(h, DC_PIN, 1)
    for i in range(0, FRAME_BYTES, CHUNK_SIZE):
        spi.writebytes2(frame[i: i + CHUNK_SIZE])


frame_count = 0


async def handler(websocket) -> None:
    global frame_count
    logging.info("Browser connected")
    async for msg in websocket:
        if not isinstance(msg, (bytes, bytearray)) or len(msg) != FRAME_BYTES:
            logging.warning("Dropped frame: expected %d bytes, got %s %d",
                            FRAME_BYTES, type(msg).__name__,
                            len(msg) if isinstance(msg, (bytes, bytearray)) else -1)
            continue
        push_frame(msg)
        frame_count += 1
        if frame_count % 60 == 0:
            logging.info("Frames pushed: %d", frame_count)


async def main() -> None:
    oled_init()
    logging.info("OLED initialized. Listening on port %d", WS_PORT)
    async with websockets.serve(handler, "localhost", WS_PORT, max_size=FRAME_BYTES + 256):
        await asyncio.Future()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO,
                        format="%(asctime)s %(levelname)s %(message)s")
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Shutting down")
    finally:
        spi.close()
        lgpio.gpiochip_close(h)
        logging.info("Cleanup done")
