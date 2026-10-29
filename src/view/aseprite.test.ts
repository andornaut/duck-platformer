import { describe, expect, it } from "vitest";

import { artHitboxes } from "./aseprite";

describe("artHitboxes", () => {
  const sprite = { json: "s.json", key: "frog", once: [], png: "s.png" };
  it.each([
    ["no sprites", [], {}],
    ["a sprite without one", [sprite], {}],
    [
      "a sprite with one",
      [sprite, { ...sprite, hitbox: { height: 30, width: 48, x: 6, y: 6 }, key: "trap" }],
      { trap: { frame: { height: 26, width: 50 }, hitbox: { height: 30, width: 48, x: 6, y: 6 } } },
    ],
  ])("reads the hit boxes of %s", (_, sprites, hitboxes) => {
    expect(
      artHitboxes(() => ({ height: 26, width: 50 }), {
        backdrops: [],
        data: [],
        fonts: [],
        images: [],
        sprites,
        tilesets: [],
      }),
    ).toEqual(hitboxes);
  });
});
