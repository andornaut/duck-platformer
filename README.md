# Duck Platformer

[![Test](https://github.com/andornaut/duck-platformer/actions/workflows/test.yml/badge.svg)](https://github.com/andornaut/duck-platformer/actions/workflows/test.yml)

A pixel-art platformer for landscape phone browsers and desktop: a duck falls out of her apartment at the top of a high-rise and climbs back up through the building, floor by floor. Built with [Phaser](https://phaser.io/) and TypeScript, and served as static files from [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/).

## Docs

Each folder's README is its plan, with what's left for the first build:

- [art/](art/README.md): art rules, assets and pipeline
- [src/](src/README.md): stack and architecture

## Developing

Requires Node 24 (`.nvmrc`).

The site's HTML pages are in `pages/`, each at its URL's path (`pages/index.html` is `/`, the home page, and `pages/play/index.html` is `/play/`, the game).

```bash
npm install

# Dev server
npm run dev

# Type check with tsc
npm run check

# Prettier check, ESLint and markdownlint
npm run lint

# Rewrite files with Prettier and apply ESLint fixes
npm run format

# Run the unit tests
npm test

# Build to dist/
npm run build

# Build, then serve it through wrangler dev
npm run preview

# Remove build and Wrangler state
npm run clean
```

## Deploying

To deploy by hand, to the account pinned by `account_id` in `wrangler.jsonc`:

```bash
npx wrangler login
npm run deploy
```

To serve a custom domain, add a `routes` entry to `wrangler.jsonc`.
