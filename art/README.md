# Art

The art plan and pipeline for Duck Platformer. Art owns `art/` and the served art directory, `public/art/`.

## Direction

- Pixel art: minimalist, cute, a little retro, refined.
- Everything, UI included, is pixel art at one base resolution, integer-scaled with no smoothing: 640x360. A landscape phone shows it at 3x (1920x1080 device pixels), so 1 base pixel is 1 CSS pixel at a device pixel ratio of 3.
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
- `art/inventory.md` lists every asset (key, type, size, tags).
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
| Duck            | 64x48 |
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

The protagonist is a cute, chibi, cream-coloured female duck, drawn facing right and mirrored for left. `art/tools/duck.py` draws her; its docstring gives every frame's pose, timing and squash and stretch table.

- Proportions: her head is about 1.5x the area of her body, set low on a round, squat body.
- Bow: a pink two-loop bow on top of her head, tilted along the back of the crown so one loop overhangs the back of her head. Two level loops on a round head read as ears in silhouette.
- Bill: short, round and orange, with a rust mouth line.
- Body: cream, with tan cel crescents and a white rim light. The wing is a plain tan comma with a dark-brown line, the tail a round nub, and the feet tiny orange stubs with no legs.
- Every jump flutters (a slow, steerable fall), so the flutter is her signature: the wing raised up and back with a clear gap from the head, the body 3px higher, and the feet tucked under her belly.
- Frame 64x48, feet on rows 44 to 46 and the outline on row 47.
- Anchor: the frame's bottom edge sits on the collision box's bottom edge, and her body-centre x, 32 (the frame's centre line, between columns 31 and 32), sits on the box centre, so mirroring her does not move it.
- Portrait: 64x64, her head and shoulders facing right, cut off by the bottom edge, with one ink outer line on a transparent ground. The dialogue box's 68x68 frame supplies the backing.

## The ferret

The villain is a chibi sable ferret in a stovepipe hat and bow tie, a talking animal that schemes against the duck's climb: in dialogue, in quips and through the hazards it sets. It is sly and smug in a charming, cartoon way (a half-lidded side-eye, a smirk, steepled paws), never scary or cross, and is never fought. `art/tools/ferret.py` draws it; its docstring gives every frame's pose and timing.

- Stance: slim and erect on short hind legs, a gentle S from the haunch up a long neck to a small wedge head with a narrow, pointed snout, and a long tail curling out behind along the ground. The S and the long neck are what keep it from reading as a dog.
- Fur: brown with a tan light rim and dark-brown cel crescents; a cream belly, muzzle and cheek; a dark-brown mask through a half-lidded side-eye (cream sclera, the pupil at the front) under a level plum brow.
- Hat: a tall, narrow plum stovepipe with a dark-brown rim light and a red band. Nothing touches it.
- Colour: tan, brown, dark brown, plum and cream, with red (the band and bow tie) as the one accent. Ink outline; internal edges two ramp steps darker than the part in front.
- Frame 64x80, facing left (mirrored for right), feet on rows 76 to 78 and the outline on row 79.
- Anchor: the frame's bottom edge sits on the collision box's bottom edge, and its body-centre x, 32 (the spine's centre line and the frame's, between columns 31 and 32), sits on the box centre, so mirroring it does not move it.
- Portrait: 64x64, its head and long neck facing right towards the text, as the duck's does, cut off by the bottom edge, with one ink outer line on a transparent ground.

## UI

All positions are in base pixels (x, y, w, h). A touch target is at least 44x44.

### Dialogue box

- A box at the bottom, 8,256,624,96, with the speaker's 64px portrait in a 68px frame at 16,270 and a name tab on the box's top edge. Two or three speakers use the same box: the portrait and name tab change.
- The name tab's fill is the speaker's colour: amber, green, pink or tan. Ink text holds at least 6.6:1 on each, and each holds at least 5:1 on the box's navy.
- Text area at x 96, y 268, 488 wide, 3 lines at a 20px pitch, one paragraph per box.
- Forward mark 10x14, hit area 588,308,44,44. A tap anywhere or a key also advances. There is no back button and no timer.
- Skip at the top right: mark 554,8,78,20, hit area 554,8,78,44. It runs ahead to the next choice; while a choice shows, it is disabled (greyed with the grey ramp, and changed in shape).
- Choices: a row of two or three answer buttons above the box, each 204x36 (hit 204x44), row top y 192, at most 162px of text. Three sit at x 8, 218 and 428; two at 113 and 323. The selected answer shows a cursor as well as a fill.
- The touch controls hide while a box is open.

### Quip

A one-line strip at the top centre, y 8, height 24, sized to its text and at most 452 wide, led by the speaker's name in their name-tab colour. It never pauses play and never reaches the lower corners.

### Touch controls

Dashed rings, light ink with a dark fringe so they hold 3:1 on light and dark ground. Hidden on desktop and when the setting is off.

| Control  | Centre  | Hit area       | Mark  |
| -------- | ------- | -------------- | ----- |
| Interact | 528,268 | 488,224,76,136 | 31x31 |
| Jump     | 600,304 | 564,224,76,136 | 39x39 |
| Move     | 72,300  | 0,224,152,136  | 61x55 |

- Move: the direction is the sign of the touch's distance from the fixed centre, with a dead zone of 6px either side, so one rule covers a drag and a tap on either half. The knob shows the distance, capped at 12px. A held direction shows a doubled chevron.
- Press: the ring turns solid and swells (frame 0, 60ms), ripples outward (frame 1, 60ms), then holds a solid ring until release, which snaps back to rest. On a drag it starts when the touch leaves the dead zone.

### Settings

A pause card over the game, which is dimmed by stepping every colour two ramp steps darker. A "Touch controls" checkbox reads Shown or Hidden, and the overlay behind the card updates as it changes. Resume and a close X return to the game.

- Card 136,88,368,184 with a 36px header holding the title.
- Close X hit area 460,88,44,44.
- The "Touch controls" row, 144,136,352,48, is one hit area that toggles the checkbox (20x20 at 156,150).
- Resume 240,212,160,44.

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

## Remaining for the first build

- The look of the hazards the ferret sets, distinct from each floor's own hazards.
- The floors: one everyday place per floor.
