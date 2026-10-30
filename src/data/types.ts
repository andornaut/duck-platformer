// The shapes of the game data. The value files beside this one fill them.

import type { SEAM_ROWS } from "./chunks";

// An axis-aligned rectangle in base pixels: x and y are its top-left corner, y grows downward.
export interface Rect {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly height: number;
  readonly width: number;
}

// The duck's movement, in base pixels and seconds.
export interface DuckTuning {
  // Speed gained per second while a direction is held, on the ground and in the air.
  readonly airAccel: number;
  readonly groundAccel: number;
  // Seconds after walking off a ledge in which a jump still starts.
  readonly coyoteTime: number;
  // Fastest fall: every fall flutters.
  readonly flutterFallSpeed: number;
  readonly gravity: number;
  // Her collision box.
  readonly height: number;
  readonly width: number;
  // Seconds before landing in which a jump press is kept, to start as she lands.
  readonly jumpBuffer: number;
  // How high she rises from where she took off when Jump is let go within the tap window: below
  // it, she climbs on to it; already past it, she stops where she is. The shortest press hops it.
  readonly jumpHopHeight: number;
  // The share of her upward speed she keeps when Jump is let go while she rises, after the tap
  // window: letting go stops her climbing promptly.
  readonly jumpReleaseCut: number;
  // Upward speed when a jump starts: held to the top, a full jump.
  readonly jumpSpeed: number;
  // Seconds from the start of a jump that decide what letting go of Jump does while she rises:
  // within them, she rises no higher than jumpHopHeight; after them, jumpReleaseCut.
  readonly jumpTapWindow: number;
  readonly walkSpeed: number;
}

// The words the player reads.
export interface GameText {
  // What characters say in dialogue, by key.
  readonly lines: Readonly<Record<string, string>>;
  // The map screen between zones: its title, the button that goes on, and each zone node's name,
  // by its id in the map, under its marker and on the button that chooses it.
  readonly map: {
    readonly continue: string;
    readonly title: string;
    readonly zones: Readonly<Record<string, string>>;
  };
  // The touch buttons' labels.
  readonly buttons: {
    readonly jump: string;
    readonly use: string;
  };
  // What characters say in passing, by key.
  readonly quips: Readonly<Record<string, string>>;
  // A room's Leave button, which returns her to its door.
  readonly room: {
    readonly leave: string;
  };
  // Each room's name, by its key in ROOMS, shown in the room.
  readonly rooms: Readonly<Record<string, { readonly name: string }>>;
  // The screen over the page when the game stops on an error.
  readonly crash: {
    readonly body: string;
    readonly reload: string;
    readonly title: string;
  };
  // The pause card: its title, the Settings and Return home rows, and Resume.
  readonly pause: {
    readonly home: string;
    readonly resume: string;
    readonly settings: string;
    readonly title: string;
  };
  // The start screen: its Start button, which reads Continue once progress is saved, and the nav
  // bar's Settings and Exit buttons.
  readonly start: {
    readonly continue: string;
    readonly exit: string;
    readonly settings: string;
    readonly start: string;
  };
  // The settings card: its title, the Move controls and Action buttons rows and their two states
  // (Shown and Hidden), the Install row and its button, and the install steps card: its title
  // and, for each browser that installs only from its own menu, its two steps.
  readonly settings: {
    readonly actionButtons: string;
    readonly hidden: string;
    readonly install: string;
    readonly installButton: string;
    readonly installSteps: {
      readonly firefoxAndroid: InstallSteps;
      readonly ios: InstallSteps;
      readonly title: string;
    };
    readonly moveControls: string;
    readonly shown: string;
    readonly title: string;
  };
}

// A browser's install steps: the first beside its button's glyph, the second beside the install
// glyph.
export interface InstallSteps {
  readonly first: string;
  readonly second: string;
}

// The touch controls, in base pixels.
export interface TouchTuning {
  // A move touch moves her once it is more than this far left or right of where it started.
  readonly moveDeadZone: number;
}

