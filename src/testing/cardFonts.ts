import { parseBitmapFont } from "@andornaut/game-kit/text/bitmapFont";

import body from "../../public/art/fonts/font-body.fnt?raw";
import title from "../../public/art/fonts/font-title.fnt?raw";
export const CARD_FONTS = { body: parseBitmapFont(body), title: parseBitmapFont(title) };
