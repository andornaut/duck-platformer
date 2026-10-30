// First, so the crash screen catches an error thrown while Phaser or the game's modules load.
import "./crash/install";
import "@andornaut/game-kit/view/frameTurnLandscapeGame.css";
import "./main.css";

import { MENU_FPS } from "@andornaut/game-kit/clock/frameCap";
import { capFrameRate } from "@andornaut/game-kit/clock/phaser/capFrameRate";
import { lockGameOrientation } from "@andornaut/game-kit/view/frameTurn";
import { followFrameTurn } from "@andornaut/game-kit/view/phaser/followFrameTurn";
import { Game, Scale, WEBGL } from "phaser";

// eslint-disable-next-line no-duplicate-imports -- the side-effect import above runs it first.
import { CRASH_SCREEN } from "./crash/install";
import { SCREEN } from "./data/screen";
import { FRAME_TURN } from "./input/frameTurn";
import { setupPhoneApp } from "./pwa";
import { installOffer } from "./pwa/installOffer";
import { BootScene } from "./scenes/BootScene";
import { MapScene } from "./scenes/MapScene";
import { PauseScene } from "./scenes/PauseScene";
import { SettingsScene } from "./scenes/SettingsScene";
import { StartScene } from "./scenes/StartScene";
import { ZoneScene } from "./scenes/ZoneScene";

// Scale.FIT: the base resolution stretches by whatever amount fills #game, keeping its aspect
// ratio, at the top of #game and centred across it, with bars on the other axis. pixelArt keeps
// the stretch nearest-neighbour. The game is constructed at once and loads while a fresh load
// checks for a newer version: BootScene holds only the zone for the check (launchReady).
function startGame(): void {
  const game = new Game({
    height: SCREEN.height,
    // Three touch pointers: a move touch, Jump and Use can all be held at once.
    input: { activePointers: 3 },
    parent: "game",
    pixelArt: true,
    // Lower input-to-screen delay: a desynchronized context lets the browser show a frame without
    // waiting on the page compositor, and the high-performance GPU where there is a choice.
    render: { antialias: false, desynchronized: true, powerPreference: "high-performance" },
    // Phaser centres the canvas across #game, and src/main.css in the turned portrait frame.
    scale: { autoCenter: Scale.CENTER_HORIZONTALLY, mode: Scale.FIT },
    // Later scenes draw over earlier ones: the pause card over the zone, the settings card over
    // the pause card's dim.
    scene: [BootScene, StartScene, MapScene, ZoneScene, PauseScene, SettingsScene],
    // WebGL only: the build's Phaser has no Canvas renderer (src/tools/phaserBuild.ts).
    type: WEBGL,
    width: SCREEN.width,
  });
  // Phaser fits the canvas to #game, refits whenever #game changes size, and measures and maps
  // pointers through the frame's turn (the kit's followFrameTurn).
  const parent = document.getElementById("game");
  if (parent !== null) {
    followFrameTurn(game, parent, FRAME_TURN.turn, SCREEN);
  }
  // The pause card and BootScene draw at most about MENU_FPS frames a second; the zone, every
  // display frame.
  capFrameRate(MENU_FPS, () => game.scene.isActive("zone"), game);
  CRASH_SCREEN.stopGameOnCrash(() => game.pause());
}

// The browser's install prompt can come before the game draws, so the settings card's offer
// starts listening as the page loads.
installOffer();

// Asks for landscape, on the game page only; where the browser refuses, the frame turns.
lockGameOrientation(screen, "landscape");

setupPhoneApp();
startGame();
