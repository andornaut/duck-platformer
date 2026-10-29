import { precachePlugin as kitPrecachePlugin } from "@andornaut/game-kit/pwa/vite/precachePlugin";
import type { Plugin } from "vite";

import type { ArtManifest } from "../view/aseprite";
import { CACHE_POLICY } from "./cachePolicy";
import { ART_MANIFEST_URL, artUrls } from "./precacheArt";

// The kit's precache plugin with the game's cache policy, building /sw.js from
// serviceWorkerSource (serviceWorker.ts) to precache the game page at pageHtmlFile and what it
// loads. BootScene loads the art from public/art/ at runtime rather than linking it, and the
// kit precaches only build output beyond the page's links, so a first plugin emits every file
// art's manifest lists into the build output at its own path, for the kit's to name.
export function precachePlugin(pageHtmlFile: string, serviceWorkerSource: string): Plugin[] {
  let urls: string[] = [];
  const emitArt: Plugin = {
    apply: "build",
    async generateBundle() {
      const { publicDir } = this.environment.config;
      const read = (url: string) => this.fs.readFile(`${publicDir}${url}`);
      const manifest = JSON.parse(
        new TextDecoder().decode(await read(ART_MANIFEST_URL)),
      ) as ArtManifest;
      urls = artUrls(manifest);
      const files = await Promise.all(urls.map(async (url) => [url, await read(url)] as const));
      for (const [url, source] of files) {
        this.emitFile({ fileName: url.slice(1), source, type: "asset" });
      }
    },
    name: "duck-precache-art",
  };
  return [
    emitArt,
    kitPrecachePlugin({
      hashedFiles: () => ({ sounds: {}, urls }),
      pageHtmlFile,
      policy: CACHE_POLICY,
      serviceWorkerSource,
    }),
  ];
}
