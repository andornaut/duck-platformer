"""The ferret: the villain's sprite and its dialogue portrait.

Usage, from the repository root:
  python3 -I art/tools/ferret.py build            write art/ferret/<key>.aseprite and public/art/sprites/<key>.png + .json
  python3 -I art/tools/ferret.py preview OUT.png  contact sheet of every frame on slate, tan and cream

Design: a chibi sable ferret, a talking villain, cute with a touch of slyness. It stands erect on its
short hind legs, leaning slightly forward, the front of its body one smooth line from the neck down to
the hips over a full, round chest; a long neck, a small wedge head with a narrow, pointed snout, and a
long tail curling out behind along the ground. Facing left (the game mirrors it). Brown fur with a tan
light rim and dark-brown cel crescents, a cream belly, muzzle and round cheek with a hint of tan blush,
and a dark-brown mask around a soft, round dark eye (a cream catchlight, the lid lowered a little)
under a small plum brow. A small smile. Small round ear with a cream centre. Dark-brown arms and feet,
tan paws. A tall, narrow plum stovepipe hat with a dark-brown rim light and a red band; nothing
touches it. A red bow tie under the jaw. Red is the one accent. Ink outline; internal edges two ramp
steps darker than the part in front.

Fills: tan, brown, dbrown, plum, cream, and the red accent (red, dred). Outline ink.

ferret, 64x80. Feet on rows 76 to 78, outline on row 79 (the frame's bottom row). Anchor: the frame's
bottom edge sits on the collision box's bottom edge, and its body-centre x, 32 (the spine's centre line
and the frame's, between columns 31 and 32), sits on the box centre, so mirroring it does not move it.

| Tag    | Frame | ms  | Pose                                                                       | Lift |
| ------ | ----- | --- | -------------------------------------------------------------------------- | ---- |
| idle   | 0     | 400 | rest: paws curled at the chest, soft round eye, small smile                | 0    |
| idle   | 1     | 400 | breath: body, head and hat 1px up, feet and tail planted                   | 1    |
| scheme | 0     | 160 | paws steepled under the chin, fingertips together, eye a pleased arc       | 0    |
| scheme | 1     | 160 | the tap: the near paw 1px down and forward, apart from the far paw         | 0    |
| talk   | 0     | 150 | rest, mouth closed                                                         | 0    |
| talk   | 1     | 150 | mouth open, head and hat 1px up                                            | 0    |

Lift is how far the body sits above its rest row, in pixels. Every tag loops (ONCE is empty).

portrait-ferret, 64x64: its wedge head and long neck facing right towards the text (as portrait-duck),
cut off by the frame's bottom edge, with one ink outer line on a transparent ground (the dialogue box's
68x68 frame supplies the backing). Tags: neutral (soft round eye, small smile), smug (the eye a pleased
arc, small smile), annoyed (a mild pout: the brow dipped towards the snout, the mouth turned down). One
frame each.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixel  # noqa: E402

SRC = "art/ferret"
W, H = 64, 80
GY = H - 1  # the outline row under the feet
INK = "ink"
FUR = ("tan", "brown", "dbrown")  # light, base, shade
FACE = ("cream", "tan")  # belly, muzzle and cheek; shade
MASK = "dbrown"
LIMB = ("brown", "dbrown", "plum")  # arms and feet
PAW = ("tan", "tan", "brown")
EAR = "cream"
NOSE = "plum"
BROW = "plum"
HAT = ("dbrown", "plum", INK)  # rim light, base, shade
BAND = "red"
BOW = ("red", "dred")
HAT_SIZE = (9, 16, 16)  # crown width, crown height, brim width: a stovepipe, no flare
HAT_TILT = -0.05  # radians; negative raises the back of the brim
# The spine: a straight line from the hips at HIP up to TOP, leaning LEAN px forward at the top, so the
# front of the body runs as one smooth line from neck to hips.
HIP = (32, 70)
TOP = 34
LEAN = 3
RADII = (8, 8, 7.6, 5.6, 4.2)  # tube radius at each spine point, hips to neck: a full, round chest
HEAD = (11, 9, 7.5)  # cranium radii and snout length


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

def catmull(P, n=14):
    """Points along a Catmull-Rom curve through P."""
    P = [P[0]] + list(P) + [P[-1]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            t = k / n
            out.append(tuple(0.5 * (2 * p1[j] + (p2[j] - p0[j]) * t
                                    + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t
                                    + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t ** 3) for j in (0, 1)))
    out.append(P[-2])
    return out


def tube(pen, P, radii, shift=0.0, scale=1.0):
    """Discs along a Catmull-Rom spine through P, the radius interpolated from radii (one per point).
    shift moves each disc towards the front (left) by shift x its radius; scale shrinks it."""
    pts = catmull(P)
    n = len(pts) - 1
    m = set()
    for i, (x, y) in enumerate(pts):
        u = i / n * (len(radii) - 1)
        j = min(int(u), len(radii) - 2)
        r = (radii[j] + (radii[j + 1] - radii[j]) * (u - j)) * scale
        m |= pen.ell(x - shift * r / scale, y, r, r)
    return m


def hat(pen, bx, by, k=1.0):
    """The stovepipe, its brim's bottom centre at bx, by. Returns the crown and brim layers."""
    cw, ch, bw = (v * k for v in HAT_SIZE)
    li, base, sh = HAT
    bt = max(3, round(3 * k))  # brim thickness
    y0, y1 = by - bt + 0.5, by - bt - ch
    brim = [(bx - bw / 2, by - bt), (bx + bw / 2, by - bt), (bx + bw / 2, by), (bx - bw / 2, by)]
    crown = [(bx - cw / 2, y0), (bx + cw / 2, y0), (bx + cw / 2, y1), (bx - cw / 2, y1)]
    bh = max(3, round(3 * k))
    band = [(bx - cw / 2 - 1, y0), (bx + cw / 2 + 1, y0), (bx + cw / 2 + 1, y0 - bh), (bx - cw / 2 - 1, y0 - bh)]
    mc = pen.poly(rot(bx, by, HAT_TILT, crown))
    crown_l = cel(mc, base, li, sh)
    for p in pen.poly(rot(bx, by, HAT_TILT, band)) & mc:
        crown_l[p] = BAND
    return crown_l, cel(pen.poly(rot(bx, by, HAT_TILT, brim)), base, li, sh)


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


