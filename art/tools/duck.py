"""The duck: the protagonist's sprite and her dialogue portrait.

Usage, from the repository root:
  python3 -I art/tools/duck.py build            write art/duck/<key>.aseprite and public/art/sprites/<key>.png + .json
  python3 -I art/tools/duck.py preview OUT.png  contact sheet of every frame on slate, tan and cream

Design: a chibi cream duck, head about 1.5x the area of her body, facing right (the game mirrors her).
Short, round orange bill with a rust mouth line. Plain tan comma wing with a dark-brown line,
round nub tail, tiny orange stub feet with no legs, tucked under the belly in the air. A pink two-loop bow
tilted along the back of the crown. Cream body with tan cel shading and a white rim light; ink outline.

duck, 64x48. Feet on rows 44 to 46, outline on row 47 (the frame's bottom row). Anchor: the frame's
bottom edge sits on the collision box's bottom edge, and her body-centre x, 32 (the line between
columns 31 and 32, the frame's centre), sits on the box centre, so mirroring her does not move it.

| Tag     | Frame | ms  | Pose                                                        | Lift | Body w x h | Shadow w |
| ------- | ----- | --- | ----------------------------------------------------------- | ---- | ---------- | -------- |
| idle    | 0     | 400 | rest                                                        | 0    | 25 x 16    | 24       |
| idle    | 1     | 400 | breath: body and head 1px up, feet planted                  | 1    | 25 x 16    | 24       |
| walk    | 0     | 130 | near foot forward and 2px up, far foot back                 | 0    | 25 x 16    | 24       |
| walk    | 1     | 130 | passing: feet together, body 1px up                         | 1    | 25 x 16    | 22       |
| walk    | 2     | 130 | far foot forward and 2px up (behind the body), near back    | 0    | 25 x 16    | 24       |
| walk    | 3     | 130 | passing                                                     | 1    | 25 x 16    | 22       |
| jump    | 0     | 80  | crouch: squash, head 2px down                               | 0    | 29 x 14    | 28       |
| jump    | 1     | 100 | lift: stretch, 3px up, feet hanging, wing half raised       | 3    | 21 x 20    | 18       |
| flutter | 0     | 100 | wing up (the signature pose)                                | 3    | 25 x 16    | 16       |
| flutter | 1     | 100 | wing back                                                   | 3    | 25 x 16    | 16       |
| flutter | 2     | 100 | wing level: the downstroke lifts the body 1px               | 4    | 25 x 16    | 16       |
| flutter | 3     | 100 | wing back                                                   | 3    | 25 x 16    | 16       |
| land    | 0     | 100 | contact: squash, feet planted wide                          | 0    | 30 x 14    | 30       |
| land    | 1     | 80  | recover: half squash                                        | 0    | 27 x 15    | 26       |

Lift is how far the body's bottom edge sits above its rest row, in pixels. Body w x h is the body's
ellipse; its area (the volume) stays within 2% of the rest pose. Shadow w is for a ground shadow the
game may draw under her: the land contact frame's is the largest. flutter and jump 1 are airborne,
so their shadow is the game's to place. jump and land play once and hold their last frame (the manifest's
"once"); every other tag loops. After land, play idle.

portrait-duck, 64x64: her head and shoulders, facing right towards the text, cut off by the frame's
bottom edge, on a transparent ground (the dialogue box's 68x68 frame supplies the backing).
Tags: neutral, happy (eye closed in a smile arc, bigger blush), worried (a brow slanting down to the
back, the eye looking down). One frame each.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixel  # noqa: E402
from pixel import K, Grid  # noqa: E402

SRC = "art/duck"
W, H = 64, 48
GY = H - 1  # the outline row under the feet
BCX = 32.0  # body centre x: the frame's centre line
BRX, BRY = 12.6, 8.2  # body ellipse at rest: round and low under the head
BODY_POWER = 2.2  # the body's superellipse power: lower is rounder
HEAD_SET = 0.66  # how far the head sits above the body's top, in head radii: lower is squatter
HRX, HRY = 13.0, 12.0  # head ellipse
BODY_BOTTOM = 44  # the body's bottom edge at rest; the feet fill rows 44 to 46
CREAM, SHADE, LIGHT = "cream", "tan", "white"
WING, WING_LINE = "tan", "dbrown"
INK = "ink"


def poly(g, pts, c):
    """Fill a polygon (pixel centres inside, even-odd rule)."""
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    for y in range(max(0, int(min(ys))), min(g.h, int(max(ys)) + 1)):
        for x in range(max(0, int(min(xs))), min(g.w, int(max(xs)) + 1)):
            px, py, inside = x + 0.5, y + 0.5, False
            j = len(pts) - 1
            for i in range(len(pts)):
                xi, yi = pts[i]
                xj, yj = pts[j]
                if (yi > py) != (yj > py) and px < (xj - xi) * (py - yi) / (yj - yi) + xi:
                    inside = not inside
                j = i
            if inside:
                g.p(x, y, c)


def m_poly(g, pts):
    t = Grid(g.w, g.h)
    poly(t, pts, "ffffff")
    return {(x, y) for y in range(g.h) for x in range(g.w) if t.px[y][x]}


def m_ell(g, cx, cy, rx, ry, ang=0.0):
    """Mask of an ellipse rotated by ang radians."""
    ca, sa = math.cos(ang), math.sin(ang)
    out = set()
    for y in range(g.h):
        for x in range(g.w):
            dx, dy = x + 0.5 - cx, y + 0.5 - cy
            u, v = dx * ca + dy * sa, -dx * sa + dy * ca
            if (u / rx) ** 2 + (v / ry) ** 2 <= 1:
                out.add((x, y))
    return out


def rot(sx, sy, ang, pts):
    """Local (u along a shape's axis, v across it) to frame coordinates."""
    ca, sa = math.cos(ang), math.sin(ang)
    return [(sx + u * ca - v * sa, sy + u * sa + v * ca) for u, v in pts]


def patch(g, m, fill, line):
    """Paint a mask with a 1px line on its edge pixels and fill inside."""
    for x, y in m:
        edge = any(n not in m for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
        g.p(x, y, line if edge else fill)


def bow(g, kx, ky, ang=-0.42, size=1.0):
    """The pink two-loop bow: rounded loops pinched at a mauve knot, tilted along the back of the crown so
    the outline is lopsided (two level loops on a round head read as ears)."""
    lobe = [(0, -1.5), (4, -2.6), (8, -4.4), (10.5, -4), (11.5, -1.6), (11.5, 1.6), (10, 3.6), (7, 3.6),
            (3, 1.5), (0, 1.5)]
    for sgn in (-1, 1):
        poly(g, rot(kx, ky, ang, [(sgn * u * size, v * size) for u, v in lobe]), "pink")
        poly(g, rot(kx, ky, ang, [(sgn * 2 * size, -0.5 * size), (sgn * 8 * size, -2 * size),
                                  (sgn * 8 * size, 1.6 * size)]), "mauve")
    poly(g, rot(kx, ky, ang, [(-2.2 * size, -3 * size), (2.2 * size, -3 * size), (2.2 * size, 3 * size),
                              (-2.2 * size, 3 * size)]), "mauve")
    poly(g, rot(kx, ky, ang, [(-1 * size, -2 * size), (1.2 * size, -2 * size), (1.2 * size, 0), (-1 * size, 0)]),
         "pink")


def cel(g, inside, base, sh, li, ks, kl):
    """Fill a shape cel-shaded from a top-left light: sh is a crescent ks px deep along the lower-right rim
    (pixels that leave the shape when moved ks px down and right), li a kl px rim on the upper left."""
    for y in range(g.h):
        for x in range(g.w):
            if inside(x, y):
                c = sh if not inside(x + ks, y + ks) else li if li and not inside(x - kl, y - kl) else base
                g.p(x, y, c)


def in_ell(cx, cy, rx, ry):
    return lambda x, y: ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1


def in_blob(cx, cy, rx, ry, power=2.6):
    return lambda x, y: (abs(x + 0.5 - cx) / rx) ** power + (abs(y + 0.5 - cy) / ry) ** power <= 1


def foot(g, cx, cy):
    """A stub foot: a small rounded orange paddle with a rust underside."""
    g.ell(cx, cy, 3.2, 1.6, "orange", "rust")


def draw(lift=0, bw=BRX, bh=BRY, wing=("fold", 0), feet=((-4, 0), (4, 0)), far_behind=True, head_dy=0):
    """One 64x48 frame.

    lift: body bottom edge this many px above its rest row. bw, bh: body ellipse radii. wing: ("fold", dy)
    or ("raise", degrees), the raised wing's direction in screen degrees (180 straight back, above 180
    up and back). feet: ((dx, up), (dx, up)) for the far and near foot, relative to the body centre, or
    "tucked". head_dy: extra head offset (positive is down).
    """
    g = Grid(W, H)
    bottom = BODY_BOTTOM - lift
    bcx, bcy = BCX, bottom - bh
    hcx = bcx + BRX * 0.45
    hcy = bcy - bh * 0.35 - HRY * HEAD_SET + head_dy
    tx = bcx - bw

    def feet_at(which):
        if feet == "tucked":
            return
        (fdx, fup) = feet[which]
        foot(g, bcx + fdx, GY - 1.5 - fup - lift)

    # far foot behind the body; tail
    if far_behind:
        feet_at(0)
    cel(g, in_ell(tx + 1, bcy - 3, 4.6, 3.6), CREAM, SHADE, None, 2, 1)
    # body; a raised wing goes on before the head so its root sits behind the head
    cel(g, in_blob(bcx, bcy, bw, bh, BODY_POWER), CREAM, SHADE, LIGHT, 3, 1)
    if not far_behind:
        feet_at(0)
    feet_at(1)
    if feet == "tucked":  # soles just under the belly
        for fdx in (-3, 4):
            g.ell(bcx + fdx, bottom + 0.5, 2.6, 1.6, "orange", "rust")
    kind, val = wing
    if kind == "raise":
        sx, sy = bcx - 4, bcy - 1
        ang = math.radians(val)
        m = m_ell(g, *rot(sx, sy, ang, [(10, 0)])[0], 11.0, 6.4, ang)
        m |= m_poly(g, rot(sx, sy, ang, [(16, -4), (24, -6.5), (19, 2)]))
        patch(g, m, WING, WING_LINE)
    cel(g, in_ell(hcx, hcy, HRX, HRY), CREAM, SHADE, LIGHT, 3, 1)
    if kind == "fold":  # the folded wing lies over the head's lower edge
        wx, wy = bcx - 3, bcy + 1 + val
        m = m_ell(g, wx + 1, wy, 7.6, 5.0) | m_poly(g, [(wx - 4, wy - 3), (wx - 11, wy - 5), (wx - 4, wy + 3)])
        patch(g, m, WING, WING_LINE)
    # bill, eye, catchlight, blush
    bx, by = hcx + HRX - 1, hcy + HRY * 0.28
    g.ell(bx + 4.2, by, 5.0, 3.8, "orange")
    g.rect(int(bx + 1), int(by + 1), 8, 1, "rust")  # mouth line
    ex, ey = int(hcx + HRX * 0.3), int(hcy - HRY * 0.3)
    g.rect(ex, ey, 4, 6, INK)
    g.rect(ex, ey, 2, 2, "white")
    g.rect(ex - 3, ey + 7, 4, 2, "pink")
    bow(g, hcx - HRX * 0.42, hcy - HRY * 0.86)
    return g.outlined(lambda c: K[INK])


def vol(rx, ry):
    return rx * ry


# Squash and stretch: (bw, bh) keep bw * bh within 2% of the rest pose's 12.0 * 8.6 = 103.2.
SQUASH_CROUCH = (14.6, 7.0)
STRETCH_LIFT = (10.4, 10.0)
SQUASH_LAND = (15.2, 6.8)
SQUASH_RECOVER = (13.4, 7.6)


def duck_tags():
    idle = [draw(), draw(lift=1, feet=((-4, -1), (4, -1)))]  # feet stay planted while the body rises
    walk = [
        draw(feet=((-6, 0), (6, 2))),
        draw(lift=1, feet=((-3, -1), (3, -1))),
        draw(feet=((6, 2), (-6, 0)), far_behind=True),
        draw(lift=1, feet=((-3, -1), (3, -1))),
    ]
    jump = [
        draw(bw=SQUASH_CROUCH[0], bh=SQUASH_CROUCH[1], wing=("fold", -1), feet=((-5, 0), (5, 0)), head_dy=0),
        draw(lift=3, bw=STRETCH_LIFT[0], bh=STRETCH_LIFT[1], wing=("raise", 204), feet=((-3, 0), (4, 0)),
             head_dy=2),
    ]
    # wing angles: up (the signature pose), back, level (the downstroke lifts the body 1px), back
    flutter = [draw(lift=3 + (a == 180), wing=("raise", a), feet="tucked") for a in (226, 204, 180, 204)]
    land = [
        draw(bw=SQUASH_LAND[0], bh=SQUASH_LAND[1], wing=("raise", 190), feet=((-6, 0), (6, 0))),
        draw(bw=SQUASH_RECOVER[0], bh=SQUASH_RECOVER[1], wing=("fold", -1), feet=((-5, 0), (5, 0))),
    ]
    return [
        ("idle", idle, 400),
        ("walk", walk, 130),
        ("jump", jump, [80, 100]),
        ("flutter", flutter, 100),
        ("land", land, [100, 80]),
    ]


def portrait(expr):
    """64x64 head and shoulders facing right, cut off by the bottom edge."""
    g = Grid(64, 64)
    hcx, hcy, hrx, hry = 26.0, 33.0, 19.0, 18.0
    # shoulders, running off the bottom edge, with the folded wing's top
    cel(g, in_blob(25, 63, 21, 13), CREAM, SHADE, LIGHT, 4, 1)
    patch(g, m_ell(g, 16, 61, 10, 5.5), WING, WING_LINE)
    cel(g, in_ell(hcx, hcy, hrx, hry), CREAM, SHADE, LIGHT, 4, 1)
    # bill: the short, round bill, scaled up, with its mouth line
    bx, by = hcx + hrx - 4, hcy + 6
    g.ell(bx + 5.5, by, 7.6, 5.6, "orange")
    g.rect(int(bx), int(by + 1), 12, 1, "rust")
    if expr == "happy":  # the mouth line turns up at the corner
        g.rect(int(bx) - 2, int(by), 2, 1, "rust")
    elif expr == "worried":  # the mouth line turns down at the corner
        g.rect(int(bx) - 2, int(by + 2), 2, 1, "rust")
    # eye
    ex, ey = 33, 22
    if expr == "happy":  # closed, a smile arc
        for x, y in ((0, 3), (1, 2), (2, 1), (3, 1), (4, 1), (5, 2), (6, 3)):
            g.rect(ex - 1 + x, ey + 3 + y, 1, 2, INK)
        g.rect(ex - 5, ey + 10, 7, 3, "pink")
    else:
        g.rect(ex, ey, 6, 9, INK)
        if expr == "worried":  # looking down: catchlight low, brow slanting down to the back
            g.rect(ex, ey + 4, 3, 3, "white")
            for i in range(7):
                g.rect(ex - 2 + i, ey - 4 + (6 - i) // 3, 1, 2, INK)
        else:
            g.rect(ex, ey, 3, 3, "white")
        g.rect(ex - 5, ey + 11, 6, 3, "pink")
    bow(g, hcx - hrx * 0.36, hcy - hry * 0.86, size=1.4)
    out = g.outlined(lambda c: K[INK])
    return out


def portrait_tags():
    return [(e, [portrait(e)], 1000) for e in ("neutral", "happy", "worried")]


# Tags that play once and hold their last frame; every other tag loops.
ONCE = {"duck": ("jump", "land")}


def sprites():
    yield "duck", duck_tags()
    yield "portrait-duck", portrait_tags()


if __name__ == "__main__":
    pixel.main(sys.argv, sprites, SRC, __doc__, once=ONCE)
