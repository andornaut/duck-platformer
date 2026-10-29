"""The ferret: the villain's sprite and its dialogue portrait.

Usage, from the repository root:
  python3 -I art/tools/ferret.py build            write art/ferret/<key>.aseprite and public/art/sprites/<key>.png + .json
  python3 -I art/tools/ferret.py preview OUT.png  contact sheet of every frame on slate, tan and cream

Design: a chibi sable ferret, a talking villain, evil in a charming, cartoon way. Standing upright,
head about 1.5x the area of its body, facing left (the game mirrors it). Brown fur with a tan light rim
and dark-brown cel crescents, a cream muzzle, cheek and belly, and a dark-brown mask across the eyes. A
narrowed side-eye (cream sclera, the pupil pushed to the front) under a plum brow, a smirk that curls up
the cheek. Small round ear with a cream centre at the back of the head. Dark-brown arms with tan paws,
a brown tail curling up into a twirl. A black (ink) top hat with a plum rim light and a red band,
tilted forward, its brim overhanging the head on both sides; a red bow tie at the throat. Red is the
one accent. Ink outline; internal edges two ramp steps darker than the part in front.

Fills: tan, brown, dbrown, plum, cream, and the red accent (red, dred). Outline ink.

ferret, 64x64. Feet on rows 60 to 62, outline on row 63 (the frame's bottom row). Anchor: the frame's
bottom edge sits on the collision box's bottom edge, and its body-centre x, 32 (the frame's centre line,
between columns 31 and 32), sits on the box centre, so mirroring it does not move it. Inked 55x63 (columns
5 to 59, rows 1 to 63) with the hat, 47px tall without it.

| Tag     | Frame | ms  | Pose                                                                   | Lift |
| ------- | ----- | --- | ---------------------------------------------------------------------- | ---- |
| idle    | 0     | 400 | rest: paws clasped at the belly, half-lidded eye, closed smirk         | 0    |
| idle    | 1     | 400 | breath: body, head and hat 1px up, feet planted                        | 1    |
| scheme  | 0     | 120 | paws raised and rubbing at the chest, squinting eye, wide smirk        | 0    |
| scheme  | 1     | 120 | near paw 1px up and back, far paw 1px down and forward; shoulders up   | 1    |
| scheme  | 2     | 120 | as frame 0                                                             | 0    |
| scheme  | 3     | 120 | near paw 1px down and forward, far paw 1px up and back; shoulders up   | 1    |
| talk    | 0     | 150 | rest, mouth closed                                                     | 0    |
| talk    | 1     | 150 | mouth open, head and hat 1px up                                        | 0    |
| tip-hat | 0     | 100 | near arm rising behind the head                                        | 0    |
| tip-hat | 1     | 100 | paw at the back of the brim                                            | 0    |
| tip-hat | 2     | 300 | hat raised 3px and tipped forward, squinting eye, wide smirk           | 0    |
| tip-hat | 3     | 100 | hat back down, paw at the brim                                         | 0    |

Lift is how far the body sits above its rest row, in pixels; the feet stay planted. scheme loops while
the ferret schemes; tip-hat plays once, then idle.

portrait-ferret, 64x64: its head and shoulders facing right towards the text (as portrait-duck), cut off
by the frame's bottom edge, with one ink outer line on a transparent ground (the dialogue box's 68x68
frame supplies the backing). Tags: neutral (half-lidded side-eye, closed smirk), smug (squinting eye,
the smirk curling higher, the hat cocked further), annoyed (a steep brow down to the snout, the eye wide, the mouth turned
down, the hat knocked level). One frame each.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixel  # noqa: E402

SRC = "art/ferret"
W = H = 64
INK = "ink"
FUR = ("tan", "brown", "dbrown")  # light, base, shade
FACE = ("cream", "tan")  # muzzle, cheek and belly; shade
MASK = "dbrown"
LIMB = ("brown", "dbrown", "plum")  # arms, feet and tail
PAW = ("tan", "tan", "brown")
EAR = "cream"
NOSE = "plum"
BROW = "plum"
HAT = ("plum", INK, INK)  # rim light, base, shade: a black hat lit on its top-left edges
BAND = "red"
BOW = ("red", "dred")
HAT_SIZE = (14, 13, 27)  # crown width, crown height, brim width
HAT_TILT = -0.18  # radians; negative raises the back of the brim (the hat tips forward)


# ---------------------------------------------------------------------------------------------- shapes

class Pen:
    """Shape masks (sets of pixels) in a w x h frame. Coordinates are written facing left; mirror=True
    draws the same shapes facing right, so cel shading applied afterwards still lights them top-left."""

    def __init__(self, w=W, h=H, mirror=False, dy=0):
        self.w, self.h, self.mirror, self.dy = w, h, mirror, dy

    def x(self, x):
        return self.w - x if self.mirror else x

    def px(self, x, y):
        """A pixel (not a continuous point)."""
        return (self.w - 1 - x if self.mirror else x), y + self.dy

    def ell(self, cx, cy, rx, ry):
        cx, cy = self.x(cx), cy + self.dy
        return {(x, y) for y in range(self.h) for x in range(self.w)
                if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1}

    def blob(self, cx, cy, rx, ry, power=2.6):
        cx, cy = self.x(cx), cy + self.dy
        return {(x, y) for y in range(self.h) for x in range(self.w)
                if abs((x + 0.5 - cx) / rx) ** power + abs((y + 0.5 - cy) / ry) ** power <= 1}

    def poly(self, pts):
        pts = [(self.x(x), y + self.dy) for x, y in pts]
        out = set()
        for y in range(self.h):
            for x in range(self.w):
                px, py, inside = x + 0.5, y + 0.5, False
                j = len(pts) - 1
                for i in range(len(pts)):
                    xi, yi = pts[i]
                    xj, yj = pts[j]
                    if (yi > py) != (yj > py) and px < (xj - xi) * (py - yi) / (yj - yi) + xi:
                        inside = not inside
                    j = i
                if inside:
                    out.add((x, y))
        return out

    def stroke(self, pts, r0, r1, steps=60):
        """A tapering round stroke along a polyline: radius r0 at the start to r1 at the end."""
        segs = list(zip(pts, pts[1:]))
        lens = [math.dist(a, b) for a, b in segs]
        total = sum(lens)
        out, run = set(), 0.0
        for (a, b), seg in zip(segs, lens):
            n = max(2, int(steps * seg / total))
            for i in range(n + 1):
                t = i / n
                r = r0 + (r1 - r0) * (run + seg * t) / total
                out |= self.ell(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, r, r)
            run += seg
        return out


def rot(cx, cy, ang, pts):
    c, s = math.cos(ang), math.sin(ang)
    return [(cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c) for x, y in pts]


def cel(m, base, li=None, sh=None, t=1):
    """Colour a mask: sh on edges facing down or right (t px deep), li on edges facing up or left."""
    out = {}
    for x, y in m:
        c = base
        if sh and any((x + k, y) not in m or (x, y + k) not in m for k in range(1, t + 1)):
            c = sh
        elif li and ((x - 1, y) not in m or (x, y - 1) not in m):
            c = li
        out[(x, y)] = c
    return out


def flat(m, c):
    return {p: c for p in m}


class Fig:
    """Layers back to front, each {(x, y): colour}. A layer added with line=True takes an internal edge,
    two ramp steps darker than its own fill (or line_c), where it overlaps what is already drawn. The
    union takes one ink outer line."""

    def __init__(self, w=W, h=H):
        self.w, self.h = w, h
        self.px = {}

    def add(self, layer, line=False, line_c=None):
        if line:
            edge = {}
            for (x, y), c in layer.items():
                for q in ((x, y - 1), (x, y + 1), (x - 1, y), (x + 1, y)):
                    if q not in layer and q in self.px:
                        edge[q] = line_c or pixel.darker(c, 2)
            self.px.update(edge)
        self.px.update(layer)

    def frame(self):
        g = pixel.Grid(self.w, self.h)
        for (x, y), c in self.px.items():
            g.p(x, y, c)
        out = g.outlined(lambda c: pixel.K[INK])
        # close notches: an empty pixel with three or four inked neighbours reads as a speck in the outline
        changed = True
        while changed:
            changed = False
            for y in range(self.h):
                for x in range(self.w):
                    if out[y][x] is None:
                        n = sum(1 for xx, yy in ((x, y - 1), (x, y + 1), (x - 1, y), (x + 1, y))
                                if 0 <= xx < self.w and 0 <= yy < self.h and out[yy][xx])
                        if n >= 3:
                            out[y][x] = pixel.K[INK]
                            changed = True
        return out


# ---------------------------------------------------------------------------------------------- parts

def hat(pen, bx, by, k=1.0, ang=HAT_TILT, lift=0):
    """The top hat, its brim's bottom centre at bx, by. Returns the crown and brim layers."""
    cw, ch, bw = (v * k for v in HAT_SIZE)
    li, base, sh = HAT
    by -= lift
    bt = max(3, round(3 * k))  # brim thickness
    top_w = cw + 2 * k  # a top hat flares slightly at the top
    brim = [(bx - bw / 2, by - bt), (bx + bw / 2, by - bt), (bx + bw / 2, by), (bx - bw / 2, by)]
    crown = [(bx - cw / 2, by - bt + 0.5), (bx + cw / 2, by - bt + 0.5), (bx + top_w / 2, by - bt - ch),
             (bx - top_w / 2, by - bt - ch)]
    bh = max(3, round(3 * k))
    band = [(bx - cw / 2, by - bt + 0.5), (bx + cw / 2, by - bt + 0.5), (bx + cw / 2 + 0.3 * k, by - bt - bh),
            (bx - cw / 2 - 0.3 * k, by - bt - bh)]
    mc = pen.poly(rot(bx, by, ang, crown))
    crown_l = cel(mc, base, li, sh)
    for p in pen.poly(rot(bx, by, ang, band)) & mc:
        crown_l[p] = BAND
    return crown_l, cel(pen.poly(rot(bx, by, ang, brim)), base, li, sh)


