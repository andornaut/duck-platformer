# Gameplay

The design of the game, how it's tuned and tested, and what's left for the first build. Duck Platformer is a landscape platformer about a lost duck travelling zone to zone across a map to get home. Phone browser first, with keyboard on desktop.

## Docs

| Doc                      | What it holds                   | Changes when            |
| ------------------------ | ------------------------------- | ----------------------- |
| [`design.md`](design.md) | The rulebook: rules and content | A design decision lands |
| [`ideas.md`](ideas.md)   | Undecided and cut ideas         | Every design session    |

Docs state the current rule only; git keeps the history. An idea stays in `ideas.md` until agreed, then moves to the doc it belongs in.

## Scope

Gameplay owns the rulebook and the values and content in the data value files (every `src/data/*.ts` except `types.ts`, `screen.ts`, the index and the tests). Every number (speeds, jump and flutter heights, timings, counts) and every string a player sees lives in those files, never in code. A new field, key or shape goes through tech.

## Method

- **Decisions:** the user's. Gameplay asks with a prompt, recommendation first and the trade-off in a line; routine work needs no asking.
- **Design sessions:** start with "design session" and a topic. Claude keeps floated ideas apart from agreed ones, asks the question that unblocks a decision, and on "wrap up" proposes doc changes, writing them once confirmed.
- **Difficulty:** keep zones around the same configurable difficulty target and variation band, whose defaults live in `src/data/`, rather than guaranteed escalation. Zone 1 is fixed; every later zone, including the final zone, randomizes on entry.
- **Playtest what needs eyes:** play the build headless on a landscape phone viewport, and report what broke to tech or art. The user playtests. PLACEHOLDER: the build URL and its dev parameters.
- **Simulate before tuning:** every difficulty change is compared before and after against a baseline, with a headless simulator that plays the real rules with bots at three skills (novice, typical, expert) and reports the targets per zone. Simulate only what a decision needs, with the same seed before and after, and re-baseline after a change that reorders random draws. Results go to the user as tables with a recommendation. Only gameplay runs simulations at scale. PLACEHOLDER: the simulator and its command; tech builds it.
- **Tune to the targets:** a result inside its band needs no tuning. The user declares when the goal is met.

## V1 plan

The target is about 30 minutes across six groups of two zones on a linear route back to the shared apartment. The ordered groups and agreed story are in [`design.md`](design.md). Only the first zone, a fixed depot-and-streets tutorial in the blue cityscape, is being implemented now. Every later zone, including the final zone, is randomized. The park remains a prototype, not the final second zone. Branching routes are planned for Next.

## Targets

Each target is a band, not a point, that the simulator reports per zone and skill. PLACEHOLDER: every band, agreed with the user. The kinds of target:

- **Zone length:** the time to clear a zone, by skill. A mistake restarts the zone and touch jumps are imprecise, so a zone is short enough that a restart doesn't sting
- **Reaches:** the duck makes every jump at a reach in the rulebook's Grid, and never one tile beyond it. A pass or fail check, not a band
- **Restarts:** a failed attempt is one that ends in a zone restart (a fall or a hazard). Restarts per zone, by skill: some attempts fail, and the band says how often
- **Route spread:** every route a choice opens lands within a narrow window of the zone's median clear time and restart rate, so no route is a lot easier or harder
- **Session length:** the time to finish the game, by skill

## Remaining for the first build

**Current implementation scope:** the first zone only. The full V1 route and play-time target above are the plan, not completed content.

Open questions:

- **Beginning:** the cause of the duck and ferret's fight
- **Confirm, dialogue pauses play:** assumed, a dialogue box pauses play
- **Confirm, keyboard has no overlay:** assumed, the touch control overlay shows only with touch
- **Confirm, one-way ledges:** assumed, he jumps up through an awning or other one-way ledge from below and lands on top of it
- **Confirm, restarts reset choices:** assumed, a zone restart also resets the choices made in that zone
- **Ending:** the outcome of their friendship when the duck returns to the shared apartment
- **Friends:** the identities of the friends the ferret enlists and their encounters
- **Map:** the presentation of the linear V1 route and Next's branching routes
- **Rooms:** the currency and what items do; what quests and rewards give and how they are tracked; what a threat leads to; whether a room can be revisited, and whether its dialogue changes
- **Use:** what it acts on besides doors (assumed: talking to animals, and objects at route forks)
- **Zones:** detailed layouts and encounters for the planned zones after zone 1
