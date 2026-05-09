#!/usr/bin/env python3
"""
push_video.py -- stream an MP4 (or any OpenCV-readable video) to the 128x128 SSD1351 OLED.

Usage:
    python3 push_video.py <video_file> [options]

Options:
    --fps FLOAT    override playback fps (default: video native fps, capped at 30)
    --loop         loop the video until Ctrl+C
    --stretch      stretch to fill 128x128 instead of letterboxing

Note: stop frame_pusher.py first -- both scripts claim the same GPIO pins.
"""

import sys
import argparse
import time
import spidev
import lgpio
import numpy as np

try:
    import cv2
except ImportError:
    sys.exit("OpenCV required:  pip3 install --user --break-system-packages opencv-python-headless")

# -- pin / SPI constants -------------------------------------------------------
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


def push_frame(buf: bytes | bytearray) -> None:
    set_window(0, 0, WIDTH, HEIGHT)
    lgpio.gpio_write(h, DC_PIN, 1)
    for i in range(0, WIDTH * HEIGHT * 2, CHUNK_SIZE):
        spi.writebytes2(buf[i: i + CHUNK_SIZE])


def frame_to_rgb565(bgr: np.ndarray, stretch: bool) -> bytes:
    """Resize a BGR OpenCV frame to 128x128 and convert to big-endian RGB565."""
    h_src, w_src = bgr.shape[:2]

    if stretch or (w_src == WIDTH and h_src == HEIGHT):
        resized = cv2.resize(bgr, (WIDTH, HEIGHT), interpolation=cv2.INTER_LINEAR)
    else:
        scale = min(WIDTH / w_src, HEIGHT / h_src)
        new_w = int(w_src * scale)
        new_h = int(h_src * scale)
        small = cv2.resize(bgr, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
        resized = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
        x_off = (WIDTH  - new_w) // 2
        y_off = (HEIGHT - new_h) // 2
        resized[y_off:y_off + new_h, x_off:x_off + new_w] = small

    # BGR (OpenCV) -> RGB565 big-endian via numpy
    r = resized[:, :, 2].astype(np.uint16) >> 3
    g = resized[:, :, 1].astype(np.uint16) >> 2
    b = resized[:, :, 0].astype(np.uint16) >> 3
    word = (r << 11) | (g << 5) | b
    return word.astype('>u2').tobytes()


def play(path: str, fps_override: float | None, loop: bool, stretch: bool) -> None:
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        sys.exit(f"Cannot open video: {path}")

    native_fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = min(fps_override or native_fps, 30.0)
    frame_time = 1.0 / fps

    print(f"Video: {path}")
    print(f"  {int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))}x{int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))}"
          f"  {native_fps:.1f} fps  {total_frames} frames")
    print(f"  Playback: {fps:.1f} fps  {'looping' if loop else 'once'}")

    run = True
    while run:
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        frame_idx = 0
        while True:
            t0 = time.monotonic()
            ok, frame = cap.read()
            if not ok:
                break
            buf = frame_to_rgb565(frame, stretch)
            push_frame(buf)
            frame_idx += 1

            elapsed = time.monotonic() - t0
            sleep = frame_time - elapsed
            if sleep > 0:
                time.sleep(sleep)

        run = loop

    cap.release()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Stream a video file to the 128x128 SSD1351 OLED.')
    parser.add_argument('video', help='video file to play (MP4, AVI, etc.)')
    parser.add_argument('--fps', type=float, default=None, metavar='FLOAT',
                        help='override playback fps (default: video native fps, max 30)')
    parser.add_argument('--loop', action='store_true',
                        help='loop the video until Ctrl+C')
    parser.add_argument('--stretch', action='store_true',
                        help='stretch to fill 128x128 instead of letterboxing')
    args = parser.parse_args()

    try:
        oled_init()
        play(args.video, args.fps, args.loop, args.stretch)
    except KeyboardInterrupt:
        pass
    finally:
        spi.close()
        lgpio.gpiochip_close(h)
        print("Done.")
