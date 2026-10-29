import "./main.css";

import { AUTO, Game, Scale } from "phaser";

import { SCREEN } from "./data/screen";
import { BootScene } from "./scenes/BootScene";
import { FloorScene } from "./scenes/FloorScene";

// Scale.FIT: the base resolution stretches by whatever amount fills #game, keeping its aspect
// ratio, with bars on the other axis. pixelArt keeps the stretch nearest-neighbour.
const game = new Game({
  height: SCREEN.height,
  // Three touch pointers: move, jump and interact can all be held at once.
  input: { activePointers: 3 },
  parent: "game",
  pixelArt: true,
  scale: { autoCenter: Scale.CENTER_BOTH, mode: Scale.FIT },
  scene: [BootScene, FloorScene],
  type: AUTO,
  width: SCREEN.width,
});
