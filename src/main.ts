// First, so the crash screen catches an error thrown while Phaser or the game's modules load.
import "./crash/install";
import "@andornaut/game-kit/view/frameTurnLandscapeGame.css";
import "./main.css";

import { MENU_FPS } from "@andornaut/game-kit/clock/frameCap";
import { capFrameRate } from "@andornaut/game-kit/clock/phaser/capFrameRate";
import { lockGameOrientation, turnedFrameQuery } from "@andornaut/game-kit/view/frameTurn";
import { followFrameTurn } from "@andornaut/game-kit/view/phaser/followFrameTurn";
import { Game, Scale, WEBGL } from "phaser";

// eslint-disable-next-line no-duplicate-imports -- the side-effect import above runs it first.
import { CRASH_SCREEN } from "./crash/install";
import { SCREEN } from "./data/screen";
import type { Rect } from "./data/types";
import { FRAME_TURN } from "./input/frameTurn";
import { setupPhoneApp } from "./pwa";
import { installOffer } from "./pwa/installOffer";
import { BootScene } from "./scenes/BootScene";
import { MapScene } from "./scenes/MapScene";
import { PauseScene } from "./scenes/PauseScene";
import { RoomScene } from "./scenes/RoomScene";
import { SettingsScene } from "./scenes/SettingsScene";
import { StartScene } from "./scenes/StartScene";
import { ZoneScene } from "./scenes/ZoneScene";
import { needsRefit } from "./view/fitCheck";
import { settleFit } from "./view/settleFit";

// The page's ink background (public/site.css), which the canvas's bars match.
const INK = "#181425";

// How often the game checks that its fit is still right (needsRefit), in ms.
const FIT_CHECK_MS = 250;

// The visible area of the page, in CSS pixels: the visual viewport where the browser has one.
function visibleArea(): Rect {
  const view = window.visualViewport;
  return view
    ? { height: view.height, width: view.width, x: view.offsetLeft, y: view.offsetTop }
    : { height: window.innerHeight, width: window.innerWidth, x: 0, y: 0 };
}

// Keeps the page sized to the visible area and the canvas fitted to it. src/main.css keeps the
// page no taller than --page-height, which this sets from the visible area rather than viewport
// units, since an installed app can size those past the screen. Every signal that the
// visible area or the frame's turn may have changed (a resize, the visual viewport, the phone
// turning, fullscreen, the app coming back from the background or the back-forward cache, or
// focus) re-reads the turn and refits until the sizes settle (settleFit): a page coming back
// can report sizes before it has laid itself out again. A check every FIT_CHECK_MS catches a
// fit or a turn gone stale with no signal at all (needsRefit, or the turn disagreeing with its
// media query) and does the same.
function keepFit(game: Game, parent: HTMLElement): void {
  const root = document.documentElement.style;
  const publish = () => {
    const value = `${visibleArea().height}px`;
    if (root.getPropertyValue("--page-height") !== value) {
      root.setProperty("--page-height", value);
    }
  };
  const refit = () => {
    publish();
    game.scale.getParentBounds();
    game.scale.refresh();
  };
  const measure = () => {
    const { height, width } = visibleArea();
    return [width, height, parent.offsetWidth, parent.offsetHeight, FRAME_TURN.turn()].join();
  };
  let stopSettling: () => void = () => undefined;
  const onSignal = () => {
    // The kit's watchFrameTurn re-reads the turn on its screen orientation's change event, which a
    // page in the background can miss.
    screen.orientation?.dispatchEvent(new Event("change"));
    stopSettling();
    stopSettling = settleFit((callback) => requestAnimationFrame(callback), measure, refit);
  };
  for (const type of ["resize", "orientationchange", "pageshow", "focus"]) {
    window.addEventListener(type, onSignal);
  }
  for (const type of ["fullscreenchange", "visibilitychange"]) {
    document.addEventListener(type, onSignal);
  }
  window.visualViewport?.addEventListener("resize", onSignal);
  window.visualViewport?.addEventListener("scroll", onSignal);
  const turned = window.matchMedia(turnedFrameQuery("landscape"));
  setInterval(() => {
    publish();
    const canvas = game.canvas.getBoundingClientRect();
    const playArea = { height: parent.offsetHeight, width: parent.offsetWidth };
    const turnStale = turned.matches !== (FRAME_TURN.turn() !== 0);
    if (turnStale || needsRefit(visibleArea(), canvas, playArea, game.scale.parentSize)) {
      onSignal();
    }
  }, FIT_CHECK_MS);
  publish();
}

// Scale.EXPAND: the canvas fills #game, stretched by the most the base resolution can take on
// both axes, so where #game is wider or taller than 2:1 the canvas is too. Each scene shows the
// game's base-resolution view at the canvas's top, centred across (src/scenes/playCamera.ts), and
// the touch controls move into the bars beside or below it. pixelArt keeps the stretch
// nearest-neighbour. The game is constructed at once and loads while a fresh load
// checks for a newer version: BootScene holds only the zone for the check (launchReady).
function startGame(): void {
  const game = new Game({
    // The bars beside the game's view, in the page's ink.
    backgroundColor: INK,
    height: SCREEN.height,
    // Three touch pointers: a move touch, Jump and Use can all be held at once.
    input: { activePointers: 3 },
    parent: "game",
    pixelArt: true,
    // Lower input-to-screen delay: a desynchronized context lets the browser show a frame without
    // waiting on the page compositor, and the high-performance GPU where there is a choice.
    render: { antialias: false, desynchronized: true, powerPreference: "high-performance" },
    scale: { autoCenter: Scale.CENTER_HORIZONTALLY, mode: Scale.EXPAND },
    // Later scenes draw over earlier ones: the pause card over the zone, the settings card over
    // the pause card's dim.
    scene: [BootScene, StartScene, MapScene, ZoneScene, PauseScene, RoomScene, SettingsScene],
    // WebGL only: the build's Phaser has no Canvas renderer (src/tools/phaserBuild.ts).
    type: WEBGL,
    width: SCREEN.width,
  });
  // Phaser fits the canvas to #game, refits whenever #game changes size, and measures and maps
  // pointers through the frame's turn (the kit's followFrameTurn).
  const parent = document.getElementById("game");
  if (parent !== null) {
    followFrameTurn(game, parent, FRAME_TURN.turn, game.scale.gameSize);
    keepFit(game, parent);
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
