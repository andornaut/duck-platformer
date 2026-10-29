import { Core, type Game } from "phaser";

import { CAPPED_FPS, type FrameGate, gateFrame, OPEN_GATE } from "../pwa/frameCap";

const LEVEL = "level";

// Caps the frame rate at CAPPED_FPS whenever the level is not in play: under the pause card and
// while BootScene loads. Under the turn-sideways notice the game is paused and draws nothing.
// Phaser's loop calls its step on every display frame; this passes on only the frames gateFrame
// draws, each with the time of the frames it skipped, so animations keep their speed. While
// LevelScene is active every frame draws. The loop takes its step when it starts, after the
// game's READY event, so the step is wrapped on the first frame and gated from the next.
export function capFrameRateOutOfPlay(game: Game): void {
  game.events.once(Core.Events.PRE_STEP, () => {
    const step = game.loop.callback;
    let gate: FrameGate = OPEN_GATE;
    game.loop.callback = (time, delta) => {
      const playing = game.scene.isActive(LEVEL);
      const frame = gateFrame(playing ? undefined : CAPPED_FPS, delta, gate);
      gate = frame.gate;
      if (frame.draw) {
        step(time, frame.elapsedMs);
      }
    };
  });
}
