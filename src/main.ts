// First, so the crash screen catches an error thrown while Phaser or the game's modules load.
import "./crash/install";
import "./main.css";

import { AUTO, Game, Scale } from "phaser";

// eslint-disable-next-line no-duplicate-imports -- the side-effect import above runs it first.
import { CRASH_SCREEN } from "./crash/install";
import { SCREEN } from "./data/screen";
import { setupOfflinePlay } from "./pwa";
import { BootScene } from "./scenes/BootScene";
import { FloorScene } from "./scenes/FloorScene";

// Scale.FIT: the base resolution stretches by whatever amount fills #game, keeping its aspect
// ratio, with bars on the other axis. pixelArt keeps the stretch nearest-neighbour. The game
// boots once a fresh load has checked for a newer version (setupOfflinePlay).
function startGame(): void {
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
  CRASH_SCREEN.stopGameOnCrash(() => {
    game.pause();
    game.sound.pauseAll();
  });
  // The game pauses while main.css shows the turn-sideways notice over it.
  const portrait = window.matchMedia("(orientation: portrait) and (pointer: coarse)");
  const followOrientation = () => (portrait.matches ? game.pause() : game.resume());
  portrait.addEventListener("change", followOrientation);
  followOrientation();
}

// Asks for landscape, on the game page only. Browsers allow the lock only in fullscreen or an
// installed app and reject it elsewhere, which needs no handling: the turn-sideways notice
// covers portrait. TypeScript's DOM library leaves lock out.
(screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> })
  .lock?.("landscape")
  .catch(() => undefined);

void setupOfflinePlay().then(startGame);
