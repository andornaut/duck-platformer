import type { Plugin } from "vite";

import { TEXT } from "../data/text";
import type { GameText } from "../data/types";

const escaped = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

// The same escaped description fills both the visible pitch and its metadata.
export function homePageHtml(text: GameText, html: string): string {
  const copy: Readonly<Record<string, string>> = {
    DESCRIPTION: text.homePage.description,
    INSTALL: text.settings.installButton,
    KEYBOARD: text.homePage.keyboard,
    PLAY: text.homePage.play,
    SUBLINE: text.homePage.subline,
    TOUCH: text.homePage.touch
      .replaceAll("{jump}", text.buttons.jump)
      .replaceAll("{use}", text.buttons.use),
  };
  return html.replace(/%HOME_([A-Z_]+)%/gu, (_, key: string) => {
    const value = copy[key];
    if (value === undefined) {
      throw new Error(`Unknown homepage copy token ${key}`);
    }
    return escaped(value);
  });
}

// Vite renders the copy in dev and production, before HTML assets and headers are processed.
export function homePagePlugin(): Plugin {
  return {
    name: "home-page-copy",
    transformIndexHtml: {
      handler: (html) => homePageHtml(TEXT, html),
      order: "pre",
    },
  };
}
