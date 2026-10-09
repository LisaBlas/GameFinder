"""Split the fantasy scrollbar art into fixed caps + a uniform middle.

scrollbar-forged-track.png / scrollbar-oxblood-grip.png were drawn at 100% 100%,
so their end caps squashed and stretched with the scroll length. This writes,
per asset, <name>-top.webp, <name>-mid.webp and <name>-bot.webp into
client/src/assets/ui (sources live in design/sources/ui). The mid strip is the source averaged along its length, so CSS can
stretch it to any height without visible distortion. Caps stay at natural
aspect.

Output is 2x the CSS width below; keep `.fantasy-scroll-track` /
`.fantasy-scroll-thumb` in client/src/App.css in sync with the printed sizes.

Usage: python scripts/build-scrollbar-slices.py   (needs Pillow + numpy)
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "design/sources/ui"  # high-res sources, not bundled
UI = ROOT / "client/src/assets/ui"

# name, content columns, content rows, cap height (source px), rows to average, CSS width (px)
ASSETS = [
    ("scrollbar-forged-track", (169, 289), (0, 2129), 200, (300, 1800), 6),
    ("scrollbar-oxblood-grip", (178, 377), (122, 1640), 150, (400, 1300), 4),
]


def to_image(a):
    out = a.copy()
    alpha = out[..., 3:]
    out[..., :3] = np.where(alpha > 1e-4, out[..., :3] / np.maximum(alpha, 1e-4), 0)
    return Image.fromarray((np.clip(out, 0, 1) * 255).round().astype(np.uint8), "RGBA")


def main():
    for name, (c0, c1), (r0, r1), cap, (m0, m1), css_w in ASSETS:
        a = np.asarray(Image.open(SRC / f"{name}.png").convert("RGBA")).astype(np.float64) / 255
        a[..., :3] *= a[..., 3:]  # premultiply so averaging doesn't fringe
        a = a[r0:r1, c0:c1]
        scale = 2 * css_w / a.shape[1]
        mid = np.repeat(a[m0 - r0:m1 - r0].mean(0, keepdims=True), 8, 0)
        for part, arr in (("top", a[:cap]), ("mid", mid), ("bot", a[-cap:])):
            im = to_image(arr)
            h = 8 if part == "mid" else max(1, round(arr.shape[0] * scale))
            im = im.resize((2 * css_w, h), Image.LANCZOS)
            im.save(UI / f"{name}-{part}.webp", "WEBP", quality=92, method=6)
        print(f"{name}: width {css_w}px, cap height {cap * scale / 2:.1f}px")


if __name__ == "__main__":
    main()
