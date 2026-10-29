// First, so the crash screen catches an error thrown while Phaser or the game's modules load.
import "./crash/install";
import "./main.css";

import { BUILD_LABEL } from "@andornaut/game-kit/build/buildLabel";
import { MENU_FPS } from "@andornaut/game-kit/clock/frameCap";
import { capFrameRate } from "@andornaut/game-kit/clock/phaser/capFrameRate";
import { Game, Scale, WEBGL } from "phaser";

// eslint-disable-next-line no-duplicate-imports -- the side-effect import above runs it first.
import { CRASH_SCREEN } from "./crash/install";
import { SCREEN } from "./data/screen";
import { coverZone, setupPhoneApp } from "./pwa";
import { BootScene } from "./scenes/BootScene";
import { PauseScene } from "./scenes/PauseScene";
import { ZoneScene } from "./scenes/ZoneScene";

// Scale.FIT: the base resolution stretches by whatever amount fills #game, keeping its aspect
// ratio, with bars on the other axis. pixelArt keeps the stretch nearest-neighbour. The game is
// constructed at once and loads while a fresh load checks for a newer version: BootScene holds
// only the zone for the check (launchReady).
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
    scale: { autoCenter: Scale.CENTER_BOTH, mode: Scale.FIT },
    // Later scenes draw over earlier ones: the pause card over the zone.
    scene: [BootScene, ZoneScene, PauseScene],
    // WebGL only: the build's Phaser has no Canvas renderer (src/tools/phaserBuild.ts).
    type: WEBGL,
    width: SCREEN.width,
  });
  // Phaser measures #game on window resizes only, but its size also changes without one: an
  // installed app learns its safe-area insets (the gesture bar, the notch) after the first
  // layout. Re-fit whenever #game itself changes size, so the canvas never overflows it.
  const parent = document.getElementById("game");
  if (parent !== null) {
    new ResizeObserver(() => game.scale.refresh()).observe(parent);
  }
  // The pause card and BootScene draw at most about MENU_FPS frames a second; the zone, every
  // display frame. Under the turn-sideways notice the game is paused and draws nothing.
  capFrameRate(MENU_FPS, () => game.scene.isActive("zone"), game);
  CRASH_SCREEN.stopGameOnCrash(() => game.pause());
  // The game pauses while main.css shows the turn-sideways notice over it, and the update toast
  // waits until the notice is gone.
  const portrait = window.matchMedia("(orientation: portrait) and (pointer: coarse)");
  const followOrientation = () => {
    coverZone("sideways", portrait.matches);
    if (portrait.matches) {
      game.pause();
    } else {
      game.resume();
    }
  };
  portrait.addEventListener("change", followOrientation);
  followOrientation();
}

// An element in pages/play/index.html.
const BUILD_LABEL_ID = "build-label";

const buildLabel = document.getElementById(BUILD_LABEL_ID);
if (buildLabel !== null) {
  buildLabel.textContent = BUILD_LABEL;
}

// Asks for landscape, on the game page only. Browsers allow the lock only in fullscreen or an
// installed app and reject it elsewhere, which needs no handling: the turn-sideways notice
// covers portrait. TypeScript's DOM library leaves lock out.
(screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> })
  .lock?.("landscape")
  .catch(() => undefined);

setupPhoneApp();
startGame();
