import { focusKeyAction, stepFocus } from "../pause/focusInput";

// Highlighting the latest level does not activate it. A new navigation press must focus an
// action before Enter/Space can choose; the key that opened the modal cannot choose a level.
export function levelSelectKey(
  latest: string,
  levels: readonly string[],
  focus: string | undefined,
  event: Pick<KeyboardEvent, "key" | "repeat" | "shiftKey">,
): {
  readonly close: boolean;
  readonly focus: string | undefined;
  readonly level: string | undefined;
} {
  if (event.key === "Escape" && !event.repeat) {
    return { close: true, focus, level: undefined };
  }
  const action = focusKeyAction(event.key, event.shiftKey, event.repeat);
  if (action === "next" || action === "previous") {
    return {
      close: false,
      focus: stepFocus([latest, ...levels.filter((id) => id !== latest), "close"], focus, action),
      level: undefined,
    };
  }
  return {
    close: action === "press" && focus === "close",
    focus,
    level: action === "press" && focus !== undefined && levels.includes(focus) ? focus : undefined,
  };
}
