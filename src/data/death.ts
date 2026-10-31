import { DUCK } from "./duck";
import type { DeathTuning } from "./types";

export const DEATH: DeathTuning = {
  bounceSpeed: 96,
  fallGravity: DUCK.gravity,
  impactSeconds: 0.08,
  maxFallSpeed: 400,
  recoilSeconds: 0.1,
  recoilVelocity: { x: -48, y: -72 },
  voidFallDistance: 96,
};

export const DEATH_PROGRESS: Readonly<
  Record<string, { readonly fill: string; readonly track: string }>
> = {
  park: { fill: "green", track: "forest" },
  street: { fill: "sky", track: "dslate" },
};
