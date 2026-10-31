# Gameplay

The design of the game, how it's tuned and tested, and what's left for the first build. Duck Platformer is a landscape platformer about a lost duck travelling zone to zone across a map to get home. Phone browser first, with keyboard on desktop.

## Docs

| Doc                      | What it holds                   | Changes when            |
| ------------------------ | ------------------------------- | ----------------------- |
| [`design.md`](design.md) | The rulebook: rules and content | A design decision lands |
| [`ideas.md`](ideas.md)   | Undecided and cut ideas         | Every design session    |

Docs state the current rule only; git keeps the history. An idea stays in `ideas.md` until agreed, then moves to the doc it belongs in.

## Scope

Gameplay owns the rulebook and the values and content in the data value files (every `src/data/*.ts` except `types.ts`, `screen.ts`, the index and the tests). Every number (speeds, jump and flutter heights, timings, counts) and every string a player sees lives in those files, never in code. Reusable behaviour patterns for animals and moving inanimate objects are gameplay-owned values in `src/data/`: their primitives, sequences or states, transitions, timing, animations and tuning. Tech owns the schema, primitives, condition evaluation and shared executor. A new field, key or shape goes through tech.

## Method

- **Decisions:** the user's. Gameplay asks with a prompt, recommendation first and the trade-off in a line; routine work needs no asking.
- **Design sessions:** start with "design session" and a topic. Claude keeps floated ideas apart from agreed ones, asks the question that unblocks a decision, and on "wrap up" proposes doc changes, writing them once confirmed.
- **Difficulty:** keep zones around the shared configurable difficulty target and variation band defined in the rulebook and `src/data/`, rather than guaranteed escalation. Vary required climbing chunks, moving obstacles, ground hazards and dog yards; a seed need not include every challenge type. Every built and future stage, including the first tutorial and final stage, randomizes its middle on entry while keeping its opening and ending fixed. Retries retain the assembled layout.
- **Jump tuning:** use one uninterrupted ballistic ascent, with a minimum hop for short presses and the full jump on a hold. Place overhead short-jump challenges to match the measured hop. Keep the reaches in the rulebook aligned with the simulator, including coyote time in the running gap reach
- **Phone playtesting:** judge jump feel, touch input and readability on a landscape phone. The user performs device playtesting.
- **Tune to the targets:** a result inside its band needs no tuning. The user declares when the goal is met.

## V1 plan

The target is about 30 minutes across six themed map destinations (zones), each with two playable stages, on a linear route back to the shared apartment. The ordered zones and agreed story are in [`design.md`](design.md). The first stage combines the depot and streets of the blue cityscape. Every stage has a fixed opening and ending with a randomized middle assembled from hand-designed chunks. The park remains a prototype, not the final second stage. Branching routes and boss encounters are deferred to Next.

The six-destination V1 map has six built stages: Blue cityscape's Parcel depot and streets (`street`) and City boundary (`city-boundary`), followed by Industrial outskirts' Warehouse district (`warehouse-district`) and Freight terminal (`freight-terminal`), then Countryside's Farmland (`farmland`) and River crossing (`river-crossing`). The other catalogued stages and zones are visibly unavailable. A zone with one unlocked playable stage enters directly; more than one opens a choice modal with the latest available stage as the highlighted default and the earlier stage secondary. Clearing a stage returns to the map; completing a first stage unlocks its second when built, and completing the second opens the next zone. Replays preserve unlocks. The park is a debug prototype outside the V1 map. Current code still calls an individual stage `ZonePlan`.

## Targets

Each target is a band, not a point, assessed per stage and player skill. PLACEHOLDER: every band, agreed with the user. The kinds of target:

- **Stage length:** cumulative active time to clear a stage, by skill, including retries and excluding pause, dialogue, menus and the death flow. A retry starts at the stage checkpoint and touch jumps are imprecise, so a stage is short enough that a restart doesn't sting
- **Reaches:** the duck makes every jump at a reach in the rulebook's Grid, and never one tile beyond it. A pass or fail check, not a band
- **Restarts:** a failed attempt is one that ends in death (a fall, hazard or crush), followed by the retry choice. Restarts per stage, by skill: some attempts fail, and the band says how often
- **Route spread:** every route a choice opens lands within a narrow window of the stage's median clear time and restart rate, so no route is a lot easier or harder
- **Session length:** the time to finish the game, by skill

## Remaining for the first build

**Current implementation scope:** both Countryside stages, Farmland and River crossing, using shared layouts, objects and behaviour graphs with muted yellow countryside skins and configuration. The goose signals before a committed short charge in bounded territory, then rests; the dog and raccoon keep their existing zone behaviours. Both stages retain fixed boundaries around randomized middles with mandatory climbs, lifts, shuttles and red hazards. Water is decorative scenery. Clearing Freight terminal opens Farmland, which opens River crossing on completion. Existing IDs, save shape and replay unlocks are preserved. Woodland and later zones remain unavailable. There are no new rooms, plot, dialogue or bosses.

Open questions:

- **Beginning:** the cause of the duck and ferret's fight
- **Confirm, keyboard has no overlay:** assumed, the touch control overlay shows only with touch
- **Confirm, one-way ledges:** assumed, he jumps up through an awning or other one-way ledge from below and lands on top of it
- **Confirm, restarts reset choices:** assumed, a zone restart also resets the choices made in that zone
- **Ending:** the outcome of their friendship when the duck returns to the shared apartment
- **Friends:** the identities of the friends the ferret enlists beyond the dog, raccoon and goose, and their encounters
- **Map:** Next's branching routes
- **Rooms:** the currency and what items do; what quests and rewards give and how they are tracked; what a threat leads to; whether a room can be revisited, and whether its dialogue changes
- **Use:** what it acts on besides doors (assumed: talking to animals, and objects at route forks)
- **Zones:** detailed layouts and encounters for the remaining planned stages
