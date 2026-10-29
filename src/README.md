# Tech Plan

## Platform and delivery

- **Stack:** Phaser 4, TypeScript and Vite.
- **Hosting:** Cloudflare Workers static assets, no Worker script (`wrangler.jsonc`).
- **Targets:** landscape phone browsers with on-screen touch controls, and desktop browsers with a keyboard.
- **Tooling:** Node 24, Vitest, ESLint with the shared house rules, Prettier, markdownlint, husky + lint-staged, Dependabot, and the Test and AI attributions workflows.

## Architecture

- **Game data:** `src/data/types.ts` holds the shapes; every other file in `src/data/` holds gameplay's values, with the words the player reads in `text.ts`.
- **Phaser boundary:** only `src/scenes/` and `src/main.ts` import Phaser or a scene, enforced by ESLint's `no-restricted-imports`. Logic, layout and data are Phaser-free, so they unit-test without a renderer.
- **Scenes:** `BootScene` runs first: it loads everything `public/art/manifest.json` lists and makes an animation of each sprite tag, keyed `<sprite>:<tag>`, with the tag's frames and durations from the sprite's Aseprite export. A tag the sprite's manifest entry lists in `once` plays once and holds its last frame; every other tag loops.
- **Shared kit:** `@andornaut/game-kit` is a committed copy at `vendor/game-kit/`, synced by game-kit's `scripts/sync-into.sh` with its source commit in `vendor/game-kit/KIT_COMMIT`, and changed only at its source.
- **Test helpers:** `src/testing/` is importable only from tests.
- **View:** `src/view/` picks each sprite's tag and whole-pixel position from the game state, Phaser-free, so the scenes only draw what it picks.

## Remaining for the first build

- The game data files, and the export to `shared/export/` that art's tools read.
- The settings page.
- Workers Builds deploys on push to `main`.
