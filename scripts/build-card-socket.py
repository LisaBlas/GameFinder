"""Generate the carved card socket that each result card sits in.

The socket is cut into the stone table (scripts/build-stone-table.py) in the
card frame's silhouette: a straight-walled recess with square pockets where
the frame's corner blocks sit. It is rendered as a height field and lit from
above (-y), the light the eye assumes: the top wall turns away into shadow and
casts it across the floor, the bottom wall and lip catch the light. (Lit from
below, as the forge would, the same cut reads as a raised plate.) It is stored
as shading: black where the carving darkens, pale light where a wall faces
up. The floor is solid: CSS lays the honed stone tile (stone-socket-floor.webp)
under this image, inside the cut; outside it, the rim shading falls on the
table, whose stone (scripts/build-stone-table.py) is lit the same way.

Outputs (used in client/src/styles/results-relic.css):
  card-socket-9slice.webp  9-slice: border-image-slice SLICE, width CORNER px,
                           drawn on a box that overhangs the card by OVERHANG.
  card-socket-seal.webp    the empty diamond setting under a missing card's
                           seal (empty sockets only; a seated card covers it).

Deterministic; tweak the constants below and re-run.
Usage: python scripts/build-card-socket.py   (needs Pillow + numpy)
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "client/src/assets/ui"

SCALE = 2           # render at 2x for hi-dpi; CSS sizes below are 1x
OVERHANG = 14       # CSS px from the image edge to the card edge
CORNER = 46         # CSS px per corner slice
MIDDLE = 8          # CSS px of stretchable edge/centre in the template
SLICE = CORNER * SCALE

# Fitted to the card frames (their rails are pushed to the card edge in
# results-relic.css). Corner blocks stick out ~4px and run ~16-19px along each
# edge for common..epic; unique's ornate corners (~9px) rest over the rim.
GAP = 1.5           # wall clearance outside the card edge (the frame's rail)
POCKET = 21         # corner pocket length, from the card corner inward
POCKET_GAP = 6      # corner pockets reach this far outside the card edge
EDGE_RADIUS = 1.5   # softens the cut corners, CSS px

DEPTH = 6.0         # recess depth, CSS px
WALL = 3.5          # wall slope width, CSS px
LIP = 1.2           # worn, rounded rim just outside the cut, CSS px
LIGHT = np.array([0.0, -0.72, 0.69])  # image space (+y = down): from above, low
FLOOR_DARK = 0.12   # extra darkening over the (already dark) honed floor tile
SHADE_GAIN = 1.5    # how strongly wall shading departs from the flat surface
LIT = np.array([196, 200, 192], np.float64)   # pale stone catching the light


def sd_box(px, py, x0, y0, x1, y1, r=0.0):
    """Signed distance to an axis-aligned box with rounded corners (<0 inside)."""
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    hx, hy = (x1 - x0) / 2 - r, (y1 - y0) / 2 - r
    qx, qy = np.abs(px - cx) - hx, np.abs(py - cy) - hy
    outside = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0))
    inside = np.minimum(np.maximum(qx, qy), 0)
    return outside + inside - r


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def height_field(sd):
    """Surface height from a signed distance (CSS px): floor, sloped wall, rim."""
    inside = -DEPTH * smoothstep(0, WALL, -sd)
    lip = -0.35 * (1 - smoothstep(0, LIP, sd)) * (sd > 0)
    return np.where(sd < 0, inside, lip)


def shade(h, sd, unit):
    """RGBA shading layer for a height field sampled every `unit` CSS px."""
    gy, gx = np.gradient(h, unit)
    n = np.dstack([-gx, -gy, np.ones_like(h)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    light = LIGHT / np.linalg.norm(LIGHT)
    lit = (n @ light) - light[2]          # 0 on flat table, + facing the light

    # Cast shadow: march toward the light along y; the rim nearest the light
    # shades the floor behind it. Marching is written for +y, so flip for -y.
    flip = light[1] < 0
    hs = h[::-1] if flip else h
    rise = light[2] / abs(light[1])       # height gained per px toward light
    shadow = np.zeros_like(hs)
    hp = np.pad(hs, ((0, 200), (0, 0)), mode="edge")
    rows = hs.shape[0]
    for step in range(1, 200):
        ahead = hp[step:step + rows]
        blocked = ahead - (hs + step * unit * rise)
        shadow = np.maximum(shadow, smoothstep(0.0, 0.6, blocked))
        if step * unit * rise > DEPTH + 1:
            break
    if flip:
        shadow = shadow[::-1]

    # Ambient occlusion: the floor darkens into the walls and corners.
    depth_in = np.clip(-sd, 0, None)
    occl = np.exp(-np.clip(depth_in - WALL, 0, None) / 3.0) * (sd < 0)

    floor = FLOOR_DARK * smoothstep(0, WALL, -sd)
    dark = floor + 0.45 * shadow * (sd < 0) + 0.28 * occl \
        + np.clip(-lit, 0, None) * SHADE_GAIN
    light_amt = np.clip(lit, 0, None) * SHADE_GAIN * 0.55
    dark = np.clip(dark, 0, 0.92)
    light_amt = np.clip(light_amt, 0, 0.5)

    # One premultiplied layer: out = LIT*light + bg*(1 - dark - light).
    alpha = np.clip(dark + light_amt, 0, 1)
    rgb = np.where(alpha[..., None] > 1e-4,
                   LIT * (light_amt / np.maximum(alpha, 1e-4))[..., None], 0)
    return np.dstack([rgb, alpha * 255]).round().clip(0, 255).astype(np.uint8)


def socket_sd(px, py, card):
    """Recess outline for a card box (x0, y0, x1, y1): body plus corner pockets."""
    x0, y0, x1, y1 = card
    sd = sd_box(px, py, x0 - GAP, y0 - GAP, x1 + GAP, y1 + GAP, EDGE_RADIUS)
    for cx, sx in ((x0, 1), (x1, -1)):
        for cy, sy in ((y0, 1), (y1, -1)):
            ax, bx = sorted((cx - sx * POCKET_GAP, cx + sx * POCKET))
            ay, by = sorted((cy - sy * POCKET_GAP, cy + sy * POCKET))
            sd = np.minimum(sd, sd_box(px, py, ax, ay, bx, by, EDGE_RADIUS))
    return sd


def build_socket():
    size = 2 * CORNER + MIDDLE
    n = size * SCALE
    c = (np.arange(n) + 0.5) / SCALE      # pixel centres in CSS px
    px, py = np.meshgrid(c, c)
    card = (OVERHANG, OVERHANG, size - OVERHANG, size - OVERHANG)
    sd = socket_sd(px, py, card)
    img = shade(height_field(sd), sd, 1 / SCALE)
    out = OUT_DIR / "card-socket-9slice.webp"
    Image.fromarray(img, "RGBA").save(out, "WEBP", lossless=True, method=6)
    print(f"{out.relative_to(ROOT)}  {n}x{n}  slice {SLICE}")


def build_seal():
    size = 30
    n = size * SCALE
    c = (np.arange(n) + 0.5) / SCALE - size / 2
    px, py = np.meshgrid(c, c)
    # Diamond: a box in coordinates rotated by 45 degrees.
    u, v = (px + py) / np.sqrt(2), (py - px) / np.sqrt(2)
    sd = sd_box(u, v, -6.5, -6.5, 6.5, 6.5, 1.0)
    img = shade(height_field(sd) * 0.6, sd, 1 / SCALE)
    out = OUT_DIR / "card-socket-seal.webp"
    Image.fromarray(img, "RGBA").save(out, "WEBP", lossless=True, method=6)
    print(f"{out.relative_to(ROOT)}  {n}x{n}")


if __name__ == "__main__":
    build_socket()
    build_seal()
