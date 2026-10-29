import "./main.css";

import { AUTO, Game, Scale } from "phaser";

import { BootScene } from "./scenes/BootScene";

// PLACEHOLDER: the base resolution and integer zoom (from the kit) once art sets the base
// resolution; until then the canvas fills the page.
new Game({
  parent: "game",
  pixelArt: true,
  scale: { autoCenter: Scale.CENTER_BOTH, mode: Scale.RESIZE },
  scene: [BootScene],
  type: AUTO,
});
