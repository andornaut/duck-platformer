# Art

The art plan and pipeline for Duck Platformer. Art owns `art/` and the served art directory, `public/art/`.

## Direction

- Pixel art: minimalist, cute, a little retro, refined.
- Everything, UI included, is pixel art at one base resolution, 720x360. The game scales it to fill the screen at 2:1 with nearest-neighbour sampling and no smoothing, by a fractional factor, so on most screens some pixels come out one device pixel wider than others. On a landscape phone 1 base pixel is about 1 CSS pixel. Judge art at a fractional scale as well as at 3x, and avoid 1px patterns (checks, dashes, alternating rows) that turn uneven when pixels vary in width.
- Chibi proportions: the head at least as big as the body, so a character reads from head shape and markings alone.
- Style decisions are the user's (see Options and decisions).

## Zone design guide

- Accents: reserve amber for doors and small points of interest. Other hues add restrained foliage, signs and character details. Red contact edges always mean danger in every theme.
- Colour: each zone has one dominant family, carried through its atmosphere and architecture. The street uses pale blue and slate; the park uses peach and tan. Keep distant colours close to the sky and spend saturation on a few useful accents.
- Detail: distant scenery uses broad silhouettes without window grids. Near architecture uses sparse window groups and quiet surfaces. Avoid repeated stripes and single-pixel texture that compete with the duck.
- Layouts: the first level has a fixed layout. Every subsequent level is randomized, including the final level. Reusable tiles, scenery and gameplay chunks assemble independently; a background image never encodes a required route. Levels are at most two screens tall (720px, 60 rows).
- Obstacles: use ledges, cliffs, walls and ceilings. Short-clearance jumps and full-height jumps share the same visual vocabulary. Ladders are not part of the obstacle set. Difficulty and jump requirements belong to gameplay data, with variation around a common configurable difficulty.
- Readability: safe walkable tops use a dark edge and a bright two-pixel lip. On darker scenery the lip holds at least 2:1 against its backdrop; against a pale sky the dark edge supplies the separation, so retain both parts of the edge. Dangerous faces instead use the shared red band, without spikes or a safe light lip. Text keeps 4.5:1 and meaningful UI marks 3:1 contrast.

### Parallax building blocks

Sky, distant skyline and middle-distance scenery are separate repeating images. Architecture that supports a ledge, and every attached door, railing or other prop, stays on the same plane as terrain. All physical surfaces move together, so the art never suggests that a landing slides away from its building.

The design starts with horizontal camera factors of 0 for sky, 0.15 for the far skyline, 0.4 for middle scenery and 1 for play. Gameplay owns the runtime values; initial far and middle vertical factors are 0.05 and 0.15. Vertical movement should be weaker on distant layers to keep climbs legible. Windows between near buildings reveal the distant layers; do not fill every opening with foreground decoration. Repeating layers must cover camera travel without exposing an empty edge.

## Process: critique and revise

Every asset goes through 2 to 4 loops of render, critique against the checklist, and revise, until nothing on the checklist fails. A higher quality bar means more loops, not one bigger pass.

### Rendering for critique

- Judge every piece at the size it is shown, never zoomed. Anything that scales is judged at its smallest size.
- Render each candidate at 1x and 3x (nearest neighbour), and composited into a real game frame: the actual screen, on the actual ground, beside the neighbouring objects it must be told apart from.

### Checklist

In order:

1. Silhouette: filled solid black, it still says what it is. Fix the shape before any detail.
2. Value: in greyscale, the subject separates from its ground, and its main parts (head and body, rider and mount) separate by lightness, not only by hue.
3. Colour budget: about 6 to 8 fills plus the outline and rim, with one accent. Merge near-duplicate shades.
4. Detail budget: clusters of 2px or more at the smallest size. No single-pixel noise, speckle or dithering on small sprites, and no texture that shimmers when it scrolls.
5. Focal point: one per sprite, card or screen. Background and filler sit lower in contrast and saturation.
6. Clean lines: a closed 1px outline, no doubled or broken edges, no orphan pixels, no jaggy curves, and one light direction everywhere (top-left).
7. Consistency across the set: proportions, outline weight, palette, facing and detail density.
8. Look-alikes: a hazard never reads as a pickup. Pickup shapes and colours are reserved; a round gold or orange blob reads as a coin.

### Options and decisions

- Mock 2 to 4 clearly different options, side by side in context with the current one first, and ask the user with a recommendation and one reason. Build only the pick.
- Mocks live in scratch, never in the repo.

### Subagents

- One subagent per asset or item, in its own worktree and branch. Its brief carries the checklist, the neighbours to compare against, and the render-in-context requirement.
- Its report gives sizes, tags and timings, anything code needs (hit boxes, light anchor pixels), and a contact sheet.

### Rebuild discipline

- After a refactor or rename, confirm every other output is byte- or pixel-identical, and restore any file a build re-saved with no change.
- When the game's layout or camera changes, rebuild whatever derives from it, then check the joins in a real capture.

## Pipeline

