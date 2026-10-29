import type { FrameTurn } from "@andornaut/game-kit/view/pagePoint";

// The media query under which src/main.css turns the page's game frame 90 degrees clockwise: a
// touch screen in portrait, where the game is drawn on its side to be played with the phone held
// sideways.
export const TURNED_FRAME_QUERY = "(orientation: portrait) and (pointer: coarse)";

// How far src/main.css turns the page's game frame now.
export function pageFrameTurn(): FrameTurn {
  return window.matchMedia(TURNED_FRAME_QUERY).matches ? 90 : 0;
}
