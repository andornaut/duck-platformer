// What the player's keys and back do to the pause card, and what back does on the start screen.
export type CardAction = "close" | "open";

// The keys that open the card during play and close it when open.
const CARD_KEYS = new Set(["Escape", "P", "p"]);

// A key's action, or undefined for any other key or a held key's repeats.
export function cardKeyAction(open: boolean, key: string, repeat: boolean): CardAction | undefined {
  if (repeat || !CARD_KEYS.has(key)) {
    return undefined;
  }
  return open ? "close" : "open";
}

// Back opens the card during play and closes it when open.
export function cardBackAction(open: boolean): CardAction {
  return open ? "close" : "open";
}

// What back does on the start screen.
export type StartBackAction = "closeSettings" | "exit";

// Back closes the settings card (or its install steps) while it shows, and otherwise leaves the
// game as Exit does. Where the start screen shows no Exit, back does nothing.
export function startBackAction(
  settingsOpen: boolean,
  canExit: boolean,
): StartBackAction | undefined {
  if (settingsOpen) {
    return "closeSettings";
  }
  return canExit ? "exit" : undefined;
}
