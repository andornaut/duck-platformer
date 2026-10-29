import { createHash } from "node:crypto";

// Where a build writes the atlas pages: under the path the headers and the service worker treat
// as content-hashed build output.
const HASHED_ART_DIR = "assets/art";

// Vite's hash length, which the headers' check for an unhashed name expects.
const HASH_LENGTH = 8;

// The first HASH_LENGTH characters of the bytes' SHA-256, in URL-safe base64, as Vite hashes.
export function contentHash(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("base64url").slice(0, HASH_LENGTH);
}

// An atlas page's file name in the build output, with its content hash.
export function atlasPageFileName(page: number, extension: string, bytes: Uint8Array): string {
  return `${HASHED_ART_DIR}/atlas-${page}-${contentHash(bytes)}.${extension}`;
}
