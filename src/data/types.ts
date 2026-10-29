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
  // Upward speed when a jump starts.
  readonly jumpSpeed: number;
  // Upward speed is multiplied by this when Jump is released while rising: a shorter hop.
  readonly jumpReleaseCut: number;
  readonly walkSpeed: number;
}

// The words the player reads.
export interface GameText {
  // The touch buttons' labels.
  readonly buttons: {
    readonly jump: string;
    readonly use: string;
  };
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

// A kind of object, in tiles. collision: solid blocks her from every side; ledge only from above;
// touching a hazard restarts the level; Use in a use zone goes through it; none is scenery.
export interface ObjectType {
  // The art key; a flat placeholder rectangle until the sprite exists.
  readonly art: string;
  readonly collision: Collision;
  readonly cols: number;
  readonly motion: Motion;
  readonly reaction: Reaction;
  readonly rows: number;
}

export interface AreaLink {
  readonly area: string;
  readonly entry: string;
}

// An object placed in an area: its type (a key of OBJECT_TYPES) with its top-left tile at col,
// row, and cols x rows tiles in size when given, else its type's size, such as a ledge drawn at
// any width. phase (0 to 1, default 0) is where it starts in its motion's round trip: 0 at the
// placed spot heading out, 0.5 at the far end heading back. to: on a "use" object, the area and
// entry that Use at it goes to; a "use" object with no `to` is the level's exit, and Use at it
// clears the level.
export interface PlacedObject {
  readonly col: number;
  readonly cols?: number;
  readonly overrides?: {
    readonly motion?: Partial<Motion>;
    readonly reaction?: Partial<Reaction>;
  };
  readonly phase?: number;
  readonly row: number;
  readonly rows?: number;
  readonly to?: AreaLink;
  readonly type: string;
}

// One area of a level: cols x rows tiles (rows is 60, two screens). solids are the terrain.
// entries are named points where she arrives: she stands on the top edge of row `row`, her
// collision box centred on the grid line at the left edge of column `col`.
export interface AreaPlan {
  readonly cols: number;
  readonly entries: Readonly<Record<string, TilePoint>>;
  readonly objects: readonly PlacedObject[];
  readonly rows: number;
  readonly solids: readonly TileRect[];
}

// A level: its areas by name, and where she starts, its only checkpoint: a fall or a hazard
// puts her back there.
export interface LevelPlan {
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

// A placed object in base pixels, its type and overrides resolved: its placed top-left corner,
// size, motion and reaction in pixels. hitbox: where a hazard touches her, from its top-left
// corner, when its art declares one; else its whole rectangle.
export interface ObjectLayout {
  readonly art: string;
  readonly collision: Collision;
  readonly height: number;
  readonly hitbox: Rect | undefined;
  readonly motion: Motion;
  readonly origin: Point;
  readonly phase: number;
  readonly reaction: Reaction;
  readonly to: AreaLink | undefined;
  readonly width: number;
}

// An area in base pixels. Falling below its height restarts the level.
export interface AreaLayout {
  readonly entries: Readonly<Record<string, Point>>;
  readonly height: number;
  readonly objects: readonly ObjectLayout[];
  readonly solids: readonly Rect[];
  readonly width: number;
}

export interface LevelLayout {
  readonly areas: Readonly<Record<string, AreaLayout>>;
  readonly start: AreaLink;
}
