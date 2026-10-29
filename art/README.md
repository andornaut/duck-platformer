# Art

The art plan and pipeline for Duck Platformer. Art owns `art/` and the served art directory, `public/art/`.

## Direction

- Pixel art: minimalist, cute, a little retro, refined.
- Everything, UI included, is pixel art at one base resolution, 648x360. The game scales it to fill the screen at 16:9 with nearest-neighbour sampling and no smoothing, by a fractional factor, so on most screens some pixels come out one device pixel wider than others. On a landscape phone 1 base pixel is about 1 CSS pixel. Judge art at a fractional scale as well as at 3x, and avoid 1px patterns (checks, dashes, alternating rows) that turn uneven when pixels vary in width.
- Chibi proportions: the head at least as big as the body, so a character reads from head shape and markings alone.
- Style decisions are the user's (see Options and decisions).

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
- A nine-slice texture carries its margins as an Aseprite slice named after its key and as `slice` in its manifest entry.
- `art/tools/fonts.py` rasterizes the fonts in `art/fonts/` into BMFonts in `public/art/fonts/`, white for tinting.
- `art/tools/palette.py` writes `public/art/palette.json`, listed under `data` in the manifest: `colours` maps each palette name to `#rrggbb`, `darker` maps each colour one ramp step down, and `dim2` two steps down, the settings card's dim. Keys are sorted.
- `art/tools/icons.py` draws the favicon and app icons, the duck's head on a green disc, as plain PNGs, not sprites or manifest entries: `public/favicon.ico` (16 and 32), `public/art/favicon-16.png` and `public/art/favicon.png`, and in `public/icons/` the 180 apple-touch icon on a green square, the 192 and 512 icons on a green disc with a transparent outside, and a 512 maskable icon with the subject inside the central 80%. The 16 and 32 are drawn natively; the larger icons are 64 and 90 drawings scaled by whole numbers.
- `art/inventory.md` lists every asset (key, type, size, tags).
- `art/tools/floor<n>.py` draws one floor's tilesets and backdrop pieces as plain PNGs, not Aseprite sprites, so the game builds each floor from level data instead of a fixed panorama.
- A tileset is `public/art/tilesets/<key>.png`, 12x12 tiles in rows of 8 with no spacing or margin, plus `<key>.json`: `{"tileSize": 12, "columns": 8, "tiles": {"<name>": <index>}, "pieces": {"<name>": [[<index>, ...], ...]}}`. An index counts row by row. A piece is a multi-tile unit as rows of indices, top row first. A tile named `one-way-*` is a one-way ledge, which stops only a fall onto its top edge; every other tile with art is solid. The manifest lists each under `tilesets` as `{"key", "png", "json"}`.
- A backdrop piece is `public/art/backdrops/<key>.png`, drawn behind the play layer. The manifest lists each under `backdrops` as `{"key", "png", "width", "height", "anchor": "bottom-left", "y", "repeat"}`: its bottom edge sits at world `y`, at an x the level data chooses, and `"repeat": "x"` tiles it across a run while `"none"` places it once.
- Art reads game layout and data from the generated export files the game writes, never from `src/`. The export files are in `shared/export/`. Art writes the shared data files the game reads (`lights.json`, `palette.json`).
- Keys are kebab-case, named after what the player sees. Internal names match displayed names.
- Checks run in a container: the art manifest, art tests that assert every key the game uses exists with its tags, and prettier on the docs. PLACEHOLDER: the image and command.

## Style rules

### Palette

