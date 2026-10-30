// Why a zone's play holds still: a door's fade, the cleared zone's exit opening, or the zone
// left for the map. Each run of ZoneScene starts with none.
export type PlayHold = "door" | "exit" | "left" | undefined;

// What a frame does with each step of play: step the rules, open the cleared zone's exit once,
// or nothing while play holds. A zone already left never opens its exit again, however long the
// scene runs before the map takes over.
export function stepAction(hold: PlayHold, cleared: boolean): "exit" | "hold" | "step" {
  if (hold !== undefined) {
    return "hold";
  }
  return cleared ? "exit" : "step";
}
