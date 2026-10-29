import type { Point, Rect, Size } from "../data/types";

// How far the page's game frame is turned clockwise on the screen: 0, or 90 on a touch screen in
// portrait, where the game is drawn on its side to be played with the phone held sideways.
export type FrameTurn = 0 | 90;

// The media query under which src/main.css turns the frame by 90.
export const TURNED_FRAME_QUERY = "(orientation: portrait) and (pointer: coarse)";

// A point on the page (client pixels) in game pixels, for a canvas whose bounding rect on the
// page is canvas, turned by turn, showing a game of size. Unclamped: a point off the canvas, such
// as in the letterbox bars or the safe-area margins beside it, lies off the game by as far, so a
// drag across them still travels. Turned by 90, the game's x runs down the page and its y from
// right to left, so the game's top-left is the canvas rect's top-right.
export function gameScaledPoint(turn: FrameTurn, canvas: Rect, game: Size, client: Point): Point {
  if (turn === 90) {
    return {
      x: ((client.y - canvas.y) * game.width) / canvas.height,
      y: ((canvas.x + canvas.width - client.x) * game.height) / canvas.width,
    };
  }
  return {
    x: ((client.x - canvas.x) * game.width) / canvas.width,
    y: ((client.y - canvas.y) * game.height) / canvas.height,
  };
}

// The same point on the game's nearest edge pixel when it is off the canvas: 0 to size - 1 on
// each axis, so it can fall in a hit area that reaches the game's edge.
export function gamePoint(turn: FrameTurn, canvas: Rect, game: Size, client: Point): Point {
  const clamp = (value: number, size: number) => Math.min(size - 1, Math.max(0, value));
  const point = gameScaledPoint(turn, canvas, game, client);
  return { x: clamp(point.x, game.width), y: clamp(point.y, game.height) };
}
