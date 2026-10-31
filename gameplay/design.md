# Game Design

The rulebook: every rule the game is built to. What's left to build and tune is in [`README.md`](README.md), and undecided ideas are in [`ideas.md`](ideas.md).

`src/data/` holds every number and all player text. This doc states the rules, with numbers only where they define one.

## Pitch

A landscape platformer: a duck travels back to the apartment he shared with his former best friend, a ferret, after the ferret mails him far away. V1 follows one linear route; branching routes are planned for Next.

## Setting

- **Characters:** the male duck is the one the player controls: a small, round, cream duck with tiny wings and feet, an orange bill and a dot eye. His full design is in the [art plan](../art/README.md). Animals talk; there are no humans.
- **Ferret:** the duck's male former best friend and apartment-mate: a champagne (cream-coloured) ferret, about twice the duck's height, standing upright, with a tall plum stovepipe hat and a red bow tie. His full design is in the [art plan](../art/README.md)
- **Story:** the duck and ferret share an apartment in a big city. After a big fight, the ferret packages the sleeping duck and mails him far away. The duck knows the ferret is responsible and wants to get home. The cause of the fight and the outcome of their friendship are undecided
- **World:** the modern day, mixing fantasy and reality
- **Zones:** a zone is one themed map destination containing two playable levels, indoors, outdoors or a hybrid of both. V1 has six zones and twelve levels. The V1 route is listed below; this implementation covers only the first level and its first dog encounter

## Core loop

1. **A level:** travel through one place, mostly left to right and bottom to top: platforming and talking with animals. Each zone contains two levels; V1 follows a linear route.
2. **The map:** each zone is a themed destination. Its two-level selection and checkpoints are planned below. V1 continues along its linear route; Next adds branching routes.
3. **Home:** the duck returns to the shared apartment. The outcome of his friendship with the ferret is undecided.

## Voice

- **Data:** every string a player sees lives in the text data files, with `{placeholders}` the game fills, never as a literal in code
- **Fit:** text never shrinks to fit. Reword it or grow its box
- **Labels:** one label for one action, everywhere
- **Lengths:** text is Tiny5 drawn at 2×, about 6.5 base px a character on average; measure the width, don't count characters. A dialogue paragraph fits 3 lines of 504 px (about 72 characters a line). An answer fits 166 px (about 25 characters). A quip, with its speaker's name, fits 452 px (about 60 characters)
- **Spelling:** Canadian (colour, favourite, neighbour). No em dashes and no emojis
- **Style:** plain, short and consistent: no flourishes, no figures of speech, no redundancy
- **Terms:** the home page is the website's page at `/`; it is never shown inside an installed app. The start screen is the game's first screen, in a browser and in an installed app. Back to title always goes to the start screen, from any zone, the map or a card

## Rules

A level is the individual playable layout, currently represented by `ZonePlan` in code. A zone is the themed map destination containing two levels. The current prototype maps individual levels; the six-destination map and two-level checkpoint flow below are an implementation plan, not completed behaviour.

### Screen and controls

- Landscape, 720×360 base resolution. Phone browser first, with on-screen touch controls; keyboard on desktop. In portrait on a touch screen, the game draws turned a quarter turn to fill the screen, so the player turns the phone
- **Keyboard:** ←/→ or A/D to move; Space, ↑ or W to jump; E to use; P or Esc to open or close the pause card
- **Overlay:** the move hint and the touch buttons show by default. Settings hides each set on its own, and hidden controls still work
- **Touch buttons** (right thumb): Use above, Jump below. Each is an open ring with its icon and no label, reads clearly as a button and stands out against any background, while hiding little of the play area. Every control stays inside the game's view across, with its drawn edge at least 8 px from the edge it is placed against: Pause 8 px in from the view's top and left, Jump 8 px in from the view's right and 20 px up from the screen's bottom, and Use 100 px above Jump with its ring 85 px in from the view's right. On a screen taller than 2:1, Jump, Use and the move hint sit in the spare space below the game. Each presses within 100 base px of its centre (a clear circle of 63 plus the move hint's radius of 37, so the hint never reaches into the clear circle), the two cut along the line midway between them so they never overlap; Jump's also reaches into the bottom-right corner of the screen. A button animates subtly when pressed
- **Touch movement:** a touch anywhere except on a button or other interactive element sets the neutral point where it lands. Dragging left or right from it past a small dead zone moves the duck that way at full speed; back inside the dead zone, he stops. Releasing ends the movement
- **Move hint** (left thumb): a left and right marker that rests level with Jump, as far in from the view's left edge as Use is from its right edge. It is only a drawing and has no press area of its own. While a touch is moving him, it sits on the neutral point; on release it returns to rest.
- **Use:** opens a room's door. PLACEHOLDER: what else it acts on

