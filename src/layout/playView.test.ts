import { describe, expect, it } from "vitest";

import { SCREEN } from "../data/screen";
import { touchRoleAt } from "../input/intent";
import { bottomRightShift, playView, shifted } from "./playView";
import { TOUCH_CONTROLS } from "./touchControls";

// Canvases the play area makes at the game's scale: the game's own size, wider, and taller.
const CASES: [string, { height: number; width: number }][] = [
  ["the game's own size", SCREEN],
  ["a wider canvas", { height: SCREEN.height, width: SCREEN.width + 101 }],
  ["a taller canvas", { height: SCREEN.height + 40, width: SCREEN.width }],
];

describe("playView", () => {
  it.each(CASES)("in %s puts the view at the top, centred across", (_, canvas) => {
    const view = playView(canvas);
    const left = view.x;
    const right = canvas.width - (view.x + view.width);
    expect({
      centred: Math.abs(left - right) <= 1,
      size: { height: view.height, width: view.width },
      top: view.y,
    }).toEqual({ centred: true, size: SCREEN, top: 0 });
  });
});

describe("bottomRightShift", () => {
  // Jump keeps its distance from the canvas's bottom-right corner, and a press on it there
  // still takes it once moved back by the shift.
  it.each(CASES)("in %s keeps Jump at the bottom-right corner", (_, canvas) => {
    const shift = bottomRightShift(canvas);
    const jump = shifted(shift, TOUCH_CONTROLS.jump.centre);
    expect({
      fromBottom: canvas.height - jump.y,
      fromRight: canvas.width - jump.x,
      role: touchRoleAt(shifted(shift, jump, -1)),
    }).toEqual({
      fromBottom: SCREEN.height - TOUCH_CONTROLS.jump.centre.y,
      fromRight: SCREEN.width - TOUCH_CONTROLS.jump.centre.x,
      role: "jump",
    });
  });
});
