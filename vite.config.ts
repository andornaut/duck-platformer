// Node types for this config file only, so browser code type-checks without Node globals.
/// <reference types="node" />

import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

// An absolute path in this repository. Vite resolves relative paths against root, which is
// pages/, so every path below goes through here instead.
function repoPath(path: string): string {
  return resolve(import.meta.dirname, path);
}

export default defineConfig({
  build: {
    // Outside root, so Vite would leave the previous build's files in place without emptyOutDir.
    emptyOutDir: true,
    outDir: repoPath("dist"),
    // Each page's path under pages/ is its URL. public/ is copied as-is.
    rolldownOptions: {
      input: {
        main: repoPath("pages/index.html"),
      },
    },
    // Phaser alone is about 1.4 MB minified, so the 500 kB default always warns.
    // Set just above it so that growth in game code still warns.
    chunkSizeWarningLimit: 1600,
  },
  // The container name the Playwright MCP reaches the dev or preview server by,
  // over the playwright-mcp Docker network. Vite rejects any other Host header.
  preview: {
    allowedHosts: ["duck-preview"],
  },
  publicDir: repoPath("public"),
  // The pages load their modules as /src/..., which names the repository's src/ rather than
  // pages/src/.
  resolve: {
    alias: { "/src": repoPath("src") },
  },
  root: repoPath("pages"),
  server: {
    allowedHosts: ["duck-preview"],
    // The dev server serves src/ and node_modules/ from outside root, as /@fs/ URLs.
    fs: { allow: [repoPath(".")] },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // No tests exist until the first game module does.
    passWithNoTests: true,
    root: repoPath("."),
  },
});
