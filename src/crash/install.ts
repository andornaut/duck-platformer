// Installs the kit's crash screen. src/main.ts imports this first, so an error thrown while any
// other module loads shows the screen rather than a blank page.
import "@andornaut/game-kit/crash/crash.css";

import { BUILD_LABEL } from "@andornaut/game-kit/build/buildLabel";
import { installCrashScreen } from "@andornaut/game-kit/crash/crashScreen";

import palette from "../../public/art/palette.json";
import { TEXT } from "../data/text";

const { amber, cream, ink, navy, orange } = palette.colours;

// ?dev=1 shows the error's message and stack, with a Copy button.
export const CRASH_SCREEN = installCrashScreen({
  buildLabel: BUILD_LABEL,
  colours: { background: navy, buttonFace: amber, buttonLip: orange, ink, text: cream },
  dev: new URLSearchParams(window.location.search).get("dev") === "1",
  words: TEXT.crash,
});
