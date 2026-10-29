# Gameplay

The design of the game, how it's tuned and tested, and what's left for the first build. Duck Platformer is a landscape platformer about a duck climbing back up her high-rise, one floor at a time. Phone browser first, with keyboard on desktop.

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
- **Playtest what needs eyes:** play the build headless on a landscape phone viewport, and report what broke to tech or art. The user playtests. PLACEHOLDER: the build URL and its dev parameters.
- **Simulate before tuning:** every difficulty change is compared before and after against a baseline, with a headless simulator that plays the real rules with bots at three skills (novice, typical, expert) and reports the targets per floor. Simulate only what a decision needs, with the same seed before and after, and re-baseline after a change that reorders random draws. Results go to the user as tables with a recommendation. Only gameplay runs simulations at scale. PLACEHOLDER: the simulator and its command; tech builds it.
- **Tune to the targets:** a result inside its band needs no tuning. The user declares when the goal is met.

## Targets

Each target is a band, not a point, that the simulator reports per floor and skill. PLACEHOLDER: every band, agreed with the user. The kinds of target:

- **Floor length:** the time to clear a floor, by skill. A mistake restarts the floor and touch jumps are imprecise, so a floor is short enough that a restart doesn't sting
- **Restarts:** a failed attempt is one that ends in a floor restart (a fall or a hazard). Restarts per floor, by skill: some attempts fail, and the band says how often
- **Route spread:** every route a choice opens lands within a narrow window of the floor's median clear time and restart rate, so no route is a lot easier or harder
- **Session length:** the time to finish the game, by skill

## Remaining for the first build

**Done when:** PLACEHOLDER: the user's goal for the first build.

Open questions:

- **Climbing between floors:** how the duck gets from one floor up to the next
- **Confirm, dialogue pauses play:** assumed, a dialogue box pauses play
- **Confirm, keyboard has no overlay:** assumed, the touch control overlay shows only with touch
- **Confirm, restarts reset choices:** assumed, a floor restart also resets the choices made on that floor
- **Ending:** what waits at the top
- **Floors:** the list and order of floor themes
- **Interact:** what it acts on (assumed: talking to animals, and doors and objects at route forks)
