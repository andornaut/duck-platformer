import { ART_MANIFEST_FILE, ART_PATH, type ArtManifest } from "../view/aseprite";

export const ART_MANIFEST_URL = `${ART_PATH}${ART_MANIFEST_FILE}`;

// Every URL a build's BootScene loads from art's manifest: the manifest itself, each data file,
// each font's descriptor and each tileset's description. Every PNG it lists is on the build's
// atlas pages (src/tools/atlas/atlasPlugin.ts), which the build lists apart.
export function artUrls(manifest: ArtManifest): string[] {
  const files = [
    ...manifest.data.map((data) => data.json),
    ...manifest.fonts.map((font) => font.fnt),
    ...manifest.tilesets.map((tileset) => tileset.json),
  ];
  return [ART_MANIFEST_URL, ...files.map((file) => `${ART_PATH}${file}`)];
}