def hat_back(bx, by, k=1.0, ang=HAT_TILT, lift=0):
    """The back (right-hand) end of the brim's underside, for a paw that lifts it."""
    bw = HAT_SIZE[2] * k
    return rot(bx, by - lift, ang, [(bx + bw / 2 - 1.5, by - lift - 1)])[0]


def bow_tie(pen, kx, ky, k=1.0):
    bw, bh = 6 * k, 4 * k
    c, sh = BOW
    m = pen.poly([(kx, ky), (kx - bw, ky - bh), (kx - bw, ky + bh)])
    m |= pen.poly([(kx, ky), (kx + bw, ky - bh), (kx + bw, ky + bh)])
    lay = cel(m, c, None, sh)
    kn = max(3, round(3 * k))
    x0, y0 = round(kx - kn / 2), round(ky - kn / 2)
    for y in range(y0, y0 + kn):
        for x in range(x0, x0 + kn):
            lay[pen.px(x, y)] = sh
    return lay


# Eye bitmaps, facing left (the front is column 0): k ink, w sclera, p pupil, b brow.
EYES = {
    "half": ["bb......",
             ".bbb....",
             "..kkkkkk",
             "kppkkkkk",
             "kppwwwwk",
             ".kkwwwk.",
             "...kkk.."],
    "squint": ["bb......",
               ".bbb....",
               "........",
               "..kkkkkk",
               "kppkkkkk",
               "kppwwwk.",
               ".kkkkk.."],
    "glare": [".....bbb",
              "...bbb..",
              ".bbb....",
              "kkkkkkk.",
              "kppwwwwk",
              "kppwwwk.",
              ".kkkkk.."],
}


