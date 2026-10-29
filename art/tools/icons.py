"""The site's favicon and app icons: the duck's head and bow on a green disc.

Usage, from the repository root:
  python3 -I art/tools/icons.py build            write every icon below
  python3 -I art/tools/icons.py preview OUT.png  every icon at 1x on light and dark ground, the 16 and 32 at 8x

Plain PNGs (and one ICO), not Aseprite sprites and not manifest entries. Every pixel is fully opaque or
fully transparent. The head, bill, eye, blush and bow come from art/tools/duck.py's shapes, placed as
fractions of the icon's side, so each drawing is its own rasterization rather than a downscale.

| Path                               | Size    | Drawing                     | Ground                          |
| ---------------------------------- | ------- | --------------------------- | ------------------------------- |
| public/art/favicon-16.png          | 16x16   | 16, hand-placed bow and eye | disc, transparent outside       |
| public/art/favicon.png             | 32x32   | 32                          | disc, transparent outside       |
| public/favicon.ico                 | 16, 32  | the two favicons above      | disc, transparent outside       |
| public/icons/apple-touch-icon.png  | 180x180 | 90, scaled 2x               | full-bleed green square         |
| public/icons/icon-192.png          | 192x192 | 64, scaled 3x               | disc, transparent outside       |
| public/icons/icon-512.png          | 512x512 | 64, scaled 8x               | disc, transparent outside       |
| public/icons/icon-maskable-512.png | 512x512 | 64 at 78%, scaled 8x        | full-bleed green, subject in 80% |

At 16px only the bow and bill have to read: no mouth line, catchlight or blush. The 32px drawing adds the
eye, blush and mouth line; 64px and up add the catchlight and the tilted two-loop bow. At 32px and below the
bow is a level bow-tie pinched at the knot, which reads as a bow at that size.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import duck  # noqa: E402
import pixel  # noqa: E402
from pixel import K, Grid  # noqa: E402

GROUND = "green"
OUTPUTS = {
    "public/art/favicon-16.png": (16, "disc", 1),
    "public/art/favicon.png": (32, "disc", 1),
    "public/icons/apple-touch-icon.png": (90, "full", 2),
    "public/icons/icon-192.png": (64, "disc", 3),
    "public/icons/icon-512.png": (64, "disc", 8),
    "public/icons/icon-maskable-512.png": (64, "mask", 8),
}
ICO = "public/favicon.ico"
MASK_SCALE = 0.78  # the subject's scale in the maskable icon, about the centre

# The head in fractions of the side: head (cx, cy, r), bill (cx, cy, rx, ry), eye (x, y, w, h),
# bow (knot x, knot y, width, tilt in radians).
HEAD = dict(head=(0.47, 0.57, 0.30), bill=(0.80, 0.63, 0.12, 0.09), eye=(0.55, 0.45, 0.06, 0.10),
            bow=(0.38, 0.28, 0.40, -0.35))
BOW16 = ["PP...PP", "PPPMPPP", "PP...PP"]
BOW32 = [".PPP...PPP.", "PPPPPMPPPPP", "PPPPPMPPPPP", "PPPPPMPPPPP", ".PPP...PPP."]


def bow_tie(g, pattern, kx, ky):
    """A level bow-tie, pinched at the knot, centred on kx, ky: P pink, M the mauve knot."""
    h, w = len(pattern), len(pattern[0])
    for j, row in enumerate(pattern):
        for i, ch in enumerate(row):
            if ch in "PM":
                g.p(kx - w // 2 + i, ky - h // 2 + j, "pink" if ch == "P" else "mauve")


def scaled_spec(spec, f):
    """The head shrunk by f about the icon's centre."""
    def at(x, y):
        return 0.5 + (x - 0.5) * f, 0.5 + (y - 0.5) * f

    return dict(head=(*at(*spec["head"][:2]), spec["head"][2] * f),
                bill=(*at(*spec["bill"][:2]), spec["bill"][2] * f, spec["bill"][3] * f),
                eye=(*at(*spec["eye"][:2]), spec["eye"][2] * f, spec["eye"][3] * f),
                bow=(*at(*spec["bow"][:2]), spec["bow"][2] * f, spec["bow"][3]))


def head16(g):
    """The 16px drawing, hand-placed: head, a 3x2 bill, a 1x2 eye and the bow-tie."""
    g.ell(7, 9.5, 4.6, 4.4, "cream", "tan")
    g.rect(11, 9, 3, 2, "orange")
    g.p(14, 9, None)
    g.rect(9, 7, 1, 2, "ink")
    bow_tie(g, BOW16, 6, 4)


