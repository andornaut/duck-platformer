// What the player's keys do to the settings card: Up and Down move the focus through its
// controls, Enter and Space press the focused one, and Escape and P close the card (and the
// install steps card first, while it shows).
export type SettingsKeyAction = "close" | "next" | "press" | "previous";

const KEY_ACTIONS: Readonly<Record<string, SettingsKeyAction>> = {
  " ": "press",
  ArrowDown: "next",
  ArrowUp: "previous",
  Enter: "press",
  Escape: "close",
  P: "close",
  p: "close",
};

// A key's action, or undefined for any other key. A held key's repeats move the focus on, but
// never press or close again.
export function settingsKeyAction(key: string, repeat: boolean): SettingsKeyAction | undefined {
  const action = KEY_ACTIONS[key];
  return repeat && action !== "next" && action !== "previous" ? undefined : action;
}

// The focus after a step through targets, in order and wrapping round, from focus: the first
// (next) or last (previous) target when nothing has the focus yet.
export function stepFocus<Target>(
  targets: readonly Target[],
  focus: Target | undefined,
  step: "next" | "previous",
): Target | undefined {
  const by = step === "next" ? 1 : -1;
  const at = focus === undefined ? -1 : targets.indexOf(focus);
  const from = at < 0 ? (by > 0 ? -1 : 0) : at;
  return targets[(from + by + targets.length) % targets.length];
}
