#!/usr/bin/env python3
"""UI art: the dialogue box, choices, quip strip, touch controls and settings card, at the 640x360 base resolution.

Usage:
  ui.py build             write art/ui/<key>.aseprite and public/art/sprites/<key>.png + .json, list them in the
                          manifest
  ui.py preview OUT.png   a contact sheet of every frame

Run from the repository root. Text is never baked in: the game sets it with font-body or font-title at 2x. A text
origin below is a BitmapText's top-left at scale 2, and A is the text's advance width at 2x (the sum of xadvance,
doubled). Positions are in base pixels, top-left of the frame, matching the layout in art/README.md.

Nine-slice textures carry their margins (left, top, right, bottom) as an Aseprite slice named after the key and as
"slice" in the manifest entry. Single-state art has one tag, "rest", at 100ms. The touch rings' press tags
(press, press-left, press-right) play once and hold their last frame (the manifest's "once") until the game
shows the held tag; every other tag loops.

Dialogue
- ui-dialogue-box, 624x96, at 8,256. Navy, ink border with cut corners, slate rim top-left, dslate bottom-right.
  Body text cream, origin 96,268, lines every 20.
- ui-portrait-frame, 68x68, at 16,270. Recessed dslate well; the 64px portrait goes at 18,272.
- ui-name-tab, nine-slice 12x20, margins 2,2,2,2; tags amber, green, pink, tan (the fill; one per speaker). Drawn
  A+12 wide at 92,237, so its bottom row lies on the box's top border. Name ink, origin x+6, y 234.
- ui-forward-mark, 10x14, at 605,323 (centred in the 588,308,44,44 hit area). Tag idle: the triangle steps right
  0, 2, 3, 2px over 1800, 80, 160, 80ms. Reduced motion shows frame 0.
- ui-skip, 78x20, at 554,8 (hit 554,8,78,44). Tags normal, pressed (dslate, rim inverted), disabled (flat, no
  rim, the double chevron becomes a bar). Label SKIP origin 563,5: cream, or grey when disabled.
- ui-answer, 204x36, hit 204x44 from row top y 192, so the art sits at y 196. Three at x 8, 218, 428; two at
  x 113, 323. Tags normal (dslate), selected (cream with an ink cursor), pressed (tan with the cursor). Text origin
  x+19, y 205, at most 162 wide: cream when normal, ink otherwise.

Quip
- ui-quip-strip, nine-slice 12x24, margins 2,2,2,2. Drawn An+Ab+24 wide (An the name, Ab the line), at most 452,
  centred at y 8. Name in font-title in the speaker's tab colour, origin x+9, y 7; line cream in font-body, origin
  x+15+An, y 11.

Touch controls (dashed rings, light ink with a 1px ink fringe; white while pressed)
- ui-touch-move, 77x67, centre pixel 38,33, so the top-left is 34,267 for the centre 72,300. Rest mark 61x55: a
  dashed ring of radius 26, open at 3 and 9 o'clock for two chevrons. Tags rest; press-left and press-right (frame 0
  the pressed half turns solid and swells to radius 28 with its chevron 2px out, frame 1 a dashed ripple at radius
  32 and a doubled chevron, 60ms each); held-left and held-right (the solid half and the doubled chevron).
- ui-touch-knob, 11x11, centre pixel 5,5: top-left 67+d,295, d the knob offset capped at 12. Tags rest (hollow),
  held (solid white).
- ui-touch-jump, 51x51, centre pixel 25,25: top-left 575,279. Rest mark 39x39 (radius 18) with a caret. Tags rest;
  press (frame 0 solid, radius 20, caret 2px up; frame 1 solid, ripple at radius 24; 60ms each); held (solid).
- ui-touch-interact, 43x43, centre pixel 21,21: top-left 507,247. Rest mark 31x31 (radius 14) with three dots.
  Tags rest, press and held as for jump, without the caret's lift.

Settings (a pause card over the game dimmed two ramp steps)
- ui-settings-card, nine-slice 16x48, margins 2,38,2,2: a cream border with cut corners, an ink header 36 high and
  a navy body. Drawn 368x184 at 136,88. Title SETTINGS cream, origin 150,93.
- ui-close, 24x24, at 470,94 (hit 460,88,44,44). Tags normal (cream X), pressed (white X on dslate).
- ui-settings-row, nine-slice 12x48, margins 2,2,2,2, dslate. Drawn 352x48 at 144,136; the whole row is the hit
  area. Label "Touch controls" cream, origin 188,151; state Shown or Hidden cream, its last glyph ending at x 484
  (origin 486-A).
- ui-checkbox, 20x20, at 156,150. Tags off (empty box), on (a green tick).
- ui-resume, 160x44, at 240,212 (the hit area). Tags normal, pressed (the face sinks 2px into its lip). A play
  triangle is drawn in; label Resume ink, origin 299,223, or 299,225 when pressed.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixel  # noqa: E402
from pixel import K, Grid, darker  # noqa: E402

SRC = "art/ui"
INK, NAVY, CREAM, WHITE = K["ink"], K["navy"], K["cream"], K["white"]

# Name tab fills, one tag each: hues the panels do not use. Ink text holds at least 6.6:1 on each, and each
# holds at least 5:1 as text on the navy panels, so the quip strip sets the speaker's name in the same colour.
TAB_FILLS = ("amber", "green", "pink", "tan")


def bm(*rows):
    """A bitmap from strings: '#' is set."""
    return [(x, y) for y, r in enumerate(rows) for x, ch in enumerate(r) if ch == "#"]


def mirror(pts):
    """A bitmap flipped left to right within its own width."""
    w = max(x for x, _ in pts)
    return [(w - x, y) for x, y in pts]


def stamp(g, pts, x, y, c):
    for px, py in pts:
        g.p(x + px, y + py, c)


def panel(g, x, y, w, h, fill, rim=("slate", "dslate"), border="ink"):
    """A box: a 1px border with cut corners, and a 1px rim inside it (the first colour on the top and left, the
    second on the bottom and right)."""
    g.rect(x, y, w, h, border)
    for cx, cy in ((x, y), (x + w - 1, y), (x, y + h - 1), (x + w - 1, y + h - 1)):
        g.p(cx, cy, None)
    g.rect(x + 1, y + 1, w - 2, h - 2, fill)
    if rim:
        lt, rb = rim
        if lt:
            g.rect(x + 1, y + 1, w - 2, 1, lt)
            g.rect(x + 1, y + 1, 1, h - 2, lt)
        if rb:
            g.rect(x + 1, y + h - 2, w - 2, 1, rb)
            g.rect(x + w - 2, y + 2, 1, h - 3, rb)


def tri_right(g, x, y, h, c):
    """A right-pointing triangle h tall (even), stepping 1px per column: h/2 wide."""
    for i in range(h // 2):
        g.rect(x + i, y + i, 1, h - 2 * i, c)


# ---------------------------------------------------------------- dialogue

def dialogue_box():
    g = Grid(624, 96)
    panel(g, 0, 0, 624, 96, "navy")
    return g.px


def portrait_frame():
    """Recessed: the shade on the top and left, the light on the bottom and right."""
    g = Grid(68, 68)
    panel(g, 0, 0, 68, 68, "dslate", rim=("navy", "slate"))
    return g.px


def name_tab(fill):
    g = Grid(12, 20)
    panel(g, 0, 0, 12, 20, fill, rim=(None, darker(fill)))
    return g.px


FORWARD_STEPS = ((0, 1800), (2, 80), (3, 160), (2, 80))  # (x offset, ms)


def forward_mark():
    frames = []
    for dx, _ in FORWARD_STEPS:
        g = Grid(10, 14)
        tri_right(g, dx, 0, 14, "cream")
        frames.append(g.px)
    return frames


def skip(state):
    """78x20. Label glyphs at 11..48, the double chevron at 55..66."""
    g = Grid(78, 20)
    if state == "disabled":
        panel(g, 0, 0, 78, 20, "navy", rim=None)
        g.rect(55, 9, 12, 2, "grey")
    else:
        rim = ("slate", "dslate") if state == "normal" else ("ink", "slate")
        panel(g, 0, 0, 78, 20, "navy" if state == "normal" else "dslate", rim=rim)
        for x in (55, 62):
            tri_right(g, x, 5, 10, "cream")
    return g.px


def answer(state):
    """204x36. Text from x 19; the cursor at 7..13."""
    g = Grid(204, 36)
    if state == "normal":
        panel(g, 0, 0, 204, 36, "dslate", rim=("slate", "navy"))
    else:
        fill = "cream" if state == "selected" else "tan"
        rim = ("white", "tan") if state == "selected" else ("brown", "cream")
        panel(g, 0, 0, 204, 36, fill, rim=rim)
        tri_right(g, 7, 11, 14, "ink")
    return g.px


def quip_strip():
    g = Grid(12, 24)
    panel(g, 0, 0, 12, 24, "navy")
    return g.px


# ---------------------------------------------------------------- touch controls

RING = dict(interact=14, jump=18, move=26)
DASH = 4
SWELL, RIPPLE = 2, 6
DEAD, KNOB_TRAVEL = 6, 12

CHEV = bm("....##", "...##.", "..##..", ".##...", "##....", ".##...", "..##..", "...##.", "....##")  # 6x9, left
CHEV2 = bm("....##..##", "...##..##.", "..##..##..", ".##..##...", "##..##....", ".##..##...", "..##..##..",
           "...##..##.", "....##..##")  # 10x9, left, doubled
CARET = [(x, y) for y in range(9) for x in (8 - y, 9 - y, 7 + y, 8 + y)]  # 17x9, 2px strokes
DOT = bm(".###.", "#####", "#####", "#####", ".###.")
DOTS = [(x + i * 7, y) for i in range(3) for x, y in DOT]  # 19x5
KNOB_HOLLOW = bm("..#####..", ".#######.", "###...###", "##.....##", "##.....##", "##.....##", "###...###",
                 ".#######.", "..#####..")  # 9x9
KNOB_SOLID = bm("..#####..", ".#######.", "#########", "#########", "#########", "#########", "#########",
                ".#######.", "..#####..")


def circle(r):
    """Midpoint circle offsets, no duplicates."""
    pts, x, y, d = set(), r, 0, 1 - r
    while x >= y:
        for a, b in ((x, y), (y, x), (-y, x), (-x, y), (-x, -y), (-y, -x), (y, -x), (x, -y)):
            pts.add((a, b))
        y += 1
        if d < 0:
            d += 2 * y + 1
        else:
            x -= 1
            d += 2 * (y - x) + 1
    return pts


class Layer:
    """Light ink pixels around a centre (0, 0); frame() adds the 1px ink fringe and rasterises."""

    def __init__(self):
        self.px = {}

    def put(self, x, y, c):
        self.px[(x, y)] = c

    def icon(self, pts, cx, cy, c):
        """A bitmap centred on cx, cy (an even size sits half a pixel left or up)."""
        w = max(x for x, _ in pts) + 1
        h = max(y for _, y in pts) + 1
        for x, y in pts:
            self.put(cx - w // 2 + x, cy - h // 2 + y, c)

    def ring(self, r, c, dash=None, arc=None, gap=None):
        """A 1px ring. dash: dashes and gaps alternate by angle, a multiple of 4 so both axes are symmetric.
        arc: +1 keeps the right half, -1 the left. gap: (half height, from |x|) left open for the chevrons."""
        n = 4 * max(1, round(2 * math.pi * r / (4 * dash))) if dash else None
        for dx, dy in circle(r):
            a = math.degrees(math.atan2(dy, dx)) % 360
            if n and int(((a + 180 / n) % 360) // (360 / n)) % 2:
                continue
            if arc and dx * arc <= 0:
                continue
            if gap and abs(dy) <= gap[0] and abs(dx) >= gap[1]:
                continue
            self.put(dx, dy, c)
        if dash or gap:
            self.prune(c)

    def prune(self, c):
        """Drop dash fragments of a single pixel (8-connected) in colour c."""
        for (x, y) in [p for p, col in self.px.items() if col == c]:
            if not any(self.px.get((x + i, y + j)) == c for i in (-1, 0, 1) for j in (-1, 0, 1) if i or j):
                del self.px[(x, y)]

    def fringe(self):
        f = set()
        for (x, y) in self.px:
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                if (x + dx, y + dy) not in self.px:
                    f.add((x + dx, y + dy))
        return f

    def extent(self):
        pts = set(self.px) | self.fringe()
        return max(abs(x) for x, _ in pts), max(abs(y) for _, y in pts)

    def frame(self, ex, ey):
        g = Grid(2 * ex + 1, 2 * ey + 1)
        for x, y in self.fringe():
            g.p(ex + x, ey + y, INK)
        for (x, y), c in self.px.items():
            g.p(ex + x, ey + y, c)
        return g.px


def button_control(key, icon, state, frame=None):
    """Interact or jump: a dashed ring at rest; pressed, frame 0 swells, frame 1 ripples, then a solid ring holds."""
    r = RING[key]
    L = Layer()
    if state == "rest":
        L.ring(r, CREAM, dash=DASH)
        L.icon(icon, 0, 0, CREAM)
    else:
        L.ring(r + (SWELL if frame == 0 else 0), WHITE)
        if frame == 1:
            L.ring(r + RIPPLE, WHITE, dash=DASH)
        L.icon(icon, 0, -2 if (key == "jump" and frame == 0) else 0, WHITE)
    return L


def move_control(side=None, frame=None):
    """The move ring: dashed, open at 3 and 9 o'clock for the chevrons. side (-1 left, 1 right) is pressed."""
    r = RING["move"]
    gap = (8, 20)
    L = Layer()
    L.ring(r, CREAM, dash=DASH, gap=gap)
    if side:
        for (x, y) in [p for p in L.px if p[0] * side > 0]:
            del L.px[(x, y)]
        L.ring(r + (SWELL if frame == 0 else 0), WHITE, arc=side, gap=gap)
        if frame == 1:
            L.ring(r + RIPPLE, WHITE, dash=DASH, arc=side, gap=gap)
    for s in (-1, 1):
        if s == side and frame != 0:
            pts = CHEV2 if s < 0 else mirror(CHEV2)
            L.icon(pts, s * (r + RIPPLE) + (1 if s > 0 else 0), 0, WHITE)
        else:
            pts = CHEV if s < 0 else mirror(CHEV)
            out = SWELL if s == side else 0
            L.icon(pts, s * (r + out) + (1 if s > 0 else 0), 0, WHITE if s == side else CREAM)
    return L


