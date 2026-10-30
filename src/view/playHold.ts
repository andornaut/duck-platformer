// Why a zone's play holds still: the fade out of a cleared zone, and back in where the next zone
// plays in the same scene. Each run of ZoneScene starts with none.
export type PlayHold = "fade" | undefined;

// What a frame does with each step of play: step the rules, leave the cleared zone once, or
// nothing while play holds. The fade holds play from leaving until the map takes over, so a
// zone is never left twice.
export function stepAction(hold: PlayHold, cleared: boolean): "hold" | "leave" | "step" {
  if (hold !== undefined) {
    return "hold";
  }
  return cleared ? "leave" : "step";
}
