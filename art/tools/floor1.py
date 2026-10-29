#!/usr/bin/env python3
"""Floor 1 art: the street front (the brick high street, morning) and the building lobby, as 12px tilesets and
modular backdrop pieces that the game places from level data. Nothing here is a fixed panorama.

Usage:
  floor1.py build             write public/art/tilesets/<key>.png + .json and public/art/backdrops/<key>.png, and
                              list them in the manifest under "tilesets" and "backdrops"
  floor1.py preview OUT.png   an example 3-screen layout (street, entrance, lobby) composed from the pieces at
                              648x360 per screen with the duck, the ferret and the touch buttons, above both
                              tilesets at 4x

Run from the repository root.

Tilesets
- A tileset is one PNG of 12x12 tiles in rows of COLUMNS (8), no spacing or margin, transparent where a tile has no
  art, and a JSON beside it:
    {"tileSize": 12, "columns": 8,
     "tiles": {"<name>": <index>, ...},                  index = row * columns + column, every tile named
     "pieces": {"<name>": [[<index>, ...], ...]}}        multi-tile pieces as rows of indices, top row first
  Names are kebab-case. A tile whose name starts with "one-way-" is a one-way ledge: it stops a fall onto its top
  edge and nothing else. Every other tile with art is solid on all sides.
- The manifest lists each as {"key": "<key>", "png": "tilesets/<key>.png", "json": "tilesets/<key>.json"}.
- Walkable surfaces: the walkable edge is the tile's top row. A surface tile has a 1px edge, a 2px light lip and
  a 2px darker underside; the face tiles below it are plainer and darker.

tiles-street (the brick high street, morning)
- sidewalk-top, sidewalk-top-joint (a 2px slab joint at the right edge; alternate them, 24px rhythm),
  sidewalk-top-left, sidewalk-top-right (plain ends, over a drop), kerb-left, kerb-right (a cream stone kerb where
  the sidewalk meets the road, one tile above it), sidewalk-face, sidewalk-face-left, sidewalk-face-right.
- road-top, road: asphalt, one tile below the sidewalk.
- one-way-awning-left, one-way-awning, one-way-awning-right: a green-and-cream canvas awning seen front-on, 4px
  stripes and a scalloped hem, art in the top 11 rows.
- planter-top-left, planter-top, planter-top-right (a clipped hedge: the walkable top), planter-left, planter,
  planter-right (the box). A planter is 2 tiles tall: a 2-tile step.
- post-top, post-base: an iron bollard, 1 tile wide and 2 tall.
- front-wall-left, front-wall-right, front-wall-lintel-left, front-wall-lintel-right: the building front cut in
  section, its street face. With the lobby's column-left/right and column-lintel-left/right it forms a 4-tile
  wide wall whose bottom row (the lintels) is the head of the entrance; the 2 left columns face the street, the 2
  right columns face the lobby.

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
- Street: street-sky 48x48 (y 48, x), street-facade 48x144 (y 192, x: the apartment floors), street-wall 12x120
  (y 312, x: plain brick between shops), street-lamp 24x168 (y 312, none).
- Storefronts, each 120 tall, y 312, none, a whole number of tiles wide: storefront-cafe 144, storefront-florist
  144, storefront-gift-shop 144, storefront-makeup-store 120, storefront-pet-shop 120, storefront-diner 168,
  storefront-noodle-bar 144. Each has a sign board with an icon (never text), a window and a door; a one-way
  awning placed at row 20 (y 240) fits under the board.
- The entrance, a plain open door she walks through: entrance-street 24x48 and entrance-lobby 24x48, y 312, none,
  side by side under the 4-tile front wall (the street piece under its street columns). The street backdrop
  ends and the lobby backdrop begins at the door's centre line, which the two pieces and the wall above cover.
- Lobby: lobby-wall 48x312 (y 312, x: wall, cornice and wainscot), lobby-pilaster 24x192 (y 240, none),
  lobby-window 72x144 (y 216, none), lobby-mailboxes 108x84 (y 228, none), lobby-plant 36x72 (y 312, none).
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

S = dict(edge="dbrown", lip="tan", body="brown", under="dbrown", joint="dbrown", face="dbrown", face_lit="brown",
         face_sh="plum", kerb="cream", kerb_lip="white", kerb_sh="tan", road="navy", road_lip="dslate",
         aw_edge="forest", aw_lip="white", aw_a="dgreen", aw_b="cream", box="brown", box_lip="tan", box_sh="dbrown",
         box_edge="dbrown", post="navy", post_edge="ink", post_lip="slate", post_band="dslate", post_lit="dslate",
         post_sh="ink", wall="brown", wall_lit="tan", wall_band="dbrown", wall_sh="dbrown", wall_edge="plum")


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


def awning(kind):
    g = R(Grid(T, T), (0, 0, T, 1, S["aw_edge"]), (0, 1, T, 2, S["aw_lip"]))
    for x in range(0, T, 4):
        R(g, (x, 3, 4, 5, S["aw_a"] if (x // 4) % 2 == 0 else S["aw_b"]))
    for x in (0, 6):  # scallops: two per tile in 2px clusters
        R(g, (x, 8, 6, 1, S["aw_a"]), (x + 1, 9, 4, 1, S["aw_a"]), (x + 2, 10, 2, 1, S["aw_edge"]))
        for px, py in ((x, 9), (x + 5, 9), (x + 1, 10), (x + 4, 10)):
            g.p(px, py, S["aw_edge"])
    if kind == "l":
        R(g, (0, 0, 1, 9, S["aw_edge"]))
        g.p(0, 0, None)
    if kind == "r":
        R(g, (T - 1, 0, 1, 9, S["aw_edge"]))
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


def post(part):
    g, e = Grid(T, T), S["post_edge"]
    if part == "top":
        R(g, (0, 0, T, 5, S["post"]), (0, 0, T, 1, e), (0, 0, 1, 5, e), (T - 1, 0, 1, 5, e), (0, 4, T, 1, e),
          (1, 1, T - 2, 2, S["post_lip"]), (2, 5, 8, 7, S["post"]), (2, 5, 1, 7, e), (9, 5, 1, 7, e),
          (3, 5, 2, 7, S["post_lit"]), (7, 5, 2, 7, S["post_sh"]), (3, 8, 6, 2, S["post_band"]))
        g.p(0, 0, None), g.p(T - 1, 0, None)
    else:
        R(g, (2, 0, 8, T, S["post"]), (2, 0, 1, T, e), (9, 0, 1, T, e), (3, 0, 2, 8, S["post_lit"]),
          (7, 0, 2, 8, S["post_sh"]), (1, 8, 10, 4, S["post"]), (0, 8, 1, 4, e), (11, 8, 1, 4, e),
          (1, 7, 10, 1, e), (1, 8, 10, 1, S["post_lip"]))
    return g


def front_wall(kind):
    """The building front in section, street face: brick with a 2px course every 12px."""
    left = kind.endswith("l")
    g = R(Grid(T, T), (0, 0, T, T, S["wall"]), (0, T - 2, T, 2, S["wall_band"]))
    if left:
        R(g, (0, 0, 1, T, S["wall_edge"]), (1, 0, 2, T - 2, S["wall_lit"]))
    if kind.startswith("lintel"):
        R(g, (0, 4, T, 6, S["wall"]), (0, 4, T, 2, S["wall_band"]), (0, T - 2, T, 1, S["wall_sh"]),
          (0, T - 1, T, 1, S["wall_edge"]))
        if left:
            R(g, (0, 0, 1, T, S["wall_edge"]))
    return g


def street_tiles():
    return [
        ("sidewalk-top", sidewalk("t")), ("sidewalk-top-joint", sidewalk("t", True)),
        ("sidewalk-top-left", sidewalk("tl")), ("sidewalk-top-right", sidewalk("tr")),
        ("kerb-left", kerb("l")), ("kerb-right", kerb("r")),
        ("sidewalk-face", sidewalk("")), ("sidewalk-face-left", sidewalk("l")),
        ("sidewalk-face-right", sidewalk("r")), ("road-top", road(True)), ("road", road(False)),
        ("one-way-awning-left", awning("l")), ("one-way-awning", awning("m")), ("one-way-awning-right", awning("r")),
        ("planter-top-left", planter("tl")), ("planter-top", planter("t")), ("planter-top-right", planter("tr")),
        ("planter-left", planter("l")), ("planter", planter("")), ("planter-right", planter("r")),
        ("post-top", post("top")), ("post-base", post("base")),
        ("front-wall-left", front_wall("l")), ("front-wall-right", front_wall("r")),
        ("front-wall-lintel-left", front_wall("lintel-l")), ("front-wall-lintel-right", front_wall("lintel-r")),
    ], {}


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
}

# kind: width, frame colour, icon colour. Frames are dim (one or two steps below the facade's value) so the
# shops stay behind the play layer; each icon holds 3:1 on the navy board.
SHOPS = {
    "cafe": (144, "plum", "cream"),
    "florist": (144, "teal", "green"),
    "gift-shop": (144, "navy", "pink"),
    "makeup-store": (120, "purple", "pink"),
    "pet-shop": (120, "navy", "tan"),
    "diner": (168, "plum", "cream"),
    "noodle-bar": (144, "teal", "tan"),
}


def street_sky():
    return R(Grid(48, 48), (0, 0, 48, 48, "blue"))


def street_facade():
    """Apartment floors, 48x144: dark-brown brick, a plum cornice on top and at the bottom, two dark windows with
    brown sills."""
    g = R(Grid(48, 144), (0, 0, 48, 144, "dbrown"), (0, 0, 48, 4, "plum"), (0, 138, 48, 6, "plum"))
    for wy in (16, 80):
        R(g, (10, wy, 28, 40, "plum"), (12, wy + 2, 24, 34, "navy"), (23, wy + 2, 2, 34, "plum"),
          (8, wy + 38, 32, 4, "brown"))
    return g


def street_wall():
    return R(Grid(12, 120), (0, 0, 12, 120, "dbrown"))


def street_lamp():
    """A street lamp, 24x168: an ink post and head with the bulb lit (white core, cream ring); no glow baked in."""
    g = R(Grid(24, 168), (10, 6, 4, 162, "ink"), (4, 2, 16, 6, "ink"), (6, 8, 12, 4, "cream"), (8, 8, 8, 2, "white"),
          (7, 160, 10, 8, "ink"))
    return g


def icon(g, kind, x, y, c, s=2):
    for j, row in enumerate(ICONS[kind]):
        for i, ch in enumerate(row):
            if ch == "#":
                R(g, (x + i * s, y + j * s, s, s, c))


def storefront(kind):
    """A storefront, w x 120: a frame in the shop's colour, a navy sign board with its icon, a window with two 4px
    reflections, a door on the right and a kickplate. The board sits above y 240, where an awning goes."""
    w, frame, ic = SHOPS[kind]
    edge = darker(frame)
    g = R(Grid(w, 120), (0, 0, w, 120, frame), (0, 0, w, 2, edge),
          (8, 6, w - 16, 28, "ink"), (10, 8, w - 20, 24, "navy"),
          (8, 44, w - 52, 64, edge), (10, 46, w - 56, 60, "dslate"), (14, 50, 4, 30, "slate"), (22, 50, 4, 14, "slate"),
          (w - 40, 44, 32, 76, edge), (w - 38, 46, 28, 74, darker(frame)), (w - 34, 50, 20, 26, "dslate"),
          (8, 108, w - 52, 12, edge))
    icon(g, kind, w // 2 - 11, 9, ic)
    return g


def entrance(side):
    """The open front door, two 24x48 pieces under the front wall. Street side: the brick jamb and the dark hall
    beyond with a doormat. Lobby side: the door leaf swung open against the cream marble jamb."""
    g = Grid(24, 48)
    if side == "street":
        R(g, (0, 0, 24, 48, "navy"), (0, 0, 4, 48, S["wall"]), (0, 0, 1, 48, S["wall_edge"]),
          (1, 0, 2, 48, S["wall_lit"]), (4, 0, 20, 3, "ink"), (6, 44, 18, 4, "plum"), (6, 44, 18, 1, "dbrown"))
    else:
        R(g, (0, 0, 24, 48, "navy"), (0, 0, 24, 3, "ink"), (0, 44, 8, 4, "plum"), (0, 44, 8, 1, "dbrown"),
          (8, 2, 10, 46, "forest"), (8, 2, 2, 46, "dgreen"), (16, 2, 2, 46, "teal"), (8, 2, 10, 1, "teal"),
          (11, 6, 4, 14, "teal"), (11, 26, 4, 16, "teal"), (10, 24, 2, 2, "tan"),
          (18, 0, 6, 48, "cream"), (18, 0, 2, 48, "white"), (22, 0, 2, 48, "tan"), (23, 0, 1, 48, LE))
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
    "street-sky": (street_sky, 48, "x"),
    "street-facade": (street_facade, 192, "x"),
    "street-wall": (street_wall, FY, "x"),
    "street-lamp": (street_lamp, FY, "none"),
    **{f"storefront-{k}": ((lambda k=k: storefront(k)), FY, "none") for k in SHOPS},
    "entrance-street": ((lambda: entrance("street")), FY, "none"),
    "entrance-lobby": ((lambda: entrance("lobby")), FY, "none"),
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
    for name, entries in (("tilesets", tilesets), ("backdrops", backdrops)):
        merged = {e["key"]: e for e in manifest.get(name, [])}
        merged.update({e["key"]: e for e in entries})
        manifest[name] = sorted(merged.values(), key=lambda e: e["key"])
    with open(pixel.MANIFEST, "w") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")
    print("built", ", ".join(k for k, _ in TILESET_DEFS), "and", len(backdrops), "backdrops")


# ---------------------------------------------------------------- preview: an example layout

# One example of level data, in tiles (x) and pieces, for the preview only: three screens, street, entrance and
# lobby. The game's level data decides the real street's length and contents.
COLS, ROWS = 3 * W // T, H // T
GROUND = FY // T
LAYOUT = dict(road=5, planters=[(10, 4), (60, 4)], posts=[29, 68], awnings=[(17, 6), (35, 6), (75, 4)],
              front=79, lobby_from=81, dais=(112, 6), ledges=[(120, 6), (138, 6)], ledge_row=20, exit=(145, 22),
              column=160)


def example_map():
    L = LAYOUT
    m = [["." for _ in range(COLS)] for _ in range(ROWS)]
    for r in range(GROUND, ROWS):
        for c in range(COLS):
            if c < L["road"]:
                if r > GROUND:
                    m[r][c] = "R"
            else:
                m[r][c] = "M" if c >= L["lobby_from"] else "#"
    for c0, w in L["planters"]:
        for r in (GROUND - 2, GROUND - 1):
            for c in range(c0, c0 + w):
                m[r][c] = "P"
    for c in L["posts"]:
        for r in (GROUND - 2, GROUND - 1):
            m[r][c] = "B"
    for c0, w in L["awnings"]:
        for c in range(c0, c0 + w):
            m[L["ledge_row"]][c] = "="
    for r in range(GROUND - 4):
        for c in range(L["front"], L["front"] + 4):
            m[r][c] = "F"
    c0, w = L["dais"]
    for r in (GROUND - 2, GROUND - 1):
        for c in range(c0, c0 + w):
            m[r][c] = "M"
    for c0, w in L["ledges"]:
        for c in range(c0, c0 + w):
            m[L["ledge_row"]][c] = "~"
    for r in range(GROUND):
        for c in (L["column"], L["column"] + 1):
            m[r][c] = "C"
    return m


def example_tile(m, c, r):
    def at(cc, rr):
        if cc < 0 or cc >= COLS:
            return "#"
        if rr < 0:
            return "."
        return m[rr][cc] if rr < ROWS else "#"

    solid = "#RMPBFC"
    ch = m[r][c]

    def kind(same=None):
        cover = (lambda x: x in same) if same else (lambda x: x in solid)
        return ("" if cover(at(c, r - 1)) else "t") + ("" if cover(at(c - 1, r)) else "l") + \
            ("" if cover(at(c + 1, r)) else "r")

    if ch == "#":
        k = kind()
        if k == "tl" and at(c - 1, r + 1) == "R":
            return "kerb-left"
        if "t" in k:
            return {"t": "sidewalk-top-joint" if c % 2 else "sidewalk-top", "tl": "sidewalk-top-left",
                    "tr": "sidewalk-top-right"}[k]
        return {"": "sidewalk-face", "l": "sidewalk-face-left", "r": "sidewalk-face-right"}[k]
    if ch == "R":
        return "road-top" if at(c, r - 1) != "R" else "road"
    if ch == "M":
        k = kind()
        if "t" in k:
            return {"t": ("floor-top", "floor-top-vein", "floor-top", "floor-top-joint")[c % 4],
                    "tl": "floor-top-left", "tr": "floor-top-right"}[k]
        return {"": "floor-face", "l": "floor-face-left", "r": "floor-face-right"}[k]
    if ch == "P":
        k = kind("P")
        return {"tl": "planter-top-left", "t": "planter-top", "tr": "planter-top-right", "l": "planter-left",
                "": "planter", "r": "planter-right"}[k]
    if ch == "B":
        return "post-top" if at(c, r - 1) != "B" else "post-base"
    if ch in "=~":
        base = "one-way-awning" if ch == "=" else "one-way-ledge"
        return base + ("-left" if at(c - 1, r) != ch else "-right" if at(c + 1, r) != ch else "")
    if ch == "F":
        i = c - LAYOUT["front"]
        side = "left" if i % 2 == 0 else "right"
        lintel = r == GROUND - 5
        if i < 2:
            return f"front-wall-{'lintel-' if lintel else ''}{side}"
        return f"column-{'lintel-' if lintel else 'vein-' if r % 2 else ''}{side}"
    if ch == "C":
        side = "left" if c == LAYOUT["column"] else "right"
        return f"column-{'base-' if r == GROUND - 1 else 'vein-' if r % 2 else ''}{side}"
    return None


def example_strip(chars=True, hud=True):
    from PIL import Image

    tiles = {}
    for _, fn in TILESET_DEFS:
        for name, g in fn()[0]:
            tiles[name] = frame_image(g.px)
    pieces = {k: frame_image(fn().px) for k, (fn, _, _) in BACKDROP_DEFS.items()}
    ys = {k: y for k, (_, y, _) in BACKDROP_DEFS.items()}
    seam = (LAYOUT["front"] + 2) * T
    im = Image.new("RGBA", (3 * W, H), rgb("ink") + (255,))

    def place(key, x):
        p = pieces[key]
        im.alpha_composite(p, (x, ys[key] - p.height))

    def run(key, x0, x1):
        w = pieces[key].width
        for x in range(x0, x1, w):
            p = pieces[key].crop((0, 0, min(w, x1 - x), pieces[key].height))
            im.alpha_composite(p, (x, ys[key] - p.height))

    run("street-sky", 0, seam)
    run("street-facade", 0, seam)
    run("street-wall", 0, seam)
    place("street-lamp", 336)
    for key, x in (("storefront-cafe", 168), ("storefront-florist", 384), ("storefront-gift-shop", 600),
                   ("storefront-pet-shop", 768)):
        place(key, x)
    run("lobby-wall", seam, 3 * W)
    for x in range(seam + 64, 3 * W, 160):
        place("lobby-pilaster", x)
    for x in (seam + 280, seam + 760):                  # props centred between the pilasters
        place("lobby-window", x)
    place("lobby-mailboxes", seam + 102)
    for x in (seam + 458, seam + 618):
        place("lobby-plant", x)
    place("entrance-street", LAYOUT["front"] * T)
    place("entrance-lobby", seam)
    ex, ey = LAYOUT["exit"]
    m = example_map()
    for r in range(ROWS):
        for c in range(COLS):
            name = example_tile(m, c, r)
            if name:
                im.alpha_composite(tiles[name], (c * T, r * T))
    for j in range(4):
        for i in range(3):
            im.alpha_composite(tiles[f"exit-{j * 3 + i}"], ((ex + i) * T, (ey + j) * T))
    if chars:
        duck = Image.open(f"{SPRITES}/duck.png").convert("RGBA").crop((0, 0, 48, 42))
        im.alpha_composite(duck, (96 - 24, FY - 42))
        ferret = Image.open(f"{SPRITES}/ferret.png").convert("RGBA").crop((0, 0, 64, 80))
        im.alpha_composite(ferret, (912 - 32, LAYOUT["ledge_row"] * T - 80))
    if hud:
        use = Image.open(f"{SPRITES}/ui-touch-use.png").convert("RGBA").crop((0, 0, 51, 51))
        jump = Image.open(f"{SPRITES}/ui-touch-jump.png").convert("RGBA").crop((0, 0, 57, 57))
        for s in range(3):
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
    hgt = strip.height + gap + max(s.height for s in sheets)
    sheet = Image.new("RGB", (strip.width, hgt), rgb("ink"))
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
