// The Touch controls setting: whether the touch buttons show, Shown unless the player hides
// them. Kept in localStorage under its own key until the game has a save.
const STORAGE_KEY = "duck-platformer.touch-controls";
const HIDDEN = "hidden";
const SHOWN = "shown";

// Shown for anything but the stored hidden value, a missing one included.
export function decodeTouchControls(stored: string | null): boolean {
  return stored !== HIDDEN;
}

export function encodeTouchControls(shown: boolean): string {
  return shown ? SHOWN : HIDDEN;
}

// Reading or writing localStorage throws where the browser blocks site data; the setting then
// lasts only until the page reloads.
function readStored(): string | null {
  try {
    return globalThis.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

let shown: boolean | undefined;

export function touchControlsShown(): boolean {
  shown ??= decodeTouchControls(readStored());
  return shown;
}

export function setTouchControlsShown(value: boolean): void {
  shown = value;
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, encodeTouchControls(value));
  } catch {
    // Kept for this page only.
  }
}
