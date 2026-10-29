"""The game's logo: the duck peeking over a big sky-blue DUCK, with PLATFORMER in cream below.

Usage, from the repository root:
  python3 -I art/tools/logo.py build            write the three logos and list them in the manifest
  python3 -I art/tools/logo.py preview OUT.png  every logo on ink and cream, at 1x and 3x

Plain PNGs on a transparent ground, every pixel fully opaque or fully transparent, listed in the manifest under
"images" as {"key", "png", "width", "height"}:

| Key       | Path                     | Use                                          |
| --------- | ------------------------ | -------------------------------------------- |
| logo      | public/art/logo.png      | the title screen                             |
| logo-nav  | public/art/logo-nav.png  | the site's nav bar                           |
| logo-icon | public/art/logo-icon.png | the /play/ page's nav column: her profile    |

The wordmark is WORDMARK: the first word large, the rest small below it (one line in the nav logo). Its letters
come from GLYPHS, a 5x7 pixel alphabet drawn at a block size, made bold, with rounded outer corners, a 1px
light rim, a shade crescent, a 1px ink outline and an optional drop shadow. GLYPHS has A C D E F K L M O P R
T U; a new title needs any other letters added there. The duck stands behind the second and third letters of
the first word, so only her head and back show over their top edge: at 2x (redrawn from art/tools/duck.py's
shapes, the outline and rim kept 1px) in the title logo, and at 1x from her idle frame in the nav logo. The
icon logo has no lettering: her profile alone on the downstroke (the wing level behind her, feet tucked),
redrawn at 1.25x.
"""

import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import duck as D  # noqa: E402
import pixel  # noqa: E402
from pixel import K, Grid  # noqa: E402

WORDMARK = ("DUCK", "PLATFORMER")
OUT = {"logo": "public/art/logo.png", "logo-nav": "public/art/logo-nav.png", "logo-icon": "public/art/logo-icon.png"}

GLYPHS = {
    "A": [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    "C": [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
    "D": ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
    "E": ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
    "F": ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
    "K": ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
    "L": ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
    "M": ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
    "O": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    "P": ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
    "R": ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
    "T": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
    "U": ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
}

BIG = dict(b=13, fill="sky", light="cyan", shade="blue")  # the first word
SMALL = dict(b=6, fill="cream", light="white", shade="tan", shadow="blue")  # the rest, below it
NAV = dict(b=2, fill="sky", light="cyan", shade="blue")
ICON_SCALE = 1.25  # her size in the icon logo, against the game sprite
PEEK = 50  # rows of the 2x duck that show above the big letters


def image(px):
    from PIL import Image

    h, w = len(px), len(px[0])
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    for y, row in enumerate(px):
        for x, c in enumerate(row):
            if c:
                im.putpixel((x, y), pixel.rgb(c) + (255,))
    return im


def word(text, b, fill, light, shade, shadow=None):
    """One line of lettering at block size b: bold strokes, rounded corners, a 1px light rim on the upper left,
    a shade crescent on the lower right, a 1px ink outline and an optional drop shadow 2px down."""
    gap = b
    cw = 5 * b + gap
    W = len(text) * cw - gap + 2
    H = 7 * b + 2 + (2 if shadow else 0)
    mask = set()
    for i, ch in enumerate(text):
        if ch == " ":
            continue
        rows = GLYPHS[ch]
        for gy, row in enumerate(rows):
            for gx, c in enumerate(row):
                if c == "#":
                    mask |= {(1 + i * cw + gx * b + x, 1 + gy * b + y) for y in range(b) for x in range(b)}
        if b >= 3:  # round each glyph's convex corners

            def on(gx, gy):
                return 0 <= gy < 7 and 0 <= gx < 5 and rows[gy][gx] == "#"

            for gy, row in enumerate(rows):
                for gx, c in enumerate(row):
                    if c != "#":
                        continue
                    x0, y0 = 1 + i * cw + gx * b, 1 + gy * b
                    for dx, dy, cx, cy in ((-1, -1, x0, y0), (1, -1, x0 + b - 1, y0), (-1, 1, x0, y0 + b - 1),
                                           (1, 1, x0 + b - 1, y0 + b - 1)):
                        if not on(gx + dx, gy) and not on(gx, gy + dy):
                            mask.discard((cx, cy))
    k = b // 3  # bold: thicken every stroke by k px on each side, then round the outer corners again
    if k:
        grown = {(x + dx + k, y + dy + k) for (x, y) in mask for dx in range(-k, k + 1) for dy in range(-k, k + 1)}
        mask = grown
        W, H = W + 2 * k, H + 2 * k
        for _ in range(k):
            mask -= {(x, y) for (x, y) in mask
                     if sum(((x + dx, y + dy) not in mask) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))) >= 2}
    g = Grid(W, H)
    ks = 2 if b >= 3 else 1
    for (x, y) in sorted(mask):
        if (x + ks, y + ks) not in mask and ((x + ks, y) not in mask or (x, y + ks) not in mask):
            c = shade
        elif (x - 1, y) not in mask or (x, y - 1) not in mask:
            c = light
        else:
            c = fill
        g.p(x, y, c)
    out = g.outlined(lambda c: K["ink"])
    if shadow:
        sh = [[None] * W for _ in range(H)]
        for y in range(H - 2):
            for x in range(W):
                if out[y][x]:
                    sh[y + 2][x] = K[shadow]
        for y in range(H):
            for x in range(W):
                if out[y][x]:
                    sh[y][x] = out[y][x]
        out = sh
    return image(out)