// A rectangle on the tile grid, in whole tiles: col and row are its top-left tile.
export interface TileRect {
  readonly col: number;
  readonly cols: number;
  readonly row: number;
  readonly rows: number;
}

export interface TilePoint {
  readonly col: number;
  readonly row: number;
}

export type Collision = "hazard" | "ledge" | "none" | "solid" | "use";
export type Direction = "down" | "left" | "right" | "up";
export type MotionAlgorithm = "ease" | "hop" | "linear" | "static" | "wander";
export type ReactionKind = "approach" | "avoid" | "none";

// How an object moves from where it is placed, in tiles and seconds (pixels in a layout). Its far
// end is distance away in direction. linear: there at speed, pause, back, pause. ease: the same
// legs, easing in and out (speed is the leg's average). hop: linear, plus an upward arc
// hopHeight high on each leg. wander: each leg goes to a random point between the placed spot
// and the far end. variance (0 to 1): each leg's speed, distance and pause vary by up to that
// fraction.
export interface Motion {
  readonly algorithm: MotionAlgorithm;
  readonly direction: Direction;
  readonly distance: number;
  readonly hopHeight: number;
  readonly pause: number;
  readonly speed: number;
  readonly variance: number;
}

// Within range of her (centre to centre), an "avoid" object moves away from her and an
// "approach" one toward her, along its motion's axis, at speed. Out of range, it goes back to its
// path at that speed and follows it again. In tiles (pixels in a layout).
export interface Reaction {
  readonly kind: ReactionKind;
  readonly range: number;
  readonly speed: number;
}

export type InteractionKind = "none" | "quip" | "talk";

// How a character interacts with her, within range tiles of her (centre to centre). quip: says
// one of its quips when she comes within range; talk: Use within range opens its dialogue.
export interface Interaction {
  readonly kind: InteractionKind;
  readonly range: number;
}

// The parts of an archetype a character or an instance may override.
export interface Tuning {
  readonly interaction?: Partial<Interaction>;
  readonly motion?: Partial<Motion>;
  readonly reaction?: Partial<Reaction>;
}

// A behaviour (ARCHETYPES by name, in src/data/archetypes.ts): its collision, fixed, and the
// default motion, reaction and interaction its characters tune. collision: solid blocks her from
// every side; ledge only from above; touching a hazard restarts the zone; Use in a use zone, a
// door, opens its room; none is scenery.
export interface Archetype {
  readonly collision: Collision;
  readonly interaction: Interaction;
  readonly motion: Motion;
  readonly reaction: Reaction;
}

// The states an animation tag can play for. open: a door as she uses it, before its room shows.
export type CharacterState = "idle" | "move" | "open" | "react" | "talk";

// An idle tic: tag plays once every `every` seconds, give or take variance (0 to 1) of that,
// rolled fresh each attempt like random motion.
export interface Quirk {
  readonly every: number;
  readonly tag: string;
  readonly variance: number;
}

// Who or what a placed thing is (CHARACTERS by name, in src/data/characters.ts): one archetype
// plus tuning, cols x rows tiles unless a placement sizes it. art: a tile or piece of the area's
// tileset, a backdrop or a sprite, or placeholder-<name>. animations: the sprite tag each state
// plays; a state left out plays idle's, except open, which plays the tag named "open". Its hit
// box comes from art's manifest. lines and quips are keys into TEXT.lines and TEXT.quips; a prop
// has none.
export interface Character {
  readonly animations?: Readonly<Partial<Record<CharacterState, string>>>;
  readonly archetype: string;
  readonly art: string;
  readonly cols: number;
  readonly lines?: readonly string[];
  readonly quips?: readonly string[];
  readonly quirks?: readonly Quirk[];
  readonly rows: number;
  readonly tuning?: Tuning;
}

export interface AreaLink {
  readonly area: string;
  readonly entry: string;
}

