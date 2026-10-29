import type { Point, Rect, Size } from "../data/types";

// A point on the page (client pixels) in game pixels, for a canvas drawn at canvas (its client
// rect) showing a game of size. A point off the canvas, such as in the letterbox bars beside or
// above it, lands on the game's nearest edge pixel: 0 to size - 1 on each axis, so it can fall
// in a hit area that reaches the game's edge.
export function gamePoint(canvas: Rect, game: Size, client: Point): Point {
  const clamp = (value: number, size: number) => Math.min(size - 1, Math.max(0, value));
  return {
    x: clamp(((client.x - canvas.x) * game.width) / canvas.width, game.width),
    y: clamp(((client.y - canvas.y) * game.height) / canvas.height, game.height),
  };
}
