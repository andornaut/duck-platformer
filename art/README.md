# Art

The art plan and pipeline for Duck Platformer. Art owns `art/` and the served art directory, `public/art/`.

## Direction

- Pixel art: minimalist, cute, a little retro, refined.
- Everything, UI included, is pixel art at one base resolution, integer-scaled with no smoothing. PLACEHOLDER: the base resolution.
- Chibi proportions: the head about as big as the body, so a character reads from head shape and markings alone.
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
- `art/inventory.md` lists every asset (key, type, size, tags).
- Art reads game layout and data from the generated export files the game writes, never from `src/`. The export files are in `shared/export/`. Art writes the shared data files the game reads (`lights.json`, `palette.json`).
- Keys are kebab-case, named after what the player sees. Internal names match displayed names.
- Checks run in a container: the art manifest, art tests that assert every key the game uses exists with its tags, and prettier on the docs. PLACEHOLDER: the image and command.

## Style rules

### Palette

- One fixed house palette, plus a few game-specific ramps that each end on a house colour. PLACEHOLDER: the palette (Endesga 32 is the recommended option to mock first).
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
- PLACEHOLDER: the frame sizes per sprite type.

### Text

- Text never shrinks to fit: reword it or grow the box. Each text role keeps one size and one font.
- Words in effects and labels are set in a font, never baked into sprites.
- A backdrop never shows its own place's name; the HUD names it.

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

- The user's picks from the mocks: base resolution, palette, frame sizes, the duck, the dialogue box, quips, the touch overlay and settings.
- The shared drawing module and the first `art/tools/<set>.py`.
- `art/inventory.md`.
