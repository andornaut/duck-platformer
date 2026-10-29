#!/usr/bin/env python3
"""UI art: the dialogue box, choices, quip strip, touch buttons and settings card, at the 720x360 base resolution.

Usage:
  ui.py build             write art/ui/<key>.aseprite and public/art/sprites/<key>.png + .json, list them in the
                          manifest
  ui.py preview OUT.png   a contact sheet of every frame

Run from the repository root. Text is never baked in: the game sets it with font-body or font-title at 2x. A text
origin below is a BitmapText's top-left at scale 2, and A is the text's advance width at 2x (the sum of xadvance,
doubled). Positions are in base pixels, top-left of the frame, matching the layout in art/README.md.

Nine-slice textures carry their margins (left, top, right, bottom) as an Aseprite slice named after the key and as
"slice" in the manifest entry. Single-state art has one tag, "rest", at 100ms. The touch buttons' press tag
plays once and holds its last frame (the manifest's "once") until the game shows the held tag; every other tag
loops.

Dialogue
- ui-dialogue-box, 640x96, at 40,256. Navy, ink border with cut corners, slate rim top-left, dslate bottom-right.
  Body text cream, origin 128,268, 504 wide, lines every 20.
- ui-portrait-frame, 68x68, at 48,270. Recessed dslate well; the 64px portrait goes at 50,272.
- ui-name-tab, nine-slice 12x20, margins 2,2,2,2; tags amber, green, pink, tan (the fill; one per speaker). Drawn
  A+12 wide at 124,237, so its bottom row lies on the box's top border. Name ink, origin x+6, y 234.
- ui-forward-mark, 10x14, at 653,323 (centred in the 636,308,44,44 hit area). Tag idle: the triangle steps right
  0, 2, 3, 2px over 1800, 80, 160, 80ms. Reduced motion shows frame 0.
- ui-skip, 78x20, at 634,8 (hit 634,8,78,44). Tags normal, pressed (dslate, rim inverted), disabled (flat, no
  rim, the double chevron becomes a bar). Label SKIP origin 643,5: cream, or grey when disabled.
- ui-answer, 208x36, hit 208x44 from row top y 192, so the art sits at y 196, 8 apart. Three at x 40, 256, 472
  (spanning the box); two at x 148, 364. Tags normal (dslate), selected (cream with an ink cursor), pressed (tan
  with the cursor). Text origin x+19, y 205, at most 166 wide: cream when normal, ink otherwise.

Quip
- ui-quip-strip, nine-slice 12x24, margins 2,2,2,2. Drawn An+Ab+24 wide (An the name, Ab the line), at most 452,
  centred on x 360 at y 8 (within 138..590). Name in font-title in the speaker's tab colour, origin x+9, y 7;
  line cream in font-body, origin x+15+An, y 11.

Touch controls (two round buttons for the right thumb and a pause button at the top left; movement has no art)
- ui-touch-use, 51x51, centre pixel 25,25: top-left 591,219 for the centre 616,244 (hit 568,200,152,80).
- ui-touch-jump, 57x57, centre pixel 28,28: top-left 648,288 for the centre 676,316 (hit 568,280,152,80).
- Each is an opaque disc: an ink edge, a 2px cream ring and a navy face, 49px across for Use and 55px for Jump,
  with its icon above the centre: three dots (19x5) on Use with their top 9px above the centre, a caret (17x9) on
  Jump with its top 12px above. Tags rest (100ms); press, once (frame 0 the ring turns white and thickens to 3px,
  the face lifts to dslate and the whole disc swells 1px; frame 1 the same at rest size; 60ms each); held (as
  press frame 1, 100ms).
- ui-pause, 35x35, centre pixel 17,17: top-left 9,9 for the centre 26,26 (hit 0,0,52,52, reaching the screen's
  corner). The same disc, 33px across, with two pause bars (11x13, each 4 wide, 3 apart) centred on the centre;
  no label. Tags as for Use and Jump: rest; press, once (2 frames at 60ms, frame 0 swells 1px); held.
- Label "Use" or "Jump" in font-body at 2x, never baked in: centred on the button's centre x (origin x = centre x
  minus half the label's visible width, rounded down), origin y = centre y - 3, so the capitals sit on rows
  centre+1 to centre+10. Use: origin 604,241; Jump: origin 659,313. Cream at rest, white while pressed or held.

Pause card (over the game dimmed two ramp steps)
- ui-settings-card, nine-slice 16x48, margins 2,38,2,2: a cream border with cut corners, an ink header 36 high and
  a navy body. Drawn 368x236 at 176,88. Title "Paused" (font-title, so PAUSED) cream, origin 190,93.
- ui-close, 24x24, at 510,94 (hit 500,88,44,44). Tags normal (cream X), pressed (white X on dslate).
- ui-settings-row, nine-slice 12x48, margins 2,2,2,2, dslate. Two rows, each the hit area for itself:
  - Touch controls, drawn 352x48 at 184,136. Label "Touch controls" cream, origin 228,151; state Shown or Hidden
    cream, its last glyph ending at x 524 (origin 526-A).
  - Quit, drawn 352x48 at 184,188 (4 below). Label "Quit" cream, origin 228,203, white while pressed.
- ui-checkbox, 20x20, at 196,150. Tags off (empty box), on (a green tick).
- ui-quit, 20x20, at 196,202: a doorway with an arrow leaving it, in the checkbox's column. Tags normal (cream),
  pressed (white, the arrow 2px further out).
- ui-resume, 160x44, at 280,264 (the hit area). Tags normal, pressed (the face sinks 2px into its lip). A play
  triangle is drawn in; label Resume ink, origin 339,275, or 339,277 when pressed.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pixel  # noqa: E402
from pixel import Grid, darker  # noqa: E402

SRC = "art/ui"

# Name tab fills, one tag each: hues the panels do not use. Ink text holds at least 6.6:1 on each, and each
# holds at least 5:1 as text on the navy panels, so the quip strip sets the speaker's name in the same colour.
TAB_FILLS = ("amber", "green", "pink", "tan")


def bm(*rows):
    """A bitmap from strings: '#' is set."""
    return [(x, y) for y, r in enumerate(rows) for x, ch in enumerate(r) if ch == "#"]


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
    g = Grid(640, 96)
    panel(g, 0, 0, 640, 96, "navy")
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
    """208x36. Text from x 19; the cursor at 7..13."""
    g = Grid(208, 36)
    if state == "normal":
        panel(g, 0, 0, 208, 36, "dslate", rim=("slate", "navy"))
    else:
        fill = "cream" if state == "selected" else "tan"
        rim = ("white", "tan") if state == "selected" else ("brown", "cream")
        panel(g, 0, 0, 208, 36, fill, rim=rim)
        tri_right(g, 7, 11, 14, "ink")
    return g.px


def quip_strip():
    g = Grid(12, 24)
    panel(g, 0, 0, 12, 24, "navy")
    return g.px


# ---------------------------------------------------------------- touch controls

BUTTON_R = {"use": 24, "jump": 27, "pause": 16}  # disc radius: 49, 55 and 33px across
CARET = [(x, y) for y in range(9) for x in (8 - y, 9 - y, 7 + y, 8 + y)]  # 17x9, 2px strokes
DOT = bm(".###.", "#####", "#####", "#####", ".###.")
DOTS = [(x + i * 7, y) for i in range(3) for x, y in DOT]  # 19x5
BARS = [(x + i * 7, y) for i in range(2) for x in range(4) for y in range(13)]  # 11x13, two pause bars
ICON = {"use": (DOTS, -9), "jump": (CARET, -12), "pause": (BARS, -6)}  # bitmap, top row relative to the centre


def disc(g, cx, cy, r, c):
    for y in range(g.h):
        for x in range(g.w):
            if (x - cx) ** 2 + (y - cy) ** 2 <= (r + 0.5) ** 2:
                g.p(x, y, c)


def touch_button_frame(key, frame=None):
    """frame None is rest; 0 and 1 the press; 2 held. Pressed, the ring turns white and thickens to 3px and the
    face lifts to dslate; frame 0 swells the disc 1px."""
    r = BUTTON_R[key] + (1 if frame == 0 else 0)
    c = BUTTON_R[key] + 1
    hot = frame is not None
    g = Grid(2 * c + 1, 2 * c + 1)
    disc(g, c, c, r, "ink")
    disc(g, c, c, r - 1, "white" if hot else "cream")
    disc(g, c, c, r - (4 if hot else 3), "dslate" if hot else "navy")
    pts, top = ICON[key]
    w = max(x for x, _ in pts) + 1
    stamp(g, pts, c - w // 2, c + top, "white" if hot else "cream")
    return g.px


def touch_button(key):
    return [
        ("rest", [touch_button_frame(key)], 100),
        ("press", [touch_button_frame(key, 0), touch_button_frame(key, 1)], 60),
        ("held", [touch_button_frame(key, 2)], 100),
    ]


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


def quit_icon(state):
    """20x20: a doorway (2px strokes, open on the right) with an arrow leaving through it. Pressed, the arrow
    steps 2px further out and turns white."""
    c, dx = ("white", 2) if state == "pressed" else ("cream", 0)
    g = Grid(20, 20)
    g.rect(1, 1, 12, 2, c)
    g.rect(1, 17, 12, 2, c)
    g.rect(1, 1, 2, 18, c)
    g.rect(11, 1, 2, 5, c)
    g.rect(11, 14, 2, 5, c)
    g.rect(6 + dx, 9, 7, 2, c)
    tri_right(g, 13 + dx, 5, 10, c)
    return g.px


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
    "ui-pause": ("press",),
    "ui-touch-jump": ("press",),
    "ui-touch-use": ("press",),
}


def sprites():
    one = lambda frame, tag="rest": [(tag, [frame], 100)]  # noqa: E731
    yield "ui-answer", [(s, [answer(s)], 100) for s in ("normal", "selected", "pressed")]
    yield "ui-checkbox", [("off", [checkbox(False)], 100), ("on", [checkbox(True)], 100)]
    yield "ui-close", [(s, [close(s)], 100) for s in ("normal", "pressed")]
    yield "ui-dialogue-box", one(dialogue_box())
    yield "ui-forward-mark", [("idle", forward_mark(), [ms for _, ms in FORWARD_STEPS])]
    yield "ui-name-tab", [(c, [name_tab(c)], 100) for c in TAB_FILLS]
    yield "ui-pause", touch_button("pause")
    yield "ui-portrait-frame", one(portrait_frame())
    yield "ui-quit", [(s, [quit_icon(s)], 100) for s in ("normal", "pressed")]
    yield "ui-quip-strip", one(quip_strip())
    yield "ui-resume", [(s, [resume(s)], 100) for s in ("normal", "pressed")]
    yield "ui-settings-card", one(settings_card())
    yield "ui-settings-row", one(settings_row())
    yield "ui-skip", [(s, [skip(s)], 100) for s in ("normal", "pressed", "disabled")]
    yield "ui-touch-jump", touch_button("jump")
    yield "ui-touch-use", touch_button("use")


if __name__ == "__main__":
    pixel.main(sys.argv, sprites, SRC, __doc__, slices=SLICES, once=ONCE)
