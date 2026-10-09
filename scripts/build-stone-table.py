"""Generate the stone war table behind the results pane, and the stone that
floors the card sockets cut into it.

The table is polished black marble with sparse fine veins (ambientCG
"Marble002", CC0: https://ambientcg.com/a/Marble002), kept in
design/sources/ambientcg-marble002/. The scan's albedo is relit here from its
normal map, lightly (polished stone has little relief), with the light from
above to match the sockets (scripts/build-card-socket.py), and graded dark
and nearly neutral for AnimatedBackground.css to veil further.

The socket floor is a different stone, so the cut reads as its own surface
rather than more marble: a fine-grained dark rock (Poly Haven "Seaside Rock" by
Dimitrios Savva, CC0: https://polyhaven.com/a/seaside_rock), kept in
design/sources/polyhaven-seaside-rock/. Unrelieved, darker, and with its
grain deepened: at this darkness a soft floor reads as a void, a speckled
one as stone.

Both outputs tile seamlessly (the scans do, and resizing keeps them periodic).

Writes (used at 1x in CSS):
  client/src/assets/stone-table.webp            TABLE x TABLE
  client/src/assets/ui/stone-socket-floor.webp  FLOOR x FLOOR
Usage: python scripts/build-stone-table.py   (needs Pillow + numpy)
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
TABLE_SRC = ROOT / "design/sources/ambientcg-marble002/Marble002_2K-JPG"
FLOOR_SRC = ROOT / "design/sources/polyhaven-seaside-rock/seaside_rock_diff_2k.jpg"
OUT_TABLE = ROOT / "client/src/assets/stone-table.webp"
OUT_FLOOR = ROOT / "client/src/assets/ui/stone-socket-floor.webp"

TABLE = 1024                  # AnimatedBackground.tsx shifts by this tile height
FLOOR = 1024
LIGHT = np.array([0.0, 0.55, 0.83])   # GL normal space (+y = up): from above
RELIEF = 0.2                  # 0 = flat albedo, 1 = full Lambert relief
# The keyword panel on the left carries the intricate texture; the table must
# stay discreet. <1 compresses the marble's mottling and veins toward its mean.
TABLE_CONTRAST = 0.4
TABLE_SOFTEN = 0.8            # px blur on the scan, so no fine detail draws the eye
SATURATION = 0.35             # a trace of the marble's own colour
TINT = np.array([0.97, 1.0, 0.99])    # near neutral, a breath of the theme green
TABLE_MEAN = 28 / 255         # mean tone before the CSS veil darkens it
# The socket floor sits above the table's CSS veil, which takes the table down
# to ~7/255 mid-pane, so the floor is pre-darkened below it (results-relic.css
# adds the forge glow to it near the bottom of the pane).
FLOOR_MEAN = 5 / 255
FLOOR_CONTRAST = 2.4          # polished dark stone shows its grain more, not less
FLOOR_SATURATION = 0.25
FLOOR_TINT = np.array([0.94, 1.0, 0.98])  # cool slate


def load(name, size, mode="RGB"):
    im = Image.open(f"{TABLE_SRC}_{name}.jpg").convert(mode)
    return np.asarray(im.resize((size, size), Image.LANCZOS), np.float64) / 255


def to_linear(c):
    return c ** 2.2


def to_srgb(c):
    return np.clip(c, 0, 1) ** (1 / 2.2)


def grade(albedo, mean, saturation=SATURATION, tint=TINT):
    """Desaturate, tint and scale a linear image to a target sRGB mean."""
    luma = albedo @ np.array([0.2126, 0.7152, 0.0722])
    rgb = luma[..., None] + saturation * (albedo - luma[..., None])
    rgb *= tint
    srgb = to_srgb(rgb)
    return to_srgb(rgb * (mean / srgb.mean()) ** 2.2)


def save(img, out):
    Image.fromarray((img * 255).round().astype(np.uint8), "RGB") \
        .save(out, "WEBP", quality=90, method=6)
    print(f"{out.relative_to(ROOT)}: {img.shape[1]}x{img.shape[0]}, {out.stat().st_size // 1024} KB")


def build_table():
    im = Image.open(f"{TABLE_SRC}_Color.jpg").convert("RGB").resize((TABLE, TABLE), Image.LANCZOS)
    im = im.filter(ImageFilter.GaussianBlur(TABLE_SOFTEN))
    albedo = to_linear(np.asarray(im, np.float64) / 255)
    albedo = albedo.mean() * (albedo / albedo.mean()) ** TABLE_CONTRAST
    normal = load("NormalGL", TABLE) * 2 - 1
    normal /= np.linalg.norm(normal, axis=2, keepdims=True)

    light = LIGHT / np.linalg.norm(LIGHT)
    lambert = np.clip(normal @ light, 0, None) / light[2]   # 1 on flat stone
    shade = 1 + RELIEF * (lambert - 1)
    save(grade(albedo * shade[..., None], TABLE_MEAN), OUT_TABLE)


def build_floor():
    im = Image.open(FLOOR_SRC).convert("RGB")
    im = im.resize((FLOOR, FLOOR), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.5))
    albedo = to_linear(np.asarray(im, np.float64) / 255)
    albedo = albedo.mean() * (albedo / albedo.mean()) ** FLOOR_CONTRAST
    save(grade(albedo, FLOOR_MEAN, FLOOR_SATURATION, FLOOR_TINT), OUT_FLOOR)


if __name__ == "__main__":
    build_table()
    build_floor()
