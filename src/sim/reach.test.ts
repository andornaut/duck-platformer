import { describe, expect, it } from "vitest";

import { DUCK } from "../data/duck";
import { REACH } from "../data/reach";
import { TILE } from "../data/screen";
import { makes, type Reach } from "./reach";

describe("makes", () => {
  it.each(Object.keys(REACH) as Reach[])("makes the %s target and not one tile more", (reach) => {
    expect([
      makes(DUCK, TILE, reach, REACH[reach]),
      makes(DUCK, TILE, reach, REACH[reach] + 1),
    ]).toEqual([true, false]);
  });
});
