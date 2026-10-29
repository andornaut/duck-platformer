import type { Point, Rect } from "../data/types";

// A path on the map: a quadratic Bezier from one node's centre to the next.
export interface Curve {
  readonly control: Point;
  readonly from: Point;
  readonly to: Point;
}

// How a path is inked: squares width wide stamped every step px along it, solid, dashed (on and
// off count the stamps' centres, in px), or as dots, one at each end and the rest spaced evenly,
// about every px apart.
export type PathStroke =
  | { readonly kind: "dashes"; readonly off: number; readonly on: number; readonly width: number }
  | { readonly kind: "dots"; readonly every: number; readonly width: number }
  | { readonly kind: "solid"; readonly width: number };

// An arrowhead along a path: at along (a fraction of its length), its tip tip px ahead along the
// curve, and its two back corners back px away, spread degrees either side of ahead.
export interface Arrowhead {
  readonly along: number;
  readonly back: number;
  readonly spread: number;
  readonly tip: number;
}

// A path's ends: each node's centre, and how far from it the path stops.
export interface PathEnds {
  readonly from: Point;
  readonly fromTrim: number;
  readonly to: Point;
  readonly toTrim: number;
}

// Points sampled evenly in t along a curve, each with the arc length up to it.
interface Arc {
  readonly lengths: readonly number[];
  readonly points: readonly Point[];
}

const SAMPLES = 1024;

// The curve from one centre to the next, its control point the chord's midpoint pushed sideways
// by bend times the chord's length: to the left of travel for an even index, the right for odd.
export function bentCurve(bend: number, from: Point, to: Point, index: number): Curve {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const side = index % 2 === 0 ? 1 : -1;
  return {
    control: {
      x: (from.x + to.x) / 2 + side * bend * dy,
      y: (from.y + to.y) / 2 - side * bend * dx,
    },
    from,
    to,
  };
}

function pointAt({ control, from, to }: Curve, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
    y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
  };
}

function arcOf(curve: Curve): Arc {
  const points = Array.from({ length: SAMPLES + 1 }, (_, i) => pointAt(curve, i / SAMPLES));
  let length = 0;
  const lengths = points.map((point, i) => {
    const before = points[i - 1];
    length += before ? Math.hypot(point.x - before.x, point.y - before.y) : 0;
    return length;
  });
  return { lengths, points };
}

// The point s px along an arc, and the unit direction of travel there.
function along({ lengths, points }: Arc, s: number): { point: Point; ahead: Point } {
  let low = 1;
  let high = SAMPLES;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if ((lengths[mid] ?? 0) < s) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  const i = low;
  const a = points[i - 1] ?? { x: 0, y: 0 };
  const b = points[i] ?? a;
  const start = lengths[i - 1] ?? 0;
  const span = (lengths[i] ?? start) - start;
  const k = span === 0 ? 0 : (s - start) / span;
  const size = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return {
    ahead: { x: (b.x - a.x) / size, y: (b.y - a.y) / size },
    point: { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k },
  };
}

// The first arc length at which the curve is at least far from centre, searching from one end.
function trimAt(arc: Arc, centre: Point, far: number, fromEnd: boolean): number {
  const total = arc.lengths.at(-1) ?? 0;
  const distance = (s: number) => {
    const { point } = along(arc, fromEnd ? total - s : s);
    return Math.hypot(point.x - centre.x, point.y - centre.y);
  };
  let low = 0;
  let high = total;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    if (distance(mid) < far) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return fromEnd ? total - high : high;
}

// A width x width square centred on a point, snapped to whole pixels.
export function stampAt(width: number, { x, y }: Point): Rect {
  const corner = (centre: number) => Math.floor(centre - width / 2 + 0.5);
  return { height: width, width, x: corner(x), y: corner(y) };
}

// Whether the stamp distance px along a dashed path inks.
export function dashInks(on: number, off: number, distance: number): boolean {
  return distance % (on + off) <= on;
}

// The pixels a filled triangle covers: those whose centres fall inside it, and those its corners
// fall in, so a sharp tip still shows.
function triangle(a: Point, b: Point, c: Point): Rect[] {
  const cross = (p: Point, q: Point, r: Point) =>
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const xs = [a.x, b.x, c.x];
  const ys = [a.y, b.y, c.y];
  const rects: Rect[] = [a, b, c].map((corner) => ({
    height: 1,
    width: 1,
    x: Math.floor(corner.x),
    y: Math.floor(corner.y),
  }));
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
      const p = { x: x + 0.5, y: y + 0.5 };
      const sides = [cross(a, b, p), cross(b, c, p), cross(c, a, p)];
      if (sides.every((side) => side >= 0) || sides.every((side) => side <= 0)) {
        rects.push({ height: 1, width: 1, x, y });
      }
    }
  }
  return rects;
}

// The squares that ink a path along curve between its trimmed ends, stamped every step px, with
// its arrowhead if it has one. Each square once.
export function pathRects(
  step: number,
  stroke: PathStroke,
  arrow: Arrowhead | undefined,
  ends: PathEnds,
  curve: Curve,
): Rect[] {
  const arc = arcOf(curve);
  const start = trimAt(arc, ends.from, ends.fromTrim, false);
  const end = trimAt(arc, ends.to, ends.toTrim, true);
  const length = Math.max(0, end - start);
  const distances: number[] = [];
  if (stroke.kind === "dots") {
    // The trim search can leave the length just under a whole number of spacings; it counts as whole.
    const count = Math.floor(length / stroke.every + 1e-6) + 1;
    for (let i = 0; i < count; i++) {
      distances.push(count === 1 ? 0 : (length * i) / (count - 1));
    }
  } else {
    for (let i = 0; i * step <= length; i++) {
      const distance = i * step;
      if (stroke.kind === "solid" || dashInks(stroke.on, stroke.off, distance)) {
        distances.push(distance);
      }
    }
  }
  const rects = distances.map((distance) =>
    stampAt(stroke.width, along(arc, start + distance).point),
  );
  if (arrow) {
    const { ahead, point } = along(arc, start + arrow.along * length);
    const turn = (degrees: number, far: number): Point => {
      const angle = (degrees * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: point.x + far * (ahead.x * cos - ahead.y * sin),
        y: point.y + far * (ahead.x * sin + ahead.y * cos),
      };
    };
    rects.push(
      ...triangle(
        turn(0, arrow.tip),
        turn(arrow.spread, arrow.back),
        turn(-arrow.spread, arrow.back),
      ),
    );
  }
  const seen = new Set<string>();
  return rects.filter((rect) => {
    const key = `${rect.x},${rect.y},${rect.width}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