def control_tags(layers):
    """[(tag, [Layer], ms)] -> tags with every frame on one canvas centred on the control's centre pixel."""
    ex = max(L.extent()[0] for _, ls, _ in layers for L in ls)
    ey = max(L.extent()[1] for _, ls, _ in layers for L in ls)
    return [(tag, [L.frame(ex, ey) for L in ls], ms) for tag, ls, ms in layers]


def touch_button(key, icon):
    return control_tags([
        ("rest", [button_control(key, icon, "rest")], 100),
        ("press", [button_control(key, icon, "press", 0), button_control(key, icon, "press", 1)], 60),
        ("held", [button_control(key, icon, "press", 2)], 100),
    ])


def touch_move():
    return control_tags([
        ("rest", [move_control()], 100),
        ("press-left", [move_control(-1, 0), move_control(-1, 1)], 60),
        ("held-left", [move_control(-1, 2)], 100),
        ("press-right", [move_control(1, 0), move_control(1, 1)], 60),
        ("held-right", [move_control(1, 2)], 100),
    ])


def touch_knob():
    tags = []
    for tag, pts, c in (("rest", KNOB_HOLLOW, CREAM), ("held", KNOB_SOLID, WHITE)):
        L = Layer()
        L.icon(pts, 0, 0, c)
        tags.append((tag, [L], 100))
    return control_tags(tags)


