# Tech Plan

## Platform and delivery

- **Stack:** Phaser 4, TypeScript and Vite.
- **Hosting:** Cloudflare Workers static assets, no Worker script (`wrangler.jsonc`).
- **Targets:** landscape phone browsers with on-screen touch controls, and desktop browsers with a keyboard.
- **Tooling:** Node 24, Vitest, ESLint with the shared house rules, Prettier, markdownlint, husky + lint-staged, Dependabot, and the Test and AI attributions workflows.

## Architecture

- **Phaser boundary:** only `src/scenes/` and `src/main.ts` import Phaser or a scene, enforced by ESLint's `no-restricted-imports`. Logic, layout and data are Phaser-free, so they unit-test without a renderer.
- **Test helpers:** `src/testing/` is importable only from tests.
- **Scenes:** `BootScene` runs first.

## Remaining for the first build

- The base resolution and integer zoom, once art sets the base resolution.
- The game data files, and the export to `shared/export/` that art's tools read.
- The served art directory, `public/art/`, and loading it.
- The shared kit, vendored at `vendor/game-kit/`.
- Touch controls, keyboard input and the settings page.
- Workers Builds deploys on push to `main`.
