import "./main.css";

import { AUTO, Game, Scale } from "phaser";

import { SCREEN } from "./data/screen";
import { BootScene } from "./scenes/BootScene";
import { FloorScene } from "./scenes/FloorScene";

// Scale.FIT: the base resolution stretches by whatever amount fills #game, keeping its aspect
// ratio, with bars on the other axis. pixelArt keeps the stretch nearest-neighbour.
const game = new Game({
  height: SCREEN.height,
  // Three touch pointers: a move touch, Jump and Use can all be held at once.
  input: { activePointers: 3 },
  parent: "game",
  pixelArt: true,
  scale: { autoCenter: Scale.CENTER_BOTH, mode: Scale.FIT },
  scene: [BootScene, FloorScene],
  type: AUTO,
  width: SCREEN.width,
});

// The game pauses while public/site.css shows the turn-sideways notice over it.
const portrait = window.matchMedia("(orientation: portrait) and (pointer: coarse)");
const followOrientation = () => (portrait.matches ? game.pause() : game.resume());
portrait.addEventListener("change", followOrientation);
followOrientation();