# ---------------------------------------------------------------- settings

def settings_card():
    g = Grid(16, 48)
    panel(g, 0, 0, 16, 48, "navy", rim=None, border="cream")
    g.rect(1, 1, 14, 36, "ink")
    return g.px


def settings_row():
    g = Grid(12, 48)
    panel(g, 0, 0, 12, 48, "dslate", rim=None, border="dslate")
    return g.px


TICK = [(4 + i, 8 + i) for i in range(4)] + [(7 + i, 11 - i) for i in range(1, 8)]  # 2x2 stamps: a 3px stroke


def checkbox(on):
    g = Grid(20, 20)
    g.rect(0, 0, 20, 20, "cream")
    g.rect(2, 2, 16, 16, "ink")
    if on:
        for x, y in TICK:
            g.rect(x, y, 2, 2, "green")
    return g.px


def resume(state):
    """160x44: an ink border, a green face and a dark green lip 4px deep; pressed, the face sinks 2px into it."""
    top = 0 if state == "normal" else 2
    g = Grid(160, 44)
    panel(g, 0, top, 160, 44 - top, "dgreen", rim=None)
    g.rect(1, top + 1, 158, 38, "green")
    tri_right(g, 48, top + 15, 10, "ink")
    return g.px


X = [(i, i) for i in range(12)] + [(i + 1, i) for i in range(11)] + [(11 - i, i) for i in range(12)] + \
    [(10 - i, i) for i in range(11)]


