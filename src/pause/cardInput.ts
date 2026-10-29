// What the player's keys and back do to the pause card.
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