def eye(pen, ex, ey, kind, k=1):
    col = dict(k=INK, w="cream", p=INK, b=BROW)
    lay = {}
    for j, row in enumerate(EYES[kind]):
        for i, ch in enumerate(row):
            if ch != ".":
                for a in range(k):
                    for b in range(k):
                        lay[pen.px(ex + i * k + a, ey + j * k + b)] = col[ch]
    return lay


def mouth(pen, sx, sy, kind, n=9):
    """The mouth under the snout, from its front (sx) back to the cheek; n is the straight run's length.
    smirk: curls up at the cheek. grin: a longer, higher curl. open: a small open mouth. frown: turns
    down at the cheek."""
    pts = [(sx + i, sy) for i in range(n)]
    if kind == "smirk":
        pts += [(sx + n, sy - 1), (sx + n + 1, sy - 2)]
    elif kind == "grin":
        pts += [(sx + n, sy), (sx + n + 1, sy - 1), (sx + n + 2, sy - 2), (sx + n + 2, sy - 3)]
    elif kind == "frown":
        pts += [(sx + n, sy + 1), (sx + n + 1, sy + 2)]
    lay = {pen.px(x, y): INK for x, y in pts}
    if kind == "open":
        lay.update({pen.px(sx + n, sy - 1): INK, pen.px(sx + n + 1, sy - 2): INK})
        lay[pen.px(sx + 2, sy + 1)] = INK
        lay[pen.px(sx + n - 2, sy + 1)] = INK
        for i in range(3, n - 2):
            lay[pen.px(sx + i, sy + 1)] = NOSE
            lay[pen.px(sx + i, sy + 2)] = INK
    return lay