// One placed thing in an area: a character with its top-left tile at col, row, and cols x rows
// tiles in size when given, else the character's. Overrides go one way: an instance's overrides
// over its character's tuning over its archetype. phase (0 to 1, default 0) is where its motion
// starts in its round trip: 0 at the placed spot heading out, 0.5 at the far end heading back.
// lines replace the character's for this one instance; scene names a dialogue scene. requires
// and excludes are carried-choice flags: it is placed only while every required flag is set and
// no excluded one is. room: a door's room, a key of ROOMS (src/data/rooms.ts). A door is an
// instance whose archetype is "door" (its collision "use"); every door has a room, and nothing
// else has one.
export interface Instance {
  readonly character: string;
  readonly col: number;
  readonly cols?: number;
  readonly excludes?: readonly string[];
  readonly lines?: readonly string[];
  readonly overrides?: Tuning;
  readonly phase?: number;
  readonly requires?: readonly string[];
  readonly room?: string;
  readonly row: number;
  readonly rows?: number;
  readonly scene?: string;
}

// A run of terrain. In an area with a tileset, look names the family of the tileset's tiles it is
// drawn with: "sidewalk" or "floor" (a top row, alternating with a joint every other column, over
// a face), "road" (a top over road, with a kerb on the terrain beside it) or "post" (2 wide: a
// cap, a shaft and a base). Without a tileset it is a flat rectangle and has no look.
export interface TerrainRect extends TileRect {
  readonly look?: string;
}

// A spot she must never reach from another in one move (a jump, or a walk off an edge): each
// names a surface, given as an entry is.
export interface NoCross {
  readonly from: TilePoint;
  readonly to: TilePoint;
}

// One area of a zone: cols x rows tiles (rows is 60, two screens). solids are the terrain.
// entries are named points where she arrives: she stands on the top edge of row `row`, her
// collision box centred on the grid line at the left edge of column `col`. tileset: the art
// tileset its terrain and tile objects are drawn from; without one, both are flat rectangles.
// noCross and outOfReach name surfaces by a spot on each, given as an entry is: noCross pairs a
// spot with one she must never reach from it in one move, and outOfReach marks surfaces she must
// never reach from the start. An assembled zone's area also lists the chunks it is made of, left
// to right, and its slots with what the seed put in each; a hand-built area has neither.
export interface AreaPlan {
  readonly chunks?: readonly PlacedChunk[];
  readonly cols: number;
  readonly entries: Readonly<Record<string, TilePoint>>;
  readonly noCross?: readonly NoCross[];
  readonly objects: readonly Instance[];
  readonly outOfReach?: readonly TilePoint[];
  readonly rows: number;
  readonly slots?: readonly FilledSlot[];
  readonly solids: readonly TerrainRect[];
  readonly tileset?: string;
}

// A zone: its areas by name, and where she starts, its only checkpoint: a fall or a hazard
// puts her back there.
export interface ZonePlan {
  readonly areas: Readonly<Record<string, AreaPlan>>;
  readonly start: AreaLink;
}

// A chunk's difficulty, 1 to 5, as gameplay/design.md's Chunks section grades it.
export type Difficulty = 1 | 2 | 3 | 4 | 5;

// A row a chunk's entry or exit stands on: one of SEAM_ROWS (src/data/chunks.ts).
export type SeamRow = (typeof SEAM_ROWS)[number];

// The ground at a chunk's left or right edge: its top is row `row`.
export interface ChunkSeam {
  readonly row: SeamRow;
}

export type SlotKind = "door" | "event";

// A marked region of a chunk where the seed places an event or a door, in the chunk's tiles.
// id: unique within its chunk.
export interface ChunkSlot {
  readonly area: TileRect;
  readonly id: string;
  readonly kind: SlotKind;
}

// The limits every chunk keeps (CHUNK_RULES, in src/data/chunks.ts). cols: its width range.
// The seam rule: at its entry and exit, the seam surface runs at least footing tiles in from the
// edge, with no gap, hazard or mover's path within them, and headroom rows clear of any solid,
// ledge or hazard above them.
export interface ChunkRules {
  readonly cols: { readonly max: number; readonly min: number };
  readonly footing: number;
  readonly headroom: number;
}

