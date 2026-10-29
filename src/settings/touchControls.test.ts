import { describe, expect, it } from "vitest";

import { decodeTouchControls, encodeTouchControls } from "./touchControls";

describe("the Touch controls setting", () => {
  it.each([true, false])("reads back %s as stored", (shown) => {
    expect(decodeTouchControls(encodeTouchControls(shown))).toBe(shown);
  });

  it.each([null, "", "unknown"])("reads %j as shown", (stored) => {
    expect(decodeTouchControls(stored)).toBe(true);
  });
});
