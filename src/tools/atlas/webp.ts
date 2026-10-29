import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import decode, { init as initDecoder } from "@jsquash/webp/decode";
import encode, { init as initEncoder } from "@jsquash/webp/encode";

import type { RgbaImage } from "./atlasPixels";

// libwebp compiled to WebAssembly, the library cwebp wraps. Its modules fetch their WebAssembly
// by URL, which Node cannot, so each is compiled here and passed in. The encoder picks its SIMD
// build wherever WebAssembly has SIMD, as every Node release this repository runs on does.
const CODEC_DIR = join(
  dirname(createRequire(import.meta.url).resolve("@jsquash/webp/package.json")),
  "codec",
);

// The modules' init takes a compiled module first, which their types leave out.
type Init = (module: WebAssembly.Module) => Promise<unknown>;

let ready: Promise<unknown> | undefined;

function loadCodecs(): Promise<unknown> {
  const compile = async (path: string) =>
    WebAssembly.compile(await readFile(join(CODEC_DIR, path)));
  ready ??= Promise.all([
    compile("enc/webp_enc_simd.wasm").then((module) => (initEncoder as Init)(module)),
    compile("dec/webp_dec.wasm").then((module) => (initDecoder as Init)(module)),
  ]);
  return ready;
}

// image as a lossless WebP, as `cwebp -lossless -exact` writes it: every pixel kept, the colour
// of fully transparent ones included, at the slowest, smallest setting.
export async function encodeWebp({ data, height, width }: RgbaImage): Promise<Uint8Array> {
  await loadCodecs();
  const pixels = { data: new Uint8ClampedArray(data), height, width } as ImageData;
  return new Uint8Array(await encode(pixels, { exact: 1, lossless: 1, method: 6, quality: 100 }));
}

export async function decodeWebp(bytes: Uint8Array): Promise<RgbaImage> {
  await loadCodecs();
  const { data, height, width } = await decode(new Uint8Array(bytes).buffer);
  return { data: new Uint8Array(data), height, width };
}