### Interface

- **Consistent:** the same element looks and behaves the same on every screen: top bars, panels, close controls, buttons, headings
- **Exact:** spacing sits on a fixed pixel grid: equal margins, aligned edges, and text clear of its box's edge by the same amount on both sides
- **Minimal:** show only what the player needs. No heading that repeats a tab's name, no label the picture already gives, and no decoration that competes with play
- **Options:** art mocks up visual options for the user to pick
- **Press areas:** apart from Jump and Use, a button's press area is the drawn button plus a quarter of its shorter side on each side, between 6 and 16 px, and at least 48×48. Where press areas overlap, the nearer button wins

### Grid

- **Duck:** 2 tiles wide and 3 tall
- **Reaches:** levels are built to the duck's reaches, measured in tiles from the top of the ground he leaves to the top of the ledge he lands on. A quick tap rises 1 tile (clearing a 1-tile ledge with a little room); a full jump rises 6; a full running jump with flutter crosses a 19-tile gap at the same height, with the jump pressed at its best moment, coyote time included. A ledge at a reach is always makeable, and one tile beyond it never is
- **Tiles:** levels are built on a grid of 12 px tiles, so the screen is 60 columns by 30 rows. Every solid, ledge and door sits on whole tiles and spans whole tiles. Hazards follow the grid, except for the 2 to 3 px thickness of edge hazards

### The duck

- **Flutter:** every fall flutters, after a jump or off a ledge: his fall is slow enough to use, and the player steers him in the air
- **Jump height:** every press launches him at full speed, and he keeps rising while Jump is held, up to about 6.5 tiles with the top at about 0.3 s. Letting go within the first 0.12 s stops the rise where he is, so the quickest tap rises about 1.5 tiles and a 0.1 s press about 3.7; letting go later halves his upward speed. A buffered jump whose button was already released is the quickest tap. This lets a level set obstacles only a tap clears, such as a low ledge beneath a ceiling with a red edge hazard
- **Jump timing:** a jump pressed just after he leaves a ledge still jumps (coyote time), and a jump pressed just before he lands jumps as he lands (jump buffering)
- **Movement:** he walks left and right and jumps. He is quick and responsive: about 0.1 s to reach full speed or stop, on the ground and in the air. His speeds, jump, flutter and timing values are in `src/data/duck.ts`, tuned to the reaches under Grid

### Map

The current prototype uses individual levels as map nodes, named zones in its data. Its current behaviour:

- **Backtracking:** he can walk back to any open level and replay any level he has completed
- **Between levels:** the map shows after the start screen's Start or Continue, and after he clears a level, with him on that level. The levels he has completed and the paths he has opened are marked
- **Open levels:** the first level is open from the start and must be completed before anything else opens. Completing a level opens the paths past it, through forks, to the next levels; a level not completed closes everything past it. Unbuilt paths and levels stay closed
- **Celebration:** clearing the last level, the one whose path leads on to home, shows a celebration screen every time, replays included (PLACEHOLDER: until it is designed). Continue returns to the map with him on that level, where he can walk back and replay; Restart asks first, as on the start screen
- **Walk:** he stands on a level. Tapping any open level's marker, or ←/→, walks him there, and Continue plays the level he stands on
- **Forks:** planned for Next. At a fork the path splits two or three ways, and completing the zone before it opens each of them
- **V1:** the target is one linear route through six themed zone destinations with two levels each, ending at the shared apartment, with no laps. This is the target plan, not a claim that the route is built. The map's look is in the [art plan](../art/README.md)

