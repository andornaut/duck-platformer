# Game Design

The rulebook: every rule the game is built to. What's left to build and tune is in [`README.md`](README.md), and undecided ideas are in [`ideas.md`](ideas.md).

`src/data/` holds every number and all player text. This doc states the rules, with numbers only where they define one.

## Pitch

A landscape, left-to-right platformer: a duck falls out of her apartment at the top of a high-rise, flutters safely down to the bottom, and climbs back up through the building to get home.

## Setting

- **Characters:** the duck, a cute duck, is the one the player controls. Animals talk, and most interactions are with animals. PLACEHOLDER: whether there are humans (see [`ideas.md`](ideas.md))
- **Floors:** each floor is one everyday place in the building, such as a restaurant, pool or spa, and the whole floor stays in that place. PLACEHOLDER: the floors and their order
- **World:** the modern day, mixing fantasy and reality

## Core loop

1. **A floor:** travel left to right through one themed place: platforming, talking with animals, and making choices that change the route.
2. **Up a floor:** clearing a floor takes the duck up to the next. PLACEHOLDER: how she gets up.
3. **The top:** reaching the top floor gets her home. PLACEHOLDER: the ending.

## Voice

- **Data:** every string a player sees lives in the text data files, with `{placeholders}` the game fills, never as a literal in code
- **Fit:** text never shrinks to fit. Reword it or grow its box
- **Labels:** one label for one action, everywhere
- **Spelling:** Canadian (colour, favourite, neighbour). No em dashes and no emojis
- **Style:** plain, short and consistent: no flourishes, no figures of speech, no redundancy

## Rules

### Screen and controls

- Landscape. Phone browser first, with on-screen touch controls; keyboard on desktop
- **Interact:** PLACEHOLDER: what it acts on
- **Keyboard:** ←/→ or A/D to move; Space, ↑ or W to jump; E to interact
- **Overlay:** a subtle overlay marks where each touch control activates, without obscuring much of the play area. A control animates subtly when it activates, by tap or by drag. The overlay is visible by default; Settings hides it
- **Touch buttons** (right thumb): Jump and Interact
- **Touch movement** (left thumb): a fixed control in the lower left. Dragging left or right from its centre moves the duck, like a joystick. Tapping its left or right half acts as a left or right button

### Interface

- **Consistent:** the same element looks and behaves the same on every screen: top bars, panels, close controls, buttons, headings
- **Exact:** spacing sits on a fixed pixel grid: equal margins, aligned edges, and text clear of its box's edge by the same amount on both sides
- **Minimal:** show only what the player needs. No heading that repeats a tab's name, no label the picture already gives, and no decoration that competes with play
- **Options:** art mocks up visual options for the user to pick

### The duck

- **Flutter:** every jump flutters: her fall is slow enough to use, and the player steers her in the air
- **Movement:** she walks left and right and jumps. PLACEHOLDER: her speeds and the jump and flutter values, in `src/data/`

### Floors and restarts

- **Challenge:** platforming, hazards and choices. There is no combat
- **Restart:** falling or touching a hazard restarts the current floor

### Dialogue

- **Box:** a text rectangle, not a speech bubble, for a conversation between two characters, sometimes three. Each screen shows one paragraph
- **Forward:** a tap or keypress moves to the next screen. There is no back and no timer
- **Restarts:** after a floor restart, the floor's dialogue plays again
- **Skip:** every dialogue has a skip button that skips the whole conversation

### Quips

- Short messages during play, for cutscenes, notices and quips. They never pause play

### Choices

- **Effect:** a choice changes where the duck goes, what she does and what she sees
- **Kinds:** dialogue answers in the dialogue box, and route forks in the level
- **Reach:** most choices affect only the current floor. A few flagged choices carry on to later floors or the ending

### Settings

- A settings page, with a toggle for the touch control overlay (on by default)
