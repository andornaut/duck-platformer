# Game Design

The rulebook: every rule the game is built to. What's left to build and tune is in [`README.md`](README.md), and undecided ideas are in [`ideas.md`](ideas.md).

`src/data/` holds every number and all player text. This doc states the rules, with numbers only where they define one.

## Pitch

A landscape platformer: a lost duck travels zone to zone across a map to get home. Every path starts and ends the same way, and the story changes with the path she takes.

## Setting

- **Characters:** the duck is the one the player controls: a small, round, cream duck with tiny wings and feet, an orange bill and a dot eye. Her full design is in the [art plan](../art/README.md). Animals talk, and most interactions are with animals. PLACEHOLDER: whether there are humans (see [`ideas.md`](ideas.md))
- **Ferret:** the villain, who schemes against the duck's journey home: a champagne (cream-coloured) ferret, about twice the duck's height, standing upright, with a tall plum stovepipe hat and a red bow tie. Its full design is in the [art plan](../art/README.md)
- **World:** the modern day, mixing fantasy and reality
- **Zones:** each zone is one place, indoors, outdoors or a hybrid of both. Zone 1 is a New York street. PLACEHOLDER: the later zones, the beginning and where home is

## Core loop

1. **A zone:** travel through one place, mostly left to right and bottom to top: platforming, talking with animals in rooms, and making choices that change the route.
2. **The map:** clearing a zone opens the map, which moves her on to the next zone. At a fork she picks one path.
3. **Home:** every path ends the same way: she outwits the ferret and gets home. PLACEHOLDER: the rest of the ending.

## Voice

- **Data:** every string a player sees lives in the text data files, with `{placeholders}` the game fills, never as a literal in code
- **Fit:** text never shrinks to fit. Reword it or grow its box
- **Labels:** one label for one action, everywhere
- **Lengths:** text is Tiny5 drawn at 2×, about 6.5 base px a character on average; measure the width, don't count characters. A dialogue paragraph fits 3 lines of 504 px (about 72 characters a line). An answer fits 166 px (about 25 characters). A quip, with its speaker's name, fits 452 px (about 60 characters)
- **Spelling:** Canadian (colour, favourite, neighbour). No em dashes and no emojis
- **Style:** plain, short and consistent: no flourishes, no figures of speech, no redundancy
- **Terms:** the home page is the website's page at `/`; it is never shown inside an installed app. The start screen is the game's first screen, in a browser and in an installed app. Return home always goes to the start screen, from any zone, the map or a card

## Rules

### Screen and controls

- Landscape, 720×360 base resolution. Phone browser first, with on-screen touch controls; keyboard on desktop. In portrait on a touch screen, the game draws turned a quarter turn to fill the screen, so the player turns the phone
- **Keyboard:** ←/→ or A/D to move; Space, ↑ or W to jump; E to use; P or Esc to open or close the pause card
- **Overlay:** the touch buttons show by default. Settings hides them, and hidden buttons still work
- **Touch buttons** (right thumb): Use above, Jump below. Each is labelled with its name, reads clearly as a button and stands out against any background, while hiding little of the play area. A button animates subtly when pressed
- **Touch movement:** a touch anywhere except on a button or other interactive element sets the neutral point where it lands. Dragging left or right from it past a small dead zone moves the duck that way at full speed; back inside the dead zone, she stops. Releasing ends the movement. Nothing marks the neutral point
- **Use:** opens a door, to a room or another area. PLACEHOLDER: what else it acts on

### Interface

- **Consistent:** the same element looks and behaves the same on every screen: top bars, panels, close controls, buttons, headings
- **Exact:** spacing sits on a fixed pixel grid: equal margins, aligned edges, and text clear of its box's edge by the same amount on both sides
- **Minimal:** show only what the player needs. No heading that repeats a tab's name, no label the picture already gives, and no decoration that competes with play
- **Options:** art mocks up visual options for the user to pick

### Grid

- **Duck:** 2 tiles wide and 3 tall
- **Reaches:** zones are built to the duck's reaches, measured in tiles from the top of the ground she leaves to the top of the ledge she lands on. A tap rises 4 tiles; a full jump rises 6; a full running jump with flutter crosses a 19-tile gap at the same height, with the jump pressed at its best moment, coyote time included. A ledge at a reach is always makeable, and one tile beyond it never is
- **Tiles:** zones are built on a grid of 12 px tiles, so the screen is 60 columns by 30 rows. Every solid, ledge, hazard and exit sits on whole tiles and spans whole tiles

### The duck

- **Flutter:** every fall flutters, after a jump or off a ledge: her fall is slow enough to use, and the player steers her in the air
- **Jump height:** a press launches her at once at the hop's speed. While Jump is held, her rise holds steady for up to 0.06 s, so the height grows from 4 tiles on a tap to 6 on a full hold. The jump is snappy: about 0.3 s to the top. On release, or when the hold runs out, gravity takes over. A buffered jump whose button was already released is a hop
- **Jump timing:** a jump pressed just after she leaves a ledge still jumps (coyote time), and a jump pressed just before she lands jumps as she lands (jump buffering)
- **Movement:** she walks left and right and jumps. She is quick and responsive: about 0.1 s to reach full speed or stop, on the ground and in the air. Her speeds, jump, flutter and timing values are in `src/data/duck.ts`, tuned to the reaches under Grid

### Map

- **Between zones:** the map shows before the first zone and after each zone's exit. She walks on to the next fork where she must choose, or stays at her place when only one path leads on. Where she has been and the paths she has travelled are marked
- **Choose:** at a fork, the fork buttons or ←/→ pick a path; tapping the map does not. Where only one path leads on, Continue moves her on
- **Forks:** at a fork she picks one of two or three paths. Paths split and rejoin, and every path reaches the same ending
- **No backtracking:** she only moves forward on the map, and never returns to a zone she has left
- **V1:** one path is built. Its forks still show, with the unbuilt paths and zones marked as unbuilt and not selectable. After home, a new lap starts (PLACEHOLDER: until the ending exists). The map's look is in the [art plan](../art/README.md)

