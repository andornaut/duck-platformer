import type { FloorLayout, FloorPlan, Rect, TileRect } from "../data/types";

export function tileRect(tile: number, rect: TileRect): Rect {
  return {
    height: rect.rows * tile,
    width: rect.cols * tile,
    x: rect.col * tile,
    y: rect.row * tile,
  };
}

// A floor plan in base pixels, for the rules.
export function floorLayout(tile: number, plan: FloorPlan): FloorLayout {
  const toRect = (rect: TileRect) => tileRect(tile, rect);
  return {
    exit: toRect(plan.exit),
    hazards: plan.hazards.map(toRect),
    height: plan.rows * tile,
    solids: plan.solids.map(toRect),
    start: { x: plan.start.col * tile, y: plan.start.row * tile },
    width: plan.cols * tile,
  };
}
