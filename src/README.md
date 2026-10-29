# Tech Plan

## Platform and delivery

- **Stack:** Phaser 4, TypeScript and Vite.
- **Hosting:** Cloudflare Workers static assets, no Worker script (`wrangler.jsonc`).
- **Targets:** landscape phone browsers with on-screen touch controls, and desktop browsers with a keyboard.
- **Tooling:** Node 24, Vitest, ESLint with the shared house rules, Prettier, markdownlint, husky + lint-staged, Dependabot, and the Test and AI attributions workflows.

## Architecture

- **Crash screen:** `src/main.ts` first imports `src/crash/install.ts`, which installs the kit's crash screen in art's palette with the words in `src/data/text.ts`; it pauses the game on the first uncaught error. `?dev=1` adds the error's details. The build label's version and commit come from Vite's `define` in `vite.config.ts`, the commit reading `dev` without git.
- **Game data:** `src/data/types.ts` holds the shapes; every other file in `src/data/` holds gameplay's values, with the words the player reads in `text.ts`.
- **Levels:** a level is played from its `LevelPlan` in tiles (`src/data/types.ts`), converted once to pixels for the rules. The test levels in `src/data/levels.ts` play in order and loop; `?level=<n>` (from 1) starts at one. Moving platforms are placed by the time since the level started, so a restart replays them.
- **Offline play:** the build writes `/sw.js` (the kit's service worker with `src/pwa/cachePolicy.ts`), precaching `/play/`, what it loads and links, and every file art's manifest lists. `src/pwa/` registers it in production; a newer version takes over before the player interacts, and after that the page's "Update ready" toast offers it.
- **Phaser boundary:** only `src/scenes/` and `src/main.ts` import Phaser or a scene, enforced by ESLint's `no-restricted-imports`. Logic, layout and data are Phaser-free, so they unit-test without a renderer.
- **Scenes:** `BootScene` runs first: it loads everything `public/art/manifest.json` lists and makes an animation of each sprite tag, keyed `<sprite>:<tag>`, with the tag's frames and durations from the sprite's Aseprite export. A tag the sprite's manifest entry lists in `once` plays once and holds its last frame; every other tag loops.
- **Security headers:** the build writes `dist/_headers` from `src/headers/securityPolicy.ts`: a Content-Security-Policy per page with its inline blocks hashed, and a year's caching for hashed build output under `/assets/`.
- **Shared kit:** `@andornaut/game-kit` is a committed copy at `vendor/game-kit/`, synced by game-kit's `scripts/sync-into.sh` with its source commit in `vendor/game-kit/KIT_COMMIT`, and changed only at its source.
- **Test helpers:** `src/testing/` is importable only from tests.
- **View:** `src/view/` picks each sprite's tag and whole-pixel position from the game state, Phaser-free, so the scenes only draw what it picks.

## Remaining for the first build

- The game data files, and the export to `shared/export/` that art's tools read.
- The settings page.
- Workers Builds deploys on push to `main`.
