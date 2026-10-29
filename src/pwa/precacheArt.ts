import { ART_MANIFEST_FILE, ART_PATH, type ArtManifest } from "../view/aseprite";

export const ART_MANIFEST_URL = `${ART_PATH}${ART_MANIFEST_FILE}`;

// Every URL BootScene loads from art's manifest: the manifest itself, each sprite's image and
// frames, each font's image and descriptor, each data file, each tileset's sheet and description,
// and each backdrop.
export function artUrls(manifest: ArtManifest): string[] {
  const files = [
    ...manifest.sprites.flatMap((sprite) => [sprite.png, sprite.json]),
    ...manifest.fonts.flatMap((font) => [font.png, font.fnt]),
    ...manifest.data.map((data) => data.json),
    ...manifest.tilesets.flatMap((tileset) => [tileset.png, tileset.json]),
    ...manifest.backdrops.map((backdrop) => backdrop.png),
  ];
  return [ART_MANIFEST_URL, ...files.map((file) => `${ART_PATH}${file}`)];
}
