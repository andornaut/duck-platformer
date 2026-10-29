#!/usr/bin/env python3
"""The map screen, drawn as a paper map: the paper and its frame, scattered pen marks, zone and fork markers, the
duck's marker and the fork-choice buttons. Paths and labels have no art: the game draws them by the rules below.

Usage, from the repository root:
  python3 -I art/tools/map.py build            write art/map/<key>.aseprite and public/art/sprites/<key>.png + .json,
                                               list them in the manifest
  python3 -I art/tools/map.py preview OUT.png  contact sheet of every frame on cream, tan and slate

A node's centre is (col * 12 + 6, row * 12 + 6) on the 60x30 grid of 12px tiles (cx, cy below). Every marker has an
odd frame with a centre pixel, so it is drawn with that pixel on the node's centre. Ink is dbrown (5.85:1 on cream),
the accent dred (5.07:1), unbuilt slate (3.8:1); the pen marks are tan (1.45:1), below the 3:1 of anything that
carries meaning. Every state differs in shape as well as colour.

Paper
- map-paper, nine-slice 32x32, margins 13,13,13,13, drawn 720x360 at 0,0: cream, with a 2px brown rule 6px in from
  each edge and a 2px tan rule 11px in. One tag, rest.
- Pen marks, tan, one tag rest each, placed by the map's data at a top-left in base pixels, at least a tile clear of
  every node, path and label: map-hill (20x11, one hill), map-wave (22x4, one wave) and map-compass (25x33, a
  four-point star under an N, for a corner). The data places them because the node layout varies with the map.

Zone marker: map-zone, 35x35, centre pixel 17,17 (top-left cx-17, cy-17). A 25px disc (radius 12).
- normal: a cream disc in a 2px dbrown ring.
- current: normal inside a second 2px dred ring of radius 17.
- visited: a solid dbrown disc, and a tick badge (a 13px cream disc ringed in dbrown with a dbrown tick) at its
  lower right, centre 27,26.
- unbuilt: a cream disc in a slate ring broken into eight dashes, with a slate question mark; no icon.
Zone icon: map-icon-<zone>, 14x14, top-left cx-7, cy-7, over every state but unbuilt. Tags normal (dbrown, for the
normal and current markers) and visited (cream, on the solid disc). map-icon-street is a brownstone (windows and a
door); map-icon-zone, a map pin, stands in for any zone without its own icon. A new zone needs only a new icon.

Fork marker: map-fork, 29x29, centre pixel 14,14 (top-left cx-14, cy-14). A 17px diamond (radius 8).
- normal: a dbrown diamond with a cream centre (radius 5).  current: normal inside a 2px dred ring of radius 14.
- visited: a solid dbrown diamond.  unbuilt: four slate 5px diamonds at the corners, no outline between them.

map-duck, 26x22: her idle frame redrawn at half size (cream body with a tan crescent and white rim, a round head set
up above the back, a 2x2 ink eye, a 3x3 orange bill, a tan wing patch, orange foot stubs, dark-slate outline),
facing right. Tag idle, 2 x 400ms: frame 1 lifts everything but the feet 1px. She stands on the current node: top-left
(cx-13, cy-39) on a zone, (cx-13, cy-36) on a fork, her outline's bottom row on the current ring's top row.

Fork choice (in place of Continue while she stands at a fork)
- ui-fork-choice, 160x36, hit 160x44 from 4px above. Like ui-answer: tags normal (dslate), selected (cream, an ink
  cursor at 7..13) and pressed (tan with the cursor). Buttons sit 8 apart centred on x 360, art at y 304 (hit y
  300): two at x 196 and 364. Label (the zone's name) in font-body at 2x, origin x+19, y+9, cream when normal and ink
  otherwise, at most 112 wide.
- ui-fork-arrow, 14x14, at x+140, y+11: the direction the path leaves the fork, cream with an ink outline so it reads
  on every face. Tags up (up and right), level (right), down (down and right): up when the next node's row is above
  the fork's, down when below.
Continue is ui-resume, 160x44, at 280,300 (the hit area), label "Continue" ink, origin 339,311 (339,313 pressed).

Paths, drawn by the game from node centre to node centre, as a gentle curve: a quadratic Bezier whose control point
is the chord's midpoint pushed sideways by 8% of the chord's length, to the left of travel for even edge indices and
to the right for odd ones. Trim each end 3px outside the marker (15px from a zone's centre, 11px from a fork's). Stamp
a w x w square every 0.5px along the curve, its top-left at (floor(x - w/2 + 0.5), floor(y - w/2 + 0.5)). A dash
pattern (on, off) counts the stamps' centres along the curve from the start, so a dash shows on + w long and a gap
off - w.
- built: w 2, dbrown, dashes 6 on, 4 off (8px dashes, 2px gaps).        travelled: w 4, dred, solid.
- unbuilt: 2x2 slate dots, n = floor(length / 6) + 1 of them spaced length / (n - 1) apart, the first and last on the
  trimmed ends.
- At a fork, each built path she can take: built, plus a dbrown arrowhead at 55% of its length (tip 7px ahead of
  that point along the curve, the two back corners 6.5px away at 137 degrees either side). The selected one: w 4,
  dred, dashes 6 on, 8 off (10px dashes, 4px gaps), with a dred arrowhead 8.4px tip, 7.8px back corners.

Labels: a zone's name in font-title at 2x, plum (9.4:1 on cream), centred under its marker. A is its advance width at
2x; its ink is A - 4 wide, starting 2px right of the origin, capitals on origin rows +8..+17. Origin
(cx - floor((A - 4) / 2) - 2, cy + 12), so the capitals sit on rows cy+20..cy+29. Under it the game fills a cream
knock-out (ox - 2, cy + 17, A + 4, 16) after the paths and before the markers, so a path never runs through a name.
A fork has no label.
"""

