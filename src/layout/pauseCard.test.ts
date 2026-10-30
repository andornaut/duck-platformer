import { describe, expect, it } from "vitest";

import { SCREEN } from "../data/screen";
import { PAUSE_BUTTON } from "./pauseCard";
import { TOUCH_CONTROLS } from "./touchControls";

describe("PAUSE_BUTTON", () => {
  // Both frames draw their edge 1px inside, so equal frame insets put the edges 16px in.
  it("sits as far in from the top-left corner as Jump from the bottom-right, 15px", () => {
    const jump = TOUCH_CONTROLS.jump.art;
    expect({
      jumpBottom: SCREEN.height - (jump.y + jump.height),
      jumpRight: SCREEN.width - (jump.x + jump.width),
      pauseLeft: PAUSE_BUTTON.art.x,
      pauseTop: PAUSE_BUTTON.art.y,
    }).toEqual({ jumpBottom: 15, jumpRight: 15, pauseLeft: 15, pauseTop: 15 });
  });
});
