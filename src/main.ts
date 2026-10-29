// First, so the crash screen catches an error thrown while Phaser or the game's modules load.
import "./crash/install";
import "./main.css";

import { MENU_FPS } from "@andornaut/game-kit/clock/frameCap";
import { capFrameRate } from "@andornaut/game-kit/clock/phaser/capFrameRate";
import { pageToGame } from "@andornaut/game-kit/view/pagePoint";
import { Game, type Input, Scale, WEBGL } from "phaser";

// eslint-disable-next-line no-duplicate-imports -- the side-effect import above runs it first.
import { CRASH_SCREEN } from "./crash/install";
import { SCREEN } from "./data/screen";
import { pageFrameTurn } from "./input/frameTurn";
import { setupPhoneApp } from "./pwa";
import { installOffer } from "./pwa/installOffer";
import { BootScene } from "./scenes/BootScene";
import { MapScene } from "./scenes/MapScene";
import { PauseScene } from "./scenes/PauseScene";
import { SettingsScene } from "./scenes/SettingsScene";
import { ZoneScene } from "./scenes/ZoneScene";

// On a touch screen in portrait, src/main.css turns the page frame 90 degrees clockwise, so the
// game reads correctly with the phone turned counter-clockwise onto its side. Phaser measures
// #game and maps pointers by their bounding rects on the page, which the turn swaps, so here it
// measures #game's own layout size and maps each pointer through the turn (the kit's pageToGame).
function followFrameTurn(game: Game, parent: HTMLElement): void {
  const scale = game.scale;
  const measure = scale.getParentBounds.bind(scale);
  scale.getParentBounds = () => {
    if (pageFrameTurn() === 0) {
      return measure();
    }
    const { offsetHeight: height, offsetWidth: width } = parent;
    if (scale.parentSize.width === width && scale.parentSize.height === height) {
      return false;
    }
    scale.parentSize.setSize(width, height);
    return true;
  };
  const input = game.input;
  const transform = input.transformPointer.bind(input);
  input.transformPointer = (pointer: Input.Pointer, pageX: number, pageY: number, wasMove) => {
    const turn = pageFrameTurn();
    if (turn === 0) {
      transform(pointer, pageX, pageY, wasMove);
      return;
    }
    const client = { x: pageX - window.scrollX, y: pageY - window.scrollY };
    const point = pageToGame(turn, game.canvas.getBoundingClientRect(), SCREEN, client);
    pointer.prevPosition.copy(pointer.position);
    pointer.position.set(point.x, point.y);
  };
}

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
    // src/main.css centres the canvas in #game: Phaser's own centring measures the canvas's
    // bounding rect, which the portrait turn swaps.
    scale: { autoCenter: Scale.NO_CENTER, mode: Scale.FIT },
    // Later scenes draw over earlier ones: the pause card over the zone, the settings card over
    // the pause card's dim.
    scene: [BootScene, MapScene, ZoneScene, PauseScene, SettingsScene],
    // WebGL only: the build's Phaser has no Canvas renderer (src/tools/phaserBuild.ts).
    type: WEBGL,
    width: SCREEN.width,
  });
  // Phaser measures #game on window resizes only, but its size also changes without one: an
  // installed app learns its safe-area insets (the gesture bar, the notch) after the first
  // layout, and the frame turns as the phone does. Re-fit whenever #game itself changes size, so
  // the canvas never overflows it.
  const parent = document.getElementById("game");
  if (parent !== null) {
    followFrameTurn(game, parent);
    new ResizeObserver(() => {
      game.scale.getParentBounds();
      game.scale.refresh();
    }).observe(parent);
  }
  // The pause card and BootScene draw at most about MENU_FPS frames a second; the zone, every
  // display frame.
  capFrameRate(MENU_FPS, () => game.scene.isActive("zone"), game);
  CRASH_SCREEN.stopGameOnCrash(() => game.pause());
}

// The browser's install prompt can come before the game draws, so the settings card's offer
// starts listening as the page loads.
installOffer();

// Asks for landscape, on the game page only. Browsers allow the lock only in fullscreen or an
// installed app and reject it elsewhere, which needs no handling: in portrait the frame turns.
// TypeScript's DOM library leaves lock out.
(screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> })
  .lock?.("landscape")
  .catch(() => undefined);

setupPhoneApp();
startGame();