// A hand-built piece of a zone (CHUNKS by id, in src/data/chunks.ts): cols wide and as tall as
// a zone, its contents in its own tiles from its top-left. theme: the theme or themes it is drawn
// in; each look its terrain names is a key of every such theme's looks. difficulty: 1 to 5.
// weight (default 1): how likely the seed is to pick it over another that fits. maxPerZone: the
// most times it appears in one zone, unlimited when left out. entry and exit: the ground at its
// left and right edges, where it joins the chunks either side. backdrops: its own placed
// scenery, drawn in front of the theme's repeated backdrops. slots: where the seed may place
// events and doors; it must play with every slot empty.
export interface ChunkPlan {
  readonly backdrops?: readonly Instance[];
  readonly cols: number;
  readonly difficulty: Difficulty;
  readonly entry: ChunkSeam;
  readonly exit: ChunkSeam;
  readonly maxPerZone?: number;
  readonly noCross?: readonly NoCross[];
  readonly objects: readonly Instance[];
  readonly outOfReach?: readonly TilePoint[];
  readonly slots?: readonly ChunkSlot[];
  readonly solids: readonly TerrainRect[];
  readonly theme: string | readonly string[];
  readonly weight?: number;
}

// A repeated backdrop drawn across a whole assembled zone: its character, top at row.
export interface ThemeBackdrop {
  readonly character: string;
  readonly row: number;
}

// What every chunk of a theme is drawn with, so seams never show (THEMES by key, in
// src/data/chunks.ts). tileset: the art tileset. looks: each look a chunk's terrain names, as
// the tileset's look it is drawn with. backdrops: its repeated backdrops, back to front. door:
// the character, a door, each filled door slot places at its own size, centred across the slot
// and standing on its floor.
export interface ThemePlan {
  readonly backdrops: readonly ThemeBackdrop[];
  readonly door: string;
  readonly looks: Readonly<Record<string, string>>;
  readonly tileset: string;
}

// How a zone is assembled from chunks (RECIPES by key, in src/data/zones.ts): its theme, its
// fixed start and finish chunks, and between them a seeded run of the theme's chunks. length:
// the zone's whole width range in columns, start and finish chunks included. difficulty: a line
// from `from` at the zone's left edge to `to` at its right; each chunk between start and finish
// is within 1 of it at the chunk's centre. events and doors: what the seed places in the chunks'
// slots, count of each.
export interface ZoneRecipe {
  readonly difficulty: { readonly from: Difficulty; readonly to: Difficulty };
  readonly doors: readonly { readonly count: number; readonly room: string }[];
  readonly events: readonly { readonly count: number; readonly id: string }[];
  readonly finish: string;
  readonly length: { readonly max: number; readonly min: number };
  readonly start: string;
  readonly theme: string;
}

// A sprite in a room playing one tag, looping, its frame's top-left at `at`, in base pixels.
export interface RoomAnimation {
  readonly art: string;
  readonly at: Point;
  readonly tag: string;
}

// A character standing in a room: its art playing its idle tag, its frame's top-left at `at`, in
// base pixels.
export interface RoomCast {
  readonly at: Point;
  readonly character: string;
}

// PLACEHOLDER: what a room sells, by item key, until gameplay decides the currency and items.
export interface RoomShop {
  readonly items: readonly string[];
}

// A room behind a door (ROOMS by key, in src/data/rooms.ts): a full-screen still scene that Use at
// its door shows, play paused, until she leaves. Its name is TEXT.rooms[key].name. art: its
// backdrop, the whole game view; without one, a plain placeholder. animations and cast: what is
// drawn over it. enter (a dialogue scene that plays as she enters) and shop are not built yet.
export interface RoomPlan {
  readonly animations?: readonly RoomAnimation[];
  readonly art?: string;
  readonly cast?: readonly RoomCast[];
  readonly enter?: string;
  readonly shop?: RoomShop;
}