# ---------------------------------------------------------------------------------------------- sprite

BCX = 32  # body centre x
HCX, HCY = 27, 29  # head centre at rest


def draw(lift=0, head_dy=0, paws=("clasp", 0), eye_kind="half", mouth_kind="smirk", tip=None):
    """One 64x64 frame, facing left.

    lift: body, head and hat this many px up, feet planted. head_dy: extra head and hat offset (negative
    is up). paws: ("clasp", 0) at the belly, or ("rub", t) at the chest, t in -1..1 sliding the paws past
    each other. tip: None, or the tip-hat stage 0 to 3.
    """
    f = Fig()
    body = Pen(dy=-lift)
    head = Pen(dy=-lift + head_dy)
    feet = Pen()
    fl, fb, fs = FUR
    ll, lb, ls = LIMB
    pl, pb, ps = PAW

    def arm(pen, pts, far=False):
        if far:
            f.add(cel(pen.stroke(pts, 2.4, 2.2), lb, None, ls))
            f.add(cel(pen.ell(*pts[-1], 2.6, 2.6), pb, None, ps))
        else:
            f.add(cel(pen.stroke(pts, 2.4, 2.2), lb, ll, ls), line=True)
            f.add(cel(pen.ell(*pts[-1], 2.6, 2.6), pb, pl, ps), line=True)

    # tail: out of the back of the body, up, ending in a twirl
    tail = [(38, 55), (47, 58), (53, 55), (56, 49), (56, 43), (53, 41), (51, 43), (53, 45)]
    f.add(cel(body.stroke(tail, 4.2, 1.6), fb, fl, fs))
    # far foot and far arm
    f.add(flat(feet.blob(36.5, 61.5, 4.5, 1.6, 2.4), ls))
    kind, t = paws
    if kind == "rub":
        far_paw, near_paw = (18 - t, 45 + t), (20.5 + t, 46.5 - t)
    else:
        far_paw, near_paw = (21, 48), (23.5, 50)
    arm(body, [(29, 42), far_paw], far=True)
    # body with a cream belly
    bm = body.blob(BCX, 49.5, 9, 10.5, 2.3)
    f.add(cel(bm, fb, fl, fs, t=2))
    f.add(flat(body.ell(27, 49.5, 4.5, 7.5) & bm, FACE[0]))
    # near foot
    f.add(cel(feet.blob(27, 61.5, 5, 1.6, 2.4), lb, ll, ls), line=True)
    # ear, head, snout, cheek, mask
    f.add(cel(head.ell(HCX + 12, HCY - 6, 3.8, 3.8), fb, fl, fs))
    f.add(flat(head.ell(HCX + 12, HCY - 5.5, 1.8, 1.8), EAR))
    hm = head.ell(HCX, HCY, 13, 11)
    f.add(cel(hm, fb, fl, fs, t=2), line=True)
    sx0, sy0 = HCX - 13, HCY + 3
    sm = head.ell(sx0, sy0, 8, 4.4)
    f.add(cel(sm, FACE[0], None, FACE[1]))
    f.add(flat(head.ell(HCX - 4, HCY + 6, 7, 4.2) & hm, FACE[0]))
    f.add(flat(head.ell(HCX - 6, HCY - 0.5, 8.5, 3.6) & (hm | sm), MASK))
    # nose, eye, mouth
    nx = min(x for x, y in sm)
    ny = sy0 - 2
    for x, y in ((nx, ny), (nx + 1, ny), (nx + 2, ny), (nx, ny + 1), (nx + 1, ny + 1)):
        f.px[(x, y - lift + head_dy)] = NOSE
    f.add(eye(head, HCX - 11, HCY - 6, eye_kind))
    f.add(mouth(head, nx + 1, sy0 + 2, mouth_kind))
    # bow tie at the throat
    f.add(bow_tie(body, HCX - 4, HCY + 12), line=True)
    # near arm (tip-hat raises it after the hat, below)
    if tip is None:
        arm(body, [(30, 43), near_paw])
    # hat; tip-hat lifts it by the back of the brim
    hx, hy = HCX + 1, HCY - 10
    lift_h, ang = (3, HAT_TILT - 0.25) if tip == 2 else (0, HAT_TILT)
    crown, brim = hat(head, hx, hy, ang=ang, lift=lift_h)
    f.add(crown, line=True, line_c=INK)
    f.add(brim, line=True, line_c=INK)
    if tip is not None:
        bx, by = hat_back(hx, hy - lift + head_dy, ang=ang, lift=lift_h)
        paw = (43, 30 - lift) if tip == 0 else (bx, by + 1)
        arm(body, [(32, 42), (41, 36), paw])
    return f.frame()


