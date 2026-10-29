import type { Point, Rect } from "../data/types";

// Art's start screen (art/README.md, Start screen), in base pixels: the nav bar across the top,
// with 36x36 icon buttons at its right end, each in a 44x44 hit area with its 20x20 icon 8 in and
// 6 down (8 down while pressed), and the logo with Start under it. Start's label origin is 15
// below its top, 2 lower while pressed.

const ICON_BUTTON = { hitInset: 4, icon: { x: 8, y: 6 }, size: 36, y: 6 } as const;
// A pressed button's icon or label sinks this far.
const PRESSED_SINK = 2;
// The last icon button's x at the nav's right end; each one before it is a slot further left.
const RIGHT_BUTTON_X = 676;
const BUTTON_SLOT = 44;
const START = { height: 52, labelDy: 15, width: 192, x: 264, y: 268 } as const;

export interface IconButtonLayout {
  readonly at: Point;
  readonly hit: Rect;
  readonly icon: Point;
  readonly pressedIcon: Point;
}

export interface StartScreenLayout {
  // Present where the start screen offers to leave the game (exitShown in src/pwa).
  readonly exit?: IconButtonLayout;
  readonly logo: Point;
  readonly nav: Rect;
  readonly settings: IconButtonLayout;
  readonly start: {
    readonly button: Rect;
    readonly labelY: number;
    readonly pressedLabelY: number;
  };
}

// The icon button in slot from the nav's right end, 0 the last.
function iconButton(slot: number): IconButtonLayout {
  const { hitInset, icon, size, y } = ICON_BUTTON;
  const x = RIGHT_BUTTON_X - slot * BUTTON_SLOT;
  const side = size + 2 * hitInset;
  return {
    at: { x, y },
    hit: { height: side, width: side, x: x - hitInset, y: y - hitInset },
    icon: { x: x + icon.x, y: y + icon.y },
    pressedIcon: { x: x + icon.x, y: y + icon.y + PRESSED_SINK },
  };
}

// The start screen with Settings then Exit at the nav's right end, or Settings alone there where
// Exit is hidden.
export function startScreenLayout(exitShown: boolean): StartScreenLayout {
  const { labelDy, ...button } = START;
  return {
    ...(exitShown ? { exit: iconButton(0) } : {}),
    logo: { x: 180, y: 60 },
    nav: { height: 48, width: 720, x: 0, y: 0 },
    settings: iconButton(exitShown ? 1 : 0),
    start: {
      button,
      labelY: button.y + labelDy,
      pressedLabelY: button.y + labelDy + PRESSED_SINK,
    },
  };
}
