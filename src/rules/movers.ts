import type { MoverLayout, Point, Rect } from "../data/types";

// A moving platform's or hazard's top-left corner seconds after the level started. The round trip is: travel
// to `to`, pause, travel back, pause; phase is where it starts in that trip. A platform with no
// distance to go or no speed stays at `from`.
export function moverAt(mover: MoverLayout, seconds: number): Point {
  const dx = mover.to.x - mover.from.x;
  const dy = mover.to.y - mover.from.y;
  const travel = Math.hypot(dx, dy) / mover.speed;
  if (!Number.isFinite(travel) || travel === 0) {
    return mover.from;
  }
  const trip = 2 * (travel + mover.pause);
  const at = (((mover.phase * trip + seconds) % trip) + trip) % trip;
  let along: number;
  if (at < travel) {
    along = at / travel;
  } else if (at < travel + mover.pause) {
    along = 1;
  } else if (at < 2 * travel + mover.pause) {
    along = 1 - (at - travel - mover.pause) / travel;
  } else {
    along = 0;
  }
  return { x: mover.from.x + dx * along, y: mover.from.y + dy * along };
}

export function moverRect(mover: MoverLayout, seconds: number): Rect {
  return { ...moverAt(mover, seconds), height: mover.height, width: mover.width };
}
