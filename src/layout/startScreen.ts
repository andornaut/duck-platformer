import { SCREEN } from "../data/screen";
import type { Point, Rect } from "../data/types";

// PLACEHOLDER: art has not drawn the start screen yet. Until it does, in base pixels: a nav bar
// across the top, holding icon buttons at its right end, each a 44x44 hit area with its icon
// centred in it, and the Start button centred below. The Start button is the pause card's Resume
// art; its label is centred across it at labelY, or pressedLabelY while pressed.

const NAV_HEIGHT = 44;
const ICON_BUTTON = 44;
// The icons' size: art's 16x16 icons, and ui-quit's 20x20 for Exit.
const ICON = { exit: 20, settings: 16 } as const;

export interface StartScreenLayout {
  // Present unless the game cannot exit (the kit's isFirefoxAndroidApp).
  readonly exit?: { readonly hit: Rect; readonly icon: Point };
  readonly nav: Rect;
  readonly settings: { readonly hit: Rect; readonly icon: Point };
  readonly start: { readonly hit: Rect; readonly labelY: number; readonly pressedLabelY: number };
}

// The icon button in slot from the nav's right end, 0 the last.
function iconButton(slot: number, icon: number): { hit: Rect; icon: Point } {
  const hit = {
    height: ICON_BUTTON,
    width: ICON_BUTTON,
    x: SCREEN.width - (slot + 1) * ICON_BUTTON,
    y: 0,
  };
  const inset = (ICON_BUTTON - icon) / 2;
  return { hit, icon: { x: hit.x + inset, y: hit.y + inset } };
}

// The start screen with Settings then Exit at the nav's right end, or Settings alone there when
// the game cannot exit.
export function startScreenLayout(exitShown: boolean): StartScreenLayout {
  const start = { height: 44, width: 160, x: (SCREEN.width - 160) / 2, y: 196 };
  return {
    ...(exitShown ? { exit: iconButton(0, ICON.exit) } : {}),
    nav: { height: NAV_HEIGHT, width: SCREEN.width, x: 0, y: 0 },
    settings: iconButton(exitShown ? 1 : 0, ICON.settings),
    start: { hit: start, labelY: start.y + 11, pressedLabelY: start.y + 13 },
  };
}