Planned two-level flow:

- **Checkpoints:** each level starts at its own checkpoint, with unlimited retries. Falls, hazards and crushes restart the current level, not the whole zone
- **Going back:** walking left from either level checkpoint returns to the map
- **Selection:** selecting a zone opens a modal with Level one and Level two. Reaching a level unlocks it, persists it for replay and highlights the latest reached level. Replaying an earlier level preserves later unlocks

### Levels

- **Camera:** on the ground he sits about two thirds down the screen. In an assembled level, the ground line follows the chunk he is in, blending across half a screen at each seam. The camera rises only when he climbs above the middle, and never shows below the lowest ground. Decorative background layers use tunable parallax, with farther layers scrolling more slowly; ground props stay attached to the terrain
- **Challenge:** platforming, hazards and choices. Routes use ledges and cliffs, not ladders, with both short-press jumps beneath low ceilings and full jumps. There is no combat
- **Checkpoint:** the start of a level is its only checkpoint. Falling or touching a hazard restarts the level from its start. Progress is saved: the levels he has completed and where he stands on the map. Clearing a level marks it completed and returns him to the map on it; a level left before its end is played again from its start
- **Crush:** a moving platform that pushes him sideways carries him to its leading edge. If it squeezes him into terrain or another solid, he is crushed and the level restarts from its start, as a hazard does. Layouts leave room beside every moving platform's path so he is never pinned on a required route
- **Difficulty:** levels use the same configurable difficulty target and variation band in `src/data/`, with variation inside it rather than guaranteed escalation between levels or from start to finish
- **Doors:** doors lead only into rooms. Use enters a door when any part of his drawn frame overlaps the door's drawn art; where he overlaps more than one, the door whose centre is nearest his wins
- **Edge hazards:** a common red strip, 2 to 3 px thick, can cover the top, bottom, left or right edge of terrain. Terrain edges and interactive antagonists share the lethal red contact treatment. There are no spikes. Touching any edge hazard restarts the level from its start
- **Exit:** reaching the end of the level clears it, and the game moves straight on to the map
- **Going back:** walking all the way back to the level's left edge leaves it without completing it: the screen fades and the map shows with him on that level, and nothing is saved. Every level starts him clear of that edge and has no wall in front of it
- **Kinds:** indoor, outdoor, or a hybrid with both
- **Layout:** level 1 is hand-built as the tutorial. Every later level, including the final level, has a randomized layout assembled from hand-built chunks: a fixed start chunk, a seeded run of chunks whose entry and exit heights match, then a fixed finish chunk. The rules for chunks are under Chunks
- **Reroll:** an assembled level's layout changes each time he enters it from the map. Restarts within the level keep it
- **Scale:** outdoors, the scenery is drawn at a quarter of indoor scale; the duck, the tiles and the reaches stay the same everywhere
- **Shape:** a level is at most 2 screens (60 tiles, 720 px) tall and as wide as it needs, and scrolls sideways and up. Indoors, to a small duck the ceilings are high: a door is 15 tiles tall, half the screen

### Chunks

- **Assembly:** a level's recipe names its theme, start and finish chunks, a length range (start and finish included), a configurable difficulty band, and the events and doors to place. The seed varies the middle chunks within that band, without requiring difficulty to rise; the start and finish chunks are exempt. It never picks the same chunk twice in a row, and it fills the slots
- **Difficulty:** 1 to 5. 1: walking and taps. 2: full jumps and still hazards. 3: gaps near the reach, single moving platforms and single low-ceiling tap spots. 4: timed platforms or moving hazards on the required path. 5: compounded tap-only, timed or platform-to-platform challenges
- **Fairness:** every chunk is walked on its own from entry to exit, with its slots empty and filled, and a sample of seeds per recipe is walked end to end
- **Seams:** a chunk's entry and exit are the ground rows at its left and right edges: 50, 40 or 30. The seam surface is terrain and runs at least 4 tiles in from the edge, with no gap there, and nothing (no solid, ledge, hazard or moving platform) in the 6 rows above it
- **Shape:** one or two screens wide (60 to 120 tiles) and at most 60 rows (720 px) tall
- **Slots:** marked regions where the seed places an event or a door. A chunk must pass with every slot empty
- **Themes:** a theme sets the tileset, terrain looks and repeated backdrops for every chunk of that theme, so seams never show. A chunk can still place its own scenery. The park is an outdoor prototype theme

