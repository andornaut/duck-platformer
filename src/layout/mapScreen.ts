import type { MapNode, Point, Rect, Size } from "../data/types";
import type { PathStroke } from "../view/mapPath";
import { hitAround } from "./hitAreas";

// Art's paper map (art/README.md, Map), in base pixels. Offsets marked "from the centre" are from
// a node's centre. The paper fills the screen; each marker's centre pixel sits on its node's
// centre; a zone's icon sits centred over its marker; the duck stands on the current marker's
// ring. Continue's label, centred with its play mark, starts at labelY, sinking to pressedLabelY
// while Continue is pressed. Continue's press area, hit, is its drawn button grown by
// hitAreas.ts's rule; a tap on a zone marker lands within nodeHit, centred on its node, the zone
// marker's frame (ZONE_MARKER square) grown the same way.
const CONTINUE_ART: Rect = { height: 44, width: 160, x: 280, y: 300 };
const ZONE_MARKER = 35;
const NODE_HIT = hitAround({
  height: ZONE_MARKER,
  width: ZONE_MARKER,
  x: 0,
  y: 0,
});

export const MAP_SCREEN = {
  continue: {
    art: CONTINUE_ART,
    hit: hitAround(CONTINUE_ART),
    labelY: 311,
    pressedLabelY: 313,
  },
  duck: {
    fork: { x: -13, y: -36 } satisfies Point,
    zone: { x: -13, y: -39 } satisfies Point,
  },
  icon: { x: -7, y: -7 } satisfies Point,
  marker: {
    fork: { x: -14, y: -14 } satisfies Point,
    zone: { x: -17, y: -17 } satisfies Point,
  },
  nodeHit: { height: NODE_HIT.height, width: NODE_HIT.width } satisfies Size,
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

// Each look a path takes, in a palette colour: unbuilt, built but not yet opened (locked, dimmed a
// step toward the paper), and opened by the zones she has completed (openMap).
export const MAP_PATH_LOOKS = {
  built: { colour: "brown", stroke: { kind: "dashes", off: 4, on: 6, width: 2 } },
  open: { colour: "dred", stroke: { kind: "solid", width: 4 } },
  unbuilt: { colour: "slate", stroke: { every: 6, kind: "dots", width: 2 } },
} as const satisfies Record<string, { readonly colour: string; readonly stroke: PathStroke }>;

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
