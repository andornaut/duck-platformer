import type { Point, Rect, Size } from "../data/types";

// A point on the page (client pixels) in game pixels, for a canvas drawn at canvas (its client
// rect) showing a game of size, unclamped: a point off the canvas, such as in the letterbox bars
// or the safe-area margins beside it, lies off the game by as far, so a drag across them still
// travels.
export function gameScaledPoint(canvas: Rect, game: Size, client: Point): Point {
  return {
    x: ((client.x - canvas.x) * game.width) / canvas.width,
    y: ((client.y - canvas.y) * game.height) / canvas.height,
  };
}

// The same point on the game's nearest edge pixel when it is off the canvas: 0 to size - 1 on
// each axis, so it can fall in a hit area that reaches the game's edge.
export function gamePoint(canvas: Rect, game: Size, client: Point): Point {
  const clamp = (value: number, size: number) => Math.min(size - 1, Math.max(0, value));
  const point = gameScaledPoint(canvas, game, client);
  return { x: clamp(point.x, game.width), y: clamp(point.y, game.height) };
}