### Zones

- **Areas:** a zone can have more than one area, joined by doors. Use at a door fades to the other area
- **Camera:** on the ground she sits about two thirds down the screen. The camera rises only when she climbs above the middle, and never shows below the lowest ground
- **Challenge:** platforming, hazards and choices. There is no combat
- **Checkpoint:** the start of a zone is its only checkpoint. Falling or touching a hazard restarts the zone from its start
- **Exit:** Use at the zone's exit clears the zone
- **Kinds:** indoor, outdoor, or a hybrid with both
- **Scale:** outdoors, the scenery is drawn at a quarter of indoor scale; the duck, the tiles and the reaches stay the same everywhere
- **Shape:** a zone is 2 screens (60 tiles) tall and as wide as it needs, and scrolls sideways and up. Indoors, to a small duck the ceilings are high: a door is 15 tiles tall, half the screen

### Objects

Everything in a zone except its terrain is placed in data, in three layers.

- **Archetypes:** a behaviour: collision (none, solid, one-way ledge, hazard or Use), movement, reaction, interaction (such as talking on Use or a quip on approach) and default tuning
- **Characters:** who something is: one archetype plus tuning overrides, its art and animations, hit box, size, its dialogue and quip lines, and quirks. No character inherits from another. Props (platforms, hazards, doors, exits and backdrops) are characters with art but no voice
- **Instances:** one placement in a zone: a character, a position, size and phase, last-word overrides, its own lines or dialogue scene, door targets, and flags for carried choices
- **Movement:** an algorithm (static, linear, ease, hop or wander), a direction, a distance, a speed, a pause at each end, and a random variance that rolls fresh on every attempt
- **Overrides:** flow one way: an instance overrides its character, which overrides its archetype. Everything resolves and is checked when the game loads
- **Reaction:** none, avoiding the duck, or approaching her, within a range

### Zone 1

- **Exit:** PLACEHOLDER: what the exit at the street's end is
- **Kind:** outdoor
- **Length:** 4 screens (240 tiles)
- **Street:** a day-time New York street, 2 screens tall: she walks the sidewalk along the bottom and climbs fire escapes, awnings and ledges into the upper screen, past a row of shops: a café, a florist, a gift shop, a makeup store, a pet shop and two restaurants. Its hazards are open cellar hatches in the sidewalk, a frog courier riding a delivery bike back and forth along it, and the ferret's first trap, a giant snap trap with a quip. Pigeons in flocks flee from her, a pug approaches her, and pedestrians walk past

### Rooms

- **Contents:** usually dialogue, and any of: items to buy or sell, quests to take, rewards, threats, and talk that advances the story or adds flavour
- **Enter:** Use at a room's door shows the room as a full-screen static scene, such as a bartender behind his bar. Play pauses until she leaves, and leaving returns her to the door

### Dialogue

- **Box:** a fixed box along the bottom, not a speech bubble, for a conversation between two characters, sometimes three. It shows the speaker's 64 px portrait with a name tab, and one paragraph of at most 3 lines. A paragraph that runs to a 4th line is reworded
- **Forward:** a tap or keypress moves to the next box. There is no back and no timer
- **Restarts:** after a zone restart, the zone's dialogue plays again
- **Skip:** every dialogue has a skip button at the top right that skips the conversation. Skip runs ahead to the next choice and stops there; once it is answered, Skip works again

### Quips

- Short messages during play, for cutscenes, notices and quips. They never pause play
- One line in a strip at the top centre, starting with the speaker's name

### The ferret

- **Appearances:** dialogue scenes in some zones, quips during play, and hazards it sets in zones
- **Calling card:** every trap it sets carries a badge of its stovepipe hat and bow tie
- **Ending:** the ferret is outwitted, never fought: the carried choices set up how the final scene goes

### Choices

- **Effect:** a choice changes where the duck goes, what she does and what she sees
- **Kinds:** dialogue answers, as two or three answer buttons in a row above the dialogue box, route forks in a zone, and forks on the map
- **Reach:** most choices affect only the current zone. A few flagged choices carry on to later zones or the ending, where they set up how she outwits the ferret

### Start screen

- **Back:** back with no card open leaves the game, the same way as Exit. In an installed app that hides Exit, back is the browser's own
- **Boot:** the game opens on the start screen, in landscape
- **Exit:** at the top right, at the far end. In an installed app it only closes the app; if the window stays open, the game stays as it was. In a browser tab it closes the tab, or goes to the site's home page if the tab stays open. Exit is hidden in installed apps that can't close themselves (iOS's and Firefox for Android's), and Settings then sits at the far right
- **Settings:** at the top right, beside Exit. It opens the settings card
- **Start:** the only other element. It opens the map, which at the beginning offers one place to go: the first zone

### Settings

- **Back:** back during play opens the pause card, and back with the card open closes it. Where the browser can't hand back to the game (Firefox for Android's installed app, and before the first tap or key in browsers without CloseWatcher), back is the browser's own
- **Open:** the pause button at the top left, shown only while a zone plays, P or Esc, or back
- **Pause card:** a card titled Paused, over the dimmed game, which pauses play, with a close X. Its rows: Settings, Return home, then Resume
- **Return home:** always goes to the start screen
- **Settings card:** opened from Settings on the pause card or the start screen. Its rows: Touch controls (Shown or Hidden, Shown by default), then Install while the game can be installed, which opens the install steps. The build label sits at its foot. Its close X, P, Esc and back each return to whichever opened it