# Eye bitmaps, facing left (the front is column 0): k ink, c catchlight, b brow. Round and soft, with a
# flat top (a lowered lid) for a touch of slyness; "pleased" is a closed, upturned arc, "pout" dips the
# brow towards the snout.
EYES = {
    "soft": ["..bbb..",
             ".......",
             ".kkkkk.",
             "kcckkkk",
             "kcckkkk",
             ".kkkkk.",
             "..kkk.."],
    "pleased": ["..bbb..",
                ".......",
                ".......",
                "..kkk..",
                ".kk.kk.",
                "kk...kk",
                "......."],
    "pout": ["....bb.",
             "..bb...",
             ".kkkkk.",
             "kcckkkk",
             "kcckkkk",
             ".kkkkk.",
             "..kkk.."],
}


def eye(pen, ex, ey, kind, k=1):
    col = dict(k=INK, c="cream", b=BROW)
    lay = {}
    for j, row in enumerate(EYES[kind]):
        for i, ch in enumerate(row):
            if ch != ".":
                for a in range(k):
                    for b in range(k):
                        lay[pen.px(ex + i * k + a, ey + j * k + b)] = col[ch]
    return lay


def mouth(pen, sx, sy, kind, n):
    """A small mouth under the snout, from just behind its tip (sx) back n px. smile: turns up at the back.
    open: a small open mouth. pout: turns down at the back."""
    pts = [(sx + i, sy) for i in range(n)]
    if kind == "smile":
        pts += [(sx + n, sy - 1)]
    elif kind == "pout":
        pts += [(sx + n, sy + 1)]
    lay = {pen.px(x, y): INK for x, y in pts}
    if kind == "open":
        lay[pen.px(sx + n, sy - 1)] = INK
        for i in range(1, n):
            lay[pen.px(sx + i, sy + 1)] = NOSE
        lay[pen.px(sx, sy + 1)] = INK
        lay[pen.px(sx + n, sy + 1)] = INK
        for i in range(1, n):
            lay[pen.px(sx + i, sy + 2)] = INK
    return lay


