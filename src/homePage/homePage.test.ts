import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import manifest from "../../public/art/manifest.json";
import { CHUNKS } from "../data/chunks";
import { TEXT } from "../data/text";
import { RECIPES } from "../data/zones";
import { keyIntent } from "../input/intent";
import { cardKeyAction } from "../pause/cardInput";
import { themesOf } from "../rules/assemble";

// The home page and the nav bar are static files, so what they state is checked against the
// game here.
const HOME_PAGE = new URL("../../pages/index.html", import.meta.url);
const NAV_SCRIPT = new URL("../../public/nav.js", import.meta.url);

const pageText = async () => (await readFile(HOME_PAGE, "utf8")).replaceAll(/\s+/gu, " ");

function artImage(key: string) {
  const image = manifest.images.find((entry) => entry.key === key);
  return { height: image?.height, src: `/art/${image?.png}`, width: image?.width };
}

describe("the logos", () => {
  it("shows the home page's logo at art's size", async () => {
    const pattern = /<img class="logo" src="([^"]+)" width="(\d+)" height="(\d+)"/u;
    const [, src, width, height] = pattern.exec(await readFile(HOME_PAGE, "utf8")) ?? [];
    expect({ height: Number(height), src, width: Number(width) }).toEqual(artImage("logo"));
  });

  it("shows the nav bar's logos, the column's then the row's, at art's sizes", async () => {
    const pattern = /\{ height: (\d+), src: "([^"]+)", width: (\d+) \}/gu;
    const shown = [...(await readFile(NAV_SCRIPT, "utf8")).matchAll(pattern)].map(
      ([, height, src, width]) => ({ height: Number(height), src, width: Number(width) }),
    );
    expect(shown).toEqual([artImage("logo-icon"), artImage("logo-nav")]);
  });
});

describe("the home page's controls", () => {
  it("names the touch buttons by their labels", async () => {
    expect(await pageText()).toContain(`press ${TEXT.buttons.jump} or ${TEXT.buttons.use}.`);
  });

  it.each([
    ["arrow keys to walk and jump", () => keyIntent(new Set(["ArrowLeft"])).move === -1],
    ["arrow keys to walk and jump", () => keyIntent(new Set(["ArrowRight"])).move === 1],
    ["arrow keys to walk and jump", () => keyIntent(new Set(["ArrowUp"])).jump],
    ["E to use", () => keyIntent(new Set(["KeyE"])).use],
    ["P to pause", () => cardKeyAction(false, "p", false) === "open"],
  ])("states %s, as the keys do", async (phrase, does) => {
    expect({ does: does(), stated: (await pageText()).includes(phrase) }).toEqual({
      does: true,
      stated: true,
    });
  });
});

// The first stage's available authored features, including optional randomized middle chunks.
const streetTheme = RECIPES.street?.theme ?? "";
const streetCharacters = new Set(
  Object.values(CHUNKS)
    .filter((chunk) => themesOf(chunk).includes(streetTheme))
    .flatMap(({ objects }) => objects.map(({ character }) => character)),
);

describe("the home page's zone 1", () => {
  it.each([["red contact edges", "red-edge-top"]])(
    "states %s, which zone 1 can include",
    async (phrase, character) => {
      expect({
        placed: streetCharacters.has(character),
        stated: (await pageText()).includes(phrase),
      }).toEqual({ placed: true, stated: true });
    },
  );
});
