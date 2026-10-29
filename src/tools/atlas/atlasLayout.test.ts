import { describe, expect, it } from "vitest";

import { EXTRUDE, layoutAtlas, type PackItem } from "./atlasLayout";

const items = (sizes: readonly (readonly [number, number])[]): PackItem[] =>
  sizes.map(([width, height], index) => ({ height, key: `item-${index}`, width }));

// Each placed item's cell, its extruded border included.
function cells(packed: readonly PackItem[], maxSize?: number) {
  const layout = layoutAtlas(packed, maxSize);
  return {
    cells: layout.placements.map(({ key, page, x, y }) => {
      const item = packed.find((candidate) => candidate.key === key);
      return {
        bottom: y + (item?.height ?? 0) + EXTRUDE,
        key,
        left: x - EXTRUDE,
        page,
        right: x + (item?.width ?? 0) + EXTRUDE,
        top: y - EXTRUDE,
      };
    }),
    layout,
  };
}

describe("layoutAtlas", () => {
  it.each([
    ["one image", items([[24, 24]]), undefined, 1],
    [
      "a row of sprites",
      items([
        [672, 42],
        [384, 80],
        [300, 36],
        [250, 26],
      ]),
      undefined,
      1,
    ],
    [
      "tall and wide art",
      items([
        [48, 720],
        [640, 96],
        [336, 272],
        [96, 204],
      ]),
      undefined,
      1,
    ],
    [
      "more than one page holds",
      items([
        [60, 60],
        [60, 60],
        [60, 60],
        [60, 60],
        [60, 60],
      ]),
      128,
      2,
    ],
  ])("places %s once each, inside its page, clear of the others", (_, packed, maxSize, pages) => {
    const { cells: placed, layout } = cells(packed, maxSize);
    expect(placed.map(({ key }) => key).sort()).toEqual(packed.map(({ key }) => key).sort());
    expect(layout.pages).toHaveLength(pages);
    for (const cell of placed) {
      const page = layout.pages[cell.page];
      expect(cell.left).toBeGreaterThanOrEqual(0);
      expect(cell.top).toBeGreaterThanOrEqual(0);
      expect(cell.right).toBeLessThanOrEqual(page?.width ?? 0);
      expect(cell.bottom).toBeLessThanOrEqual(page?.height ?? 0);
      const overlapping = placed.filter(
        (other) =>
          other !== cell &&
          other.page === cell.page &&
          other.left < cell.right &&
          cell.left < other.right &&
          other.top < cell.bottom &&
          cell.top < other.bottom,
      );
      expect(overlapping).toEqual([]);
    }
  });

  it("throws on an image too large for a page, naming it", () => {
    expect(() =>
      layoutAtlas(
        items([
          [24, 24],
          [200, 24],
        ]),
        128,
      ),
    ).toThrow("item-1");
  });
});