def close(state):
    g = Grid(24, 24)
    if state == "pressed":
        panel(g, 0, 0, 24, 24, "dslate", rim=None, border="dslate")
    stamp(g, X, 6, 6, "white" if state == "pressed" else "cream")
    return g.px


# ---------------------------------------------------------------- the set

SLICES = {
    "ui-name-tab": (2, 2, 2, 2),
    "ui-quip-strip": (2, 2, 2, 2),
    "ui-settings-card": (2, 38, 2, 2),
    "ui-settings-row": (2, 2, 2, 2),
}


# Tags that play once and hold their last frame; every other tag loops.
ONCE = {
    "ui-touch-interact": ("press",),
    "ui-touch-jump": ("press",),
    "ui-touch-move": ("press-left", "press-right"),
}


def sprites():
    one = lambda frame, tag="rest": [(tag, [frame], 100)]  # noqa: E731
    yield "ui-answer", [(s, [answer(s)], 100) for s in ("normal", "selected", "pressed")]
    yield "ui-checkbox", [("off", [checkbox(False)], 100), ("on", [checkbox(True)], 100)]
    yield "ui-close", [(s, [close(s)], 100) for s in ("normal", "pressed")]
    yield "ui-dialogue-box", one(dialogue_box())
    yield "ui-forward-mark", [("idle", forward_mark(), [ms for _, ms in FORWARD_STEPS])]
    yield "ui-name-tab", [(c, [name_tab(c)], 100) for c in TAB_FILLS]
    yield "ui-portrait-frame", one(portrait_frame())
    yield "ui-quip-strip", one(quip_strip())
    yield "ui-resume", [(s, [resume(s)], 100) for s in ("normal", "pressed")]
    yield "ui-settings-card", one(settings_card())
    yield "ui-settings-row", one(settings_row())
    yield "ui-skip", [(s, [skip(s)], 100) for s in ("normal", "pressed", "disabled")]
    yield "ui-touch-interact", touch_button("interact", DOTS)
    yield "ui-touch-jump", touch_button("jump", CARET)
    yield "ui-touch-knob", touch_knob()
    yield "ui-touch-move", touch_move()


if __name__ == "__main__":
    pixel.main(sys.argv, sprites, SRC, __doc__, slices=SLICES, once=ONCE)
