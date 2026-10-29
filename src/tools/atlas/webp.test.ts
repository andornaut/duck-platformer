import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ART_MANIFEST_FILE, ART_PATH, type ArtManifest } from "../../view/aseprite";
import { buildAtlas } from "./atlasBuild";
import { blankImage, type RgbaImage } from "./atlasPixels";
import { decodeWebp, encodeWebp } from "./webp";

const ART_DIR = join(import.meta.dirname, "../../../public", ART_PATH);
const readArt = async (path: string) => new Uint8Array(await readFile(join(ART_DIR, path)));
const ART = JSON.parse(new TextDecoder().decode(await readArt(ART_MANIFEST_FILE))) as ArtManifest;
const { pages } = await buildAtlas(readArt, ART);

// A 2x1 image: an opaque pixel and a fully transparent one that keeps a colour.
function hiddenColour(): RgbaImage {
  const image = blankImage(2, 1);
  image.data.set([0x12, 0x34, 0x56, 0xff, 0xab, 0xcd, 0xef, 0x00]);
  return image;
}

describe("encodeWebp", () => {
  it.each([
    ["a fully transparent pixel's colour", hiddenColour()],
    ...pages.map((page, index): [string, RgbaImage] => [`atlas page ${index}`, page]),
  ])("decodes to every pixel of %s", async (_, image) => {
    const decoded = await decodeWebp(await encodeWebp(image));
    expect({ height: decoded.height, width: decoded.width }).toEqual({
      height: image.height,
      width: image.width,
    });
    expect(Buffer.compare(decoded.data, image.data)).toBe(0);
  });
});
