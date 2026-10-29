import "./main.css";

import { fitWholePixels } from "@andornaut/game-kit/view/phaser/fitWholePixels";
import { AUTO, Game, Scale } from "phaser";

import { SCREEN } from "./data/screen";
import { BootScene } from "./scenes/BootScene";
import { FloorScene } from "./scenes/FloorScene";

// Scale.NONE: fitWholePixels sets the only zoom, the most whole device pixels per base pixel.
const game = new Game({
  height: SCREEN.height,
  // Three touch pointers: move, jump and interact can all be held at once.
  input: { activePointers: 3 },
  parent: "game",
  pixelArt: true,
  scale: { autoCenter: Scale.CENTER_BOTH, mode: Scale.NONE },
  scene: [BootScene, FloorScene],
  type: AUTO,
  width: SCREEN.width,
});
fitWholePixels(SCREEN, game);
