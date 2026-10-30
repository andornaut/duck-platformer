import type { GameText } from "./types";

export const TEXT: GameText = {
  buttons: {
    jump: "Jump",
    use: "Use",
  },
  crash: {
    body: "The game stopped. Reload to play again.",
    reload: "Reload",
    title: "Something went wrong",
  },
  lines: {},
  map: {
    continue: "Continue",
    title: "Map",
    zones: {
      alley: "Alley",
      park: "Park",
      street: "Street",
    },
  },
  pause: {
    home: "Return home",
    resume: "Resume",
    settings: "Settings",
    title: "Paused",
  },
  quips: {},
  room: {
    leave: "Leave",
  },
  rooms: {
    // PLACEHOLDER: until gameplay designs the rooms.
    test: { name: "Test room" },
  },
  settings: {
    actionButtons: "Action buttons",
    hidden: "Hidden",
    install: "Install",
    installButton: "Install",
    installSteps: {
      firefoxAndroid: { first: "Tap the menu, then More.", second: "Tap Add app to Home screen." },
      ios: { first: "Tap Share.", second: "Tap Add to Home Screen." },
      title: "Install",
    },
    moveControls: "Move controls",
    shown: "Shown",
    title: "Settings",
    touchControls: "Touch controls",
  },
  start: {
    continue: "Continue",
    exit: "Exit",
    settings: "Settings",
    start: "Start",
  },
};
