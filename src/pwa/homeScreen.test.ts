import { describe, expect, it } from "vitest";

import { type HomeCover, type HomeScreen, trackHomeScreen } from "./homeScreen";

type Step = ["cover", HomeCover, boolean] | ["shown"];

function run(steps: readonly Step[]): boolean[] {
  const seen: boolean[] = [];
  const home: HomeScreen = trackHomeScreen((onHome) => seen.push(onHome));
  for (const step of steps) {
    if (step[0] === "shown") {
      home.shown();
    } else {
      home.cover(step[1], step[2]);
    }
  }
  return seen;
}

describe("trackHomeScreen", () => {
  it.each<{ name: string; seen: boolean[]; steps: Step[] }>([
    { name: "nothing before the zone shows", seen: [], steps: [["cover", "sideways", true]] },
    { name: "home once the zone shows", seen: [true], steps: [["shown"], ["shown"]] },
    {
      name: "away while the pause card is open",
      seen: [true, false, true],
      steps: [["shown"], ["cover", "pauseCard", true], ["cover", "pauseCard", false]],
    },
    {
      name: "away until every cover is gone",
      seen: [true, false, true],
      steps: [
        ["shown"],
        ["cover", "pauseCard", true],
        ["cover", "sideways", true],
        ["cover", "pauseCard", false],
        ["cover", "sideways", false],
      ],
    },
    {
      name: "home only once a cover from before the zone is gone",
      seen: [true],
      steps: [["cover", "sideways", true], ["shown"], ["cover", "sideways", false]],
    },
  ])("$name", ({ seen, steps }) => {
    expect(run(steps)).toEqual(seen);
  });
});