- One fixed house palette, plus a few game-specific ramps that each end on a house colour. The house palette is [Endesga 32](https://lospec.com/palette-list/endesga-32); colour names are the `K` names in `art/tools/pixel.py`.
- Every pixel is fully opaque or fully transparent.
- Each colour has a one-step-darker mapping (its ramp). Shadows and dimming step each colour down its ramp, never blend with black.
- Neutral greys are reserved for disabled UI.

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

| Sprite          | Frame |
| --------------- | ----- |
| Duck            | 48x42 |
| Duck portrait   | 64x64 |
| Ferret          | 64x80 |
| Ferret portrait | 64x64 |

### Text

- Fonts: `font-body` (Tiny5, mixed case) for body text, dialogue and quips; `font-title` (Silkscreen, capitals) for titles, names and buttons. Both are native at 8px and drawn at 2x, so a line is 16 base pixels tall. Sprites keep 1px detail.
- Text holds 4.5:1 against what it sits on; essential icons and marks hold 3:1. A state never relies on colour alone.
- Text never shrinks to fit: reword it or grow the box. Each text role keeps one size and one font.
- Words in effects and labels are set in a font, never baked into sprites.
- A backdrop never shows its own place's name; the HUD names it.

## The duck

The protagonist is a wide, round, cream-coloured duck, drawn facing right and mirrored for left. `art/tools/duck.py` draws her; its docstring gives every frame's pose, timing and squash and stretch table.

- Shape: a wide, round blob of a body with a small round head set into its top at the front, a square ink dot eye and a short, plain orange bill. Her back slopes down to a short tail tip at the rear. No bow.
- Colour: cream, with tan cel crescents and a white rim light. The wing is a flat tan patch, the feet tiny orange stubs. Dark-slate outline.
- Every jump flutters (a slow, steerable fall), so the flutter is her signature: the wing raised up and back from the top of her back, the body 2px higher, and the feet tucked under her belly.
- Frame 48x42, feet on rows 39 and 40 and the outline on row 41.
- Collision body 24x36 (2x3 tiles), anchored bottom-centre: the frame's bottom edge sits on the body's bottom edge, and her body-centre x, 24 (the frame's centre line, between columns 23 and 24), sits on the body's centre, so mirroring her does not move it.
- Overhang of the 24x36 body at rest: her back and tail 8px on the left, her head and bill 10px on the right, and 2px of the body's height above her head left empty. The raised wing reaches 5px above the body, and the jump crouch and land squash push her tail out to 12px on the left.
- Portrait: 64x64, her head set into the top of her body, facing right, cut off by the bottom edge, with one ink outer line on a transparent ground. The dialogue box's 68x68 frame supplies the backing.

## The ferret

The villain is a chibi sable ferret in a stovepipe hat and bow tie, a talking animal that schemes against the duck's climb: in dialogue, in quips and through the hazards it sets. It is cute with a touch of slyness (soft round eyes, a small smile, steepled paws), never scary or cross, and is never fought. `art/tools/ferret.py` draws it; its docstring gives every frame's pose and timing.

- Stance: erect on short hind legs, leaning slightly forward, the front of the body one smooth line from the neck to the hips over a full, round chest, with no S wave. A long neck, a small wedge head with a narrow, pointed snout and a long tail curling out behind along the ground keep it from reading as a dog.
- Fur: brown with a tan light rim and dark-brown cel crescents; a cream belly, muzzle and round cheek with a hint of tan blush; a dark-brown mask around a soft, round dark eye with a cream catchlight, under a small plum brow.
- Hat: a tall, narrow plum stovepipe with a dark-brown rim light and a red band. Nothing touches it.
- Colour: tan, brown, dark brown, plum and cream, with red (the band and bow tie) as the one accent. Ink outline; internal edges two ramp steps darker than the part in front.
- Frame 64x80, facing left (mirrored for right), feet on rows 76 to 78 and the outline on row 79.
- Anchor: the frame's bottom edge sits on the collision box's bottom edge, and its body-centre x, 32 (the spine's centre line and the frame's, between columns 31 and 32), sits on the box centre, so mirroring it does not move it.
- Portrait: 64x64, its head and long neck facing right towards the text, as the duck's does, cut off by the bottom edge, with one ink outer line on a transparent ground.

## UI

All positions are in base pixels (x, y, w, h). A touch target is at least 44x44.

### Dialogue box

- A box at the bottom, 12,256,624,96, with the speaker's 64px portrait in a 68px frame at 20,270 and a name tab on the box's top edge. Two or three speakers use the same box: the portrait and name tab change.
- The name tab's fill is the speaker's colour: amber, green, pink or tan. Ink text holds at least 6.6:1 on each, and each holds at least 5:1 on the box's navy.
- Text area at x 100, y 268, 488 wide, 3 lines at a 20px pitch, one paragraph per box.
- Forward mark 10x14, hit area 592,308,44,44. A tap anywhere or a key also advances. There is no back button and no timer.
- Skip at the top right: mark 562,8,78,20, hit area 562,8,78,44. It runs ahead to the next choice; while a choice shows, it is disabled (greyed with the grey ramp, and changed in shape).
- Choices: a row of two or three answer buttons above the box, each 204x36 (hit 204x44), row top y 192, at most 162px of text. Three sit at x 12, 222 and 432; two at 117 and 327. The selected answer shows a cursor as well as a fill.
- The touch controls hide while a box is open.

### Quip

A one-line strip at the top centre (x 324), y 8, height 24, sized to its text and at most 452 wide (x 102 to 554), led by the speaker's name in their name-tab colour. It never pauses play and never reaches the lower corners.

### Touch controls

Two round buttons for the right thumb, Use above and to the left of Jump. Each is an opaque disc: an ink edge, a 2px cream ring and a navy face, so it holds 3:1 on light and dark ground, with its icon above its label. Hidden on desktop and when the setting is off.

| Control | Centre  | Hit area       | Disc      | Icon       |
| ------- | ------- | -------------- | --------- | ---------- |
| Use     | 544,244 | 496,200,152,80 | 49px wide | three dots |
| Jump    | 604,316 | 496,280,152,80 | 55px wide | caret      |

- Labels: "Use" and "Jump" in `font-body` at 2x, set by the game from text data and never baked in. Each is centred on its button's centre x, with its origin 3px above the centre, so the capitals sit just below it.
- Press: the ring turns white and thickens to 3px and the face lifts a step, swelling 1px for the first frame (frame 0, then frame 1, 60ms each), then holds until release, which snaps back to rest.
- Movement has no art: a touch anywhere off a button sets its own neutral point, and nothing marks it.

### Settings

A pause card over the game, which is dimmed by stepping every colour two ramp steps darker. A "Touch controls" checkbox reads Shown or Hidden, and the overlay behind the card updates as it changes. Resume and a close X return to the game.

- Card 140,88,368,184 with a 36px header holding the title.
- Close X hit area 464,88,44,44.
- The "Touch controls" row, 148,136,352,48, is one hit area that toggles the checkbox (20x20 at 160,150).
- Resume 244,212,160,44.

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

## Floor 1

The street front of the building, then its lobby: a brick high street in the morning, a plain open front door, and a cream marble lobby. `art/tools/floor1.py` draws it; its docstring lists every tile and piece.

- The sidewalk and lobby floor line is y 312 (tile row 26). The road sits one tile lower, behind a cream stone kerb.
- Street tiles (`tiles-street`): brick sidewalk (tops alternating with a 2px joint every 24px, ends, face), kerb, road, a green-and-cream one-way awning, a 2-tile planter with a hedge top, an iron post 2 tiles tall, and the front wall.
- Lobby tiles (`tiles-lobby`): cream marble floor (a 48px slab: top, vein, top, joint), its face a step darker, a one-way marble shelf, a green marble column darker than the duck, and the stairwell exit as a 3x4 piece.
- One-way ledges sit 6 tiles above the floor (row 20, y 240), which is a full jump; awnings fit under the storefront signs there.
- The entrance: a 4-tile front wall in section from the top of the screen down to row 21, its lintels the door head. Its 2 left columns are `front-wall-*` (street face) and its 2 right columns `column-*` (lobby face). Under it, `entrance-street` and `entrance-lobby` sit side by side, and the street backdrop gives way to the lobby backdrop at the door's centre line, which they cover.
- Signs are icons, never text: a cup, a flower, a gift box, a lipstick, a paw, a fork and knife, a noodle bowl.

| Backdrop                | Size    | Bottom y | Repeat |
| ----------------------- | ------- | -------- | ------ |
| street-sky              | 48x48   | 48       | x      |
| street-facade           | 48x144  | 192      | x      |
| street-wall             | 12x120  | 312      | x      |
| street-lamp             | 24x168  | 312      | none   |
| storefront-cafe         | 144x120 | 312      | none   |
| storefront-florist      | 144x120 | 312      | none   |
| storefront-gift-shop    | 144x120 | 312      | none   |
| storefront-makeup-store | 120x120 | 312      | none   |
| storefront-pet-shop     | 120x120 | 312      | none   |
| storefront-diner        | 168x120 | 312      | none   |
| storefront-noodle-bar   | 144x120 | 312      | none   |
| entrance-street         | 24x48   | 312      | none   |
| entrance-lobby          | 24x48   | 312      | none   |
| lobby-wall              | 48x312  | 312      | x      |
| lobby-pilaster          | 24x192  | 240      | none   |
| lobby-window            | 72x144  | 216      | none   |
| lobby-mailboxes         | 108x84  | 228      | none   |
| lobby-plant             | 36x72   | 312      | none   |

Below the floor line the game shows ink.

## Remaining for the first build

- The look of the hazards the ferret sets, distinct from each floor's own hazards.
- The floors above Floor 1: one everyday place per floor.
