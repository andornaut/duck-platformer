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

// A moving platform or hazard: a cols x rows block whose top-left tile goes from `from` to `to` and back,
// at speed tiles per second, waiting pause seconds at each end (0 allowed). phase (0 to 1) is
// where it is in the round trip at the level's start: 0 at `from` heading to `to`, 0.5 at `to`
// heading back. The round trip is: travel to `to`, pause, travel back, pause.
export interface MoverPlan {
  readonly cols: number;
  readonly from: TilePoint;
  readonly pause: number;
  readonly phase: number;
  readonly rows: number;
  readonly speed: number;
  readonly to: TilePoint;
}

// One level on the tile grid, as authored: cols x rows tiles (rows is 60, two screens). solids
// block from every side; ledges are one-way, solid only from above; movers are moving platforms;
// touching a hazard or a moving hazard (moving as a mover does, but never solid) restarts the
// level; reaching the exit clears it. She starts standing on the top edge of row start.row,
// her collision box centred on the grid line at the left edge of column start.col.
export interface LevelPlan {
  readonly cols: number;
  readonly exit: TileRect;
  readonly hazards: readonly TileRect[];
  readonly ledges: readonly TileRect[];
  readonly movers: readonly MoverPlan[];
  readonly movingHazards: readonly MoverPlan[];
  readonly rows: number;
  readonly solids: readonly TileRect[];
  readonly start: TilePoint;
}

// How far the duck can jump, in tiles, from the top of the ground she leaves to the top of the
// ledge she lands on. hop: the height of a short hop; jump: the height of a full jump; gap: the
// width of a gap, at the same height, that a running full jump crosses.
export interface Reaches {
  readonly gap: number;
  readonly hop: number;
  readonly jump: number;
}

// A moving platform or hazard in base pixels: its size, the top-left corners it travels between, its
// speed in pixels per second, and its pause and phase as in MoverPlan.
export interface MoverLayout {
  readonly from: Point;
  readonly height: number;
  readonly pause: number;
  readonly phase: number;
  readonly speed: number;
  readonly to: Point;
  readonly width: number;
}

// One level's geometry, in base pixels, converted from its LevelPlan. Falling below its height
// restarts the level.
export interface LevelLayout {
  readonly exit: Rect;
  readonly hazards: readonly Rect[];
  readonly height: number;
  readonly ledges: readonly Rect[];
  readonly movers: readonly MoverLayout[];
  readonly movingHazards: readonly MoverLayout[];
  readonly solids: readonly Rect[];
  // Where her collision box's bottom centre starts.
  readonly start: Point;
  readonly width: number;
}
