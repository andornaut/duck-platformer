# Tech Plan

## Platform and delivery

- **Stack:** Phaser 4, TypeScript and Vite.
- **Hosting:** Cloudflare Workers static assets, no Worker script (`wrangler.jsonc`).
- **Targets:** landscape phone browsers with on-screen touch controls, and desktop browsers with a keyboard.
- **Tooling:** Node 24, Vitest, ESLint with the shared house rules, Prettier, markdownlint, husky + lint-staged, Dependabot, and the Test and AI attributions workflows.

## Architecture

- **Phaser boundary:** only `src/scenes/` and `src/main.ts` import Phaser or a scene, enforced by ESLint's `no-restricted-imports`. Logic, layout and data are Phaser-free, so they unit-test without a renderer.
- **Test helpers:** `src/testing/` is importable only from tests.
- **Scenes:** `BootScene` runs first: it loads everything `public/art/manifest.json` lists and makes an animation of each sprite tag, keyed `<sprite>:<tag>`, with the tag's frames and durations from the sprite's Aseprite export.
- **View:** `src/view/` picks each sprite's tag and whole-pixel position from the game state, Phaser-free, so the scenes only draw what it picks.

## Remaining for the first build

- The base resolution and integer zoom, once art sets the base resolution.
- The game data files, and the export to `shared/export/` that art's tools read.
- The shared kit, vendored at `vendor/game-kit/`.
- Touch controls, keyboard input and the settings page.
- Workers Builds deploys on push to `main`.
