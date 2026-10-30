import type { GameText } from "./types";

export const TEXT: GameText = {
  buttons: {
    jump: "Jump",
    use: "Use",
  },
  // PLACEHOLDER: until gameplay writes the celebration.
  celebration: {
    continue: "Continue",
    message: "You reached the end of the map.",
    restart: "Restart",
    title: "Well done!",
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
  // PLACEHOLDER: until gameplay writes the question.
  restart: {
    cancel: "Cancel",
    question: "Start again from the first zone?",
    restart: "Restart",
    title: "Restart",
  },
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
  },
  start: {
    continue: "Continue",
    exit: "Exit",
    restart: "Restart",
    settings: "Settings",
    start: "Start",
  },
};
