import type { Point, Rect } from "../data/types";

// How far each kind of button's press area reaches past its drawn button, in base pixels: the
// touch buttons Use and Jump and the pause button by touchControl (Jump further, by jumpReach,
// toward Use and the game, and out to the screen's right and bottom edges), and every other
// button (card rows and buttons, Start, the nav's icon buttons, the map's buttons and markers) by
// button. Every press area is at least MIN_TARGET on each side.
export const HIT_MARGINS = { button: 6, jumpReach: 16, touchControl: 8 } as const;

// A touch target's least size on each side (art/README.md, UI).
export const MIN_TARGET = 44;

// A drawn button's press area: art grown by margin on every side, then to MIN_TARGET on each
// axis where it is still smaller, about its centre.
export function hitAround(margin: number, art: Rect): Rect {
  const grow = (start: number, size: number) => {
    const grown = size + 2 * margin;
    const side = Math.max(grown, MIN_TARGET);
    return { size: side, start: start - margin - (side - grown) / 2 };
  };
  const x = grow(art.x, art.width);
  const y = grow(art.y, art.height);
  return { height: y.size, width: x.size, x: x.start, y: y.start };
}

// A button on screen: what it is, where it is drawn, and its press area.
export interface PressArea<K> {
  readonly art: Rect;
  readonly hit: Rect;
  readonly key: K;
}

function contains(rect: Rect, point: Point): boolean {
  return (
    point.x >= rect.x &&
    point.x < rect.x + rect.width &&
    point.y >= rect.y &&
    point.y < rect.y + rect.height
  );
}

function distanceToCentre(art: Rect, point: Point): number {
  return Math.hypot(point.x - (art.x + art.width / 2), point.y - (art.y + art.height / 2));
}

// The button a press at point lands on: of those whose press area takes it in, the one whose
// drawn button's centre is nearest, so where two areas overlap the nearer button wins.
export function pressedArea<K>(areas: readonly PressArea<K>[], point: Point): K | undefined {
  let best: PressArea<K> | undefined;
  for (const area of areas) {
    if (
      contains(area.hit, point) &&
      (best === undefined || distanceToCentre(area.art, point) < distanceToCentre(best.art, point))
    ) {
      best = area;
    }
  }
  return best?.key;
}

// A button's press area with its drawn button, grown by margin (hitAround).
export function pressArea<K>(key: K, margin: number, art: Rect): PressArea<K> {
  return { art, hit: hitAround(margin, art), key };
}
