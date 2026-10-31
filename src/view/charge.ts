import type { CharacterState } from "../data/types";
import type { ChargeState } from "../rules/charge";

export function chargePose(charge: ChargeState): { flipX: boolean; state: CharacterState } {
  return {
    flipX: charge.facing === -1,
    state: !charge.active ? "idle" : charge.phase === "patrol" ? "move" : charge.phase,
  };
}