- All art is drawn by Python scripts, never by hand in an editor: `art/tools/<set>.py`, each with `build` and `preview OUT.png` commands.
- A shared module holds the grid (rect, ellipse, line, cel shading, outline pass), the palette with ramp names, and the export.
- A build writes the Aseprite sources (`art/<set>/<key>.aseprite`) and exports them as PNG plus JSON, with Aseprite tags for animations, to `public/art/sprites/<key>.png` and `.json`.
- Change the script, never the `.aseprite`: a build overwrites it.
- Each script's docstring is its spec: every asset's size, tags, frame timings and placement.
- Every manifest sprite entry has `once`: the tags that play once and hold their last frame, `[]` when none. Every other tag loops. A script declares them in a `ONCE` dict beside its `sprites()`.
- A sprite with a hit box carries `hitbox` in its manifest entry, `{"x", "y", "width", "height"}` in frame pixels for the facing it is drawn in. A script declares them in a `HITBOX` dict beside `ONCE`; only sprites that declare one have it, and a box outside the frame fails the build.
- A nine-slice texture carries its margins as an Aseprite slice named after its key and as `slice` in its manifest entry.
- `art/tools/fonts.py` rasterizes the fonts in `art/fonts/` into BMFonts in `public/art/fonts/`, white for tinting: printable ASCII and the middle dot (·).
- `art/tools/palette.py` writes `public/art/palette.json`, listed under `data` in the manifest: `colours` maps each palette name to `#rrggbb`, `darker` maps each colour one ramp step down, and `dim2` two steps down, the settings card's dim. Keys are sorted.
- `art/tools/icons.py` draws the favicon and app icons, the duck on a sky-blue sunburst disc (whole from 32px up, her head and back at 16px on flat sky, where the rays do not hold), as plain PNGs, not sprites or manifest entries: `public/favicon.ico` (16 and 32), `public/art/favicon-16.png` and `public/art/favicon.png`, and in `public/icons/` the 180 apple-touch icon on a full-bleed sunburst square, the 192 and 512 icons on a sunburst disc with a transparent outside, and a 512 maskable icon with the subject inside the central 80%. The 16 and 32 are drawn natively; the larger icons are 64 and 90 drawings scaled by whole numbers.
- `art/inventory.md` lists every asset (key, type, size, tags).
- `art/tools/floor<n>.py` draws one zone's tilesets and backdrop pieces as plain PNGs, not Aseprite sprites, so the game builds each zone from level data instead of a fixed panorama (`floor1.py` draws Zone 1). A chunk theme has its own module, such as `art/tools/park.py`, with the same `build` and `preview OUT.png` commands; each tool merges its own keys into the manifest's `tilesets` and `backdrops` and keeps the others.
- A tileset is `public/art/tilesets/<key>.png`, 12x12 tiles in rows of 8 with no spacing or margin, plus `<key>.json`: `{"tileSize": 12, "columns": 8, "tiles": {"<name>": <index>}, "pieces": {"<name>": [[<index>, ...], ...]}, "hitboxes": {"<name>": {"x", "y", "width", "height"}}}`. An index counts row by row. A piece is a multi-tile unit as rows of indices, top row first. `hitboxes` is optional and written only when a tile has one: a `hazard-*` tile's hit box in pixels within its 12x12 tile, the same shape as a sprite's `hitbox`. A tile without an entry hits its whole cell. `pixel.write_tileset` writes every tileset. A tile named `one-way-*` is a one-way ledge, which stops only a fall onto its top edge. A tile named `door-*` or `exit-*` is a doorway with no collision. A doorway leads only to a room: where the level gives it one, the game puts a Use zone over its piece. A zone is cleared at its right edge, never through a doorway. A tile named `pit-*` is a pit with no collision, so she falls through it and out of the level. A tile named `hazard-*` has no collision and is drawn for a hazard instance placed with a width: touching its hit box restarts her. Every other tile with art is solid. The manifest lists each under `tilesets` as `{"key", "png", "json"}`.
- A backdrop piece is `public/art/backdrops/<key>.png`, drawn behind the play layer. The manifest lists each under `backdrops` as `{"key", "png", "width", "height", "anchor": "bottom-left", "y", "repeat"}`: its bottom edge sits at world `y`, at an x the level data chooses, and `"repeat": "x"` tiles it across a run while `"none"` places it once.
- Art reads game layout and data from the generated export files the game writes, never from `src/`. The export files are in `shared/export/`. Art writes the shared data files the game reads (`lights.json`, `palette.json`).
- Keys are kebab-case, named after what the player sees. Internal names match displayed names.
- Checks run in a container: the art manifest, art tests that assert every key the game uses exists with its tags, and prettier on the docs. PLACEHOLDER: the image and command.

## Style rules

### Palette