### Objects

Everything in a level except its terrain is placed in data through archetypes, characters and instances.

- **Archetypes:** a behaviour: collision (none, solid, one-way ledge, hazard or Use), movement, reaction, interaction (such as talking on Use or a quip on approach) and default tuning
- **Characters:** who something is: one archetype plus tuning overrides, its art and animations, hit box, size, its dialogue and quip lines, and quirks. No character inherits from another. Props (platforms, hazards, doors and backdrops) are characters with art but no voice
- **Decoration:** background animals, animals in windows and animals in parallax layers are nonlethal decoration. Interactive antagonists are always lethal on contact and have a thin red contact outline
- **Instances:** one placement in a level: a character, a position, size and phase, last-word overrides, its own lines or dialogue scene, a door's room, and flags for carried choices
- **Movement:** an algorithm (static, linear, ease, hop or wander), a direction, a distance, a speed, a pause at each end, and a random variance that rolls fresh on every attempt
- **Overrides:** flow one way: an instance overrides its character, which overrides its archetype. Everything resolves and is checked when the game loads
- **Reaction:** none, avoiding the duck, or approaching him, within a range

### V1 route

The target play time is about 30 minutes across six themed zones of two levels, in this order. Only the first level and its first dog encounter are being implemented now. Its depot and streets form one fixed tutorial; every later level, including the final climb, is randomized.

| Zone           | First level                          | Second level           |
| -------------- | ------------------------------------ | ---------------------- |
| Blue cityscape | Depot and streets, combined tutorial | City boundary          |
| Industrial     | Warehouse                            | Freight terminal       |
| Countryside    | Farmland                             | River crossing         |
| Woodland       | Forest paths                         | Ravine                 |
| Home city      | Outskirts                            | Familiar neighbourhood |
| Apartment      | Entrance and lobby                   | Climb to the apartment |

### First level

- **Layout:** the fixed tutorial combines the parcel depot and streets of the blue cityscape in one area. The duck starts beside his opened parcel on safe ground, then crosses a one-tile step, a full-jump block and a short red-edged gap before entering the streets. A later low ceiling over a one-tile step requires a short press
- **Rooms:** the street door leads to the prototype test room
- **Route:** the main path continues right toward the city boundary; the upper street ledges are an optional detour. The city boundary is planned as the zone's second level and is not built by this change

The park is a prototype for randomized levels, not V1's second level. The identities of the ferret's friends beyond the first dog and the later encounters along the route are undecided.

### First dog encounter

- **Activation:** proximity starts the introduction once per attempt, freezing play. Completing or skipping it activates the dog and resumes play
- **Approach:** the loading yard follows the basic hop and full-jump lessons and precedes the streets. A refuge ledge before the ground patrol and another beyond it give safe observation and landing points. Neither requires a maximum-height jump. The first encounter has no other hazards
- **Contact:** the dog is always lethal on contact, including during crouch and rest, with a thin red contact outline
- **Cycle:** patrol, crouch, rush, rest, then patrol again. A nearby duck on the same ground triggers the crouch; the rush direction locks when crouching starts, and the rush stays inside the patrol area
- **Dialogue:** the first introduction has three lines: the dog says the ferret asked him to stop the duck; the duck says he is going home; the dog tells him to get past. The player-facing wording lives in the text data files, with Skip available
- **Timing:** the dog uses the same timing across both planned levels of the first zone; their layouts vary. The encounter draft covers only the first encounter in the first level

### Rooms

- **Contents:** usually dialogue, and any of: items to buy or sell, quests to take, rewards, threats, and talk that advances the story or adds flavour
- **Enter:** Use at a room's door plays the door's opening animation, if it has one, with play held, then shows the room as a full-screen still scene with a little animation, such as a bartender behind his bar. Play pauses until he leaves, and leaving returns him to the door, shown closed. He leaves with the Leave button in a corner, back, or Esc
- **Per level:** every level has at least one room. PLACEHOLDER: each is an empty test room for now, showing only its name
- **World:** the side-scrolling levels are the game world; rooms are the only other places, each reached through a door

