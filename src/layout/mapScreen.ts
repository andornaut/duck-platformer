import type { Point, Rect } from "../data/types";

// PLACEHOLDER: the map screen's layout, in base pixels, until art draws it: the title's origin,
// the Continue button, the text scale, and the radius of a zone's mark (a fork's is half).
export const MAP_SCREEN: {
  readonly button: Rect;
  readonly nodeRadius: number;
  readonly textScale: number;
  readonly title: Point;
} = {
  button: { height: 36, width: 160, x: 280, y: 304 },
  nodeRadius: 8,
  textScale: 2,
  title: { x: 24, y: 16 },
};