def head(f, pen, hx, hy, rx, ry, L, eye_kind, mouth_kind, k=1):
    """The wedge head facing left: a cranium and a narrow snout L px long tapering to a point, a cream
    lower muzzle and cheek, a dark mask through the eye, the nose, eye and mouth."""
    fl, fb, fs = FUR
    f.add(cel(pen.ell(hx + rx * 0.5, hy - ry * 0.72, 3.2 * k, 3.2 * k), fb, fl, fs))  # ear
    f.add(flat(pen.ell(hx + rx * 0.5, hy - ry * 0.68, 1.5 * k, 1.5 * k), EAR))
    tipx, tipy = hx - rx - L, hy + ry * 0.3
    snout = pen.poly([(hx - rx * 0.2, hy - ry * 0.55), (tipx + 2 * k, tipy - 2 * k), (tipx, tipy - 0.4 * k),
                      (tipx + 0.5 * k, tipy + 1.2 * k), (tipx + 3 * k, tipy + 2 * k), (hx - rx * 0.1, hy + ry * 0.75)])
    hm = pen.ell(hx, hy, rx, ry) | snout
    f.add(cel(hm, fb, fl, fs, t=2), line=True)
    muzzle = pen.poly([(tipx + 0.5 * k, tipy + 0.1 * k), (hx - rx * 0.3, hy + ry * 0.05), (hx + rx * 0.25, hy + ry * 0.45),
                       (hx + rx * 0.1, hy + ry * 0.9), (tipx + 3 * k, tipy + 3 * k)]) & hm
    f.add(cel(muzzle, FACE[0], None, FACE[1]))
    cheek = pen.ell(hx - rx * 0.1, hy + ry * 0.4, rx * 0.5, ry * 0.42) & hm  # a round cream cheek
    f.add(cel(cheek, FACE[0], None, FACE[1]))
    ex, ey = hx - rx * 0.6, hy - ry * 0.05
    band = pen.poly([(tipx + L * 0.45, tipy - 2 * k), (ex - 2 * k, ey - 3 * k), (ex + 7 * k, ey - 3.5 * k),
                     (ex + 9 * k, ey + 1 * k), (ex + 5 * k, ey + 4 * k), (tipx + L * 0.5, tipy + 0.2 * k)])
    f.add(flat(band & hm, MASK))
    nx, ny = round(tipx), round(tipy - 1.5 * k)
    for x, y in ((nx, ny), (nx + 1, ny), (nx + 2, ny), (nx, ny + 1), (nx + 1, ny + 1)):
        f.px[pen.px(x, y)] = NOSE
    f.add(eye(pen, round(ex - 3 * k), round(ey - 3.5 * k), eye_kind, k=k))
    # the mouth line runs just inside the lower edge of the narrow snout
    f.add(mouth(pen, nx + 2 * k, round(tipy + 0.6 * k), mouth_kind, n=round(L * 0.4 * k)))
    bx, by = round(hx - rx * 0.05), round(hy + ry * 0.42)  # a hint of blush on the cheek
    for j in range(k + 1 if k > 1 else 1):
        for i in range(3 * k):
            f.px[pen.px(bx + i, by + j)] = FACE[1]


# ---------------------------------------------------------------------------------------------- sprite

def spine(lift=0):
    hx, hy = HIP
    ys = [hy + (TOP - hy) * i / 4 for i in range(5)]
    return [(hx - LEAN * i / 4, ys[i] - lift) for i in range(5)]


