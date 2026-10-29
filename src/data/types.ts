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

// One floor on the tile grid, as authored. Its size is cols by rows tiles. She starts with her
// collision box's centre on the grid line at the left edge of column start.col, standing on the
// top edge of row start.row.
export interface FloorPlan {
  readonly cols: number;
  readonly exit: TileRect;
  readonly hazards: readonly TileRect[];
  readonly rows: number;
  readonly solids: readonly TileRect[];
  readonly start: { readonly col: number; readonly row: number };
}

// How far the duck can jump, in tiles, from the top of the ground she leaves to the top of the
// ledge she lands on. hop: the height of a short hop; jump: the height of a full jump; gap: the
// width of a gap, at the same height, that a running full jump crosses.
export interface Reaches {
  readonly gap: number;
  readonly hop: number;
  readonly jump: number;
}

// One floor's geometry, in base pixels, converted from its FloorPlan. solids block her; touching
// a hazard restarts the floor; reaching the exit clears it; falling below the floor's height
// restarts it.
export interface FloorLayout {
  readonly exit: Rect;
  readonly hazards: readonly Rect[];
  readonly height: number;
  readonly solids: readonly Rect[];
  // Where her collision box's bottom centre starts.
  readonly start: Point;
  readonly width: number;
}
