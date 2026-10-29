import { inkWidth, parseBitmapFont } from "@andornaut/game-kit/text/bitmapFont";
import { describe, expect, it } from "vitest";

import fontBody from "../../public/art/fonts/font-body.fnt?raw";
import { MAP_SCREEN } from "../layout/mapScreen";
import { ZONE_MAP } from "./map";
import { TEXT } from "./text";

const ZONE_IDS = ZONE_MAP.nodes.filter((node) => node.kind === "zone").map((node) => node.id);

describe("ZONE_MAP", () => {
  it.each(ZONE_IDS)("names zone node %s in TEXT", (id) => {
    expect(TEXT.map.zones[id]).toBeTruthy();
  });

  it.each(ZONE_IDS)("fits zone node %s's name on a fork-choice button", (id) => {
    const { labelWidth } = MAP_SCREEN.forkChoice;
    const width = inkWidth(
      parseBitmapFont(fontBody),
      MAP_SCREEN.textScale,
      TEXT.map.zones[id] ?? "",
    );
    expect(width).toBeLessThanOrEqual(labelWidth);
  });
});