// A chunk in an assembled zone: its id, and the zone columns it takes.
export interface PlacedChunk {
  readonly chunk: string;
  readonly col: number;
  readonly cols: number;
}

// A slot in an assembled zone, in zone tiles: the chunk it is in (an index into the area's
// chunks), its id there, and what the seed put in it, the event's id or the door's room; empty
// when the recipe asked for fewer.
export interface FilledSlot extends ChunkSlot {
  readonly chunk: number;
  readonly fill?: string;
}

// How far the duck can jump, in tiles, from the top of the ground she leaves to the top of the
// ledge she lands on. hop: the height of a short hop; jump: the height of a full jump; gap: the
// width of a gap, at the same height, that a running full jump crosses.
export interface Reaches {
  readonly gap: number;
  readonly hop: number;
  readonly jump: number;
}

// A placed thing in base pixels, its instance, character and archetype resolved into one flat
// object: its placed top-left corner, size, motion, reaction and interaction in pixels, and what
// the view and dialogue need. hitbox: where a hazard touches her, from its top-left corner, when
// its art declares one; else its whole rectangle.
export interface ObjectLayout {
  readonly animations: Readonly<Record<CharacterState, string | undefined>>;
  readonly art: string;
  readonly character: string;
  readonly collision: Collision;
  readonly height: number;
  readonly hitbox: Rect | undefined;
  readonly interaction: Interaction;
  readonly lines: readonly string[];
  readonly motion: Motion;
  readonly origin: Point;
  readonly phase: number;
  readonly quips: readonly string[];
  readonly quirks: readonly Quirk[];
  readonly reaction: Reaction;
  readonly room: string | undefined;
  readonly scene: string | undefined;
  readonly width: number;
}

// An area in base pixels. Falling below its height restarts the zone, and her collision box
// reaching past exitX, the left edge of its last column, clears it. terrain and tileset are its
// plan's, in tiles, for drawing. chunks: an assembled area's chunks, left to right, for the
// camera; none in a hand-built one.
export interface AreaLayout {
  readonly chunks: readonly { readonly width: number; readonly x: number }[];
  readonly entries: Readonly<Record<string, Point>>;
  readonly exitX: number;
  readonly height: number;
  readonly objects: readonly ObjectLayout[];
  readonly solids: readonly Rect[];
  readonly terrain: readonly TerrainRect[];
  readonly tileset: string | undefined;
  readonly width: number;
}

// A sprite's hit box in its frame, with the frame's size: the game draws the frame centred on
// its object's rectangle along x and standing on its bottom edge.
export interface ArtHitbox {
  readonly frame: Size;
  readonly hitbox: Rect;
}

export interface ZoneLayout {
  readonly areas: Readonly<Record<string, AreaLayout>>;
  readonly start: AreaLink;
}

// A point on the map: a zone she plays, or a fork where paths split or join. at: where it is
// drawn on the map screen, on its tile grid. zone: a zone node's key in ZONES or RECIPES; a zone
// not built yet has none.
export interface MapNode {
  readonly at: TilePoint;
  readonly id: string;
  readonly kind: "fork" | "zone";
  readonly zone?: string;
}

// A path from one node to the next, in the direction she travels, never back. A path not built
// yet is drawn dotted and cannot be chosen.
export interface MapEdge {
  readonly built: boolean;
  readonly from: string;
  readonly to: string;
}

// A pen mark on the map's paper: its art key and its top-left, in base pixels, at least a tile
// clear of every node, path and label.
export interface MapDecoration {
  readonly art: string;
  readonly at: Point;
}

// The map of zones: every path starts at start and ends at finish. decorations: the pen marks on
// its paper.
export interface ZoneMap {
  readonly decorations: readonly MapDecoration[];
  readonly edges: readonly MapEdge[];
  readonly finish: string;
  readonly nodes: readonly MapNode[];
  readonly start: string;
}
