import { describe, expect, it } from "vitest";

import { type PlayHold, stepAction } from "./playHold";

describe("stepAction", () => {
  it.each<[PlayHold, boolean, ReturnType<typeof stepAction>]>([
    [undefined, false, "step"],
    [undefined, true, "exit"],
    ["door", false, "hold"],
    ["exit", true, "hold"],
    // The exit has opened and she has left for the map, the zone still cleared: the scene must
    // not open the exit again, which would hold play into the next zone.
    ["left", true, "hold"],
  ])("with play held for %s and the zone cleared %s: %s", (hold, cleared, action) => {
    expect(stepAction(hold, cleared)).toBe(action);
  });
});
