// The shapes of the game data. The value files beside this one fill them.

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
  // Seconds a held Jump keeps her rising at jumpSpeed before gravity takes over: a tap hops,
  // and a longer hold rises higher, up to a full jump.
  readonly jumpHoldTime: number;
  // Upward speed when a jump starts: a tap's hop.
  readonly jumpSpeed: number;
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
  // The screen over the page when the game stops on an error.
  readonly crash: {
    readonly body: string;
    readonly reload: string;
    readonly title: string;
  };
  // The pause card: its title, the Touch controls row and its two states, Quit and Resume.
  readonly pause: {
    readonly hidden: string;
    readonly quit: string;
    readonly resume: string;
    readonly shown: string;
    readonly title: string;
    readonly touchControls: string;
  };
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
// every side; ledge only from above; touching a hazard restarts the zone; Use in a use zone goes
// through it; none is scenery.
export interface Archetype {
  readonly collision: Collision;
  readonly interaction: Interaction;
  readonly motion: Motion;
  readonly reaction: Reaction;
}

// The states an animation tag can play for.
export type CharacterState = "idle" | "move" | "react" | "talk";

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
// plays; a state left out plays idle's. Its hit box comes from art's manifest. lines and quips
// are keys into TEXT.lines and TEXT.quips; a prop has none.
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
// no excluded one is. to: where a door leads; a use thing with no `to` is the zone's exit.
export interface Instance {
  readonly character: string;
  readonly col: number;
  readonly cols?: number;
  readonly excludes?: readonly string[];
  readonly lines?: readonly string[];
  readonly overrides?: Tuning;
  readonly phase?: number;
  readonly requires?: readonly string[];
  readonly row: number;
  readonly rows?: number;
  readonly scene?: string;
  readonly to?: AreaLink;
}

// A run of terrain. In an area with a tileset, look names the family of the tileset's tiles it is
// drawn with: "sidewalk" or "floor" (a top row, alternating with a joint every other column, over
// a face), "road" (a top over road, with a kerb on the terrain beside it) or "post" (2 wide: a
// cap, a shaft and a base). Without a tileset it is a flat rectangle and has no look.
export interface TerrainRect extends TileRect {
  readonly look?: string;
}

// One area of a zone: cols x rows tiles (rows is 60, two screens). solids are the terrain.
// entries are named points where she arrives: she stands on the top edge of row `row`, her
// collision box centred on the grid line at the left edge of column `col`. tileset: the art
// tileset its terrain and tile objects are drawn from; without one, both are flat rectangles.
export interface AreaPlan {
  readonly cols: number;
  readonly entries: Readonly<Record<string, TilePoint>>;
  readonly objects: readonly Instance[];
  readonly rows: number;
  readonly solids: readonly TerrainRect[];
  readonly tileset?: string;
}

// A zone: its areas by name, and where she starts, its only checkpoint: a fall or a hazard
// puts her back there.
export interface ZonePlan {
  readonly areas: Readonly<Record<string, AreaPlan>>;
  readonly start: AreaLink;
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
  readonly scene: string | undefined;
  readonly to: AreaLink | undefined;
  readonly width: number;
}

// An area in base pixels. Falling below its height restarts the zone. terrain and tileset are
// its plan's, in tiles, for drawing.
export interface AreaLayout {
  readonly entries: Readonly<Record<string, Point>>;
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
// drawn on the map screen, on its tile grid. zone: a zone node's key in ZONES; a zone not built
// yet has none.
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
