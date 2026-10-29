import type { CachePolicy } from "@andornaut/game-kit/pwa/cachePolicy";

// The game's caching rules (the kit's pwa/cachePolicy), which the service worker and the precache
// build share. Content-hashed build output is under /assets/. The web app manifest is unhashed
// and fetched network-first, so a deploy's copy shows on the next load.
export const CACHE_POLICY: CachePolicy = {
  cacheNamePrefix: "duck-",
  hashedAssetPrefix: "/assets/",
  revalidatedUrls: ["/manifest.webmanifest"],
};