def draw(lift=0, head_dy=0, paws="curled", eye_kind="soft", mouth_kind="smile"):
    """One 64x80 frame, facing left.

    lift: body, head and hat this many px up, feet and tail planted. head_dy: extra head and hat offset
    (negative is up). paws: "curled" at the chest, "steeple" (fingertips together under the chin) or
    "tap" (the near paw 1px down and forward).
    """
    f = Fig(W, H)
    ground = Pen(W, H)
    body = Pen(W, H, dy=-lift)
    top = Pen(W, H, dy=-lift + head_dy)
    hipx, hipy = HIP
    fl, fb, fs = FUR
    ll, lb, ls = LIMB
    pl, pb, ps = PAW
    # tail: out from the rump along the ground, curling up at the end
    tail = [(hipx + 5, 72), (hipx + 13, 75.5), (hipx + 20, 75), (hipx + 24, 69), (hipx + 22, 63), (hipx + 18.5, 64)]
    f.add(cel(ground.stroke(tail, 3.6, 1.6), fb, fl, fs))
    f.add(flat(ground.blob(hipx + 2.5, GY - 1.5, 4.2, 1.6, 2.4), ls))  # far foot
    P = spine()
    sp = catmull(P)
    shx, shy = sp[int(len(sp) * 0.66)]
    shx -= RADII[2] * 0.35
    if paws == "curled":
        far_paw, near_paw = (shx - 6, shy + 1), (shx - 4, shy + 3.5)
    elif paws == "steeple":
        far_paw, near_paw = (shx - 6, shy - 4), (shx - 5, shy - 2)
    else:  # tap
        far_paw, near_paw = (shx - 6, shy - 4), (shx - 4, shy - 1)

    def arm(paw, far=False):
        mid = ((shx + paw[0]) / 2 + 1, (shy + paw[1]) / 2 + 2.5)
        m = body.stroke([(shx, shy), mid, paw], 2.2, 1.9)
        if far:
            f.add(cel(m, lb, None, ls))
            f.add(cel(body.ell(*paw, 2.2, 2.2), pb, None, ps))
        else:
            f.add(cel(m, lb, ll, ls), line=True)
            f.add(cel(body.ell(*paw, 2.2, 2.2), pb, pl, ps), line=True)

    arm(far_paw, far=True)
    bm = tube(body, P, RADII)
    f.add(cel(bm, fb, fl, fs, t=2))
    f.add(flat(tube(body, P[:4], RADII[:4], shift=0.45, scale=0.55) & bm, FACE[0]))  # belly
    f.add(cel(body.ell(hipx + 1, hipy + 1, 6.5, 5.5), fb, fl, fs), line=True)  # haunch
    f.add(cel(ground.blob(hipx - 4, GY - 1.5, 5, 1.6, 2.4), lb, ll, ls), line=True)  # near foot
    rx, ry, L = HEAD
    hx, hy = P[-1][0] - 3, P[-1][1] - ry * 0.55 + (1 if paws != "curled" else 0)
    head(f, top, hx, hy, rx, ry, L, eye_kind, mouth_kind)
    f.add(bow_tie(top, hx - rx * 0.15, hy + ry * 0.95, k=0.85), line=True)  # under the jaw
    arm(near_paw)
    crown, brim = hat(top, hx + 1, hy - ry + 1.5)
    f.add(crown, line=True, line_c=INK)
    f.add(brim, line=True, line_c=INK)
    return f.frame()


def ferret_tags():
    return [
        ("idle", [draw(), draw(lift=1)], 400),
        ("scheme", [draw(paws="steeple", eye_kind="pleased"), draw(paws="tap", eye_kind="pleased")], 160),
        ("talk", [draw(), draw(head_dy=-1, mouth_kind="open")], 150),
    ]


# ---------------------------------------------------------------------------------------------- portrait

def portrait(expr):
    """64x64 head, long neck and shoulders facing right, cut off by the bottom edge."""
    f = Fig(64, 64)
    pen = Pen(64, 64, mirror=True)
    fl, fb, fs = FUR
    neck = pen.stroke([(44, 46), (47, 56), (50, 66)], 8.5, 12)
    f.add(cel(neck, fb, fl, fs, t=2))
    f.add(flat(pen.stroke([(40, 48), (42, 58), (43, 66)], 4.5, 7) & neck, FACE[0]))
    rx, ry, L = HEAD
    k = 1.65
    hx, hy = 40, 40
    f.add(bow_tie(pen, 39, 55, k=1.3), line=True)
    head(f, pen, hx, hy, rx * k, ry * k, L * k * 0.9, dict(neutral="soft", smug="pleased", annoyed="pout")[expr],
         dict(neutral="smile", smug="smile", annoyed="pout")[expr], k=2)
    hk = min(1.6, (hy - ry * k + 1.5 - 1) / (HAT_SIZE[1] + 3))  # as large as fits above the head
    crown, brim = hat(pen, hx + 1, hy - ry * k + 1.5, k=hk)
    f.add(crown, line=True, line_c=INK)
    f.add(brim, line=True, line_c=INK)
    return f.frame()


def portrait_tags():
    return [(e, [portrait(e)], 1000) for e in ("neutral", "smug", "annoyed")]


# Tags that play once and hold their last frame; every other tag loops.
ONCE = {}


def sprites():
    yield "ferret", ferret_tags()
    yield "portrait-ferret", portrait_tags()


if __name__ == "__main__":
    pixel.main(sys.argv, sprites, SRC, __doc__, once=ONCE)