def ferret_tags():
    idle = [draw(), draw(lift=1)]
    scheme = [draw(lift=lf, paws=("rub", t), eye_kind="squint", mouth_kind="grin")
              for t, lf in ((0, 0), (1, 1), (0, 0), (-1, 1))]
    talk = [draw(), draw(head_dy=-1, mouth_kind="open")]
    tip = [draw(tip=0), draw(tip=1), draw(tip=2, eye_kind="squint", mouth_kind="grin"), draw(tip=3)]
    return [
        ("idle", idle, 400),
        ("scheme", scheme, 120),
        ("talk", talk, 150),
        ("tip-hat", tip, [100, 100, 300, 100]),
    ]


# ---------------------------------------------------------------------------------------------- portrait

def portrait(expr):
    """64x64 head and shoulders facing right, cut off by the bottom edge."""
    f = Fig()
    pen = Pen(mirror=True)
    fl, fb, fs = FUR
    hcx, hcy = 36, 38
    sm_ = pen.blob(40, 66, 20, 12, 2.4)
    f.add(cel(sm_, fb, fl, fs, t=2))
    f.add(flat(pen.ell(30, 66, 9, 9) & sm_, FACE[0]))
    f.add(cel(pen.ell(hcx + 19, hcy - 3, 4.2, 4.2), fb, fl, fs))
    f.add(flat(pen.ell(hcx + 19, hcy - 2.5, 2, 2), EAR))
    hm = pen.ell(hcx, hcy, 21, 16)
    f.add(cel(hm, fb, fl, fs, t=2), line=True)
    sx0, sy0 = hcx - 20, hcy + 4
    sm = pen.ell(sx0, sy0, 11, 7.5)
    f.add(cel(sm, FACE[0], None, FACE[1], t=2))
    f.add(flat(pen.ell(hcx - 6, hcy + 9, 11, 6) & hm, FACE[0]))
    f.add(flat(pen.ell(hcx - 9, hcy - 1, 13, 5.5) & (hm | sm), MASK))
    nx = 0  # the snout's front column, facing left
    while not any(pen.px(nx, y) in sm for y in range(H)):
        nx += 1
    for j in range(3):
        for i in range(4 - (j == 2)):
            f.px[pen.px(nx + i, sy0 - 4 + j)] = NOSE
    f.add(eye(pen, hcx - 17, hcy - 9, dict(neutral="half", smug="squint", annoyed="glare")[expr], k=2))
    kind = dict(neutral="smirk", smug="grin", annoyed="frown")[expr]
    lay = mouth(pen, nx + 2, sy0 + 4, kind, n=16)
    if kind != "frown":  # at portrait size the curl climbs 2px further
        tx = nx + 2 + 16 + (1 if kind == "smirk" else 2)
        ty = sy0 + 4 - (2 if kind == "smirk" else 3)
        lay.update({pen.px(tx + 1, ty - 1): INK, pen.px(tx + 1, ty - 2): INK})
    f.add(lay)
    f.add(bow_tie(pen, hcx - 2, hcy + 19, k=1.6), line=True)
    k = min(1.4, 24 / (HAT_SIZE[1] + 3))  # as large as fits above the head
    ang = HAT_TILT + dict(neutral=0, smug=-0.12, annoyed=0.12)[expr]  # cocked when smug, level when annoyed
    crown, brim = hat(pen, hcx + 2, hcy - 13, k=k, ang=ang)
    f.add(crown, line=True, line_c=INK)
    f.add(brim, line=True, line_c=INK)
    return f.frame()


def portrait_tags():
    return [(e, [portrait(e)], 1000) for e in ("neutral", "smug", "annoyed")]


def sprites():
    yield "ferret", ferret_tags()
    yield "portrait-ferret", portrait_tags()


if __name__ == "__main__":
    pixel.main(sys.argv, sprites, SRC, __doc__)
