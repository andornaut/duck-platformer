# Tech Plan

## Platform and delivery

- **Stack:** Phaser 4, TypeScript and Vite.
- **Hosting:** Cloudflare Workers static assets, no Worker script (`wrangler.jsonc`).
- **Targets:** landscape phone browsers with on-screen touch controls, and desktop browsers with a keyboard.
- **Tooling:** Node 24, Vitest, ESLint with the shared house rules, Prettier, markdownlint, husky + lint-staged, Dependabot, and the Test and AI attributions workflows.

## Architecture

- **Back:** `src/pwa/backNavigation.ts` catches back, in a browser tab and the installed app, with a CloseWatcher where the browser has one and otherwise a guard history entry pushed from the player's first key or tap, and dispatches `back-pressed` on window for `PauseScene`. Quit goes back past the game to the page before it, or with none closes the window where the browser allows it. Firefox for Android's installed app keeps the browser's own back.
- **Crash screen:** `src/main.ts` first imports `src/crash/install.ts`, which installs the kit's crash screen in art's palette with the words in `src/data/text.ts`; it pauses the game on the first uncaught error. `?dev=1` adds the error's details. The build label's version and commit come from Vite's `define` in `vite.config.ts`, the commit reading `dev` without git.
- **Game data:** `src/data/types.ts` holds the shapes; every other file in `src/data/` holds gameplay's values, with the words the player reads in `text.ts`.
- **Installed app:** the home page's Install button (`src/homePage/main.ts`, on the kit's install flow) shows the browser's install prompt, or the steps for a browser that installs only from its own menu (iOS, Firefox for Android), and hides once installed. The web app manifest starts the app on `/play/`, which the service worker precaches, full screen and locked to landscape. In the app the game page has no nav bar, so no link leaves the game. The game page shows the build label in its top right corner. The screen stays on during play, and sleeps as usual while the pause card is open or the page is hidden; the installed app asks the browser once per launch to keep its storage.
- **Levels:** a level is played from its `LevelPlan` in tiles (`src/data/types.ts`), converted once to pixels for the rules. The test levels in `src/data/levels.ts` play in order and loop; `?level=<n>` (from 1) starts at one. Moving platforms are placed by the time since the level started, so a restart replays them.
- **Offline play:** the build writes `/sw.js` (the kit's service worker with `src/pwa/cachePolicy.ts`), precaching `/play/`, what it loads and links, and every file art's manifest lists. `src/pwa/` registers it in production; a newer version takes over before the player interacts, and after that the page's "Update available" toast offers it. It checks on each load and whenever the page comes back into view, at most once a minute.
- **Pause card:** `PauseScene` runs beside `LevelScene` and draws over it: the pause button in the top-left corner, and the card (`src/layout/pauseCard.ts`) that it, P, Escape and back open. The card pauses the level over a dim of it read back from the canvas and redrawn two steps down each colour's ramp (palette.json's `dim2`, `src/view/dim.ts`), read once with the touch buttons hidden and once shown so the Touch controls row updates the view behind the card. Resume, the close X, P, Escape and back close it; Quit leaves the game. The Touch controls setting is kept in `localStorage` (`src/settings/touchControls.ts`).
- **Phaser boundary:** only `src/scenes/` and `src/main.ts` import Phaser or a scene, enforced by ESLint's `no-restricted-imports`. Logic, layout and data are Phaser-free, so they unit-test without a renderer.
- **Scenes:** `BootScene` runs first: it loads everything `public/art/manifest.json` lists and makes an animation of each sprite tag, keyed `<sprite>:<tag>`, with the tag's frames and durations from the sprite's Aseprite export. A tag the sprite's manifest entry lists in `once` plays once and holds its last frame; every other tag loops.
- **Security headers:** the build writes `dist/_headers` from `src/headers/securityPolicy.ts`: a Content-Security-Policy per page with its inline blocks hashed, and a year's caching for hashed build output under `/assets/`.
- **Shared kit:** `@andornaut/game-kit` is a committed copy at `vendor/game-kit/`, synced by game-kit's `scripts/sync-into.sh` with its source commit in `vendor/game-kit/KIT_COMMIT`, and changed only at its source.
- **Test helpers:** `src/testing/` is importable only from tests.
- **View:** `src/view/` picks each sprite's tag and whole-pixel position from the game state, Phaser-free, so the scenes only draw what it picks.

## Remaining for the first build

- The game data files, and the export to `shared/export/` that art's tools read.
- Workers Builds deploys on push to `main`.
