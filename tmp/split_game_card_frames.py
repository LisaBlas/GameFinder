from pathlib import Path

from PIL import Image, ImageDraw


ASSET_DIR = Path("client/src/assets/ui")

# Coordinates are measured on the canonical 768x768 source artwork.
# The cleared region removes the complete center ornament; the rail is rebuilt
# from an untouched segment of the same frame so color and material stay exact.
SPECS = {
    "uncommon": {
        "clear": (286, 638, 482, 768),
        "rail_y": (688, 727),
        "rail_source": (180, 688, 286, 727),
    },
    "rare": {
        "clear": (330, 650, 438, 768),
        "rail_y": (682, 728),
        "rail_source": (205, 682, 313, 728),
        "ornament_crop": (330, 650, 438, 768),
        "ornament_polygon": [(54, 8), (104, 59), (54, 116), (4, 59)],
    },
    "epic": {
        "clear": (330, 646, 438, 768),
        "rail_y": (681, 731),
        "rail_source": (205, 681, 313, 731),
        "ornament_crop": (330, 646, 438, 768),
        "ornament_polygon": [(54, 8), (104, 55), (54, 96), (4, 55)],
    },
    "unique": {
        "clear": (270, 580, 498, 768),
        "rail_y": (646, 695),
        "rail_source": (165, 646, 270, 695),
    },
}


def rebuild_frame(name: str, spec: dict) -> None:
    path = ASSET_DIR / f"game-card-frame-{name}.png"
    image = Image.open(path).convert("RGBA")
    clear_left, clear_top, clear_right, clear_bottom = spec["clear"]
    rail_top, rail_bottom = spec["rail_y"]

    transparent = Image.new("RGBA", (clear_right - clear_left, clear_bottom - clear_top))
    image.paste(transparent, (clear_left, clear_top))

    rail = image.crop(spec["rail_source"])
    rail = rail.resize((clear_right - clear_left, rail_bottom - rail_top), Image.Resampling.LANCZOS)
    image.alpha_composite(rail, (clear_left, rail_top))
    image.save(path, optimize=True)


def extract_polygon_ornament(name: str, spec: dict) -> None:
    original = Image.open(ASSET_DIR / f"game-card-frame-{name}.png").convert("RGBA")
    crop = original.crop(spec["ornament_crop"])
    mask = Image.new("L", crop.size, 0)
    ImageDraw.Draw(mask).polygon(spec["ornament_polygon"], fill=255)
    alpha = Image.composite(crop.getchannel("A"), Image.new("L", crop.size, 0), mask)
    crop.putalpha(alpha)
    bbox = crop.getbbox()
    if bbox:
        crop = crop.crop(bbox)
    crop.save(ASSET_DIR / f"game-card-ornament-{name}.png", optimize=True)


for rarity, config in SPECS.items():
    if "ornament_crop" in config:
        extract_polygon_ornament(rarity, config)

for rarity, config in SPECS.items():
    rebuild_frame(rarity, config)
