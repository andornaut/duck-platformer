// Events dispatched on window for the scenes to act on. Each is a plain Event with no detail.
export const PHONE_EVENTS = {
  // The Android back gesture or button, or the browser's Back. The page stays on the game, so
  // the scenes decide what back means (open or close the pause card).
  backPressed: "back-pressed",
} as const;

type PhoneEventName = (typeof PHONE_EVENTS)[keyof typeof PHONE_EVENTS];

export function dispatchPhoneEvent(target: EventTarget, name: PhoneEventName): void {
  target.dispatchEvent(new Event(name));
}
