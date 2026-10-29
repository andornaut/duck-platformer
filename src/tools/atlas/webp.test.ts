import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { encodeLosslessWebp, webpDecodesTo } from "@andornaut/game-kit/art/webp";
import { describe, expect, it } from "vitest";

import { ART_MANIFEST_FILE, ART_PATH, type ArtManifest } from "../../view/aseprite";
import { buildAtlas } from "./atlasBuild";

const ART_DIR = join(import.meta.dirname, "../../../public", ART_PATH);
const readArt = async (path: string) => new Uint8Array(await readFile(join(ART_DIR, path)));
const ART = JSON.parse(new TextDecoder().decode(await readArt(ART_MANIFEST_FILE))) as ArtManifest;
const { pages } = await buildAtlas(readArt, ART);

describe("the atlas pages as WebP", () => {
  it.each(pages.map((page, index) => [index, page] as const))(
    "decodes page %i to every pixel of the packed page",
    async (_, page) => {
      expect(await webpDecodesTo(page, await encodeLosslessWebp(page))).toBe(true);
    },
  );
});
