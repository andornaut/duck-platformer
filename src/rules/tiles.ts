import type {
  LevelLayout,
  LevelPlan,
  MoverLayout,
  MoverPlan,
  Point,
  Rect,
  TilePoint,
  TileRect,
} from "../data/types";

export function tileRect(tile: number, rect: TileRect): Rect {
  return {
    height: rect.rows * tile,
    width: rect.cols * tile,
    x: rect.col * tile,
    y: rect.row * tile,
  };
}

function tilePoint(tile: number, point: TilePoint): Point {
  return { x: point.col * tile, y: point.row * tile };
}

function moverLayout(tile: number, mover: MoverPlan): MoverLayout {
  return {
    from: tilePoint(tile, mover.from),
    height: mover.rows * tile,
    pause: mover.pause,
    phase: mover.phase,
    speed: mover.speed * tile,
    to: tilePoint(tile, mover.to),
    width: mover.cols * tile,
  };
}

// A level plan in base pixels, for the rules.
export function levelLayout(tile: number, plan: LevelPlan): LevelLayout {
  const toRect = (rect: TileRect) => tileRect(tile, rect);
  return {
    exit: toRect(plan.exit),
    hazards: plan.hazards.map(toRect),
    height: plan.rows * tile,
    ledges: plan.ledges.map(toRect),
    movers: plan.movers.map((mover) => moverLayout(tile, mover)),
    movingHazards: plan.movingHazards.map((hazard) => moverLayout(tile, hazard)),
    solids: plan.solids.map(toRect),
    start: tilePoint(tile, plan.start),
    width: plan.cols * tile,
  };
}
