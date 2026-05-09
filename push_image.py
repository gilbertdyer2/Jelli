#!/usr/bin/env python3
"""
push_image.py -- push a still image to the 128x128 SSD1351 OLED.

Usage:
    python3 push_image.py [image_file] [options]

If no image is given, displays a colour-gradient test pattern.
The image is resized to fit 128x128 (aspect ratio preserved, letterboxed in black).
Press Ctrl+C to exit.

Diagnostic flags:
    --fill RRGGBB     flood-fill screen with a hex colour (e.g. --fill 000000 for black,
                      --fill ffffff for white)
    --gamma FLOAT     gamma correction exponent (default: 1.0 = none; try 1.5-2.2 to
                      darken midtones)

Note: stop frame_pusher.py first -- both scripts claim the same GPIO pins.
"""

import sys
import argparse
import time
import spidev
import lgpio

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow required:  pip3 install --user --break-system-packages Pillow")

# -- pin / SPI constants (match frame_pusher.py exactly) ----------------------
DC_PIN  = 25
RST_PIN = 27

SPI_FREQ   = 10_000_000
WIDTH      = 128
HEIGHT     = 128
CHUNK_SIZE = 4096

# -- hardware init -------------------------------------------------------------
h = lgpio.gpiochip_open(0)
lgpio.gpio_claim_output(h, DC_PIN,  0)
lgpio.gpio_claim_output(h, RST_PIN, 1)

spi = spidev.SpiDev()
spi.open(0, 0)
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


def make_gamma_lut(gamma: float) -> list:
    if gamma == 1.0:
        return list(range(256))
    return [round((i / 255) ** gamma * 255) for i in range(256)]


def image_to_rgb565(img: Image.Image, lut: list) -> bytearray:
    """Convert a PIL image to a 32,768-byte big-endian RGB565 buffer (128x128)."""
    img = img.convert('RGB')
    img.thumbnail((WIDTH, HEIGHT), Image.LANCZOS)
    canvas = Image.new('RGB', (WIDTH, HEIGHT), (0, 0, 0))
    x_off = (WIDTH  - img.width)  // 2
    y_off = (HEIGHT - img.height) // 2
    canvas.paste(img, (x_off, y_off))

    buf = bytearray(WIDTH * HEIGHT * 2)
    pixels = canvas.load()
    for y in range(HEIGHT):
        for x in range(WIDTH):
            r, g, b = pixels[x, y]
            r, g, b = lut[r], lut[g], lut[b]
            word = ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3)
            idx = (y * WIDTH + x) * 2
            buf[idx]     = (word >> 8) & 0xFF
            buf[idx + 1] =  word       & 0xFF
    return buf


def push_frame(buf: bytearray) -> None:
    set_window(0, 0, WIDTH, HEIGHT)
    lgpio.gpio_write(h, DC_PIN, 1)
    for i in range(0, len(buf), CHUNK_SIZE):
        spi.writebytes2(buf[i: i + CHUNK_SIZE])


def make_test_pattern() -> Image.Image:
    """Red->green horizontal gradient, blue->white vertical gradient."""
    img = Image.new('RGB', (WIDTH, HEIGHT))
    px = img.load()
    for y in range(HEIGHT):
        for x in range(WIDTH):
            px[x, y] = (
                int(x / (WIDTH  - 1) * 255),
                int(y / (HEIGHT - 1) * 255),
                128,
            )
    return img


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Push a still image to the 128x128 SSD1351 OLED.')
    parser.add_argument('image', nargs='?', help='image file to display (omit for test gradient)')
    parser.add_argument('--gamma', type=float, default=1.0, metavar='FLOAT',
                        help='gamma correction exponent (default: 1.0 = none; try 1.5-2.2 to darken midtones)')
    parser.add_argument('--fill', metavar='RRGGBB',
                        help='flood-fill screen with hex colour instead of loading an image')
    args = parser.parse_args()
    lut = make_gamma_lut(args.gamma)

    try:
        oled_init()

        if args.fill is not None:
            hex_color = args.fill.lstrip('#')
            r = int(hex_color[0:2], 16)
            g = int(hex_color[2:4], 16)
            b = int(hex_color[4:6], 16)
            word = ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3)
            hi, lo = (word >> 8) & 0xFF, word & 0xFF
            buf = bytearray([hi, lo] * (WIDTH * HEIGHT))
            print(f"Fill colour: #{hex_color.upper()}  ->  RGB565 word 0x{word:04X}")
        elif args.image:
            img = Image.open(args.image)
            print(f"Loaded: {args.image}  ({img.width}x{img.height})")
            if args.gamma != 1.0:
                print(f"Gamma correction: {args.gamma}")
            print("Converting to RGB565...")
            buf = image_to_rgb565(img, lut)
        else:
            img = make_test_pattern()
            print("No image specified -- showing test gradient")
            if args.gamma != 1.0:
                print(f"Gamma correction: {args.gamma}")
            print("Converting to RGB565...")
            buf = image_to_rgb565(img, lut)
        print("Pushing to OLED...")
        push_frame(buf)
        print("Done. Press Ctrl+C to exit.")

        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        pass
    finally:
        spi.close()
        lgpio.gpiochip_close(h)
        print("Cleanup done.")
