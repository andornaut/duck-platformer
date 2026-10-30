import type { Point, Rect } from "../data/types";

// Every button's press area reaches past its drawn button on every side by marginShare of the
// button's shorter side, but never less than leastMargin or more than mostMargin, in base
// pixels, and is at least minTarget on each side, grown evenly about the button's centre where
// it would be smaller. Jump's reaches on to the screen's right and bottom edges as well
// (touchControls.ts).
export const HIT_RULE = {
  leastMargin: 6,
  marginShare: 0.25,
  minTarget: 48,
  mostMargin: 16,
} as const;

// How far a drawn button's press area reaches past it on every side.
export function hitMargin(art: Rect): number {
  const { leastMargin, marginShare, mostMargin } = HIT_RULE;
  return Math.min(mostMargin, Math.max(leastMargin, marginShare * Math.min(art.width, art.height)));
}

// A drawn button's press area: art grown by hitMargin on every side, then to minTarget on each
// axis where it is still smaller, about its centre.
export function hitAround(art: Rect): Rect {
  const margin = hitMargin(art);
  const grow = (start: number, size: number) => {
    const grown = size + 2 * margin;
    const side = Math.max(grown, HIT_RULE.minTarget);
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

// A button's press area with its drawn button (hitAround).
export function pressArea<K>(key: K, art: Rect): PressArea<K> {
  return { art, hit: hitAround(art), key };
}