### Dialogue

- **Box:** a fixed box along the bottom, not a speech bubble, for a conversation between two characters, sometimes three. It shows the speaker's 64 px portrait with a name tab, and one paragraph of at most 3 lines. A paragraph that runs to a 4th line is reworded
- **Forward:** a tap or keypress moves to the next box. There is no back and no timer
- **Restarts:** after a level restart, the level's dialogue plays again. The first dog introduction is once per attempt
- **Skip:** every dialogue has a skip button at the top right that skips the conversation. Skip runs ahead to the next choice and stops there; once it is answered, Skip works again

### Quips

- Short messages during play, for cutscenes, notices and quips. They never pause play
- One line in a strip at the top centre, starting with the speaker's name

### The ferret

- **Appearances:** the ferret enlists his friends as a favour. A friend or group is responsible for a themed zone and appears in person or through dialogue overlays; identities beyond the first dog are undecided
- **Boss encounters:** deferred to Next, outside V1
- **Calling card:** every trap it sets carries a badge of its stovepipe hat and bow tie
- **Ending:** the duck returns home; the outcome of their friendship is undecided. There is no combat

### Choices

- **Effect:** a choice changes where the duck goes, what he does and what he sees
- **Kinds:** dialogue answers, as two or three answer buttons in a row above the dialogue box. Route forks in zones and on the map are planned for Next
- **Reach:** choice effects on later zones or the ending are undecided. Branching routes are planned for Next

### Start screen

- **Back:** back with no card open leaves the game, the same way as Exit, wherever Exit shows; elsewhere back is the browser's own
- **Boot:** the game opens in landscape. With saved progress it opens on the map where he stands; with no save it opens on the start screen. It never opens straight into a zone
- **Exit:** at the top right, at the far end. In a browser tab it goes straight to the home page. In an installed app it closes the app, and it shows only in apps that can close themselves (Chrome's Android app, and Chrome or Edge desktop app windows); in every other installed app (iOS, Firefox for Android, Samsung Internet and Edge for Android) it is hidden, and Settings sits at the far right
- **Restart:** on the start screen with a save, and on the celebration. It asks first on a card: a short question, Restart, which confirms, and Cancel; back and Esc cancel. Confirming clears only the saved progress and opens the map with him on the first zone and nothing completed. It never clears stats or achievements, which keep their own save
- **Settings:** at the top right, beside Exit. It opens the settings card
- **Start:** with no save it reads Start and opens the map with him on the first zone. With a save (reached through Back to title) Start gives way to Continue, which opens the map where he stands, and Restart beside it. There is one save

### Settings

- **Back:** back during play opens the pause card, and back with the card open closes it. Where the browser can't hand back to the game (Firefox for Android's installed app, and before the first tap or key in browsers without CloseWatcher), back is the browser's own
- **Back to title:** always goes to the start screen
- **Modals:** every card over the game (the pause card, the settings card and its install steps, the restart question) has no title bar: its title is centred near the top and its close X sits at its top-right corner. While one is open, only the card responds: nothing under it does, not the start screen's nav bar, the pause button, the touch controls, the map or doors. A tap anywhere outside a card that can close only closes it, as its close X or back would, the margins beside the game included; on a card with no close, a required choice, it does nothing at all. A press that drags does nothing
- **Open:** the pause button at the top left, shown only while a zone plays, P or Esc, or back. It also opens by itself when the frame turns, or stops turning, while a zone plays, and only then; Resume continues
- **Pause card:** a card titled Paused, over the dimmed game, which pauses play, with a close X. Its buttons, all one shape, stacked: Resume first, the primary in green, then Settings and Back to title
- **Settings card:** opened from Settings on the pause card or the start screen. Its rows: Move controls (the move hint) and Action buttons (Use and Jump), each a switch, on by default, then Install while the game can be installed, which opens the install steps. The build label sits at its foot. Its close X, P, Esc and back each return to whichever opened it
