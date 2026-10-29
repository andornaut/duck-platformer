import type {
  AreaLayout,
  AreaPlan,
  LevelLayout,
  LevelPlan,
  Motion,
  ObjectLayout,
  ObjectType,
  PlacedObject,
  Point,
  Reaction,
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

// A placed object with its type and overrides resolved, in pixels.
export function objectLayout(
  tile: number,
  types: Readonly<Record<string, ObjectType>>,
  hitboxes: Readonly<Record<string, Rect>>,
  placed: PlacedObject,
): ObjectLayout {
  const type = types[placed.type];
  if (!type) {
    throw new Error(`No object type ${placed.type}`);
  }
  const motion: Motion = { ...type.motion, ...placed.overrides?.motion };
  const reaction: Reaction = { ...type.reaction, ...placed.overrides?.reaction };
  return {
    art: type.art,
    collision: type.collision,
    height: (placed.rows ?? type.rows) * tile,
    hitbox: hitboxes[type.art],
    motion: {
      ...motion,
      distance: motion.distance * tile,
      hopHeight: motion.hopHeight * tile,
      speed: motion.speed * tile,
    },
    origin: tilePoint(tile, placed),
    phase: placed.phase ?? 0,
    reaction: { ...reaction, range: reaction.range * tile, speed: reaction.speed * tile },
    to: placed.to,
    width: (placed.cols ?? type.cols) * tile,
  };
}

export function areaLayout(
  tile: number,
  types: Readonly<Record<string, ObjectType>>,
  hitboxes: Readonly<Record<string, Rect>>,
  area: AreaPlan,
): AreaLayout {
  return {
    entries: Object.fromEntries(
      Object.entries(area.entries).map(([name, point]) => [name, tilePoint(tile, point)]),
    ),
    height: area.rows * tile,
    objects: area.objects.map((placed) => objectLayout(tile, types, hitboxes, placed)),
    solids: area.solids.map((rect) => tileRect(tile, rect)),
    width: area.cols * tile,
  };
}

// A level plan in base pixels, for the rules: its objects' types from types, and the hit boxes
// art declares, by art key.
export function levelLayout(
  tile: number,
  types: Readonly<Record<string, ObjectType>>,
  hitboxes: Readonly<Record<string, Rect>>,
  plan: LevelPlan,
): LevelLayout {
  return {
    areas: Object.fromEntries(
      Object.entries(plan.areas).map(([name, area]) => [
        name,
        areaLayout(tile, types, hitboxes, area),
      ]),
    ),
    start: plan.start,
  };
}