def head(g, S, spec):
    """The head at side S from a spec in fractions of the side."""
    ks = max(1, round(S / 22))
    cx, cy, r = spec["head"]
    duck.cel(g, duck.in_ell(cx * S, cy * S, r * S, r * S * 0.94), "cream", "tan", "white" if S >= 32 else None,
             ks, 1)
    bx, by, brx, bry = spec["bill"]
    g.ell(bx * S, by * S, max(1.6, brx * S), max(1.2, bry * S), "orange")
    if S >= 32:
        g.rect(int((bx - brx * 0.8) * S), int((by + bry * 0.25) * S), round(brx * 1.6 * S), 1, "rust")
    ex, ey, ew, eh = spec["eye"]
    w, h = max(2, round(ew * S)), max(3, round(eh * S))
    g.rect(int(ex * S), int(ey * S), w, h, "ink")
    if S >= 48:
        g.rect(int(ex * S), int(ey * S), w // 2, w // 2, "white")
    g.rect(int(ex * S) - w + 1, int(ey * S) + h + 1, w, max(1, round(S / 32)), "pink")
    kx, ky, bw, ang = spec["bow"]
    if S <= 32:
        bow_tie(g, BOW32, round(kx * S), round(ky * S))
    else:
        duck.bow(g, kx * S, ky * S, ang=ang, size=bw * S / 23)


def icon(S, ground):
    """One drawing: ground is "disc" (transparent outside), "full" (green square) or "mask" (green square,
    the subject shrunk into the central 80%)."""
    g = Grid(S, S)
    if S == 16:
        head16(g)
    else:
        head(g, S, scaled_spec(HEAD, MASK_SCALE) if ground == "mask" else HEAD)
    fig = g.outlined(lambda c: K["ink"])
    out = Grid(S, S)
    if ground == "disc":
        out.ell(S / 2, S / 2, S / 2, S / 2, GROUND)
    else:
        out.rect(0, 0, S, S, GROUND)
    for y in range(S):
        for x in range(S):
            if fig[y][x]:
                out.px[y][x] = fig[y][x]
    return out.px


def image(px, z=1):
    from PIL import Image

    S = len(px)
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    for y, row in enumerate(px):
        for x, c in enumerate(row):
            if c:
                im.putpixel((x, y), pixel.rgb(c) + (255,))
    return im.resize((S * z, S * z), Image.NEAREST) if z != 1 else im


def images():
    return {path: image(icon(S, ground), z) for path, (S, ground, z) in OUTPUTS.items()}


def build():
    ims = images()
    for path, im in ims.items():
        os.makedirs(os.path.dirname(path), exist_ok=True)
        im.save(path)
    fav16, fav32 = ims["public/art/favicon-16.png"], ims["public/art/favicon.png"]
    fav32.save(ICO, format="ICO", sizes=[(16, 16), (32, 32)], append_images=[fav16])
    print("built", ", ".join(list(ims) + [ICO]))


def preview(out):
    from PIL import Image

    ims = images()
    small = [ims["public/art/favicon-16.png"], ims["public/art/favicon.png"]]
    zoom = [im.resize((im.width * 8, im.height * 8), Image.NEAREST) for im in small]
    gap = 16
    rows = []
    for ground in ("dee1e6", "202124"):
        w = sum(im.width for im in ims.values()) + gap * (len(ims) + 1)
        row = Image.new("RGBA", (w, 512 + 2 * gap), pixel.rgb(ground) + (255,))
        x = gap
        for im in ims.values():
            row.alpha_composite(im, (x, gap))
            x += im.width + gap
        rows.append(row)
    zrow = Image.new("RGBA", (sum(z.width for z in zoom) + gap * 3, 256 + 2 * gap), pixel.rgb("slate") + (255,))
    x = gap
    for z in zoom:
        zrow.alpha_composite(z, (x, gap))
        x += z.width + gap
    rows.append(zrow)
    sheet = Image.new("RGBA", (max(r.width for r in rows), sum(r.height for r in rows)), pixel.rgb("ink") + (255,))
    y = 0
    for r in rows:
        sheet.alpha_composite(r, (0, y))
        y += r.height
    sheet.convert("RGB").save(out)


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "preview":
        preview(sys.argv[2])
    elif len(sys.argv) == 2 and sys.argv[1] == "build":
        build()
    else:
        sys.exit(__doc__)