import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixel  # noqa: E402
from pixel import Grid  # noqa: E402
from ui import panel, tri_right  # noqa: E402

SRC = "art/map"


def bm(*rows):
    """A bitmap from strings: '#' is set."""
    return [(x, y) for y, r in enumerate(rows) for x, ch in enumerate(r) if ch == "#"]


def stamp(g, pts, x, y, c):
    for px, py in pts:
        g.p(x + px, y + py, c)


def disc(g, cx, cy, r, c):
    """A filled disc on a centre pixel, 2r+1 across."""
    for y in range(-r, r + 1):
        for x in range(-r, r + 1):
            if x * x + y * y <= r * r + r * 0.6:
                g.p(cx + x, cy + y, c)


def ring(g, cx, cy, r, w, c, broken=False):
    """A ring w px thick whose outer edge is radius r; broken leaves eight gaps, one every 45 degrees."""
    for y in range(-r - 1, r + 2):
        for x in range(-r - 1, r + 2):
            if r - w + 0.5 < math.hypot(x, y) <= r + 0.5:
                if broken and (math.degrees(math.atan2(y, x)) + 360) % 45 > 30:
                    continue
                g.p(cx + x, cy + y, c)


def diamond(g, cx, cy, r, c):
    for y in range(-r, r + 1):
        for x in range(-r, r + 1):
            if abs(x) + abs(y) <= r:
                g.p(cx + x, cy + y, c)


# ---------------------------------------------------------------- paper

def paper():
    """32x32 nine-slice: cream, a 2px brown rule 6px in and a 2px tan rule 11px in."""
    g = Grid(32, 32)
    g.rect(0, 0, 32, 32, "cream")
    for inset, c in ((6, "brown"), (11, "tan")):
        n = 32 - 2 * inset
        g.rect(inset, inset, n, 2, c)
        g.rect(inset, 32 - inset - 2, n, 2, c)
        g.rect(inset, inset, 2, n, c)
        g.rect(32 - inset - 2, inset, 2, n, c)
    g.rect(13, 13, 6, 6, "cream")
    return g.px


def hill():
    """20x11: a hill's outline, a 2px stroke stepping 2px per 2px."""
    g = Grid(20, 11)
    for i in range(10):
        g.rect(i * 2, int(abs(i - 4.5) * 2), 2, 2, "tan")
    return g.px


def wave():
    """22x4: three 2px humps."""
    g = Grid(22, 4)
    for i, dy in enumerate((2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0)):
        g.rect(i * 2, dy, 2, 2, "tan")
    return g.px


