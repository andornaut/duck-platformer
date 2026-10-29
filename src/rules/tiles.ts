import type {
  Archetype,
  AreaLayout,
  AreaPlan,
  ArtHitbox,
  Character,
  CharacterState,
  Instance,
  Interaction,
  Motion,
  ObjectLayout,
  Point,
  Reaction,
  Rect,
  TilePoint,
  TileRect,
  ZoneLayout,
  ZonePlan,
} from "../data/types";
import { tileHitbox, type Tileset } from "../view/tiles";

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

// The archetypes and characters instances are resolved against.
export interface Catalogue {
  readonly archetypes: Readonly<Record<string, Archetype>>;
  readonly characters: Readonly<Record<string, Character>>;
}

const STATES: readonly CharacterState[] = ["idle", "move", "react", "talk"];

// The character and archetype an instance names, or an error naming what is missing.
export function resolveNames(
  catalogue: Catalogue,
  instance: Instance,
): { archetype: Archetype; character: Character } {
  const character = catalogue.characters[instance.character];
  if (!character) {
    throw new Error(`No character ${instance.character}`);
  }
  const archetype = catalogue.archetypes[character.archetype];
  if (!archetype) {
    throw new Error(`No archetype ${character.archetype} for ${instance.character}`);
  }
  return { archetype, character };
}

// An instance resolved into one flat object, in pixels: its instance's overrides over its
// character's tuning over its archetype, and the character's art, animations (a state left out
// plays idle's), words and quirks, which an instance's own lines replace. Its hit box is its
// sprite's, from hitboxes, or for art drawn from its area's tileset, its tiles'.
export function objectLayout(
  tile: number,
  catalogue: Catalogue,
  hitboxes: Readonly<Record<string, ArtHitbox>>,
  tileset: Tileset | undefined,
  instance: Instance,
): ObjectLayout {
  const { archetype, character } = resolveNames(catalogue, instance);
  const motion: Motion = {
    ...archetype.motion,
    ...character.tuning?.motion,
    ...instance.overrides?.motion,
  };
  const reaction: Reaction = {
    ...archetype.reaction,
    ...character.tuning?.reaction,
    ...instance.overrides?.reaction,
  };
  const interaction: Interaction = {
    ...archetype.interaction,
    ...character.tuning?.interaction,
    ...instance.overrides?.interaction,
  };
  const width = (instance.cols ?? character.cols) * tile;
  const height = (instance.rows ?? character.rows) * tile;
  const art = hitboxes[character.art];
  const idle = character.animations?.idle;
  return {
    animations: Object.fromEntries(
      STATES.map((state) => [state, character.animations?.[state] ?? idle]),
    ) as Record<CharacterState, string | undefined>,
    art: character.art,
    character: instance.character,
    collision: archetype.collision,
    height,
    hitbox: art
      ? {
          ...art.hitbox,
          x: art.hitbox.x + (width - art.frame.width) / 2,
          y: art.hitbox.y + height - art.frame.height,
        }
      : tileset && tileHitbox(tile, tileset, character.art, width / tile, height / tile),
    interaction: { ...interaction, range: interaction.range * tile },
    lines: instance.lines ?? character.lines ?? [],
    motion: {
      ...motion,
      distance: motion.distance * tile,
      hopHeight: motion.hopHeight * tile,
      speed: motion.speed * tile,
    },
    origin: tilePoint(tile, instance),
    phase: instance.phase ?? 0,
    quips: character.quips ?? [],
    quirks: character.quirks ?? [],
    reaction: { ...reaction, range: reaction.range * tile, speed: reaction.speed * tile },
    scene: instance.scene,
    to: instance.to,
    width,
  };
}

// Whether an instance is placed, given the carried-choice flags that are set: every flag it
// requires is set and none it excludes is.
export function isPlaced(flags: ReadonlySet<string>, instance: Instance): boolean {
  return (
    (instance.requires ?? []).every((flag) => flags.has(flag)) &&
    !(instance.excludes ?? []).some((flag) => flags.has(flag))
  );
}

export function areaLayout(
  tile: number,
  catalogue: Catalogue,
  hitboxes: Readonly<Record<string, ArtHitbox>>,
  tilesets: Readonly<Record<string, Tileset>>,
  flags: ReadonlySet<string>,
  area: AreaPlan,
): AreaLayout {
  const tileset = area.tileset === undefined ? undefined : tilesets[area.tileset];
  return {
    chunks: (area.chunks ?? []).map(({ col, cols }) => ({ width: cols * tile, x: col * tile })),
    entries: Object.fromEntries(
      Object.entries(area.entries).map(([name, point]) => [name, tilePoint(tile, point)]),
    ),
    height: area.rows * tile,
    objects: area.objects
      .filter((instance) => isPlaced(flags, instance))
      .map((instance) => objectLayout(tile, catalogue, hitboxes, tileset, instance)),
    solids: area.solids.map((rect) => tileRect(tile, rect)),
    terrain: area.solids,
    tileset: area.tileset,
    width: area.cols * tile,
  };
}

// A zone plan in base pixels, for the rules: each instance resolved against the catalogue, with
// the hit boxes art declares by art key and in its tilesets by tile, and only the instances the
// set flags place.
export function zoneLayout(
  tile: number,
  catalogue: Catalogue,
  hitboxes: Readonly<Record<string, ArtHitbox>>,
  tilesets: Readonly<Record<string, Tileset>>,
  flags: ReadonlySet<string>,
  plan: ZonePlan,
): ZoneLayout {
  return {
    areas: Object.fromEntries(
      Object.entries(plan.areas).map(([name, area]) => [
        name,
        areaLayout(tile, catalogue, hitboxes, tilesets, flags, area),
      ]),
    ),
    start: plan.start,
  };
}
