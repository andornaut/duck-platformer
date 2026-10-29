#!/usr/bin/env python3
"""Floor 1 art: the hotel's New York street front (brick and brownstone, a day scene) and the hotel lobby, as 12px
tilesets and modular backdrop pieces that the game places from level data. Nothing here is a fixed panorama.

Usage:
  floor1.py build             write public/art/tilesets/<key>.png + .json and public/art/backdrops/<key>.png, and
                              list them in the manifest under "tilesets" and "backdrops"
  floor1.py preview OUT.png   an example 2-screen street ending at the hotel door, composed from the pieces at
                              648x360 per screen with the duck, the ferret and the touch buttons, above both
                              tilesets at 4x

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
  the game puts a Use zone over its piece. Every other tile with art is solid on all sides.
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

tiles-lobby (cream marble, the revised lobby)
- floor-top, floor-top-vein, floor-top-joint (a 2px joint at the right edge), floor-top-left, floor-top-right,
  floor-face, floor-face-left, floor-face-right. Lay floor-top, floor-top-vein, floor-top, floor-top-joint
  repeating: a 48px slab with one vein.
- one-way-ledge-left, one-way-ledge, one-way-ledge-right: a marble shelf, a 7px slab with brackets under the end
  tiles.
- column-cap-left/right, column-left/right, column-vein-left/right, column-base-left/right,
  column-lintel-left/right: green marble, 2 tiles wide, darker than the duck. Alternate column and column-vein
  rows.
- exit (piece, 3x4 tiles, 36x48): the stairwell, an opening with steps rising to the right and a white up-arrow
  on a green sign in its lintel. Tiles exit-0 to exit-11 in row order.

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
- Lobby (unchanged; redone with the lobby): lobby-wall 48x312 (y 312, x), lobby-pilaster 24x192 (y 240),
  lobby-window 72x144 (y 216), lobby-mailboxes 108x84 (y 228), lobby-plant 36x72 (y 312).
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixel  # noqa: E402
from pixel import Grid, darker, rgb  # noqa: E402

T = 12
COLUMNS = 8
W, H = 648, 360
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
    ] + door, {"door": door_rows}


# ---------------------------------------------------------------- lobby tiles

LE = "dbrown"


def floor(kind, mark=""):
    g = Grid(T, T)
    if "t" in kind:
        surface(g, LE, "white", "cream", "tan")
        if mark == "joint":
            R(g, (T - 2, 3, 2, 7, "tan"))
        elif mark == "vein":
            R(g, (2, 5, 3, 2, "tan"), (5, 7, 3, 2, "tan"))
        ends(g, kind, LE, "white", "tan", 1)
        if "r" in kind:
            R(g, (T - 3, 1, 2, 2, "cream"))
        return g
    R(g, (0, 0, T, T, "brown"))
    return ends(g, kind, LE, "tan", "dbrown")


def column(kind, vein=False):
    """Green marble: forest with a dgreen lit band, a teal shade, 2px dgreen veins; tan marble cap, base and
    lintel."""
    left = kind.endswith("l")
    g = R(Grid(T, T), (0, 0, T, T, "forest"))
    if left:
        R(g, (0, 0, 1, T, "ink"), (1, 0, 2, T, "dgreen"))
        if vein:
            R(g, (5, 3, 3, 2, "dgreen"), (8, 5, 3, 2, "dgreen"))
    else:
        R(g, (T - 3, 0, 2, T, "teal"), (T - 1, 0, 1, T, "ink"))
        if vein:
            R(g, (1, 6, 3, 2, "dgreen"), (4, 8, 3, 2, "dgreen"))
    if kind.startswith("cap"):
        R(g, (0, 0, T, 1, LE), (0, 1, T, 2, "cream"), (0, 3, T, 3, "tan"), (0, 6, T, 1, LE))
    if kind.startswith("base"):
        R(g, (0, 4, T, 1, LE), (0, 5, T, 2, "cream"), (0, 7, T, 5, "tan"))
    if kind.startswith("lintel"):
        R(g, (0, 6, T, 1, LE), (0, 7, T, 2, "cream"), (0, 9, T, 2, "tan"), (0, T - 1, T, 1, LE))
    if kind.startswith(("cap", "base", "lintel")):
        R(g, (0, 0, 1, T, LE) if left else (T - 1, 0, 1, T, LE))
    return g


def stairwell():
    """The exit, 36x48: a tan marble frame (12px lintel holding the sign, 4px jambs) round a dark stairwell 26x36
    whose steps rise to the right, and a white up-arrow on dark green."""
    g = Grid(36, 48)
    R(g, (0, 0, 36, 48, LE), (1, 1, 34, 47, "tan"), (1, 1, 34, 2, "cream"), (1, 1, 2, 47, "cream"),
      (32, 3, 2, 45, "brown"), (4, 11, 28, 37, LE), (5, 12, 26, 36, "navy"))
    for i in range(4):
        sx, sy = 7 + i * 6, 41 - i * 7
        R(g, (sx, sy, 31 - sx, 48 - sy, "dslate"), (sx, sy, 31 - sx, 2, "slate"))
    R(g, (5, 12, 26, 3, "ink"), (10, 1, 16, 10, "forest"), (11, 2, 14, 8, "dgreen"))
    for k, (x, w) in enumerate(((17, 2), (16, 4), (15, 6), (14, 8))):
        R(g, (x, 3 + k, w, 1, "white"))
    R(g, (17, 7, 2, 2, "white"))
    return g


def lobby_tiles():
    tiles = [
        ("floor-top", floor("t")), ("floor-top-vein", floor("t", "vein")), ("floor-top-joint", floor("t", "joint")),
        ("floor-top-left", floor("tl")), ("floor-top-right", floor("tr")),
        ("floor-face", floor("")), ("floor-face-left", floor("l")), ("floor-face-right", floor("r")),
        ("one-way-ledge-left", shelf("l", LE, "white", "cream", "tan", "brown", "dbrown")),
        ("one-way-ledge", shelf("m", LE, "white", "cream", "tan", "brown", "dbrown")),
        ("one-way-ledge-right", shelf("r", LE, "white", "cream", "tan", "brown", "dbrown")),
        ("column-cap-left", column("cap-l")), ("column-cap-right", column("cap-r")),
        ("column-left", column("l")), ("column-right", column("r")),
        ("column-vein-left", column("l", True)), ("column-vein-right", column("r", True)),
        ("column-base-left", column("base-l")), ("column-base-right", column("base-r")),
        ("column-lintel-left", column("lintel-l")), ("column-lintel-right", column("lintel-r")),
    ]
    exit_g = stairwell()
    names = []
    for j in range(4):
        row = []
        for i in range(3):
            g = Grid(T, T)
            g.px = [r[i * T:(i + 1) * T] for r in exit_g.px[j * T:(j + 1) * T]]
            name = f"exit-{j * 3 + i}"
            tiles.append((name, g))
            row.append(name)
        names.append(row)
    return tiles, {"exit": names}


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
    """48x312: the dslate wall, a navy cornice at y 44, a navy wainscot from y 240 with a 2px slate rail."""
    return R(Grid(48, 312), (0, 0, 48, 312, "dslate"), (0, 44, 48, 4, "navy"), (0, 240, 48, 72, "navy"),
             (0, 238, 48, 2, "slate"))


def lobby_pilaster():
    return R(Grid(24, 192), (0, 0, 24, 192, "navy"))


def lobby_window():
    """72x144: a tall night window, panes one step from the wall."""
    g = R(Grid(72, 144), (0, 0, 72, 144, "navy"))
    for x, y, h in ((4, 4, 64), (38, 4, 64), (4, 72, 68), (38, 72, 68)):
        R(g, (x, y, 30, h, "dslate"))
    return g


def lobby_mailboxes():
    g = R(Grid(108, 84), (0, 0, 108, 84, "navy"))
    for j in range(4):
        for i in range(5):
            R(g, (4 + i * 21, 4 + j * 20, 16, 16, "dslate"), (8 + i * 21, 9 + j * 20, 8, 2, "navy"))
    return g


def lobby_plant():
    g = R(Grid(36, 72), (6, 48, 26, 24, "plum"), (4, 44, 30, 4, darker("purple")))
    for x, y, w, h, c in ((0, 12, 16, 12, "forest"), (16, 0, 16, 14, "teal"), (10, 18, 22, 26, "teal"),
                          (4, 26, 12, 16, "forest"), (22, 14, 14, 16, "forest")):
        R(g, (x, y, w, h, c))
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
    "lobby-wall": (lobby_wall, FY, "x"),
    "lobby-pilaster": (lobby_pilaster, 240, "none"),
    "lobby-window": (lobby_window, 216, "none"),
    "lobby-mailboxes": (lobby_mailboxes, 228, "none"),
    "lobby-plant": (lobby_plant, FY, "none"),
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
    door=(89, 22),
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
    if chars:
        duck = Image.open(f"{SPRITES}/duck.png").convert("RGBA").crop((0, 0, 48, 42))
        im.alpha_composite(duck, (96 - 24, FY - 42))
        ferret = Image.open(f"{SPRITES}/ferret.png").convert("RGBA").crop((0, 0, 64, 80))
        im.alpha_composite(ferret, (372 - 32, EXAMPLE["ledge_row"] * T - 80))
    if hud:
        use = Image.open(f"{SPRITES}/ui-touch-use.png").convert("RGBA").crop((0, 0, 51, 51))
        jump = Image.open(f"{SPRITES}/ui-touch-jump.png").convert("RGBA").crop((0, 0, 57, 57))
        for s in range(2):
            im.alpha_composite(use, (s * W + 519, 219))
            im.alpha_composite(jump, (s * W + 576, 288))
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
    gap = 16
    sheet = Image.new("RGB", (strip.width, strip.height + gap + max(s.height for s in sheets)), rgb("ink"))
    sheet.paste(strip, (0, 0))
    x = 0
    for s in sheets:
        sheet.paste(s, (x, strip.height + gap))
        x += s.width + gap
    sheet.save(out)


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "preview":
        preview(sys.argv[2])
    elif len(sys.argv) == 2 and sys.argv[1] == "build":
        build()
    else:
        sys.exit(__doc__)
