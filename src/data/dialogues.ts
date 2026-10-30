import type { DialoguePlan, DialogueSpeaker } from "./types";

// CLEANUP (added 2026-10-30): fill the paragraphs before the depot introduction ships.
export const DIALOGUES: Readonly<Record<string, DialoguePlan>> = {
  "depot-dog-intro": { lines: [] },
};

// CLEANUP (added 2026-10-30): confirm name-tab colours and provide portrait-dog before shipping.
export const SPEAKERS: Readonly<Record<string, DialogueSpeaker>> = {
  dog: { colour: "green", portrait: "portrait-dog" },
  duck: { colour: "amber", portrait: "portrait-duck" },
};
