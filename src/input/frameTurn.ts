import { type FrameTurn, TURNED_FRAME_QUERY } from "./screenPoint";

// How far src/main.css turns the page's game frame now.
export function pageFrameTurn(): FrameTurn {
  return window.matchMedia(TURNED_FRAME_QUERY).matches ? 90 : 0;
}
