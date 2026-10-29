# Game Design

The rulebook: every rule the game is built to. What's left to build and tune is in [`README.md`](README.md), and undecided ideas are in [`ideas.md`](ideas.md).

`src/data/` holds every number and all player text. This doc states the rules, with numbers only where they define one.

## Pitch

A landscape platformer: a duck falls out of her room at the top of a New York hotel, flutters safely down to the street, and climbs back up through the hotel, one floor at a time, to get home.

## Setting

- **Characters:** the duck is the one the player controls: a small, round, cream duck with tiny wings and feet, an orange bill and a dot eye. Her full design is in the [art plan](../art/README.md). Animals talk, and most interactions are with animals. PLACEHOLDER: whether there are humans (see [`ideas.md`](ideas.md))
- **Ferret:** the villain, who schemes against the duck's climb: a brown ferret, about twice the duck's height, standing upright, with a dark eye mask, a tall plum stovepipe hat and a red bow tie. Its full design is in the [art plan](../art/README.md)
- **Hotel:** the building is a hotel in New York City. Each floor of it is one level
- **Levels:** level 1 is the ground floor: the street outside, then the lobby. Each later level is one everyday place in the hotel, such as a restaurant, pool or spa, and the whole level stays in that place. PLACEHOLDER: the later levels and their order
- **World:** the modern day, mixing fantasy and reality

## Core loop

1. **A level:** travel through one floor of the hotel, mostly left to right and bottom to top: platforming, talking with animals in rooms, and making choices that change the route.
2. **Up a level:** clearing a level takes the duck up to the next floor. PLACEHOLDER: how she gets up.
3. **The top:** on the top level she outwits the ferret, and gets home. PLACEHOLDER: the rest of the ending.

## Voice

- **Data:** every string a player sees lives in the text data files, with `{placeholders}` the game fills, never as a literal in code
- **Fit:** text never shrinks to fit. Reword it or grow its box
- **Labels:** one label for one action, everywhere
- **Lengths:** text is Tiny5 drawn at 2×, about 6.5 base px a character on average; measure the width, don't count characters. A dialogue paragraph fits 3 lines of 488 px (about 70 characters a line). An answer fits 162 px (about 24 characters). A quip, with its speaker's name, fits 452 px (about 60 characters)
- **Spelling:** Canadian (colour, favourite, neighbour). No em dashes and no emojis
- **Style:** plain, short and consistent: no flourishes, no figures of speech, no redundancy

## Rules

### Screen and controls

- Landscape, 720×360 base resolution. Phone browser first, with on-screen touch controls; keyboard on desktop
- **Keyboard:** ←/→ or A/D to move; Space, ↑ or W to jump; E to use
- **Overlay:** the touch buttons show by default. Settings hides them, and hidden buttons still work
- **Touch buttons** (right thumb): Use above, Jump below. Each is labelled with its name, reads clearly as a button and stands out against any background, while hiding little of the play area. A button animates subtly when pressed
- **Touch movement:** a touch anywhere except on a button or other interactive element sets the neutral point where it lands. Dragging left or right from it past a small dead zone moves the duck that way at full speed; back inside the dead zone, she stops. Releasing ends the movement. Nothing marks the neutral point
- **Use:** opens a door, to a room or into the hotel. PLACEHOLDER: what else it acts on

### Interface

- **Consistent:** the same element looks and behaves the same on every screen: top bars, panels, close controls, buttons, headings
- **Exact:** spacing sits on a fixed pixel grid: equal margins, aligned edges, and text clear of its box's edge by the same amount on both sides
- **Minimal:** show only what the player needs. No heading that repeats a tab's name, no label the picture already gives, and no decoration that competes with play
- **Options:** art mocks up visual options for the user to pick

### Grid

- **Duck:** 2 tiles wide and 3 tall
- **Reaches:** levels are built to the duck's reaches, measured in tiles from the top of the ground she leaves to the top of the ledge she lands on. A short hop rises 2 tiles; a full jump rises 6; a full jump with flutter crosses a 12-tile gap at the same height. A ledge at a reach is always makeable, and one tile beyond it never is
- **Tiles:** levels are built on a grid of 12 px tiles, so the screen is 60 columns by 30 rows. Every solid, ledge, hazard and exit sits on whole tiles and spans whole tiles

### The duck

- **Flutter:** every fall flutters, after a jump or off a ledge: her fall is slow enough to use, and the player steers her in the air
- **Jump timing:** a jump pressed just after she leaves a ledge still jumps (coyote time), and a jump pressed just before she lands jumps as she lands (jump buffering)
- **Movement:** she walks left and right and jumps. Her speeds, jump, flutter and timing values are in `src/data/duck.ts`, tuned to the reaches under Grid
- **Short hop:** releasing Jump while she rises cuts the jump short, so precise short hops stay possible

### Levels

- **Challenge:** platforming, hazards and choices. There is no combat
- **Checkpoint:** the start of a level is its only checkpoint. Falling or touching a hazard restarts the level from its start
- **No backtracking:** once she leaves a level, she never returns to it
- **Scale:** outdoors, the scenery is drawn at a quarter of indoor scale; the duck, the tiles and the reaches stay the same everywhere
- **Shape:** a level is 2 screens (60 tiles) tall and as wide as it needs, and scrolls sideways and up. To a small duck the hotel's ceilings are high: a door is 15 tiles tall, half the screen

### Level 1

- **Entrance:** the hotel door is seen only from the street. Use at the door enters the hotel after a quick fade, into the lobby, a separate indoor scene
- **Length:** 10 screens (540 tiles): 4 of street, then 6 of lobby
- **Lobby:** PLACEHOLDER: what happens there
- **Street:** a day-time New York street past the hotel's ground-floor shops: a café, a florist, a gift shop, a makeup store, a pet shop and two restaurants. Its hazards are open cellar hatches in the sidewalk, rolling traffic along it, and the ferret's first trap, set near the hotel door with a quip

### Rooms

- **Contents:** usually dialogue, and any of: items to buy or sell, quests to take, rewards, threats, and talk that advances the story or adds flavour
- **Enter:** Use at a room's door shows the room as a full-screen static scene, such as a bartender behind his bar. Play pauses until she leaves, and leaving returns her to the door

### Dialogue

- **Box:** a fixed box along the bottom, not a speech bubble, for a conversation between two characters, sometimes three. It shows the speaker's 64 px portrait with a name tab, and one paragraph of at most 3 lines. A paragraph that runs to a 4th line is reworded
- **Forward:** a tap or keypress moves to the next box. There is no back and no timer
- **Restarts:** after a level restart, the level's dialogue plays again
- **Skip:** every dialogue has a skip button at the top right that skips the conversation. Skip runs ahead to the next choice and stops there; once it is answered, Skip works again

### Quips

- Short messages during play, for cutscenes, notices and quips. They never pause play
- One line in a strip at the top centre, starting with the speaker's name

### The ferret

- **Appearances:** dialogue scenes in some levels, quips during play, and hazards it sets in levels
- **Ending:** the ferret is outwitted, never fought: the carried choices set up how the final scene goes

### Choices

- **Effect:** a choice changes where the duck goes, what she does and what she sees
- **Kinds:** dialogue answers, as two or three answer buttons in a row above the dialogue box, and route forks in the level
- **Reach:** most choices affect only the current level. A few flagged choices carry on to later levels or the ending, where they set up how she outwits the ferret

### Settings

- A pause card over the dimmed game, which pauses play. Its rows: Touch controls (Shown or Hidden, Shown by default), then Resume
