import type { Scene } from "phaser";

import type { Progress } from "../save";
import type { ZoneData } from "./ZoneScene";

// Starts the scene saved progress resumes at, in place of scene: the start of the zone she was
// in, opened under the pause card when paused, or the map where she stood after clearing one,
// each on the saved lap seed, so an assembled zone is assembled the same. From the beginning,
// the map with nothing played, which draws a new lap seed.
export function resumeProgress(scene: Scene, paused: boolean, progress: Progress): void {
  if (progress.at === "zone") {
    scene.scene.start("zone", {
      paused,
      route: progress.route,
      seed: progress.seed,
    } satisfies ZoneData);
  } else if (progress.at === "map") {
    scene.scene.start("map", { played: true, route: progress.route, seed: progress.seed });
  } else {
    scene.scene.start("map");
  }
}
