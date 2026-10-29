import { PNG } from "pngjs";
import type { Plugin } from "vite";

import type { AtlasManifest } from "../../assets/atlasManifest";
import { ART_MANIFEST_FILE, ART_PATH, type ArtManifest } from "../../view/aseprite";
import { buildAtlas } from "./atlasBuild";
import type { RgbaImage } from "./atlasPixels";
import { atlasPageFileName } from "./hashedArt";

// The module whose default export is the build's AtlasManifest, or null on the dev server.
export const ATLAS_MODULE = "virtual:atlas-manifest";
// Vite's prefix for a module id that names no file.
const RESOLVED_ATLAS_MODULE = `\0${ATLAS_MODULE}`;

// An atlas page as a lossless PNG.
export function encodePage({ data, height, width }: RgbaImage): Uint8Array {
  const png = new PNG({ height, width });
  png.data = Buffer.from(data);
  return PNG.sync.write(png, { colorType: 6, deflateLevel: 9 });
}

interface AtlasPluginApi {
  // The URLs of the build's atlas pages, once buildStart has run.
  pageUrls(): readonly string[];
}

// In a build, packs every PNG art's manifest lists into atlas pages, writes each to the build
// output under a content-hashed name, and makes ATLAS_MODULE the atlas manifest that maps each
// art key and frame to its page and rect. The files under public/art/ are still copied as they
// are, for the dev server, which loads each file on its own.
export function atlasPlugin(): Plugin & { api: AtlasPluginApi } {
  let manifest: AtlasManifest | null = null;
  return {
    api: { pageUrls: () => manifest?.pages.map(({ url }) => url) ?? [] },
    async buildStart() {
      const { config, logger } = this.environment;
      if (config.command !== "build") {
        return;
      }
      const artDir = `${config.publicDir}${ART_PATH}`;
      const readArt = async (path: string) => this.fs.readFile(`${artDir}${path}`);
      const art = JSON.parse(
        new TextDecoder().decode(await readArt(ART_MANIFEST_FILE)),
      ) as ArtManifest;
      const { pages, textures } = await buildAtlas(readArt, art);
      manifest = {
        pages: pages.map((image, page) => {
          const source = encodePage(image);
          const fileName = atlasPageFileName(page, "png", source);
          this.emitFile({ fileName, source, type: "asset" });
          logger.info(`atlas: ${fileName} ${image.width}x${image.height}, ${source.length} B`);
          return { height: image.height, url: `/${fileName}`, width: image.width };
        }),
        textures,
      };
    },
    load(id) {
      return id === RESOLVED_ATLAS_MODULE
        ? `export default ${JSON.stringify(manifest)};`
        : undefined;
    },
    name: "duck-atlas",
    resolveId(id) {
      return id === ATLAS_MODULE ? RESOLVED_ATLAS_MODULE : undefined;
    },
  };
}
