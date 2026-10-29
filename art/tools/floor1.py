#!/usr/bin/env python3
"""Floor 1 art: the hotel's New York street front (brick and brownstone, a day scene) and the hotel lobby, as 12px
tilesets and modular backdrop pieces that the game places from level data. Nothing here is a fixed panorama.

Usage:
  floor1.py build             write public/art/tilesets/<key>.png + .json and public/art/backdrops/<key>.png, and
                              list them in the manifest under "tilesets" and "backdrops"
  floor1.py preview OUT.png   an example 2-screen street ending at the hotel door (720x360 per screen) above an
                              example lobby (720x720, two screens tall) and both tilesets at 4x, composed from the
                              pieces with the duck, the ferret and the touch buttons

Run from the repository root.

Scale
- Outdoors the world is drawn as if zoomed out 4x while the duck and the 12px tiles keep their size: a storey is
  180px (the ground storey runs from y 132 to the sidewalk line, y 312) and a door is about 45px, so the duck
  (42px) stands almost as tall as a street door. Indoors (the lobby) is a separate scene at full scale.

Tilesets
- A tileset is one PNG of 12x12 tiles in rows of COLUMNS (8), no spacing or margin, transparent where a tile has no
  art, and a JSON beside it:
    {"tileSize": 12, "columns": 8,
     "tiles": {"<name>": <index>, ...},                  index = row * columns + column, every tile named
     "pieces": {"<name>": [[<index>, ...], ...]}}        multi-tile pieces as rows of indices, top row first
  Names are kebab-case. A tile whose name starts with "one-way-" is a one-way ledge: it stops a fall onto its top
  edge and nothing else. A tile whose name starts with "door-" or "exit-" is a doorway: it has no collision, and
  the game puts a Use zone over its piece. A tile whose name starts with "pit-" is a pit: it has no collision, so
  she falls through it and out of the level. Every other tile with art is solid on all sides.
- The manifest lists each as {"key": "<key>", "png": "tilesets/<key>.png", "json": "tilesets/<key>.json"}.
- Walkable surfaces: the walkable edge is the tile's top row. A surface tile has a 1px edge, a 2px light lip and
  a 2px darker underside; the face tiles below it are plainer and darker.

tiles-street
- sidewalk-top, sidewalk-top-joint (a 2px slab joint at the right edge; alternate them, 24px rhythm),
  sidewalk-top-left, sidewalk-top-right (plain ends, over a drop), kerb-left, kerb-right (a cream stone kerb where
  the sidewalk meets a cross street, one tile above the road), sidewalk-face, sidewalk-face-left,
  sidewalk-face-right: warm stone.
- road-top, road: asphalt, one tile below the sidewalk.
- one-way-awning-left, one-way-awning, one-way-awning-right: a green-and-cream shop awning seen front-on, 4px
  stripes and a scalloped hem, art in the top 11 rows. Lay them on row 20 (y 240), 6 tiles above the sidewalk,
  across a shopfront under its sign.
- one-way-canopy-left, one-way-canopy, one-way-canopy-right: the hotel's forest-green canopy, the same shape,
  laid on row 20 over the hotel door.
- planter-top-left, planter-top, planter-top-right (a clipped hedge: the walkable top), planter-left, planter,
  planter-right (the box). A planter is 2 tiles tall: a 2-tile step.
- door (piece, 3x4 tiles, 36x48): the hotel's front door, a pair of lit amber glass doors in a tan frame. Tiles
  door-0 to door-11 in row order. Use at the door enters the lobby, a separate scene, after a fade.
- The cellar hatch, a hazard: an open pit in the sidewalk, any number of tiles wide, its two steel leaves standing
  up. On the sidewalk row: hatch-left, then pit-opening for each opening tile, then hatch-right. pit-opening fills
  every row below the opening to the level's bottom, and sidewalk-face-right and sidewalk-face-left run down under
  the two edges. pit-leaf-left-top over pit-leaf-left stand on the two rows above hatch-left, pit-leaf-right-top
  over pit-leaf-right above hatch-right. hatch-left and hatch-right are solid sidewalk ends capped by a steel angle
  iron; pit-opening is the dark drop (ink); the leaves are slate plates with dslate studs, 20px tall, leaning
  outwards, with no collision. Steel is the slate ramp (slate, dslate, navy), no grey. Tiles 35 to 41, after the
  door, so every earlier index holds.

tiles-lobby (the boutique lobby: wood, books and plants, at indoor scale)
- Every walkable top, the floor and each one-way ledge, has the same 2px cream lip under a 1px plum edge, so the
  standable edges are the brightest lines in the room, in colour and in greyscale.
- floor-top, floor-top-joint (a 2px board end at the right edge; alternate them, 24px rhythm), floor-top-left,
  floor-top-right, floor-face, floor-face-left, floor-face-right: brown boards over a dark-brown face. The lobby
  floor line is y 672 (row 56) in a level 720px (60 tiles) tall.
- One-way ledges, each a 7px slab (left, middle, right): one-way-balcony-* (the mezzanine's front edge),
  one-way-shelf-* (bookcase boards, with brackets on the end tiles), one-way-cushion-* (the sofa's seat and back),
  one-way-desk-* (the reception desk's top).
- post-cap-left/right, post-left/right, post-base-left/right: a wood post 2 tiles wide, solid, for the room's
  ends.
- exit (piece, 7x15 tiles, 84x180, a door at indoor scale): the stairwell to the next floor, an opening with
  stairs rising to the right under a white up-arrow on a green sign. Tiles exit-0 to exit-104 in row order; a
  Use zone, no collision.

Backdrops
- One PNG per piece in public/art/backdrops/<key>.png, drawn behind the play layer, lower in contrast and
  saturation than the tiles. The manifest lists each as
    {"key": "<key>", "png": "backdrops/<key>.png", "width": w, "height": h, "anchor": "bottom-left", "y": y,
     "repeat": "x" | "none"}
  The piece's bottom-left corner sits at world y (its bottom edge), at an x the level data chooses. "repeat": "x"
  tiles it horizontally across a run; "none" places it once. Below the sidewalk line (y 312) the game shows ink.
  Draw order, back to front: sky, skyline, facades, facade pieces (fire escape, hotel crest and windows),
  storefronts, street furniture, then the play layer.
- Sky and skyline (repeat x): street-sky 48x312 (y 312); street-skyline 336x272 (y 312): far blue buildings,
  water towers and a glass tower, seen above one-storey buildings and down cross streets.
- Facades (repeat x, one per building type; a run per building): facade-one-storey 48x192 (y 312, a parapet at
  y 120), facade-walkup 48x312, facade-brownstone 48x312, facade-hotel 48x312 (y 312 each). Each shows the
  180px ground storey with a band at y 206 over the shopfronts and the next storey's windows above.
- Facade pieces (none): fire-escape 196x185 (y 185, on a walk-up), hotel-crest 98x44 (y 190, over the hotel
  door: two banners and the crest), hotel-window 32x152 (y 304, one of the lobby's tall windows).
- Storefronts (none), each 120 tall (y 312), a whole number of tiles wide, with a sign icon (never text), a tall
  display window and a 46px door: storefront-cafe 84, storefront-florist 84, storefront-gift-shop 96,
  storefront-makeup-store 96, storefront-pet-shop 108, storefront-diner 108, storefront-noodle-bar 120.
- Street furniture (none, y 312): cab 96x40, hot-dog-cart 40x70, subway-railing 72x62, street-tree 64x136,
  walk-signal 12x82, doorman-podium 18x24, canopy-poles 60x60 (under the canopy's end tiles), cross-street
  120x26 (the far avenue between two kerbs; place no facade over a cross street so the skyline shows).
- Lobby (indoor scale; the lobby floor line is y 672): lobby-wall 48x720 (y 720, x: wood panelling, cornice,
  wainscot), lobby-balustrade 48x36 (y at the balcony's floor line, x), lobby-bookcase 84x384 (y 672; boards 8,
  16, 24 and 32 tiles up, under one-way-shelf rows 7 wide), lobby-sofa 120x72 (y 672; cushions 3 and 6 tiles up,
  under one-way-cushion rows 8 wide from x+12), lobby-desk 120x96 (y 672; its top 8 tiles up, under one-way-desk
  10 wide), lobby-plant 48x120 (y 672), lobby-lamp 48x192 (y 220, hung from the ceiling), lobby-window 96x240
  (y 552), lobby-front-door 156x180 (y 672: the inside of the front door, where she arrives; never a way back).
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixel  # noqa: E402
from pixel import Grid, darker, rgb  # noqa: E402

T = 12
COLUMNS = 8
W, H = 720, 360
FY = 312                       # the sidewalk and lobby floor line
TILESETS = "public/art/tilesets"
BACKDROPS = "public/art/backdrops"
SPRITES = "public/art/sprites"


def R(g, *rects):
    """Fill rects (x, y, w, h, colour or None) on a Grid in order."""
    for x, y, w, h, c in rects:
        g.rect(x, y, w, h, c)
    return g


def ends(g, kind, edge, lit=None, shade=None, below=0):
    """Exposed ends of a solid tile: a 1px edge, a 2px lit band (left) or shade band (right) from row `below`;
    a surface end drops its corner pixel."""
    if "l" in kind:
        R(g, (0, 0, 1, T, edge))
        if lit:
            R(g, (1, below, 2, T - below, lit))
        if "t" in kind:
            g.p(0, 0, None)
    if "r" in kind:
        R(g, (T - 1, 0, 1, T, edge))
        if shade:
            R(g, (T - 3, below, 2, T - below, shade))
        if "t" in kind:
            g.p(T - 1, 0, None)
    return g


def surface(g, edge, lip, body, under):
    return R(g, (0, 0, T, T, body), (0, 0, T, 1, edge), (0, 1, T, 2, lip), (0, T - 2, T, 2, under))


def shelf(kind, edge, lip, top, face, bracket, bracket_sh):
    """One-way ledge: a 7px slab in the top rows, a bracket under each end tile, transparent below."""
    g = R(Grid(T, T), (0, 0, T, 1, edge), (0, 1, T, 2, lip), (0, 3, T, 2, top), (0, 5, T, 1, face),
          (0, 6, T, 1, edge))
    if kind == "l":
        R(g, (0, 0, 1, 7, None), (1, 1, 1, 5, edge))
    if kind == "r":
        R(g, (T - 1, 0, 1, 7, None), (T - 2, 1, 1, 5, edge))
    if kind in "lr":
        bx = 4 if kind == "l" else T - 6
        R(g, (bx, 7, 2, 4, bracket), (bx, 11, 2, 1, bracket_sh))
    return g


# ---------------------------------------------------------------- street tiles

# Warm stone sidewalk, a cream stone kerb, a navy road; green-and-cream awnings; the hotel's forest-green canopy.
S = dict(edge="dbrown", lip="skin1", body="skin2", under="brown", joint="brown", face="brown", face_lit="skin2",
         face_sh="dbrown", kerb="cream", kerb_lip="white", kerb_sh="tan", road="navy", road_lip="dslate",
         box="brown", box_lip="tan", box_sh="dbrown", box_edge="dbrown")
AWNING = dict(edge="forest", lip="white", a="dgreen", b="cream")
CANOPY = dict(edge="ink", lip="tan", a="forest", b="forest")


def sidewalk(kind, joint=False):
    g = Grid(T, T)
    if "t" in kind:
        surface(g, S["edge"], S["lip"], S["body"], S["under"])
        if joint:
            R(g, (T - 2, 3, 2, 7, S["joint"]))
        return ends(g, kind, S["edge"], S["lip"], S["under"], 1)
    R(g, (0, 0, T, T, S["face"]))
    return ends(g, kind, S["edge"], S["face_lit"], S["face_sh"])


def kerb(side):
    g = R(Grid(T, T), (0, 0, T, T, S["kerb"]), (0, 0, T, 1, S["edge"]), (0, 1, T, 2, S["kerb_lip"]),
          (0, T - 2, T, 2, S["kerb_sh"]))
    ends(g, "t" + side, S["edge"], S["kerb_lip"], S["kerb_sh"], 1)
    if side == "l":
        g.p(1, 0, None), g.p(0, 1, None), g.p(1, 1, S["edge"])
    else:
        g.p(T - 2, 0, None), g.p(T - 1, 1, None), g.p(T - 2, 1, S["edge"])
    return g


def road(top):
    g = R(Grid(T, T), (0, 0, T, T, S["road"]))
    if top:
        R(g, (0, 0, T, 1, "ink"), (0, 1, T, 2, S["road_lip"]))
    return g


def awning(kind, p=AWNING):
    """A canvas awning seen front-on: a light lip, 4px stripes, a scalloped hem; art in the top 11 rows."""
    g = R(Grid(T, T), (0, 0, T, 1, p["edge"]), (0, 1, T, 2, p["lip"]))
    for x in range(0, T, 4):
        R(g, (x, 3, 4, 5, p["a"] if (x // 4) % 2 == 0 else p["b"]))
    for x in (0, 6):
        R(g, (x, 8, 6, 1, p["a"]), (x + 1, 9, 4, 1, p["a"]), (x + 2, 10, 2, 1, p["edge"]))
        for px, py in ((x, 9), (x + 5, 9), (x + 1, 10), (x + 4, 10)):
            g.p(px, py, p["edge"])
    if kind == "l":
        R(g, (0, 0, 1, 9, p["edge"]))
        g.p(0, 0, None)
    if kind == "r":
        R(g, (T - 1, 0, 1, 9, p["edge"]))
        g.p(T - 1, 0, None)
    return g


def planter(kind):
    g = Grid(T, T)
    if "t" in kind:
        R(g, (0, 0, T, T, S["box"]), (0, 0, T, 1, "forest"), (0, 1, T, 2, "green"), (0, 3, T, 3, "dgreen"),
          (0, 6, T, 1, S["box_edge"]), (0, 7, T, 2, S["box_lip"]))
        if "l" in kind:
            R(g, (0, 0, 1, T, S["box_edge"]), (0, 0, 1, 6, "forest"))
            g.p(0, 0, None), g.p(1, 0, None), g.p(1, 1, "forest")
        if "r" in kind:
            R(g, (T - 1, 0, 1, T, S["box_edge"]), (T - 1, 0, 1, 6, "forest"), (T - 3, 9, 2, 3, S["box_sh"]))
            g.p(T - 1, 0, None), g.p(T - 2, 0, None), g.p(T - 2, 1, "forest")
        return g
    R(g, (0, 0, T, T, S["box"]), (0, T - 1, T, 1, S["box_edge"]))
    return ends(g, kind, S["box_edge"], S["box_lip"], S["box_sh"])


def hotel_door():
    """The hotel's front door, 36x48: a pair of lit amber glass doors in a tan frame, the brightest thing at the
    door, so it reads as the way in."""
    g = R(Grid(36, 48), (0, 0, 36, 48, "ink"), (1, 1, 34, 47, "tan"), (1, 1, 34, 2, "cream"), (1, 1, 2, 47, "cream"),
          (32, 3, 2, 45, "brown"), (5, 6, 26, 42, "ink"))
    for x in (6, 19):
        R(g, (x, 7, 11, 41, "amber"), (x, 30, 11, 18, "ochre"), (x + 1, 9, 2, 16, "yellow"))
    R(g, (17, 6, 2, 42, "tan"), (14, 26, 2, 6, "brown"), (20, 26, 2, 6, "brown"))
    return g


# The cellar hatch: an open pit in the sidewalk with its two steel leaves standing up. Steel is the slate ramp
# (slate, dslate, navy): slate leaves read against the dark facades in greyscale, where dslate would not.
LEAF_H = 20                    # leaf height above the sidewalk, in px


def hatch_edge(side):
    """The sidewalk tile beside the opening (side "l" for the hatch's left edge, "r" its right): a sidewalk end
    capped by a steel angle iron, its top lit, its flange running 5px down the shaft wall. Solid."""
    g = sidewalk("tr" if side == "l" else "tl")
    x = T - 4 if side == "l" else 0
    R(g, (x, 0, 4, 3, "dslate"), (x, 0, 4, 1, "slate"))
    fx = T - 2 if side == "l" else 0
    R(g, (fx, 3, 2, 5, "dslate"), (T - 1 if side == "l" else 0, 3, 1, 5, "navy"))
    return g


def pit():
    """The opening: the dark drop, ink to the bottom of the level. No collision."""
    return R(Grid(T, T), (0, 0, T, T, "ink"))


def hatch_leaf():
    """The left leaf, standing on the left edge and leaning out 1px every 6 rows: a slate plate with dslate studs
    and a dslate hinge knuckle, ink-outlined, LEAF_H tall over 2 tile rows (24px) above the sidewalk."""
    g = Grid(T, 2 * T)
    for y in range(2 * T - LEAF_H, 2 * T):
        lean = (2 * T - 1 - y) // 6
        R(g, (5 - lean, y, 6, 1, "slate"))
    for y in range(2 * T - LEAF_H + 2, 2 * T - 1, 4):
        lean = (2 * T - 1 - y) // 6
        R(g, (5 - lean + (1 if (y // 4) % 2 else 3), y, 2, 2, "dslate"))
    R(g, (9, 2 * T - 3, 2, 3, "dslate"))
    g.px = g.outlined(lambda c: pixel.K["ink"])
    return g


def split_leaf(side):
    """The leaf as its top and bottom tiles, mirrored for the right edge."""
    g = hatch_leaf()
    if side == "r":
        g.px = pixel.flipped(g.px)
    top, bottom = Grid(T, T), Grid(T, T)
    top.px, bottom.px = g.px[:T], g.px[T:]
    return top, bottom


def cut(g, prefix):
    """A multi-tile drawing as named 12x12 tiles (prefix-0, prefix-1, ... in row order) and its piece rows."""
    tiles, rows = [], []
    for j in range(g.h // T):
        row = []
        for i in range(g.w // T):
            t = Grid(T, T)
            t.px = [r[i * T:(i + 1) * T] for r in g.px[j * T:(j + 1) * T]]
            name = f"{prefix}-{j * (g.w // T) + i}"
            tiles.append((name, t))
            row.append(name)
        rows.append(row)
    return tiles, rows


def street_tiles():
    door, door_rows = cut(hotel_door(), "door")
    return [
        ("sidewalk-top", sidewalk("t")), ("sidewalk-top-joint", sidewalk("t", True)),
        ("sidewalk-top-left", sidewalk("tl")), ("sidewalk-top-right", sidewalk("tr")),
        ("kerb-left", kerb("l")), ("kerb-right", kerb("r")),
        ("sidewalk-face", sidewalk("")), ("sidewalk-face-left", sidewalk("l")),
        ("sidewalk-face-right", sidewalk("r")), ("road-top", road(True)), ("road", road(False)),
        ("one-way-awning-left", awning("l")), ("one-way-awning", awning("m")), ("one-way-awning-right", awning("r")),
        ("one-way-canopy-left", awning("l", CANOPY)), ("one-way-canopy", awning("m", CANOPY)),
        ("one-way-canopy-right", awning("r", CANOPY)),
        ("planter-top-left", planter("tl")), ("planter-top", planter("t")), ("planter-top-right", planter("tr")),
        ("planter-left", planter("l")), ("planter", planter("")), ("planter-right", planter("r")),
    ] + door + hatch_tiles(), {"door": door_rows}


def hatch_tiles():
    """Appended after the door so every earlier index holds."""
    lt, lb = split_leaf("l")
    rt, rb = split_leaf("r")
    return [("hatch-left", hatch_edge("l")), ("hatch-right", hatch_edge("r")), ("pit-opening", pit()),
            ("pit-leaf-left-top", lt), ("pit-leaf-left", lb), ("pit-leaf-right-top", rt), ("pit-leaf-right", rb)]


# ---------------------------------------------------------------- lobby tiles

# The boutique lobby: wood walls a step darker than everything she stands on. Every walkable top, the floor and
# each one-way ledge, carries the same 2px cream lip under a 1px plum edge, so in greyscale the standable edges
# are the brightest lines in the room. Indoor scale: a door is 180px (15 tiles).
LE = "plum"
LOBBY_H = 720                  # a level is 2 screens (60 tiles) tall
LOBBY_FY = 672                 # the lobby floor line (tile row 56)


def floor(kind, joint=False):
    """Wood floor: a cream lip, brown boards with a 2px dark-brown board end every 24px, a dark-brown face."""
    g = Grid(T, T)
    if "t" in kind:
        surface(g, LE, "cream", "brown", "dbrown")
        if joint:
            R(g, (T - 2, 3, 2, 7, "dbrown"))
        return ends(g, kind, LE, "cream", "dbrown", 1)
    R(g, (0, 0, T, T, "dbrown"))
    return ends(g, kind, LE, "brown", "plum")


# one-way ledge styles: lip, top, face, bracket (None: no brackets)
LEDGES = {
    "balcony": ("cream", "tan", "brown", None),        # the mezzanine floor's front edge
    "shelf": ("cream", "tan", "brown", "dbrown"),      # bookcase and wall shelves
    "cushion": ("cream", "mauve", "purple", None),     # the sofa's seat and back
    "desk": ("cream", "tan", "dbrown", None),          # the reception desk's top
}


def ledge(style, kind):
    lip, top, face, bracket = LEDGES[style]
    g = R(Grid(T, T), (0, 0, T, 1, LE), (0, 1, T, 2, lip), (0, 3, T, 2, top), (0, 5, T, 1, face), (0, 6, T, 1, LE))
    if kind == "l":
        R(g, (0, 0, 1, 7, None), (1, 1, 1, 5, LE))
    if kind == "r":
        R(g, (T - 1, 0, 1, 7, None), (T - 2, 1, 1, 5, LE))
    if bracket and kind in "lr":
        bx = 4 if kind == "l" else T - 6
        R(g, (bx, 7, 2, 4, bracket), (bx, 11, 2, 1, LE))
    return g


def post(kind):
    """A wood post, 2 tiles wide: brown with a tan lit band and a dark-brown shade; cream-capped cap and base."""
    left = kind.endswith("l")
    g = R(Grid(T, T), (0, 0, T, T, "brown"))
    if left:
        R(g, (0, 0, 1, T, LE), (1, 0, 2, T, "tan"))
    else:
        R(g, (T - 3, 0, 2, T, "dbrown"), (T - 1, 0, 1, T, LE))
    if kind.startswith("cap"):
        R(g, (0, 0, T, 1, LE), (0, 1, T, 2, "cream"), (0, 3, T, 3, "tan"), (0, 6, T, 1, LE))
    if kind.startswith("base"):
        R(g, (0, 4, T, 1, LE), (0, 5, T, 2, "cream"), (0, 7, T, 5, "tan"))
    if kind.startswith(("cap", "base")):
        R(g, (0, 0, 1, T, LE) if left else (T - 1, 0, 1, T, LE))
    return g


def stairwell():
    """The exit to the next floor, 84x180 (a door at indoor scale): a tan frame round an opening with stairs
    rising to the right, and a white up-arrow on a green sign over it."""
    g = R(Grid(84, 180), (0, 0, 84, 180, LE), (2, 2, 80, 178, "tan"), (2, 2, 4, 178, "cream"),
          (76, 6, 4, 174, "brown"), (22, 6, 40, 24, "forest"), (24, 8, 36, 20, "dgreen"),
          (10, 36, 64, 144, "ink"), (12, 38, 60, 142, "navy"))
    for k in range(6):
        R(g, (41 - k * 2, 11 + k * 2, 2 + k * 4, 2, "white"))
    R(g, (39, 23, 6, 4, "white"))
    for i in range(6):
        sx, sy = 12 + i * 10, 166 - i * 22
        R(g, (sx, sy, 72 - sx, 180 - sy, "dslate"), (sx, sy, 72 - sx, 4, "slate"))
    R(g, (12, 38, 60, 8, "ink"))
    return g


def lobby_tiles():
    tiles = [
        ("floor-top", floor("t")), ("floor-top-joint", floor("t", True)),
        ("floor-top-left", floor("tl")), ("floor-top-right", floor("tr")),
        ("floor-face", floor("")), ("floor-face-left", floor("l")), ("floor-face-right", floor("r")),
    ]
    for style in LEDGES:
        tiles += [(f"one-way-{style}-left", ledge(style, "l")), (f"one-way-{style}", ledge(style, "m")),
                  (f"one-way-{style}-right", ledge(style, "r"))]
    tiles += [("post-cap-left", post("cap-l")), ("post-cap-right", post("cap-r")), ("post-left", post("l")),
              ("post-right", post("r")), ("post-base-left", post("base-l")), ("post-base-right", post("base-r"))]
    exit_tiles, exit_rows = cut(stairwell(), "exit")
    return tiles + exit_tiles, {"exit": exit_rows}


TILESET_DEFS = (("tiles-street", street_tiles), ("tiles-lobby", lobby_tiles))


def tileset_image(tiles):
    from PIL import Image

    rows = -(-len(tiles) // COLUMNS)
    im = Image.new("RGBA", (COLUMNS * T, rows * T), (0, 0, 0, 0))
    for i, (_, g) in enumerate(tiles):
        im.alpha_composite(frame_image(g.px), ((i % COLUMNS) * T, (i // COLUMNS) * T))
    return im


def tileset_json(tiles, pieces):
    index = {name: i for i, (name, _) in enumerate(tiles)}
    return {"columns": COLUMNS, "pieces": {k: [[index[n] for n in row] for row in v] for k, v in pieces.items()},
            "tileSize": T, "tiles": index}


# ---------------------------------------------------------------- backdrops

# Sign icons, 11x11, one colour on a navy board. Signs are icons, never text.
ICONS = {
    "cafe": ["..#..#.....", "...#..#....", "..#..#.....", "...........", "#########..", "#########.#",
             "#########.#", "#########.#", ".#######.#.", "..#####....", "###########"],
    "florist": ["...##.##...", "..########.", "..###..###.", "...##.##...", ".....#.....", ".##..#..##.",
                "..##.#.##..", "....###....", ".....#.....", "..#######..", "...#####..."],
    "gift-shop": ["..##...##..", "...##.##...", "....###....", "###########", "#....#....#", "###########",
                  ".#...#...#.", ".#...#...#.", ".#...#...#.", ".#...#...#.", ".#########."],
    "makeup-store": ["....###....", "...####....", "...#####...", "...#####...", "...#####...", "..#######..",
                     "..#.....#..", "..#######..", "..#.....#..", "..#.....#..", "..#######.."],
    "pet-shop": ["...........", "..##...##..", "..##...##..", "##.......##", "##.......##", "....###....",
                 "...#####...", "..#######..", "..#######..", "...##.##...", "..........."],
    "diner": ["#.#.#...##.", "#.#.#...###", "#.#.#...###", "#####...###", ".###....###", "..#.....##.",
              "..#......#.", "..#......#.", "..#......#.", "..#......#.", "..#......#."],
    "noodle-bar": [".........#.", "........#..", ".......#.#.", "......#.#..", ".....#.#...", "###########",
                   "###########", ".#########.", "..#######..", "...#####...", "..#######.."],
    "hotel": ["....#.#....", "...#####...", "..#.###.#..", ".#########.", "###########", "#.#.#.#.#.#",
              "#.#.#.#.#.#", "#.#.#.#.#.#", "#.#.#.#.#.#", "###########", "###########"],
}

# kind: width (whole tiles), frame colour. Frames are dim so the shops stay behind the play layer.
SHOPS = {
    "cafe": (84, "forest"),
    "florist": (84, "plum"),
    "gift-shop": (96, "teal"),
    "makeup-store": (96, "purple"),
    "pet-shop": (108, "navy"),
    "diner": (108, "plum"),
    "noodle-bar": (120, "teal"),
}

# Building facades: wall, line (storey lines, frames, mortar), trim (sills, parapet).
BUILDINGS = {
    "one-storey": ("dbrown", "plum", "brown"),
    "walkup": ("dbrown", "plum", "brown"),
    "brownstone": ("plum", "ink", "dbrown"),
    "hotel": ("dslate", "navy", "tan"),
}


def icon(g, kind, x, y, c):
    for j, row in enumerate(ICONS[kind]):
        for i, ch in enumerate(row):
            if ch == "#":
                g.p(x + i, y + j, c)


def street_sky():
    return R(Grid(48, FY), (0, 0, 48, FY, "sky"))


def street_skyline():
    """The far skyline, 336x272 (its top at y 40): blue buildings with navy windows, water towers on the roofs and
    one tall glass tower, drawn smaller than the street so the city reads as far away."""
    g = Grid(336, 272)
    spans = [(0, 40, 110), (40, 60, 70), (100, 30, 150), (130, 50, 90), (224, 60, 80), (284, 52, 120)]
    for x, w, top in spans:
        R(g, (x, top, w, 272 - top, "blue"))
        for wy in range(top + 8, 252, 24):
            for wx in range(x + 6, x + w - 6, 10):
                R(g, (wx, wy, 4, 8, "navy"))
    R(g, (180, 0, 44, 272, "blue"))                      # the glass tower: 2px navy mullions every 8px
    for mx in range(184, 222, 8):
        R(g, (mx, 4, 2, 268, "navy"))
    R(g, (178, 0, 48, 4, "navy"))
    for tx, top in ((10, 110), (60, 70), (150, 90), (240, 80)):   # water towers: legs, barrel, cone
        R(g, (tx + 2, top - 6, 2, 6, "navy"), (tx + 10, top - 6, 2, 6, "navy"), (tx, top - 20, 14, 14, "navy"))
        for k in range(4):
            R(g, (tx + 1 + 2 * k, top - 22 - 2 * k, 12 - 4 * k, 2, "navy"))
    return g


def facade(kind):
    """One repeating 48px slice of a building front from the top of the screen to the sidewalk line: the ground
    storey is 180px (y 132 to 312) with a band at y 206 over the shopfronts; above it the next storey's windows.
    The one-storey building stops at a parapet at y 120."""
    wall, line, trim = BUILDINGS[kind]
    if kind == "one-storey":
        g = R(Grid(48, 192), (0, 0, 48, 192, wall), (0, 0, 48, 6, trim), (0, 6, 48, 4, line), (0, 86, 48, 4, line))
        return g
    g = R(Grid(48, FY), (0, 0, 48, FY, wall), (0, 124, 48, 8, line), (0, 122, 48, 2, trim), (0, 206, 48, 4, line))
    R(g, (11, 50, 26, 58, line), (14, 53, 20, 52, "navy"), (23, 53, 2, 52, line), (9, 108, 30, 4, trim))
    if kind == "brownstone":
        R(g, (9, 44, 30, 6, trim))                       # a stone lintel over each window
    return g


def fire_escape():
    """196x185, bottom at y 185: an ink platform and railing under the second-storey windows, a stair up out of
    the screen and a drop ladder hanging towards the sidewalk."""
    g = Grid(196, 185)
    R(g, (0, 112, 196, 3, "ink"), (0, 92, 196, 2, "ink"))
    for px in range(0, 196, 18):
        R(g, (px, 92, 2, 22, "ink"))
    for k in range(46):                                  # the stair, a 2px diagonal
        R(g, (20 + k, 92 - 2 * k, 2, 2, "ink"))
    R(g, (136, 115, 2, 70, "ink"), (148, 115, 2, 70, "ink"))
    for ry in range(121, 185, 8):
        R(g, (136, ry, 14, 2, "ink"))
    return g


def hotel_crest():
    """98x44, bottom at y 190: two banners on short poles either side of a navy plaque with the hotel's crest."""
    g = Grid(98, 44)
    for x, c in ((4, "navy"), (82, "dgreen")):
        R(g, (x - 4, 0, 20, 2, "ink"), (x, 2, 12, 34, c), (x + 2, 36, 8, 4, c), (x, 2, 12, 2, "cream"))
    R(g, (32, 4, 32, 26, "ink"), (33, 5, 30, 24, "navy"), (24, 42, 48, 2, "tan"))
    icon(g, "hotel", 43, 11, "cream")
    return g


def hotel_window():
    """32x152, bottom at y 304: one of the lobby's tall windows, seen from the street."""
    return R(Grid(32, 152), (0, 0, 32, 152, "navy"), (3, 3, 26, 146, "ink"), (3, 48, 26, 2, "navy"),
             (6, 8, 4, 30, "dslate"))


def storefront(kind):
    """A shopfront, w x 120 (y 192 to 312): a frame in the shop's colour, a navy sign board with its icon, a tall
    display window under a transom, and a 46px door under its own transom. An awning (one-way, row 20) fits across
    it below the sign."""
    w, frame = SHOPS[kind]
    edge = darker(frame)
    g = R(Grid(w, 120), (0, 0, w, 120, frame), (4, 2, w - 8, 18, "ink"), (5, 3, w - 10, 16, "navy"),
          (4, 26, w - 34, 86, edge), (6, 28, w - 38, 82, "dslate"), (6, 44, w - 38, 2, edge),
          (10, 50, 2, 24, "slate"), (14, 50, 2, 12, "slate"),
          (w - 28, 26, 24, 94, edge), (w - 26, 28, 20, 42, "dslate"), (w - 26, 74, 20, 46, edge),
          (w - 23, 78, 14, 18, "dslate"))
    icon(g, kind, w // 2 - 5, 6, "cream")
    return g


def cab():
    """96x40: a yellow cab side-on, for the far avenue down a cross street."""
    g = R(Grid(96, 40), (16, 6, 52, 12, "amber"), (20, 8, 20, 8, "navy"), (44, 8, 20, 8, "navy"),
          (36, 0, 12, 6, "cream"), (0, 18, 96, 14, "amber"), (0, 28, 96, 4, "orange"))
    for wx in (12, 70):
        R(g, (wx, 30, 14, 10, "ink"), (wx + 4, 34, 6, 2, "dslate"))
    return g


def hot_dog_cart():
    """40x70: a steel cart on two wheels under a blue-and-cream umbrella."""
    g = Grid(40, 70)
    g.ell(20, 12, 20, 12, "blue")
    R(g, (0, 12, 40, 12, None), (8, 4, 6, 8, "cream"), (24, 4, 6, 8, "cream"), (18, 12, 2, 34, "ink"),
      (0, 44, 40, 18, "slate"), (0, 44, 40, 3, "white"))
    for wx in (4, 28):
        g.ell(wx + 4, 64, 4, 4, "ink")
    return g


def subway_railing():
    """72x62: a green railing round the stairs down, with a green lamp on a post at each end."""
    g = R(Grid(72, 62), (3, 40, 66, 2, "forest"), (3, 40, 2, 22, "forest"), (67, 40, 2, 22, "forest"))
    for bx in range(11, 66, 8):
        R(g, (bx, 42, 2, 20, "forest"))
    for px in (3, 67):
        R(g, (px, 8, 2, 32, "forest"), (px - 3, 0, 8, 8, "dgreen"))
    return g


def street_tree():
    """64x136: a round forest-green crown on a thin trunk, dim so it stays behind play."""
    g = R(Grid(64, 136), (30, 56, 4, 80, "dbrown"))
    g.ell(32, 32, 32, 32, "forest")
    g.ell(16, 16, 14, 12, "dgreen")
    return g


def walk_signal():
    """12x82: a pole with the signal box at the top showing the white walking figure."""
    return R(Grid(12, 82), (4, 6, 2, 76, "ink"), (0, 0, 10, 12, "ink"), (4, 2, 2, 2, "white"), (3, 4, 4, 4, "white"),
             (3, 8, 1, 3, "white"), (6, 8, 1, 3, "white"))


def doorman_podium():
    return R(Grid(18, 24), (2, 2, 14, 22, "dbrown"), (0, 0, 18, 4, "tan"))


def canopy_poles():
    """60x60: the two tan poles holding up the hotel canopy, set under its end tiles."""
    return R(Grid(60, 60), (2, 0, 2, 60, "tan"), (56, 0, 2, 60, "tan"))


def cross_street():
    """120x26: the far avenue seen down a cross street, navy with 2px lane dashes; the sky and skyline show above."""
    g = R(Grid(120, 26), (0, 0, 120, 26, "navy"))
    for x in range(8, 120, 24):
        R(g, (x, 12, 8, 2, "dslate"))
    return g


def lobby_wall():
    """48x720, repeat x, bottom at y 720: dark-brown wood panelling with 2px plum grooves every 24px, a plum and
    ink ceiling cornice, a plum wainscot from y 588 under a 2px brown rail. Below the floor line it is covered by
    the floor tiles."""
    g = R(Grid(48, LOBBY_H), (0, 0, 48, LOBBY_H, "dbrown"), (0, 0, 48, 20, "plum"), (0, 20, 48, 4, "ink"))
    for x in (10, 34):
        R(g, (x, 24, 2, 564, "plum"))
    R(g, (0, 588, 48, 84, "plum"), (0, 586, 48, 2, "brown"))
    return g


def lobby_bookcase():
    """84x384 (7x32 tiles), bottom at y 672: a tall bookcase, a brown frame round a plum back, one step from the
    wall. Its boards sit 8, 16, 24 and 32 tiles above the floor, where one-way-shelf tiles go (7 wide); muted books
    stand on each board."""
    g = R(Grid(84, 384), (0, 0, 84, 384, "brown"), (4, 4, 76, 380, "plum"))
    for k in range(4):
        R(g, (0, 384 - 96 * (k + 1), 84, 7, "brown"))  # the boards
    for k, base in enumerate((384, 288, 192, 96)):    # books standing on the floor and each lower board
        for i, bx in enumerate(range(8, 76, 6)):      # 4px spines, stepped heights, muted colours
            hgt = (34, 40, 28, 44, 36, 30, 42, 26, 38, 32, 44)[i % 11]
            c = ("teal", "dbrown", "forest", "navy", "purple", "dbrown")[(i + k) % 6]
            R(g, (bx, base - hgt, 4, hgt, c))
    return g


def lobby_sofa():
    """120x72 (10x6 tiles), bottom at y 672: a purple sofa. Its seat top is 3 tiles up (a hop) and its back 6;
    lay one-way-cushion tiles on both, 8 wide over the cushions (x 12 to 108), inside the 1-tile arms."""
    g = R(Grid(120, 72), (12, 0, 96, 64, "purple"), (59, 6, 2, 30, "plum"), (12, 36, 96, 2, "plum"),
          (12, 60, 96, 4, "plum"), (0, 24, 12, 40, "purple"), (108, 24, 12, 40, "purple"),
          (0, 24, 12, 4, "mauve"), (108, 24, 12, 4, "mauve"), (10, 24, 2, 40, "plum"), (108, 24, 2, 40, "plum"),
          (12, 64, 8, 8, "plum"), (100, 64, 8, 8, "plum"))
    return g


def lobby_plant():
    """48x120, bottom at y 672: a big leafy plant in a dark pot."""
    g = R(Grid(48, 120), (8, 84, 32, 36, "plum"), (6, 80, 36, 6, "dbrown"))
    for x, y, w, h, c in ((0, 24, 20, 30, "forest"), (18, 0, 22, 34, "dgreen"), (6, 40, 36, 44, "forest"),
                          (26, 30, 22, 28, "teal"), (4, 58, 16, 20, "teal")):
        R(g, (x, y, w, h, c))
    return g


def lobby_lamp():
    """48x192, bottom at y 220: a pendant lamp on a cord from the ceiling, a tan drum shade with its bulb lit
    (white core, cream ring). No glow is baked in: lights are data."""
    return R(Grid(48, 192), (23, 0, 2, 166, "ink"), (4, 166, 40, 20, "tan"), (4, 166, 40, 2, "cream"),
             (4, 184, 40, 2, "brown"), (18, 186, 12, 6, "cream"), (20, 186, 8, 4, "white"))


def lobby_window():
    """96x240, bottom at y 552: a tall window onto the bright day, plum frame and bars."""
    g = R(Grid(96, 240), (0, 0, 96, 240, "plum"), (4, 4, 88, 232, "blue"), (46, 4, 4, 232, "plum"),
          (4, 118, 88, 4, "plum"), (10, 10, 6, 60, "sky"), (56, 10, 6, 40, "sky"))
    return g


def lobby_desk():
    """120x96 (10x8 tiles), bottom at y 672: the reception desk, dark-brown with plum panels. Its top is 8 tiles
    up, a full jump; lay one-way-desk tiles (10 wide) on it."""
    g = R(Grid(120, 96), (0, 0, 120, 96, "dbrown"), (0, 90, 120, 6, "plum"))
    for x in (8, 46, 84):
        R(g, (x, 12, 28, 70, "plum"))
    return g


def lobby_front_door():
    """156x180, bottom at y 672: the inside of the hotel's front door, where she arrives from the street. Not a
    way back (a level is never revisited): a tan frame, a transom, two glass doors onto the bright street."""
    g = R(Grid(156, 180), (0, 0, 156, 180, LE), (2, 2, 152, 178, "brown"), (2, 2, 152, 4, "tan"),
          (12, 12, 132, 168, "ink"), (14, 14, 128, 34, "blue"), (76, 14, 4, 34, "brown"), (12, 48, 132, 4, "brown"),
          (76, 52, 4, 128, "brown"), (12, 166, 132, 14, "plum"))
    for x in (14, 80):
        R(g, (x, 54, 62, 112, "blue"), (x + 6, 60, 8, 70, "sky"), (x + 18, 60, 4, 40, "sky"), (x, 54, 62, 3, "brown"),
          (x + (52 if x == 14 else 4), 110, 6, 22, "dbrown"))
    return g


def lobby_balustrade():
    """48x36, repeat x, bottom at the mezzanine's floor line: brown balusters every 12px under a brown rail."""
    g = R(Grid(48, 36), (0, 0, 48, 4, "brown"))
    for x in (4, 16, 28, 40):
        R(g, (x, 4, 4, 32, "brown"))
    return g


# key: (draw, anchor y, repeat)
BACKDROP_DEFS = {
    "street-sky": (street_sky, FY, "x"),
    "street-skyline": (street_skyline, FY, "x"),
    **{f"facade-{k}": ((lambda k=k: facade(k)), FY, "x") for k in BUILDINGS},
    "fire-escape": (fire_escape, 185, "none"),
    "hotel-crest": (hotel_crest, 190, "none"),
    "hotel-window": (hotel_window, 304, "none"),
    **{f"storefront-{k}": ((lambda k=k: storefront(k)), FY, "none") for k in SHOPS},
    "cab": (cab, FY, "none"),
    "hot-dog-cart": (hot_dog_cart, FY, "none"),
    "subway-railing": (subway_railing, FY, "none"),
    "street-tree": (street_tree, FY, "none"),
    "walk-signal": (walk_signal, FY, "none"),
    "doorman-podium": (doorman_podium, FY, "none"),
    "canopy-poles": (canopy_poles, FY, "none"),
    "cross-street": (cross_street, FY, "none"),
    "lobby-wall": (lobby_wall, LOBBY_H, "x"),
    "lobby-balustrade": (lobby_balustrade, 288, "x"),
    "lobby-bookcase": (lobby_bookcase, LOBBY_FY, "none"),
    "lobby-sofa": (lobby_sofa, LOBBY_FY, "none"),
    "lobby-desk": (lobby_desk, LOBBY_FY, "none"),
    "lobby-plant": (lobby_plant, LOBBY_FY, "none"),
    "lobby-lamp": (lobby_lamp, 220, "none"),
    "lobby-window": (lobby_window, 552, "none"),
    "lobby-front-door": (lobby_front_door, LOBBY_FY, "none"),
}


# ---------------------------------------------------------------- export

def frame_image(px):
    from PIL import Image

    h, w = len(px), len(px[0])
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    for y, row in enumerate(px):
        for x, c in enumerate(row):
            if c:
                im.putpixel((x, y), rgb(c) + (255,))
    return im


def build():
    os.makedirs(TILESETS, exist_ok=True)
    os.makedirs(BACKDROPS, exist_ok=True)
    tilesets, backdrops = [], []
    for key, fn in TILESET_DEFS:
        tiles, pieces = fn()
        tileset_image(tiles).save(f"{TILESETS}/{key}.png")
        with open(f"{TILESETS}/{key}.json", "w") as f:
            json.dump(tileset_json(tiles, pieces), f, indent=2, sort_keys=True)
            f.write("\n")
        tilesets.append({"key": key, "png": f"tilesets/{key}.png", "json": f"tilesets/{key}.json"})
    for key, (fn, y, repeat) in BACKDROP_DEFS.items():
        g = fn()
        frame_image(g.px).save(f"{BACKDROPS}/{key}.png")
        backdrops.append({"key": key, "png": f"backdrops/{key}.png", "width": g.w, "height": g.h,
                          "anchor": "bottom-left", "y": y, "repeat": repeat})
    manifest = {}
    if os.path.exists(pixel.MANIFEST):
        with open(pixel.MANIFEST) as f:
            manifest = json.load(f)
    # floor1.py owns both lists outright, so a piece it no longer draws leaves the manifest
    manifest["tilesets"] = sorted(tilesets, key=lambda e: e["key"])
    manifest["backdrops"] = sorted(backdrops, key=lambda e: e["key"])
    with open(pixel.MANIFEST, "w") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")
    print("built", ", ".join(k for k, _ in TILESET_DEFS), "and", len(backdrops), "backdrops")


# ---------------------------------------------------------------- preview: an example layout

# One example of level data for the preview only: two screens of street ending at the hotel door. The game's level
# data decides the real street's length and contents. Tiles are in columns; pieces are (key, x).
COLS, ROWS = 2 * W // T, H // T
GROUND = FY // T
EXAMPLE = dict(
    road=(17, 10), planters=[(4, 3), (60, 3)], awnings=[(10, 6), (28, 6)], canopy=(88, 5), ledge_row=20,
    door=(89, 22), hatch=(45, 3),
    runs=[("street-sky", 0, 2 * W), ("street-skyline", 0, 2 * W), ("facade-one-storey", 0, 192),
          ("facade-walkup", 324, 564), ("facade-brownstone", 564, 792), ("facade-hotel", 792, 2 * W)],
    pieces=[("cross-street", 204), ("cab", 214), ("fire-escape", 344), ("hotel-crest", 1026),
            ("hotel-window", 934), ("hotel-window", 982), ("hotel-window", 1124),
            ("storefront-cafe", 12), ("storefront-florist", 104), ("storefront-pet-shop", 336),
            ("storefront-makeup-store", 456), ("storefront-gift-shop", 576), ("storefront-diner", 812),
            ("storefront-noodle-bar", 1164), ("hot-dog-cart", 640), ("subway-railing", 712),
            ("street-tree", 270), ("street-tree", 910), ("walk-signal", 182), ("doorman-podium", 1038),
            ("canopy-poles", 1056)],
)


def example_map():
    E = EXAMPLE
    m = [["." for _ in range(COLS)] for _ in range(ROWS)]
    r0, rw = E["road"]
    for r in range(GROUND, ROWS):
        for c in range(COLS):
            if r0 <= c < r0 + rw:
                if r > GROUND:
                    m[r][c] = "R"
            else:
                m[r][c] = "#"
    for c0, w in E["planters"]:
        for r in (GROUND - 2, GROUND - 1):
            for c in range(c0, c0 + w):
                m[r][c] = "P"
    for c0, w in E["awnings"]:
        for c in range(c0, c0 + w):
            m[E["ledge_row"]][c] = "="
    c0, w = E["canopy"]
    for c in range(c0, c0 + w):
        m[E["ledge_row"]][c] = "~"
    c0, w = E["hatch"]
    for r in range(GROUND, ROWS):
        for c in range(c0, c0 + w):
            m[r][c] = "_"
    return m


def example_tile(m, c, r):
    def at(cc, rr):
        if cc < 0 or cc >= COLS:
            return "#"
        if rr < 0:
            return "."
        return m[rr][cc] if rr < ROWS else "#"

    ch = m[r][c]

    def kind(same):
        return ("" if at(c, r - 1) in same else "t") + ("" if at(c - 1, r) in same else "l") + \
            ("" if at(c + 1, r) in same else "r")

    if ch == "_":
        return "pit-opening"
    if ch == "#" and r == GROUND and "_" in (at(c - 1, r), at(c + 1, r)):
        return "hatch-left" if at(c + 1, r) == "_" else "hatch-right"
    if ch == "#":
        k = kind("#RP")
        if k in ("tl", "tr") and (at(c - 1, r + 1) == "R" or at(c + 1, r + 1) == "R"):
            return "kerb-left" if k == "tl" else "kerb-right"
        if "t" in k:
            return {"t": "sidewalk-top-joint" if c % 2 else "sidewalk-top", "tl": "sidewalk-top-left",
                    "tr": "sidewalk-top-right"}[k]
        return {"": "sidewalk-face", "l": "sidewalk-face-left", "r": "sidewalk-face-right"}[k]
    if ch == "R":
        return "road-top" if at(c, r - 1) != "R" else "road"
    if ch == "P":
        return {"tl": "planter-top-left", "t": "planter-top", "tr": "planter-top-right", "l": "planter-left",
                "": "planter", "r": "planter-right"}[kind("P")]
    if ch in "=~":
        base = "one-way-awning" if ch == "=" else "one-way-canopy"
        return base + ("-left" if at(c - 1, r) != ch else "-right" if at(c + 1, r) != ch else "")
    return None


def example_strip(chars=True, hud=True):
    from PIL import Image

    tiles = {}
    for _, fn in TILESET_DEFS:
        for name, g in fn()[0]:
            tiles[name] = frame_image(g.px)
    pieces = {k: frame_image(fn().px) for k, (fn, _, _) in BACKDROP_DEFS.items()}
    ys = {k: y for k, (_, y, _) in BACKDROP_DEFS.items()}
    im = Image.new("RGBA", (COLS * T, H), rgb("ink") + (255,))
    for key, x0, x1 in EXAMPLE["runs"]:
        p = pieces[key]
        for x in range(x0, x1, p.width):
            q = p.crop((0, 0, min(p.width, x1 - x), p.height))
            im.alpha_composite(q, (x, ys[key] - q.height))
    for key, x in EXAMPLE["pieces"]:
        p = pieces[key]
        im.alpha_composite(p, (x, ys[key] - p.height))
    m = example_map()
    for r in range(ROWS):
        for c in range(COLS):
            name = example_tile(m, c, r)
            if name:
                im.alpha_composite(tiles[name], (c * T, r * T))
    dc, dr = EXAMPLE["door"]
    for j in range(4):
        for i in range(3):
            im.alpha_composite(tiles[f"door-{j * 3 + i}"], ((dc + i) * T, (dr + j) * T))
    hc, hw = EXAMPLE["hatch"]
    for c, side in ((hc - 1, "left"), (hc + hw, "right")):
        im.alpha_composite(tiles[f"pit-leaf-{side}-top"], (c * T, (GROUND - 2) * T))
        im.alpha_composite(tiles[f"pit-leaf-{side}"], (c * T, (GROUND - 1) * T))
    if chars:
        duck = Image.open(f"{SPRITES}/duck.png").convert("RGBA").crop((0, 0, 48, 42))
        im.alpha_composite(duck, (96 - 24, FY - 42))
        ferret = Image.open(f"{SPRITES}/ferret.png").convert("RGBA").crop((0, 0, 64, 80))
        im.alpha_composite(ferret, (372 - 32, EXAMPLE["ledge_row"] * T - 80))
    if hud:
        use = Image.open(f"{SPRITES}/ui-touch-use.png").convert("RGBA").crop((0, 0, 51, 51))
        jump = Image.open(f"{SPRITES}/ui-touch-jump.png").convert("RGBA").crop((0, 0, 57, 57))
        for s in range(2):
            im.alpha_composite(use, (s * W + 591, 219))
            im.alpha_composite(jump, (s * W + 648, 288))
    return im.convert("RGB")


# One example lobby for the preview only, 720x720 (60x60 tiles, two screens tall), built to the reaches: a hop
# rises 3 tiles, a full jump 8, a flutter crosses a gap of 20. One-way rows: (style, row, first col, width).
LOBBY_EXAMPLE = dict(
    ledges=[("cushion", 53, 15, 8), ("cushion", 50, 15, 8), ("desk", 48, 26, 10), ("shelf", 48, 40, 7),
            ("shelf", 40, 40, 7), ("shelf", 32, 40, 7), ("shelf", 24, 40, 7), ("balcony", 24, 0, 20)],
    exit=(4, 9), post=58,
    runs=[("lobby-wall", 0, 720), ("lobby-balustrade", 0, 240)],
    pieces=[("lobby-front-door", 12), ("lobby-sofa", 168), ("lobby-desk", 312), ("lobby-bookcase", 480),
            ("lobby-window", 576), ("lobby-plant", 640), ("lobby-lamp", 288), ("lobby-lamp", 384)],
    ys={"lobby-balustrade": 288},
)


def lobby_example(chars=True, hud=True):
    from PIL import Image

    E = LOBBY_EXAMPLE
    tiles = {name: frame_image(g.px) for name, g in lobby_tiles()[0]}
    pieces = {k: frame_image(fn().px) for k, (fn, _, _) in BACKDROP_DEFS.items() if k.startswith("lobby-")}
    ys = {k: E["ys"].get(k, y) for k, (_, y, _) in BACKDROP_DEFS.items()}
    im = Image.new("RGBA", (720, LOBBY_H), rgb("ink") + (255,))
    for key, x0, x1 in E["runs"]:
        p = pieces[key]
        for x in range(x0, x1, p.width):
            q = p.crop((0, 0, min(p.width, x1 - x), p.height))
            im.alpha_composite(q, (x, ys[key] - q.height))
    for key, x in E["pieces"]:
        p = pieces[key]
        im.alpha_composite(p, (x, ys[key] - p.height))
    ground = LOBBY_FY // T
    for r in range(ground, LOBBY_H // T):
        for c in range(60):
            im.alpha_composite(tiles["floor-top-joint" if c % 2 else "floor-top"] if r == ground else
                               tiles["floor-face"], (c * T, r * T))
    for style, row, c0, w in E["ledges"]:
        for c in range(c0, c0 + w):
            k = "-left" if c == c0 else "-right" if c == c0 + w - 1 else ""
            im.alpha_composite(tiles[f"one-way-{style}{k}"], (c * T, row * T))
    pc = E["post"]
    for r in range(ground):
        for c, side in ((pc, "left"), (pc + 1, "right")):
            im.alpha_composite(tiles[f"post-{'base-' if r == ground - 1 else ''}{side}"], (c * T, r * T))
    ec, er = E["exit"]
    for j in range(15):
        for i in range(7):
            im.alpha_composite(tiles[f"exit-{j * 7 + i}"], ((ec + i) * T, (er + j) * T))
    if chars:
        duck = Image.open(f"{SPRITES}/duck.png").convert("RGBA").crop((0, 0, 48, 42))
        im.alpha_composite(duck, (150 - 24, LOBBY_FY - 42))
        ferret = Image.open(f"{SPRITES}/ferret.png").convert("RGBA").crop((0, 0, 64, 80))
        im.alpha_composite(ferret, (200 - 32, 24 * T - 80))
    if hud:
        use = Image.open(f"{SPRITES}/ui-touch-use.png").convert("RGBA").crop((0, 0, 51, 51))
        jump = Image.open(f"{SPRITES}/ui-touch-jump.png").convert("RGBA").crop((0, 0, 57, 57))
        for top in (0, 360):
            im.alpha_composite(use, (591, top + 219))
            im.alpha_composite(jump, (648, top + 288))
    return im.convert("RGB")


def preview(out):
    from PIL import Image

    strip = example_strip()
    sheets = []
    for _, fn in TILESET_DEFS:
        tiles, _ = fn()
        ts = tileset_image(tiles)
        bg = Image.new("RGBA", ts.size, rgb("dslate") + (255,))
        bg.alpha_composite(ts)
        sheets.append(bg.convert("RGB").resize((ts.width * 4, ts.height * 4), Image.NEAREST))
    lobby = lobby_example()
    gap = 16
    low = strip.height + gap
    sheet = Image.new("RGB", (strip.width, low + max(lobby.height, sum(s.height + gap for s in sheets))),
                      rgb("ink"))
    sheet.paste(strip, (0, 0))
    sheet.paste(lobby, (0, low))
    y = low
    for s in sheets:
        sheet.paste(s, (lobby.width + gap, y))
        y += s.height + gap
    sheet.save(out)


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "preview":
        preview(sys.argv[2])
    elif len(sys.argv) == 2 and sys.argv[1] == "build":
        build()
    else:
        sys.exit(__doc__)