def duck_at(s, pose="rest"):
    """Her side view redrawn at s times her size from duck.py's shapes: every shape scales, the outline and rim
    stay 1px. pose is "rest" (standing, wing folded) or "downstroke" (in the air, the wing level behind her,
    feet tucked under her belly)."""
    W, H = round(D.W * s), round(D.H * s)
    g = Grid(W, H)
    C = W / 2
    bw, bh = D.BRX * s, D.BRY * s
    air = pose == "downstroke"
    bottom = H - 1 - 2 * round(2 * s) if air else D.BODY_BOTTOM * s
    bcy = bottom - bh
    hr = D.HEAD_R * s
    hcx, hcy = C + D.HEAD_X * bw, bcy - D.HEAD_UP * bh
    fw, fh = round(4 * s), round(2 * s)
    if not air:
        g.rect(int(C - 5 * s), H - 1 - fh, fw, fh, "orange")
    D.cel(g, D.in_ell(C - bw + s, bcy - s, 4.4 * s, 2.2 * s, -0.45), D.BASE, D.SHADE, None, round(s), 1)
    D.cel(g, D.in_body(C, bcy, bw, bh, hcx - hr * 0.7, D.NAPE_DROP * s, D.BACK_FLAT * s), D.BASE, D.SHADE,
          D.LIGHT, round(3 * s), 1)
    if air:
        for dx in (-5, 2):
            g.rect(int(C + dx * s), int(bottom), fw, round(s), "orange")
        a, ln = math.radians(172), 15 * s
        sx, sy = C - 5 * s, bcy - bh * 0.45
        D.flat(g, D.in_ell(sx + math.cos(a) * ln * 0.5, sy + math.sin(a) * ln * 0.5, ln * 0.5, ln * 0.27, a),
               D.WING)
    else:
        g.rect(int(C + 2 * s), H - 1 - fh, fw, fh, "orange")
    D.cel(g, D.in_ell(hcx, hcy, hr, hr), D.BASE, D.SHADE, D.LIGHT, round(3 * s), 1)
    if not air:
        D.flat(g, D.in_ell(C - 2 * s, bcy + 2 * s, bw * 0.5, bh * 0.3, -0.3), D.WING)
    g.rect(int(hcx + hr - 2 * s), int(hcy), round(7 * s), round(5 * s), "orange")
    g.rect(int(hcx), int(hcy - hr * 0.55), round(4 * s), round(4 * s), "ink")
    return image(g.outlined(lambda c: K[D.OUTLINE]))


def logo():
    from PIL import Image

    b = BIG["b"]
    w1 = word(WORDMARK[0], **BIG)
    w2 = word(" ".join(WORDMARK[1:]), **SMALL)
    d = duck_at(2)
    c = Image.new("RGBA", (max(w1.width, w2.width) + 20, d.height + w1.height + w2.height + 20), (0, 0, 0, 0))
    x1 = (c.width - w1.width) // 2
    top = PEEK + 2
    # behind the second and third letters: only her head and back show above them
    c.alpha_composite(d.crop((0, 0, d.width, PEEK + 4)), (x1 + 12 * b - d.width // 2 - b // 2, top - PEEK))
    c.alpha_composite(w1, (x1, top))
    c.alpha_composite(w2, ((c.width - w2.width) // 2, top + w1.height + 8))
    return c.crop(c.getbbox())


def logo_nav():
    from PIL import Image

    frames = {n: fs for n, fs, _ in D.duck_tags()}
    d = image(frames["idle"][0])
    d = d.crop(d.getbbox())
    w = word(" ".join(WORDMARK), **NAV)
    c = Image.new("RGBA", (d.width + w.width + 4, max(d.height, w.height)), (0, 0, 0, 0))
    c.alpha_composite(d.crop((0, 0, d.width, 22)), (0, 0))
    c.alpha_composite(w, (d.width - 8, 14))
    return c.crop(c.getbbox())


def logo_icon():
    """Her profile alone on the downstroke, at ICON_SCALE times the sprite."""
    d = duck_at(ICON_SCALE, "downstroke")
    return d.crop(d.getbbox())


def images():
    return {"logo": logo(), "logo-nav": logo_nav(), "logo-icon": logo_icon()}


def build():
    ims = images()
    for key, im in ims.items():
        os.makedirs(os.path.dirname(OUT[key]), exist_ok=True)
        im.save(OUT[key])
    manifest = {}
    if os.path.exists(pixel.MANIFEST):
        with open(pixel.MANIFEST) as f:
            manifest = json.load(f)
    entries = {e["key"]: e for e in manifest.get("images", [])}
    for key, im in ims.items():
        entries[key] = {"key": key, "png": os.path.basename(OUT[key]), "width": im.width, "height": im.height}
    manifest["images"] = sorted(entries.values(), key=lambda e: e["key"])
    with open(pixel.MANIFEST, "w") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")
    print("built", ", ".join(f"{k} {im.width}x{im.height}" for k, im in ims.items()))


def preview(out):
    from PIL import Image

    ims = images()
    tiles = []
    for ground in ("ink", "cream"):
        for z in (1, 3):
            for im in ims.values():
                t = Image.new("RGBA", (im.width + 16, im.height + 16), pixel.rgb(ground) + (255,))
                t.alpha_composite(im, (8, 8))
                tiles.append(t.resize((t.width * z, t.height * z), Image.NEAREST))
    W = max(t.width for t in tiles)
    sheet = Image.new("RGB", (W, sum(t.height for t in tiles)), pixel.rgb("ink"))
    y = 0
    for t in tiles:
        sheet.paste(t.convert("RGB"), (0, y))
        y += t.height
    sheet.save(out)


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "preview":
        preview(sys.argv[2])
    elif len(sys.argv) == 2 and sys.argv[1] == "build":
        build()
    else:
        sys.exit(__doc__)
