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
    hidden: "Hidden",
    quit: "Quit",
    resume: "Resume",
    settings: "Settings",
    shown: "Shown",
    title: "Paused",
    touchControls: "Touch controls",
  },
  quips: {},
  settings: {
    hidden: "Hidden",
    install: "Install",
    installButton: "Install",
    installSteps: {
      firefoxAndroid: { first: "Tap the menu, then More.", second: "Tap Add app to Home screen." },
      ios: { first: "Tap Share.", second: "Tap Add to Home Screen." },
      title: "Install",
    },
    shown: "Shown",
    title: "Settings",
    touchControls: "Touch controls",
  },
};
