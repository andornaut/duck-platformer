import { describe, expect, it } from "vitest";

import hintSheet from "../../public/art/sprites/ui-move-hint.json";
import { SCREEN } from "../data/screen";
import { TOUCH } from "../data/touch";
import type { Point } from "../data/types";
import type { HeldTouch } from "../input/intent";
import { bottomShift, shifted } from "../layout/playView";
import { MOVE_HINT, TOUCH_CONTROLS } from "../layout/touchControls";
import { knobOffset, moveHintView } from "./moveHint";
import { centredAt } from "./touchControls";

const { knobReach } = MOVE_HINT;
const REST = MOVE_HINT.centre;
const DEAD = TOUCH.moveDeadZone;

const touch = (role: HeldTouch["role"], start: Point, at: Point): HeldTouch => ({
  role,
  startX: start.x,
  startY: start.y,
  x: at.x,
});
const START = { x: 200, y: 250 };

describe("the move hint at rest", () => {
  it("draws art's frame at its top-left", () => {
    const { h, w } = Object.values(hintSheet.frames)[0]?.frame ?? { h: 0, w: 0 };
    expect(centredAt(MOVE_HINT.centre, { height: h, width: w })).toEqual({
      x: MOVE_HINT.art.x,
      y: MOVE_HINT.art.y,
    });
  });

  // Level with Jump, inside the view across and at the canvas's bottom: in a wider canvas it
  // moves across with the view, and below the game it moves down with the bar.
  it.each([
    ["the game's own size", SCREEN, MOVE_HINT.centre],
    [
      "a wider canvas",
      { height: SCREEN.height, width: SCREEN.width + 180 },
      { x: MOVE_HINT.centre.x + 90, y: MOVE_HINT.centre.y },
    ],
    [
      "a taller canvas",
      { height: SCREEN.height + 40, width: SCREEN.width },
      { x: MOVE_HINT.centre.x, y: MOVE_HINT.centre.y + 40 },
    ],
  ])("sits in %s at %j, level with Jump", (_, canvas, centre) => {
    const shift = bottomShift(canvas);
    expect({
      at: shifted(shift, MOVE_HINT.centre),
      jumpY: shifted(shift, TOUCH_CONTROLS.jump.centre).y,
    }).toEqual({ at: centre, jumpY: centre.y });
  });
});

describe("moveHintView", () => {
  const atRest = { centre: REST, knob: REST, knobTag: "rest", ringTag: "rest" };

  it.each<[string, HeldTouch[], object]>([
    ["no touch: at rest", [], atRest],
    ["a button held: at rest", [touch("jump", START, START)], atRest],
    [
      "a drag right: on its start, held right, the knob at its reach",
      [touch("move", START, { x: START.x + 30, y: START.y })],
      {
        centre: START,
        knob: { x: START.x + knobReach, y: START.y },
        knobTag: "held",
        ringTag: "held-right",
      },
    ],
    [
      "a drag left: held left",
      [touch("move", START, { x: START.x - 30, y: START.y })],
      {
        centre: START,
        knob: { x: START.x - knobReach, y: START.y },
        knobTag: "held",
        ringTag: "held-left",
      },
    ],
    [
      "a drag inside the dead zone: the ring at rest on its start, the knob followed",
      [touch("move", START, { x: START.x + DEAD, y: START.y })],
      { centre: START, knob: { x: START.x + DEAD, y: START.y }, knobTag: "held", ringTag: "rest" },
    ],
    [
      "a drag up and right: the knob across only",
      [touch("move", START, { x: START.x + 30, y: START.y - 40 })],
      {
        centre: START,
        knob: { x: START.x + knobReach, y: START.y },
        knobTag: "held",
        ringTag: "held-right",
      },
    ],
    [
      "two drags: the later one",
      [
        touch("move", { x: 100, y: 200 }, { x: 70, y: 200 }),
        touch("move", START, { x: START.x + 30, y: START.y }),
      ],
      {
        centre: START,
        knob: { x: START.x + knobReach, y: START.y },
        knobTag: "held",
        ringTag: "held-right",
      },
    ],
  ])("%s", (_, touches, view) => {
    expect(moveHintView(TOUCH, knobReach, REST, touches)).toEqual(view);
  });
});

describe("knobOffset", () => {
  it.each([
    [0, 0],
    [5, 5],
    [-5, -5],
    [knobReach, knobReach],
    [100, knobReach],
    [-100, -knobReach],
  ])("moves the knob %i across by %i", (dx, offset) => {
    expect(knobOffset(knobReach, dx)).toBe(offset);
  });
});