def compass():
    """25x33: an N over a four-point star, arms tapering from 3px to 1px."""
    g = Grid(25, 33)
    stamp(g, bm("##..##", "###.##", "######", "##.###", "##..##"), 9, 0, "tan")
    cx, cy = 12, 20
    for k in range(13):
        w = 3 if k < 4 else 2 if k < 9 else 1
        for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0)):
            x, y = cx + dx * k, cy + dy * k
            if dx == 0:
                g.rect(x - w // 2, y, w, 1, "tan")
            else:
                g.rect(x, y - w // 2, 1, w, "tan")
    diamond(g, cx, cy, 3, "tan")
    return g.px


# ---------------------------------------------------------------- icons, 14x14, 2px strokes

ICONS = {
    "street": ("##############", "##############", "##..........##", "##..##..##..##", "##..##..##..##",
               "##..........##", "##..##..##..##", "##..##..##..##", "##..........##", "##...####...##",
               "##...####...##", "##...####...##", "##############", "##############"),
    # a map pin: a ring on a point
    "zone": ("....######....", "...########...", "..###....###..", "..##......##..", "..##......##..",
             "..##......##..", "..###....###..", "...########...", "....######....", ".....####.....",
             ".....####.....", "......##......", "......##......", ".............."),
}
QMARK = bm("..####..", ".##..##.", ".....##.", "....##..", "...##...", "...##...", "........", "...##...",
           "...##...")
TICK = bm("....##", "...##.", "##.##.", ".###..", "..#...")


def icon(rows, c):
    g = Grid(14, 14)
    stamp(g, bm(*rows), 0, 0, c)
    return g.px


# ---------------------------------------------------------------- markers

def zone(state):
    g = Grid(35, 35)
    c = 17
    if state == "unbuilt":
        disc(g, c, c, 12, "cream")
        ring(g, c, c, 12, 2, "slate", broken=True)
        stamp(g, QMARK, c - 4, c - 4, "slate")
        return g.px
    if state == "current":
        ring(g, c, c, 17, 2, "dred")
    if state == "visited":
        disc(g, c, c, 12, "dbrown")
        disc(g, 27, 26, 6, "cream")
        ring(g, 27, 26, 6, 2, "dbrown")
        stamp(g, TICK, 24, 24, "dbrown")
        return g.px
    disc(g, c, c, 12, "cream")
    ring(g, c, c, 12, 2, "dbrown")
    return g.px


def fork(state):
    g = Grid(29, 29)
    c = 14
    if state == "unbuilt":
        for dx, dy in ((0, -7), (0, 7), (-7, 0), (7, 0)):
            diamond(g, c + dx, c + dy, 2, "slate")
        return g.px
    if state == "current":
        ring(g, c, c, 14, 2, "dred")
    diamond(g, c, c, 8, "dbrown")
    if state != "visited":
        diamond(g, c, c, 5, "cream")
    return g.px


def duck(frame):
    """26x22, facing right; frame 1 lifts everything but the feet 1px."""
    up = frame
    g = Grid(26, 22)
    g.ell(10.5, 13.5 - up, 9.5, 6.5, "cream", sh="tan", li="white")
    g.tri((1.5, 9 - up), (6, 10 - up), (3, 13 - up), "cream")
    g.ell(16.5, 6.5 - up, 5, 5, "cream", li="white")
    g.rect(21, 6 - up, 3, 3, "orange")
    g.rect(17, 5 - up, 2, 2, "ink")
    g.ell(8.5, 12.5 - up, 5, 2, "tan")
    g.rect(7, 20, 3, 1, "orange")
    g.rect(12, 20, 3, 1, "orange")
    return g.outlined(edge=lambda c: pixel.K["dslate"])


# ---------------------------------------------------------------- fork choice

def fork_choice(state):
    """160x36, as ui-answer: text from x 19, the cursor at 7..13."""
    g = Grid(160, 36)
    if state == "normal":
        panel(g, 0, 0, 160, 36, "dslate", rim=("slate", "navy"))
    else:
        fill = "cream" if state == "selected" else "tan"
        rim = ("white", "tan") if state == "selected" else ("brown", "cream")
        panel(g, 0, 0, 160, 36, fill, rim=rim)
        tri_right(g, 7, 11, 14, "ink")
    return g.px


def fork_arrow(direction):
    """14x14: a 2px arrow, cream inside a 1px ink outline, pointing right, up-right or down-right."""
    g = Grid(14, 14)
    if direction == "level":
        g.rect(1, 6, 7, 2, "cream")
        for i in range(6):
            g.rect(7 + i, 1 + i, 1, 12 - 2 * i, "cream")
    else:
        for i in range(9):
            g.rect(2 + i, 10 - i, 2, 2, "cream")
        g.rect(5, 2, 7, 2, "cream")
        g.rect(10, 2, 2, 7, "cream")
        if direction == "down":
            g.px = g.px[::-1]
    return g.outlined(edge=lambda c: pixel.K["ink"])


# ---------------------------------------------------------------- the set

SLICES = {"map-paper": (13, 13, 13, 13)}
ONCE = {}


def sprites():
    one = lambda frame, tag="rest": [(tag, [frame], 100)]  # noqa: E731
    yield "map-compass", one(compass())
    yield "map-duck", [("idle", [duck(0), duck(1)], 400)]
    yield "map-fork", [(s, [fork(s)], 100) for s in ("normal", "current", "visited", "unbuilt")]
    yield "map-hill", one(hill())
    for key in sorted(ICONS):
        yield f"map-icon-{key}", [("normal", [icon(ICONS[key], "dbrown")], 100),
                                  ("visited", [icon(ICONS[key], "cream")], 100)]
    yield "map-paper", one(paper())
    yield "map-wave", one(wave())
    yield "map-zone", [(s, [zone(s)], 100) for s in ("normal", "current", "visited", "unbuilt")]
    yield "ui-fork-arrow", [(d, [fork_arrow(d)], 100) for d in ("up", "level", "down")]
    yield "ui-fork-choice", [(s, [fork_choice(s)], 100) for s in ("normal", "selected", "pressed")]


if __name__ == "__main__":
    pixel.main(sys.argv, sprites, SRC, __doc__, grounds=("ead4aa", "e4a672", "5a6988"), slices=SLICES, once=ONCE)
