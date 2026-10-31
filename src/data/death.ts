import { DUCK } from "./duck";
import type { DeathTuning } from "./types";

export const DEATH: DeathTuning = {
  bounceSpeed: 96,
  fallGravity: DUCK.gravity,
  impactSeconds: 0.08,
  maxFallSpeed: 400,
  recoilSeconds: 0.1,
  recoilVelocity: { x: -48, y: -180 },
  voidFallDistance: 96,
};
