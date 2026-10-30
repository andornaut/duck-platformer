import duckSheet from "../../public/art/sprites/duck.json";
import type { DuckTuning, Point, Size } from "../data/types";
import { duckFrameRect, type DuckState } from "../rules/duck";
import { sheetFrameSize } from "./aseprite";

// Her drawn frame's size, from art's duck sheet: every frame is this big.
export const DUCK_FRAME: Size = sheetFrameSize(duckSheet);

export type DuckTag = "flutter" | "idle" | "jump" | "land" | "walk";

// The tag she shows, and how long she has shown it as of this step.
export interface DuckPose {
  readonly ms: number;
  readonly tag: DuckTag;
}

export const startPose: DuckPose = { ms: 0, tag: "flutter" };

// Her pose after one step of stepMs from before to after. Rising, she jumps; falling, she
// flutters; on the step she lands, land starts and plays for landMs; on the ground she walks
// while moving and idles while still.
export function stepPose(
  landMs: number,
  stepMs: number,
  before: DuckState,
  after: DuckState,
  pose: DuckPose,
): DuckPose {
  const ms = pose.ms + stepMs;
  let tag: DuckTag;
  if (!after.grounded) {
    tag = after.vy < 0 ? "jump" : "flutter";
  } else if (!before.grounded) {
    tag = "land";
  } else if (pose.tag === "land" && ms < landMs) {
    tag = "land";
  } else {
    tag = after.vx === 0 ? "idle" : "walk";
  }
  return tag === pose.tag ? { ms, tag } : { ms: 0, tag };
}

// The whole-pixel top-left of her frame (duckFrameRect).
export function duckFrameAt(tuning: DuckTuning, frame: Size, duck: DuckState): Point {
  const { x, y } = duckFrameRect(tuning, frame, duck);
  return { x, y };
}
