"""Generate the carved arches of the Reliquary (desktop "Need a spark?" view).

The altar and the six vessel niches are round-topped recesses cut into the
panel's stone, carved and lit exactly like the result sockets: this script
reuses the height field and lighting of scripts/build-card-socket.py, so the
light falls from above and the arch crown shadows the floor below it. Each
image is a shading layer only (black where the carving darkens, pale light
where a wall faces up); CSS lays the honed stone tile under it, inside the
cut, and pools rarity light on the floor.

Arches don't 9-slice (the crown would stretch), so each is rendered at its
CSS size and scaled uniformly by the layout (aspect-ratio in reliquary.css).

Outputs (client/src/assets/ui/, used in client/src/styles/reliquary.css):
  reliquary-arch.webp   the altar recess, ARCH_W x ARCH_H + OVERHANG all round
  reliquary-niche.webp  a vessel niche, NICHE_W x NICHE_H + OVERHANG
                        (unique niches use the same art, scaled up)

Deterministic; tweak the constants below and re-run.
Usage: python scripts/build-reliquary.py   (needs Pillow + numpy)
"""
import importlib.util
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "client/src/assets/ui"

sys.dont_write_bytecode = True  # importing the socket script; leave no __pycache__
_spec = importlib.util.spec_from_file_location("socket", ROOT / "scripts/build-card-socket.py")
socket = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(socket)

SCALE = 2           # render at 2x for hi-dpi; CSS sizes below are 1x
OVERHANG = 14       # CSS px of rim shading drawn outside the cut (same as sockets)

ARCH_W, ARCH_H = 470, 370   # altar recess, CSS px
NICHE_W, NICHE_H = 92, 132  # vessel niche, CSS px

# A deeper cut than the sockets: these are alcoves, not card seats.
ARCH_DEPTH = 9.0
NICHE_DEPTH = 7.0


def arch_sd(px, py, x0, y0, w, h):
    """Signed distance to a round-topped arch (<0 inside): a disc for the crown,
    a vertical strip below its centre for the jambs, cut flat at the sill."""
    r = w / 2
    cx, cy = x0 + r, y0 + r
    disc = np.hypot(px - cx, py - cy) - r
    strip = np.maximum(np.abs(px - cx) - r, cy - py)
    return np.maximum(np.minimum(disc, strip), py - (y0 + h))


def build(name, w, h, depth):
    W, H = w + 2 * OVERHANG, h + 2 * OVERHANG
    xs = (np.arange(W * SCALE) + 0.5) / SCALE
    ys = (np.arange(H * SCALE) + 0.5) / SCALE
    px, py = np.meshgrid(xs, ys)
    sd = arch_sd(px, py, OVERHANG, OVERHANG, w, h)
    saved = socket.DEPTH
    socket.DEPTH = depth            # height_field / shade read the module constant
    try:
        img = socket.shade(socket.height_field(sd), sd, 1 / SCALE)
    finally:
        socket.DEPTH = saved
    out = OUT_DIR / name
    Image.fromarray(img, "RGBA").save(out, "WEBP", lossless=True, method=6)
    print(f"{out.relative_to(ROOT)}  {W * SCALE}x{H * SCALE}  ({W}x{H} CSS px)")


if __name__ == "__main__":
    build("reliquary-arch.webp", ARCH_W, ARCH_H, ARCH_DEPTH)
    build("reliquary-niche.webp", NICHE_W, NICHE_H, NICHE_DEPTH)
