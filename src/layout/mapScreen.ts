import type { MapNode, Point, Rect, Size } from "../data/types";
import type { Arrowhead, PathStroke } from "../view/mapPath";

// Art's paper map (art/README.md, Map), in base pixels. Offsets marked "from the centre" are from
// a node's centre. The paper fills the screen; each marker's centre pixel sits on its node's
// centre; a zone's icon sits centred over its marker; the duck stands on the current marker's
// ring. Continue's label, centred with its play mark, starts at labelY, sinking to pressedLabelY
// while Continue is pressed. At a fork, a choice button per route on, gap apart and centred on
// middle at y, takes Continue's place; its press area starts hitAbove px above it, and its label
// (at most labelWidth wide) and arrow sit at their offsets inside it. A tap on a zone marker
// lands within nodeHit, centred on its node: at least a touch button's 44 square.
export const MAP_SCREEN = {
  continue: {
    hit: { height: 44, width: 160, x: 280, y: 300 } satisfies Rect,
    labelY: 311,
    pressedLabelY: 313,
  },
  duck: {
    fork: { x: -13, y: -36 } satisfies Point,
    zone: { x: -13, y: -39 } satisfies Point,
  },
  forkChoice: {
    arrow: { x: 140, y: 11 } satisfies Point,
    gap: 8,
    height: 36,
    hitAbove: 4,
    hitHeight: 44,
    label: { x: 19, y: 9 } satisfies Point,
    labelWidth: 112,
    middle: 360,
    width: 160,
    y: 304,
  },
  icon: { x: -7, y: -7 } satisfies Point,
  marker: {
    fork: { x: -14, y: -14 } satisfies Point,
    zone: { x: -17, y: -17 } satisfies Point,
  },
  nodeHit: { height: 44, width: 44 } satisfies Size,
  paper: { height: 360, width: 720, x: 0, y: 0 } satisfies Rect,
  textScale: 2,
  title: { x: 24, y: 16 } satisfies Point,
} as const;

// How paths are drawn: each bent by bend times its length, stamped every step px, and stopped
// trim px from the centre of the node at each end, by the node's kind.
export const MAP_PATH = {
  bend: 0.08,
  step: 0.5,
  trim: { fork: 11, zone: 15 } satisfies Record<MapNode["kind"], number>,
} as const;

// Each look a path takes, in a palette colour: built and not, travelled this lap, and at a fork,
// each route on she may choose and the one she has chosen.
export const MAP_PATH_LOOKS = {
  built: { colour: "dbrown", stroke: { kind: "dashes", off: 4, on: 6, width: 2 } },
  selectable: {
    arrow: { along: 0.55, back: 6.5, spread: 137, tip: 7 },
    colour: "dbrown",
    stroke: { kind: "dashes", off: 4, on: 6, width: 2 },
  },
  selected: {
    arrow: { along: 0.55, back: 7.8, spread: 137, tip: 8.4 },
    colour: "dred",
    stroke: { kind: "dashes", off: 8, on: 6, width: 4 },
  },
  travelled: { colour: "dred", stroke: { kind: "solid", width: 4 } },
  unbuilt: { colour: "slate", stroke: { every: 6, kind: "dots", width: 2 } },
} as const satisfies Record<
  string,
  { readonly arrow?: Arrowhead; readonly colour: string; readonly stroke: PathStroke }
>;

export type PathLook = keyof typeof MAP_PATH_LOOKS;

// A zone's name under its marker, from the name's advance width at the text scale: its text's
// origin, and the cream knock-out drawn under it, over the paths.
export function mapLabel(advance: number, centre: Point): { knockout: Rect; origin: Point } {
  const origin = { x: centre.x - Math.floor((advance - 4) / 2) - 2, y: centre.y + 12 };
  return {
    knockout: { height: 16, width: advance + 4, x: origin.x - 2, y: centre.y + 17 },
    origin,
  };
}

// The fork-choice buttons for count routes on: where each is drawn, and the area a press on it
// must land in.
export function forkChoiceRects(count: number): { art: Rect; hit: Rect }[] {
  const { gap, height, hitAbove, hitHeight, middle, width, y } = MAP_SCREEN.forkChoice;
  const left = middle - (count * width + (count - 1) * gap) / 2;
  return Array.from({ length: count }, (_, i) => {
    const x = left + i * (width + gap);
    return {
      art: { height, width, x, y },
      hit: { height: hitHeight, width, x, y: y - hitAbove },
    };
  });
}
