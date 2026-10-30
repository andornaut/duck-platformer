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

// The touch buttons Use and Jump instead press within a circle of this radius about each one's
// centre, or half the distance between their centres where that is less, so the two never
// overlap (touchRadius). Jump's reaches on into the screen's bottom-right corner as well
// (touchControls.ts).
export const TOUCH_CIRCLE_RADIUS = 60;

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

export interface Circle {
  readonly centre: Point;
  readonly radius: number;
}

// A press area's shape: a rect, a circle, or the union of several.
export type PressShape = Circle | Rect | readonly (Circle | Rect)[];

// The radius of the touch buttons' circles about centres a and b: TOUCH_CIRCLE_RADIUS, or half
// the distance between them where that is less, so the circles never overlap.
export function touchRadius(a: Point, b: Point): number {
  return Math.min(TOUCH_CIRCLE_RADIUS, Math.hypot(a.x - b.x, a.y - b.y) / 2);
}

// A button on screen: what it is, where it is drawn, and its press area.
export interface PressArea<K> {
  readonly art: Rect;
  readonly hit: PressShape;
  readonly key: K;
}

function contains(shape: PressShape, point: Point): boolean {
  if (Array.isArray(shape)) {
    return shape.some((part: Circle | Rect) => contains(part, point));
  }
  if ("radius" in shape) {
    return Math.hypot(point.x - shape.centre.x, point.y - shape.centre.y) < shape.radius;
  }
  const rect = shape as Rect;
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
