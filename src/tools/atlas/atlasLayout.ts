import type { Point } from "@andornaut/game-kit/rect";

// Mobile GPUs guarantee textures up to 2048 pixels a side.
export const ATLAS_MAX_SIZE = 2048;
// Each image's edge pixels repeat this far outward, so a frame sampled just past its edge reads
// its own colour rather than a neighbour's.
export const EXTRUDE = 1;
const PAGE_WIDTHS = [256, 512, 1024, 2048] as const;

// An image to pack, by its key.
export interface PackItem {
  readonly height: number;
  readonly key: string;
  readonly width: number;
}

// Where an image's top-left sits, on which page.
export interface Placement extends Point {
  readonly key: string;
  readonly page: number;
}

export interface PageSize {
  readonly height: number;
  readonly width: number;
}

export interface AtlasLayout {
  readonly pages: readonly PageSize[];
  readonly placements: readonly Placement[];
}

// Shelf packs items, tallest first, onto pages width wide, each cell EXTRUDE larger on every
// side, so images sit 2 * EXTRUDE apart and EXTRUDE from the page's edges. Undefined when an
// item is wider than width or taller than maxSize.
function packShelves(
  items: readonly PackItem[],
  width: number,
  maxSize: number,
): AtlasLayout | undefined {
  const pages: PageSize[] = [];
  const placements: Placement[] = [];
  let [x, y, shelfHeight, pageHeight] = [0, 0, 0, 0];
  for (const { height, key, width: itemWidth } of items) {
    const [cellWidth, cellHeight] = [itemWidth + 2 * EXTRUDE, height + 2 * EXTRUDE];
    if (cellWidth > width || cellHeight > maxSize) {
      return undefined;
    }
    if (x + cellWidth > width) {
      [x, y, shelfHeight] = [0, y + shelfHeight, 0];
    }
    if (y + cellHeight > maxSize) {
      pages.push({ height: pageHeight, width });
      [x, y, shelfHeight, pageHeight] = [0, 0, 0, 0];
    }
    placements.push({ key, page: pages.length, x: x + EXTRUDE, y: y + EXTRUDE });
    x += cellWidth;
    shelfHeight = Math.max(shelfHeight, cellHeight);
    pageHeight = Math.max(pageHeight, y + shelfHeight);
  }
  if (placements.length > 0) {
    pages.push({ height: pageHeight, width });
  }
  return { pages, placements };
}

// Packs items into pages of at most maxSize a side, at the page width that needs the fewest
// pages, each one a request, then the least area, preferring the narrower on a tie. Throws on
// an item too large for a page.
export function layoutAtlas(
  items: readonly PackItem[],
  maxSize: number = ATLAS_MAX_SIZE,
): AtlasLayout {
  const sorted = [...items].sort(
    (a, b) => b.height - a.height || b.width - a.width || (a.key < b.key ? -1 : 1),
  );
  const area = ({ pages }: AtlasLayout) =>
    pages.reduce((sum, page) => sum + page.width * page.height, 0);
  let best: AtlasLayout | undefined;
  for (const width of [...PAGE_WIDTHS.filter((candidate) => candidate < maxSize), maxSize]) {
    const layout = packShelves(sorted, width, maxSize);
    if (
      layout !== undefined &&
      (best === undefined ||
        layout.pages.length < best.pages.length ||
        (layout.pages.length === best.pages.length && area(layout) < area(best)))
    ) {
      best = layout;
    }
  }
  if (best === undefined) {
    const largest = sorted.find(
      ({ height, width }) => Math.max(width, height) + 2 * EXTRUDE > maxSize,
    );
    throw new Error(`${largest?.key ?? "An image"} is too large for a ${maxSize} px atlas page`);
  }
  return best;
}