- One fixed house palette, plus a few game-specific ramps that each end on a house colour. The house palette is [Endesga 32](https://lospec.com/palette-list/endesga-32); colour names are the `K` names in `art/tools/pixel.py`.
- Every pixel is fully opaque or fully transparent.
- Each colour has a one-step-darker mapping (its ramp). Shadows and dimming step each colour down its ramp, never blend with black.
- Greys (lgrey, grey) may be used for environment scenery and characters. Disabled UI keeps its own treatment: greyed with the grey ramp and changed in shape, so it stays recognisable.

### Outlines

- Outlines are coloured: two ramp steps darker than the fill they border.
- Against the play ground, keep stepping down the ramp until the outline holds 3:1 contrast on every ground it can appear on.
- A dark area takes a light rim on its top-left-facing edges, so it separates from dark ground.
- Faces and portraits take one ink outer line.
- Effects take a fixed 1px rim instead of a ramp outline.

### Shading and faces

- Cel shading: per material a light, a base and a shade. The shade is a crescent along the lower-right rim that follows the form, never a diagonal plane or per-pixel texture.
- Markings are a few flat patches.
- Front-facing faces stay clean: flat skin with at most a 1px shadow down one side.
- Eyes are matched pairs, at least 3x3 at small sizes.

### Sizes

- Draw on a small design grid, then rasterize at a fixed scale. Shapes scale; 1px lines and single pixels stay 1px.
- Feet sit on the frame's bottom rows.
- Size classes step evenly. Draw each to a target inked area, not just a frame size, so small and large read as distinct steps.

| Sprite          | Frame                        |
| --------------- | ---------------------------- |
| Duck            | 48x42                        |
| Duck portrait   | 64x64                        |
| Ferret          | 64x80                        |
| Ferret portrait | 64x64                        |
| Pigeon          | 22x22                        |
| Pug             | 44x32                        |
| Pedestrian      | 34x50 (cat), 36x50 (raccoon) |

### Text

- Fonts: `font-body` (Tiny5, mixed case) for body text, dialogue and quips; `font-title` (Silkscreen, capitals) for titles and names. Button labels use `font-body`, mixed case. Both are native at 8px and drawn at 2x, so a line is 16 base pixels tall. Sprites keep 1px detail.
- Text holds 4.5:1 against what it sits on; essential icons and marks hold 3:1. A state never relies on colour alone.
- Text never shrinks to fit: reword it or grow the box. Each text role keeps one size and one font.
- Words in effects and labels are set in a font, never baked into sprites.
- A backdrop never shows its own place's name; the HUD names it.

## The duck

The protagonist is a wide, round, cream-coloured duck, drawn facing right and mirrored for left. `art/tools/duck.py` draws her; its docstring gives every frame's pose, timing and squash and stretch table.

- Shape: a wide, round blob of a body with a small round head set into its top at the front, a square ink dot eye and a short, plain orange bill. Her back dips at the nape, so her round head sits up above the back line, and ends in a short tail tip at the rear. No bow.
- Colour: cream, with tan cel crescents and a white rim light. The wing is a flat tan patch, the feet tiny orange stubs. Dark-slate outline.
- Every jump flutters (a slow, steerable fall), so the flutter is her signature: the wing raised up and back from the top of her back, the body 2px higher, and the feet tucked under her belly.
- Frame 48x42, feet on rows 39 and 40 and the outline on row 41.
- Collision body 24x36 (2x3 tiles), anchored bottom-centre: the frame's bottom edge sits on the body's bottom edge, and her body-centre x, 24 (the frame's centre line, between columns 23 and 24), sits on the body's centre, so mirroring her does not move it.
- Overhang of the 24x36 body at rest: her back and tail 8px on the left, her head and bill 10px on the right, and 2px of the body's height above her head left empty. The raised wing reaches 5px above the body, and the jump crouch and land squash push her tail out to 12px on the left.
- Portrait: 64x64, her head set into the top of her body, facing right, cut off by the bottom edge, with one ink outer line on a transparent ground. The dialogue box's 68x68 frame supplies the backing.

## Logo

The logo is the duck peeking over a big sky-blue DUCK, her head and back showing over its top edge, with PLATFORMER in cream below. `art/tools/logo.py` draws it as plain PNGs on a transparent ground, listed in the manifest under `images` with their sizes: `logo` (360x193, the title screen), `logo-nav` (214x30, the site's nav bar, on one line) and `logo-icon` (53x41, the top of the /play/ page's nav column: her profile alone, no lettering, on the downstroke with the wing level behind her and feet tucked, redrawn at 1.25x).

- The lettering is a 5x7 pixel alphabet drawn bold at a block size, with rounded corners, a light rim, a shade crescent and an ink outline; PLATFORMER takes a 2px blue drop shadow so it holds on a cream ground.
- The title is one string in the script, `WORDMARK`. The alphabet has A C D E F K L M O P R T U, so a new title adds any other letters to `GLYPHS`.

## The ferret

The villain is a champagne ferret standing up on its hind legs in a stovepipe hat and bow tie, a talking animal that schemes against the duck's climb: in dialogue, in quips and through the hazards it sets. It is cute with a touch of slyness (round glinting eyes under a soft lid, a small smile, steepled paws), never scary or cross, and is never fought. `art/tools/ferret.py` draws it; its docstring gives every frame's pose and timing.

- Shape: modelled on a natural ferret rather than a chibi. A long, slinky body stood upright with a small forward arch (a Bezier spine from the low hip to the high neck, stamped as overlapping discs), a small wedge head held level, short dark legs, and a tapering tail touching the ground behind as a third contact point.
- Fur: a champagne (skin1) coat with a skin2 shade crescent along the belly and a cream rim on the back; brown legs and tail with dark-brown far legs; a white face band, a skin2 mask round the eye and a pink nose.
- Eyes: round, 5px across with the corners cut, ink with a 2x2 white glint and a 1px cream glint, under a soft brown lid line that dips at the outer corner. Scheming, the lid drops to half.
- Kept apart from the duck: the coat is 1.24:1 against her cream and the shade 2.12:1, its outline is dark brown where hers is dark slate, its legs, tail and mask sit well below anything on her, and it stands tall where she is round.
- Hat: a tall, narrow plum stovepipe with a dark-brown rim light and a red band. Nothing touches it. Red (the band and bow tie) is the one accent; the hat and bow tie take an ink outline.
- Frame 64x80, facing left (mirrored for right), feet on rows 76 to 78 and the outline on row 79.
- Anchor: the frame's bottom edge sits on the collision box's bottom edge, and its body-centre x, 32 (between columns 31 and 32), sits on the box centre, so mirroring it does not move it.
- Portrait: 64x64, its head and neck facing right towards the text, as the duck's does, cut off by the bottom edge, with one ink outer line on a transparent ground. Neutral, smug (the lid at half) and annoyed (a brow dipped towards the snout).

## UI

The [form control style guide](controls.md) defines standard buttons, selection controls, shared states, spacing and explicit exceptions. The screen layouts below specify their placement.

All positions are in base pixels (x, y, w, h) of the 720x360 layout as drawn. The game derives every press area from the drawn button at runtime: the button plus 25% of its shorter side on each side, clamped between 6 and 16px, and at least 48x48. Use and Jump instead press within 100 of each one's centre (a clear circle of 63 plus the move hint's radius of 37), cut along the line midway between their centres so the two never overlap; Jump's also reaches the screen's bottom-right corner, as the rect from its centre to the corner. Art gives only the drawn rects and centres.

### Dialogue box

- A box at the bottom, 40,256,640,96, with the speaker's 64px portrait in a 68px frame at 48,270 and a name tab on the box's top edge. Two or three speakers use the same box: the portrait and name tab change.
- The name tab's fill is the speaker's colour: amber, green, pink or tan. Ink text holds at least 6.6:1 on each, and each holds at least 5:1 on the box's navy.
- Text area at x 128, y 268, 504 wide, 3 lines at a 20px pitch, one paragraph per box.
- Forward mark 10x14 at 653,323. A tap anywhere or a key also advances. There is no back button and no timer.
- Skip at the top right: mark 634,8,78,20. It runs ahead to the next choice; while a choice shows, it is disabled (greyed with the grey ramp, and changed in shape).
- Choices: a row of two or three answer buttons above the box, each 208x36, 8 apart, row top y 192, at most 166px of text. Three sit at x 40, 256 and 472, spanning the box; two at 148 and 364. The selected answer shows a cursor as well as a fill.
- The touch controls hide while a box is open.

### Quip

A one-line strip at the top centre (x 360), y 8, height 24, sized to its text and at most 452 wide (x 138 to 590), led by the speaker's name in their name-tab colour. It never pauses play and never reaches the lower corners.

### Touch controls

Two round buttons for the right thumb, Use above and to the left of Jump. Each is the move hint's open ring, 73px across with no face: a 2px cream band between 1px ink lines, with its icon centred and fringed in ink, so it holds 3:1 on any ground, the sky and any character. No label. Hidden on desktop and when the setting is off.

| Control | Centre, as drawn | Frame | Ring      | Icon       |
| ------- | ---------------- | ----- | --------- | ---------- |
| Use     | 592,210          | 75x75 | 73px wide | three dots |
| Jump    | 667,307          | 75x75 | 73px wide | caret      |

- Centres are the base 720x360 layout, as drawn. At runtime the game anchors Jump, Use and the pause button to the screen's corners, so on a wide or tall screen they sit in the spare space outside the game.
- Press: the band and icon turn white and the ring swells 1px for the first frame (frame 0, then frame 1, 60ms each), then hold until release, which snaps back to rest.
- Movement: a touch anywhere off a button sets its own neutral point. The move hint (`ui-move-hint`, 75x75) shows where to put the left thumb: an open ring 73px across with no face, a 2px cream band between 1px ink lines and an ink-fringed chevron each side, so it reads on any ground, the sky and any character. It is a drawing only, with no press area. At rest its centre is level with Jump's and its ring as far in from the view's left as Use's is from its right: 121,303 at 720 wide. While a touch moves her, the game draws it on that touch's neutral point, anywhere on screen, lights the dragged side's chevron (`held-left`, `held-right`) and slides its knob (`ui-move-knob`, 11x11) up to 12px left or right; on release it returns to rest.

### Start screen

The game boots into the start screen; Start goes to the map. A nav bar runs across the top with icon buttons at its right, and Start sits below the logo.

- Nav bar `ui-nav-bar`, 0,0,720,48.
- Icon buttons `ui-icon-button`, 36x36 at y 6, each with a 20x20 icon 8 in and 6 down (8 down while pressed). With Exit: Settings at x 632 and Exit at x 676, so Exit is at the far right. Without Exit (Firefox for Android's installed app hides it): Settings alone at x 676.
- Logo (`logo`, 360x193) at 180,60, with Start (`ui-button-primary`, 192x48, dslate with a white label) at 264,268, 15 below it. With saved progress, Restart uses the secondary `ui-button` (grey with an ink label) at 164,268 on the left, and Continue the primary style at 364,268 on the right: both 192x48, with an 8px gap, centred under the logo. Continue remains the default action for keyboard activation. Nav and icon controls keep their separate styles.
- Icons share their shapes with dog-walker-game's: the cog (8 square teeth round a ring with a round hole), the exit (a doorway in 2px strokes, open on the right, with a solid arrow leaving it) and the home (a solid house with a 1:1 pitched roof, a chimney on the right slope and a door gap). Each comes as a 20x20 nav icon and a 16x16 row icon.
- Button labels are centred: origin x = the button's centre x minus floor(ink width / 2), where the ink width is the label's visible width. Start-screen labels begin 13px below the button top and sink 2px while pressed, using the shared text-button press and focus handling. Start and Continue on this screen omit the ink play mark, which does not read on dslate; a light variant remains unimplemented. The map's Continue keeps its existing `ui-resume` art until separately standardized.

### Pause, settings and install cards

A pause button at the top left opens the pause card over the game, which is dimmed by stepping every colour two ramp steps darker. The pause card reads Resume, Settings and Back to title, three buttons of one shape stacked, Resume the primary; Settings opens the settings card over the same dim, and Install opens the install steps card for browsers that install from their own menu. One card shows at a time. Every card is the same frame, 368 wide at 176,88: no header, an lgrey face (pale steel) in an ink border, its title in ink centred near the top (origin y 96) and the close X (24x24 at 510,94, an ink X) at the top right. Text on the face is ink, or dslate for the build label. Rows, as on dog-walker-game's settings card, have no box: each is a 352x48 hit area at x 184, 4px apart, pressed as a whole, with a dslate 16x16 icon at x 198 and an ink label origin at x 228.

- Pause button: a disc 33px across (an ink edge, a 2px cream ring and a navy face, the ring white and 1px thicker and the face a step lighter while pressed), with two pause bars and no label, centred at 24,24 as drawn (35x35 frame, top-left 7,7), its edge 8px in from the game view's top and left. Every control stays inside the view across; Use, Jump and the move hint sit at the screen's bottom, so on a screen taller than 2:1 they move into the bar below, with Jump's ring 8px in from the view's right and 20px up from the bottom, and no drawn edge closer than 8px to the edge it is placed against. It is a touch control: hidden on desktop and while a dialogue box is open. Its press area is the drawn frame grown by the rect rule above.

| Card     | Rect           | Title    | Rows (y)                                                                       | Below the rows                             |
| -------- | -------------- | -------- | ------------------------------------------------------------------------------ | ------------------------------------------ |
| Pause    | 176,88,368,236 | Paused   | buttons 352x48 at x 184: Resume 136 (primary), Settings 188, Back to title 240 |                                            |
| Settings | 176,88,368,236 | Settings | Move controls 136, Action buttons 188, Install 240 (if installable)            | build label centred on x 360, origin y 296 |
| Steps    | 176,88,368,160 | Install  | none: two steps at y 144 and 196                                               |                                            |

- Buttons on a card come in two styles of the same shape, both nine-slices (16x28, margins 2,4,2,6) drawn at any size with an ink label that sinks 2px while pressed: `ui-button-primary` (a dslate face on a navy lip, white label) for the card's main action, first on the card, and `ui-button` (a grey face on a slate lip, ink label, one step darker than the card) for the rest. Neither has an outline, as on dog-walker-game.
- Settings card without Install: 368x184, the build label at origin y 244.
- Move controls and Action buttons rows: two independent toggles, the left hint and the right buttons (Use and Jump), both Shown by default; hiding the hint hides only its drawing. Each row has its icon at 198,y+16 (`icon-move-controls`, `icon-touch-controls`), and `ui-switch` (32x16) at 496,y+16: the knob right with a tick on green when on, left with a cross on slate when off.
- Install row: its icon at 198,256 and a secondary button (`ui-button`, 72x28) at 452,250 whose label the game centres in it, at most 56 wide. The whole row presses it.
- Build label: dslate in `font-body`, centred on x 360, for example "v0.0.1 · dev".
- Keyboard focus: `ui-focus`, a nine-slice ring (margins 4) drawn 4px outside the focused element on every side, at (x-4, y-4, w+8, h+8): a 2px yellow band between 1px ink lines, so it holds 3:1 on the card, the rows, the buttons and the dim. It rings the focused element's face: a settings row (the Install row included), Resume, Start, an answer button, a nav button or the close X (round its 24x24 mark).
- Install steps: each step is a 16x16 glyph at x 198 and up to two lines of text at x 228 (20px pitch, at most 296 wide). Step 1 shows the iOS Share glyph or the browser-menu glyph, whichever the browser uses; step 2 the install glyph.

## Map

The map screen shows the zones and the forks between them as a paper map, after the start screen and after each zone is cleared, with the duck on a zone she may play: the first from the start, then any zone the ones she has completed open, back or on. `art/tools/map.py` draws it; its docstring gives every sprite's states, anchor and placement, and the drawing rules below in full. The game lays the nodes out from the map data, on the 60x30 grid of 12px tiles, centred at (12 col + 6, 12 row + 6).

- Paper: `map-paper`, a nine-slice drawn 720x360 at 0,0: cream with a brown rule 6px in and a tan rule 11px in. The pen marks (`map-hill`, `map-wave`, `map-compass`) are tan sprites the map data places, at least a tile clear of every node, path and label, since the node layout varies with the map.
- Ink is dbrown, the accent dred, unbuilt slate; the pen marks are tan, below the 3:1 of anything that carries meaning. One exception: a built path is brown (2.67:1), a step dimmer than the ink, and its dash pattern carries its state.
- Zone marker `map-zone`, 35x35 centred on the node: normal (a cream disc in a dbrown ring), current (a second dred ring outside), visited (a solid dbrown disc with a tick badge, for a zone she has completed), locked (normal with a dbrown padlock in place of the icon, for a built zone behind one she has not completed) and unbuilt (a broken slate ring round a question mark). Over every state but locked and unbuilt the zone's icon, `map-icon-<zone>` (14x14, tag `normal` or `visited`), sits centred; a zone without one shows `map-icon-zone`, so a new zone needs only its icon.
- Fork marker `map-fork`, 29x29: a hollow dbrown diamond, ringed in dred when current, solid when visited, four slate corner dots when unbuilt. A fork has no label.
- The duck's marker `map-duck` (26x22, `idle` 2 x 400ms) stands on the current node's ring.
- Paths have no art. The game draws each from node to node as a gentle curve (a quadratic Bezier bent 8% of its length, alternating sides), trimmed 3px outside the markers, by stamping squares along it: built a 2px brown dash (6 on, 4 off), opened (by the zones she has completed) a 4px solid dred line, unbuilt 2x2 slate dots every 6px.
- Labels: the zone's name in `font-title` at 2x, plum, centred under its marker: origin (cx - floor((A - 4) / 2) - 2, cy + 12), where A is its advance width at 2x, over a cream knock-out (ox - 2, cy + 17, A + 4, 16) that hides the paths behind it.
- Continue is `ui-resume` at 280,300 and plays the zone she stands on; a tap on an open zone's marker walks her there.
- The celebration screen after the last zone, and the restart card that asks before Restart, are placeholders awaiting art: they reuse the settings card, `ui-button`, `ui-resume` and `ui-focus`.

## Animation

- Motion is in whole pixels. Tag names are the animation names. New tags go after existing ones so frame indices hold.
- Squash and stretch are per-frame tables of height, squash, stretch and shadow size. Volume stays roughly constant, and the contact frame's shadow is the largest. Effects have a clear peak frame.
- Short reactions run 60 to 80ms per frame (shake 60ms, tap burst 4 x 60ms). Anything that opens a modal waits for the tap burst to finish.

### Cycles

| Cycle           | Frames | Timing       | Motion                                                                                     |
| --------------- | ------ | ------------ | ------------------------------------------------------------------------------------------ |
| Idle, character | 2      | 400ms        | Breathing: the body 1px higher on frame 2, feet planted                                    |
| Idle, prop      | 3 to 4 | 2 to 5s loop | Holds the rest pose most of the loop, then steps away and back over 2s or less             |
| Walk, four legs | 4      | 100 to 160ms | Diagonal pairs swap, the body bobs on passing frames, ears lag 1px                         |
| Walk, two legs  | 4      | 100 to 160ms | One foot lifted, passing (both feet down, body 1px higher), the other foot lifted, passing |

- Frame 0 of every idle is the rest pose, and every sprite that stands or waits loops one.
- A prop's idle changes colour in 2px clusters, never as a hard blink, and never brighter than the rest pose.

### Character states

A placed thing has three layers: an archetype (its behaviour), a character (its art, animations, hit box, dialogue and quip pools and quirks) and an instance (one placement). A character's data names its art key and the tag that plays for each state, so every character sprite lists its tags by state (idle, move, react, talk, quirk) in its script docstring and in the table below. A state with no tag of its own says "none" or names the tag it falls back to. A state with more than one tag names each.

| Character          | idle   | move                                         | react                        | talk                       | quirk    |
| ------------------ | ------ | -------------------------------------------- | ---------------------------- | -------------------------- | -------- |
| duck               | `idle` | `walk`; in the air `jump`, `flutter`, `land` | none, falls back to `land`   | none, falls back to `idle` | none     |
| ferret             | `idle` | none, falls back to `idle`                   | none, falls back to `scheme` | `talk`                     | `scheme` |
| frog-courier       | `idle` | `ride`                                       | none, falls back to `idle`   | none, falls back to `idle` | none     |
| pigeon             | `idle` | `fly`                                        | `flee`, then `fly`           | none, falls back to `idle` | none     |
| dog-pug            | `idle` | `walk`                                       | `perk`                       | `talk`                     | none     |
| pedestrian-cat     | `idle` | `walk`                                       | none, falls back to `idle`   | none, falls back to `idle` | none     |
| pedestrian-raccoon | `idle` | `walk`                                       | none, falls back to `idle`   | none, falls back to `idle` | none     |

- ferret-trap-snap is a hazard, not a character: it has no character states, only `set` and `snap`.

### Reduced motion

- Every loop shows frame 0, and effects hold their peak frame.
- A white flash becomes one 120ms blink.

## Effects and lighting

### Lights

- Lights are data, not baked pixels. Art writes `lights.json`: each light is an ellipse, band (rect) or cone, with a width and height at full size, a palette colour, and 1 to 3 hard concentric rings, outermost first, each brighter.
- The game draws lights additively, over the ground and under the sprites. Hard rings keep it pixel art, and because they add rather than cover, the ground's texture shows through.
- Lights read on dark ground. On mid or pale ground they read as stains: use softer rings, or none by day.
- Glow is amber, never cream or gold, which go grey or khaki.
- Tune strength by rebaking several levels on the same paused frame and comparing them side by side.
- A sprite attaches its lights by offsets from its feet, mirrored on the other side, limited per zone, optionally pulsing with its idle. A cone shines from a lit bulb pixel drawn on the sprite (a white core with a cream ring).
- Cull a light by its own rect, never its emitter's.
- Space repeated lamps in an even rhythm, not randomly.

### Hit effects

- An impact frame is an eight-point star in the event's colour with a white core.
- Edge flashes pair a light ink with a dark fringe on the inward edge, so they hold 3:1 on light and dark grounds.

## Hazards

A hazard restarts the floor on contact. `art/tools/hazards.py` draws the hazard sprites and `art/tools/floor1.py` the hazard tiles; their docstrings give every frame and tile.

- Every hazard sprite has an ink outline, so it holds 3:1 on every street ground, and is drawn at outdoor scale beside the duck.
- Steel (the hatch and its leaves, the bike's wheels) uses the slate ramp (slate, dslate, navy), not grey: the leaves are slate because dslate does not separate from the dark facades in greyscale.
- The ferret's calling card: every trap the ferret sets carries his badge, a 13x13 cream plate with his hat-and-bow mark (a plum stovepipe with a red band over a red bow tie). `badge()` in `hazards.py` draws it for every trap. A floor's own hazards (traffic, open hatches) never carry it.

| Hazard           | Kind                                                          | Size                        | Collision                                    | Tags and timing                                                      |
| ---------------- | ------------------------------------------------------------- | --------------------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| Cellar hatch     | tiles in `tiles-street`: `hatch-left`, `pit-*`, `hatch-right` | any width; leaves 2 rows up | edges solid; `pit-*` none, she falls through | none                                                                 |
| frog-courier     | sprite, a frog on a delivery bike, facing right               | 60x36 (5x3 tiles)           | hit box 6,6,48,30                            | `ride` 4 x 100ms, `idle` frame 0 at 400ms                            |
| ferret-trap-snap | sprite, the ferret's giant spring mousetrap with his badge    | 50x26 (about 4x2 tiles)     | hit box 4,14,42,12                           | `set` 1 x 400ms, `snap` 60, 60, 80, 80ms, plays once and ends closed |

- Cellar hatch: on the sidewalk row `hatch-left`, one `pit-opening` per opening tile, `hatch-right`; `pit-opening` down every row below the opening; `pit-leaf-left-top` over `pit-leaf-left` above `hatch-left`, and the right leaf above `hatch-right`. It reads as a hole from several tiles away: two steel leaves standing up over a dark gap in the sidewalk line.
- frog-courier rolls back and forth along the sidewalk and is mirrored for left. Its wheels roll without slipping at 51 px/s; the hit box leaves out his eye bump, the bag's top and 2px of each tyre.
- ferret-trap-snap waits on `set` and plays `snap` once when the duck touches its hit box.

## Street cast

The ambient characters of the Zone 1 street, drawn by `art/tools/cast.py`; its docstring gives every frame. They have no portraits, are never hazards or pickups and carry no hit box. Each faces right (mirrored for left) at outdoor scale beside the duck, with its feet on the frame's bottom rows and its body centre on the frame's centre line, so mirroring it does not move it. Outlines are coloured: two ramp steps darker, stepped further down until they hold 3:1 on the sidewalk.

| Key                | Character                                                        | Frame | Tags and timing                                                                               |
| ------------------ | ---------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------- |
| pigeon             | a small pigeon at true street scale, placed in groups            | 22x22 | `idle` 600, 140, 140, 140ms (stand, peck, stand, peck); `flee` 2 x 80ms, once; `fly` 2 x 90ms |
| dog-pug            | a fawn pug with a black mask and a sky-blue collar               | 44x32 | `idle` 2 x 400ms; `walk` 4 x 120ms; `perk` 2 x 80ms, once; `talk` 2 x 150ms                   |
| pedestrian-cat     | an orange tabby in a mauve coat with a cream tote bag            | 34x50 | `walk` 4 x 140ms; `idle` 2 x 400ms                                                            |
| pedestrian-raccoon | a knitted-style raccoon: cream face band, ink masks, banded tail | 36x50 | `walk` 4 x 140ms; `idle` 2 x 400ms                                                            |

- The pigeon flees in two steps: `flee` plays once (crouch, leap) and the game then loops `fly` while it moves the pigeon up and away. It reads at 1x by its grey body, lgrey rim light, bold green-and-mauve neck sheen and pink feet.
- The cat has the coat body: a big round head over an A-line coat and two stub legs. The raccoon has its own front-on body after a knitted raccoon: a cream face band over ink masks, a wide round muzzle and belly, its head low on a round body, and a banded tail. Both walk the two-leg cycle: a foot lifted 2px, passing (body 1px up), the other foot lifted, passing.

## Dog antagonist

`dog-antagonist` is a separate floppy-eared, ochre-and-brown dog, drawn facing right in a 60x40 frame and mirrored for left. It does not replace the harmless `dog-pug`. The brighter coat separates the animal from the muted blue environment; the long floppy ears and round cream muzzle identify it independently of colour.

Every pose uses the same contact box: x 2, y 2, width 56, height 38, in frame pixels. A three-pixel red rectangle drawn by the runtime marks those exact bounds in every state. The red line is not baked into the sprite. All drawn body parts remain inside the contact envelope, which does not shrink when the dog crouches or rests. Contact is always lethal; a crouch or rest is a movement cue, never a safe state.

| State  | Tag      | Art cycle               | Pose                                     |
| ------ | -------- | ----------------------- | ---------------------------------------- |
| Crouch | `crouch` | one frame, 400ms        | body low and legs tucked before the rush |
| Idle   | `idle`   | two frames, 400ms each  | breathing with feet planted              |
| Patrol | `walk`   | four frames, 120ms each | alternating legs and a small passing bob |
| Rest   | `rest`   | two frames, 400ms each  | settled body after the rush              |
| Rush   | `rush`   | two frames, 80ms each   | stretched body and reaching legs         |

These tags loop while their gameplay state is active. Gameplay owns the duration and transition of patrol, crouch, committed rush and rest; art cycle durations do not set encounter timing. A five-column by four-row placement (60x48) bottom-anchors the 60x40 frame, putting the contact box ten pixels below the placement's top and ending at its bottom.

`portrait-dog` is 64x64, facing right towards the text, with the matching floppy ears and coat, an ink outline and a transparent ground, cut off at the bottom. Its `neutral` tag is one frame at 1000ms. It uses the existing dialogue portrait frame; no proper name or specific breed is encoded in the art.

## Environment aesthetic

Every environment theme (a zone's street, a chunk theme's park) follows these rules. The park theme (`art/tools/park.py`) is the reference; its values are given after each rule.

- One sky hue and a limited, tonal palette built around it. Every background layer is a step or two along that hue's ramp, and saturated colour is kept for the few things that matter. Park: a skin1 (`#e8b796`) sky, stepping to tan (`#e4a672`) from y 200 behind play.
- Background layers read as atmosphere: the far city, the distant trees and the tall treetops sit close to the sky's value and saturation, low in contrast, and step down in value only slightly as they come nearer. Park: the city and the treetops' base skin2 (`#c28569`, 1.46:1 against the tan sky), shaded brown (`#b86f50`), lit tan; no windows in the far city.
- Walkable tops are the brightest edges in the scene: a 2px light lip under a 1px dark edge. Against darker scenery the lip holds at least 2:1 in greyscale; against pale sky the dark edge carries separation. Cream (`#ead4aa`) is the default lip; use white where cream falls short. Park: cream on grass, paths, benches and branches (2.12:1 against skin2); white on the stone stairs and the bandstand roof, which stand against the tan treetops (2.10:1, where cream would be 1.45:1); dark edges dark green, dark brown or plum.
- Ground is a bright top band two or three rows deep over a soft, low-contrast fill, never a busy or dark mass. Clusters in the fill are 2px and sparse (about one tile in five), and an exposed side shows a narrow band of a darker step. Park: a grass top (dark-green edge, cream lip, green body) over a green turf row with 2px dark-green roots, then brown soil with dark-brown 2px pebbles; a 3px dark-brown band and a plum edge on an exposed side.
- Tree crowns are lobed and cel-shaded, never round blobs: a mass of overlapping lobes in the shade colour, the base colour over it a little up and left, then a few small lit lobes on the top-left only, so the edge is broken and no colour sits as a round blob inside another (a round orange or gold blob reads as a coin). Park: near crowns rust over dark brown with ochre lit lobes; background crowns skin2 over brown, unlit.
- Steps are soft: a step of 1 or 2 rows is a tap's walk-up, drawn as a rounded grass lip with a stone stair tread on about every other step; a taller terrace face is turf over soil, any height. Collision is the full tile, and there are no slopes. Park: steps 2 columns deep and 2 rows high; terrace faces run `soil-left` or `soil-right` down under the turf.
- Saturation is spent where it matters: the walkable lips, the hazards, the accents that guide the eye (an awning, a lit door, a crown in the foreground). Props and backdrops otherwise stay within the palette's tones.
- Hazard surfaces use the same flat red contact band in every zone, never spikes, a safe light lip or a pickup shape. The pond and thorn images remain in the asset catalogue for compatibility; new contact-edge obstacles use the shared strips.
- Zone 1, the street, is the cool counterpart: a pale steel morning. Its sky is flat lgrey (`#c0cbdc`); separate window-free city silhouettes use grey (`#8b9bb4`) and slate (`#5a6988`); buildings and shopfronts are slate, dslate and grey with quiet dslate windows; the sidewalk is a white-lipped pale concrete band (lgrey slabs) over a slate face; every ledge pairs a navy edge with a white lip: white holds 2.82:1 against grey and 5.51:1 against slate; navy holds 8.48:1 against the pale sky; the warm accents are the ochre-and-cream awnings, the cream sign icons and the amber door and cab. `floor1.py` draws the pieces with warm ramp names and recolours them through its `COOL_*` maps.
- Repeating backdrops tile at widths that divide 720, so seams never show.
- Every scene is checked in greyscale: each walkable top separates from what is behind it, the ground band reads over its fill, and the background stays behind play.

## Modular platforming tiles

`art/tools/obstacles.py` builds `tiles-platforming`: 17 tiles, each 12x12, packed into a 96x36 PNG with eight columns. Solid blue blocks and one-way ledges assemble independently of scenery. A level chooses the terrain look `platform`; individual characters can choose this tileset while their area uses a different theme.

- `one-way-ledge-left`, `one-way-ledge-middle`, `one-way-ledge-right`: thin safe ledges, transparent underneath. Only falling onto the top lands on them.
- `platform-bottom`, `platform-bottom-left`, `platform-bottom-right`: solid underside and lower corners for floating blocks and ceilings.
- `platform-face`, `platform-face-left`, `platform-face-right`: solid fill and exposed cliff or wall edges, repeated to any height.
- `platform-top`, `platform-top-joint`, `platform-top-left`, `platform-top-right`: solid safe tops, repeated to any width.

### Shared red contact edges

For a dangerous top, use a plain solid face under the hazard instead of a safe white-lipped top. All themes use the same flat strip: two pixels of Endesga red (`#e43b44`) with a one-pixel ink backing. No spikes. Contact with any part of the three-pixel strip restarts the level at its beginning. These tiles are hazards with no solid collision; place them in the cell immediately outside the supporting solid, which retains its ordinary collision. Repeat horizontally for floors and ceilings, vertically for walls. The orientation names describe the face of the supporting solid, not the edge of the hazard's own cell.

| Tile            | Placement relative to solid | Hit box within its 12x12 cell (x, y, width, height) |
| --------------- | --------------------------- | --------------------------------------------------- |
| `hazard-bottom` | below                       | 0, 0, 12, 3                                         |
| `hazard-left`   | left                        | 9, 0, 3, 12                                         |
| `hazard-right`  | right                       | 0, 0, 3, 12                                         |
| `hazard-top`    | above                       | 0, 9, 12, 3                                         |

Red strips never carry the bright safe lip. Red is a consistent danger cue across zones; the contrasting ink backing keeps the thin edge visible against both pale and dark scenery. Gameplay chooses the placement and clearance, including dangerous ceilings over short-jump routes and dangerous sides beside landings.

## Zone 1: parcel depot and New York street

The first zone has a fixed layout, beginning at an opened parcel in an industrial depot and continuing into a downtown New York street on a pale steel morning. It is two screens tall: the sidewalk runs along the bottom and the buildings support climbs into the upper screen. `art/tools/depot.py` draws the depot modules and `art/tools/floor1.py` the street pieces. Their docstrings specify each reusable asset; gameplay data defines their arrangement.

- Depot: blue-grey ribbed wall modules, roller loading bays and cream parcel icons, with warm cardboard reserved for the opened parcel. No labels are baked into the art. The three modules are static backdrops with no collision, animation or interaction; gameplay places solid surfaces separately. All stay on the play plane, with parallax factors 1,1.
- Outdoor scale: the street is drawn as if zoomed out 4x while the duck and the 12px tiles keep their size. A storey is 180px and a door is about 45px, so the duck (42px) stands almost as tall as a street door.
- The street is 720px (60 tiles) tall: the sidewalk's top is y 600 (row 50), with sidewalk and road filling rows 50 to 59 below it so the camera can hold her feet two thirds down the screen. The ground storey runs from y 420 to the sidewalk, and storeys stack every 180px above: a two-storey roof is at y 240 (row 20) and a three-storey roof at y 60 (row 5), the tallest that fits. A water tower (its tank top 6 tiles above its roof) fits on a two-storey roof, not a three-storey one. Every street piece's bottom y below is in that frame.
- Street tiles (`tiles-street`): a pale concrete sidewalk (tops alternating with a 2px joint every 24px, ends, a slate face), a pale stone kerb where it meets a cross street, the road one tile lower, an ochre-and-cream one-way shop awning, a dark-brown one-way canopy with a white lip, a 2-tile planter with a hedge top, the cellar hatch and its pit, and the door as a 3x4 piece: a pair of lit amber glass doors, 36x48, the brightest thing at the door, for a room's door where the level has one.
- Climbing tiles, appended so every earlier index holds: one-way fire-escape landings (black iron), window sills, a rooftop cornice and a water tower's flat top, each with left, middle and right tiles at any width. Every ledge's top carries the same 2px white lip under a 1px dark edge, so it reads against any facade in greyscale.
- Climbing backdrops: upper storeys and rooflines stack as reusable facade pieces. Standable ledges and solid faces come from modular tiles, placed independently of the scenery. Existing fire-escape ladder images remain available for compatibility; new platforming layouts use ledges and cliffs instead.
- Backdrops are modular: a sky and a far skyline of faded downtown skyscrapers in two layers that cover both screens and rise above the near roofs, one repeating facade per building type (one-storey, walk-up, brownstone, and a tall stone building), facade pieces, one storefront per shop, and street furniture placed singly (a cab, a hot-dog cart, a subway railing, a street tree, a walk signal, the doorman's podium, the canopy's poles). A cross street is a gap with no facade, where the skyline shows over the far avenue.
- The door, the canopy, `facade-hotel`, `hotel-crest`, `hotel-window` and the doorman's podium are generic building pieces, kept from the hotel this street used to belong to.
- Signs are icons, never text: a cup, a flower, a gift box, a lipstick, a paw, a fork and knife, a noodle bowl, and a crest.

| Backdrop                | Size    | Bottom y | Repeat |
| ----------------------- | ------- | -------- | ------ |
| street-sky              | 48x600  | 600      | x      |
| street-skyline          | 336x600 | 600      | x      |
| facade-one-storey       | 48x192  | 600      | x      |
| facade-walkup           | 48x312  | 600      | x      |
| facade-walkup-upper     | 48x180  | 288      | x      |
| roofline-walkup         | 48x48   | 108      | x      |
| facade-brownstone       | 48x312  | 600      | x      |
| facade-brownstone-upper | 48x180  | 288      | x      |
| roofline-brownstone     | 48x48   | 108      | x      |
| facade-hotel            | 48x312  | 600      | x      |
| facade-hotel-upper      | 48x180  | 288      | x      |
| roofline-hotel          | 48x48   | 108      | x      |
| fire-escape             | 196x185 | 473      | none   |
| fire-escape-railing     | 48x24   | 432      | x      |
| fire-escape-ladder      | 24x96   | 432      | none   |
| fire-escape-ladder-4    | 24x48   | 432      | none   |
| fire-escape-ladder-5    | 24x60   | 432      | none   |
| fire-escape-ladder-6    | 24x72   | 432      | none   |
| fire-escape-ladder-7    | 24x84   | 432      | none   |
| water-tower             | 48x84   | 240      | none   |
| hotel-crest             | 98x44   | 478      | none   |
| hotel-window            | 32x152  | 592      | none   |
| storefront-cafe         | 84x120  | 600      | none   |
| storefront-florist      | 84x120  | 600      | none   |
| storefront-gift-shop    | 96x120  | 600      | none   |
| storefront-makeup-store | 96x120  | 600      | none   |
| storefront-pet-shop     | 108x120 | 600      | none   |
| storefront-diner        | 108x120 | 600      | none   |
| storefront-noodle-bar   | 120x120 | 600      | none   |
| cab                     | 96x40   | 600      | none   |
| hot-dog-cart            | 40x70   | 600      | none   |
| subway-railing          | 72x62   | 600      | none   |
| street-tree             | 64x136  | 600      | none   |
| walk-signal             | 12x82   | 600      | none   |
| doorman-podium          | 18x24   | 600      | none   |
| canopy-poles            | 60x60   | 600      | none   |
| cross-street            | 120x26  | 600      | none   |

Below the sidewalk's top, the sidewalk and road tiles fill rows 50 to 59.

### Depot modules

| Key               | Size    | Bottom y | Repeat | Placement                                                       |
| ----------------- | ------- | -------- | ------ | --------------------------------------------------------------- |
| depot-loading-bay | 120x120 | 600      | none   | Ten columns by ten rows, top at row 40 on a row-50 floor        |
| depot-wall        | 48x180  | 600      | x      | Four columns by fifteen rows, top at row 35 on a row-50 floor   |
| parcel-open       | 72x36   | 600      | none   | Six columns by three rows, top at row 47; drawn behind the duck |

The opened parcel is scenery, without the bright safe ledge lip or a red danger strip. It marks the starting location without blocking movement. The depot wall can repeat to any run width; loading bays and parcels are independently placed pieces. No panorama or scene-specific duck drawing is exported.

The separate atmosphere layers `street-city-far` and `street-city-mid` are each 720x600, bottom-left anchored at y 600 and repeating in x. Place them with the flat `street-sky`, back to front in that order. The legacy `street-skyline` is a composite compatibility asset: do not place it alongside the two separate layers. Physical facades, doors and attached ledges remain on the play plane.

### Kept for a later indoor zone: the boutique lobby

The lobby set is no longer in Zone 1. It is kept, unchanged, for a later indoor zone.

- The lobby is a boutique at indoor scale: wood-panelled walls, a sofa, a reception desk, a tall bookcase, plants, pendant lamps and a tall window. A door is 180px (15 tiles) and the zone is 720px (60 tiles) tall, so the camera scrolls up through it; the floor line is y 672 (row 56).
- Contrast: the walls are dark wood, and every walkable top (the floor and each one-way ledge) carries the same 2px cream lip under a 1px plum edge, so the standable edges are the brightest lines in the room in greyscale, and the cream duck stays the focal point.
- Lobby tiles (`tiles-lobby`): a wood floor (tops with a 2px board end every 24px, ends, face), one-way balcony, shelf, cushion and desk ledges, a solid wood post 2 tiles wide, and the stairwell as a 7x15 doorway piece (84x180) with a white up-arrow on a green sign. The inside of the front door is a backdrop.
- Lobby pieces line up with the reaches: the sofa's seat and back are 3 and 6 tiles up, the desk top 8, and the bookcase boards 8, 16, 24 and 32.

| Backdrop         | Size    | Bottom y           | Repeat |
| ---------------- | ------- | ------------------ | ------ |
| lobby-wall       | 48x720  | 720                | x      |
| lobby-balustrade | 48x36   | balcony floor line | x      |
| lobby-bookcase   | 84x384  | 672                | none   |
| lobby-sofa       | 120x72  | 672                | none   |
| lobby-desk       | 120x96  | 672                | none   |
| lobby-plant      | 48x120  | 672                | none   |
| lobby-lamp       | 48x192  | 220                | none   |
| lobby-window     | 96x240  | 552                | none   |
| lobby-front-door | 156x180 | 672                | none   |

## Park theme

The first chunk theme: an autumn park. Later zones are built from hand-built chunks, each a screen or two wide, in a seeded order that rerolls each time she enters the zone; a theme carries one tileset, its terrain and its repeated backdrops, drawn across the whole zone so seams never show, and chunks add their own props. `art/tools/park.py` draws it; its docstring lists every tile and piece.

- Frame and scale as the street: outdoor scale, 12px tiles, zones 60 rows (720px) tall.
- Chunk seams sit at ground rows 50, 40 and 30 (y 600, 480 and 360): a chunk's left and right edges meet the next chunk's at one of those heights. A step of 1 or 2 rows is a tap's walk-up; a taller terrace face is turf over soil (`soil-left` or `soil-right` running down the face), any height. There are no slopes.
- Look: a peach sky with cream clouds, tall tan treetops and a skin2 city behind, close to the sky's value; the ground two bright rows deep (a cream-lipped grass top over green turf), then warm brown soil with sparse 2px pebbles. Every walkable top's lip holds at least 2:1 against what is behind it: cream lips, and white on the stone stairs and the bandstand roof, which stand against the tan treetops.

| Tile                                              | Collision                                                                                                                                                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `grass-top`, `grass-top-left`, `grass-top-right`  | solid; the walkable top, the end tiles rounded on an exposed side                                                                                                                                                               |
| `turf`, `turf-left`, `turf-right`                 | solid; the row under a grass top                                                                                                                                                                                                |
| `soil`, `soil-pebbles`, `soil-left`, `soil-right` | solid; the fill, pebbles on about one tile in five                                                                                                                                                                              |
| `path-top`, `path-top-joint`                      | solid; a gravel path top, alternated                                                                                                                                                                                            |
| `step-stair`, `step-stair-left`                   | solid; a stone tread in a step's top, every other step                                                                                                                                                                          |
| `one-way-bench-*` (left, middle, right)           | one-way; a bench's top, 2 rows up                                                                                                                                                                                               |
| `one-way-branch-*`                                | one-way; a tree's branch, 6 rows up                                                                                                                                                                                             |
| `one-way-bandstand-*`                             | one-way; the bandstand roof, 6 rows above its base                                                                                                                                                                              |
| `hazard-pond-*`, `hazard-pond-bed-*`              | none; a pond hazard two rows deep, placed with a width. The first row's tiles hit `{x 0, y 4, width 12, height 8}` (`hitboxes`) and the bed row its whole cell: 20px from the water surface down. The banks beside it are solid |
| `hazard-thorn-*`                                  | none; a thorn-hedge hazard one row tall, placed with a width. Each tile hits `{x 0, y 2, width 12, height 10}` (`hitboxes`)                                                                                                     |

Sprites, in the manifest's `sprites`:

- `park-boat`, 72x18, facing right: a rowing boat, the moving platform on a pond. Its collision is 6x1 tiles (72x12) with its top on the frame's row 0, the deck line: a 1px dark-brown edge on row 0 and a 2px cream lip on rows 1 and 2, like every walkable top, and nothing drawn above it. A tan gunwale, then a rust hull lit ochre and shaded dark brown underneath, rounded to the keel, dipping into the pond's water rows. Tag `idle`, 2 frames at 400ms: frame 1 drops the keel 1px; the deck line stays fixed.
- `park-gate`, 36x60 (3x5 tiles), the park's room door: no collision, and the game puts a Use zone over it. Anchor: the frame's bottom-left on the ground's top, centred in the door's slot. A wrought-iron arch on two posts with leaf finials and ochre and rust leaves, over a pale opening and a brown path. Tags `idle` (closed, 1 frame at 400ms) and `open` (4 frames at 80ms, plays once and holds open) when she uses it.

Backdrops repeat in x at widths that divide 720, so chunk seams never show; props stand on the ground (their bottom y is given for row 50; subtract 120 per seam row up).

| Backdrop        | Size    | Bottom y | Repeat |
| --------------- | ------- | -------- | ------ |
| park-sky        | 48x600  | 600      | x      |
| park-clouds     | 360x160 | 200      | x      |
| park-treetops   | 360x420 | 600      | x      |
| park-city       | 360x200 | 540      | x      |
| park-far-trees  | 240x120 | 600      | x      |
| park-tree       | 96x150  | 600      | none   |
| park-bench      | 36x24   | 600      | none   |
| park-bandstand  | 120x84  | 600      | none   |
| park-lamp       | 16x84   | 600      | none   |
| park-fountain   | 96x48   | 600      | none   |
| park-flower-bed | 72x16   | 600      | none   |
| park-bin        | 16x24   | 600      | none   |
| park-sign       | 24x40   | 600      | none   |
| park-reeds      | 24x30   | 610      | none   |
| park-lily-pad   | 14x4    | 608      | none   |

## Remaining for the first build

- The ferret's later traps, each carrying his badge, and the hazards of the floors above.
- The zones after Zone 1, reached across the map's forks.
