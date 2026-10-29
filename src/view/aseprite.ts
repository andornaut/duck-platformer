// Art's sprites, as public/art/manifest.json lists them and Aseprite exports them.

export interface ArtManifest {
  readonly data: readonly { readonly json: string; readonly key: string }[];
  readonly fonts: readonly { readonly fnt: string; readonly key: string; readonly png: string }[];
  readonly sprites: readonly {
    readonly json: string;
    readonly key: string;
    readonly png: string;
  }[];
}

// An Aseprite json-hash export: frames in sheet order, and the tags that name runs of them.
export interface AsepriteSheet {
  readonly frames: Readonly<Record<string, { readonly duration: number }>>;
  readonly meta: {
    readonly frameTags: readonly {
      readonly direction: string;
      readonly from: number;
      readonly name: string;
      readonly to: number;
    }[];
  };
}

export interface TagFrame {
  // The frame's name in the sheet, which is its texture frame name.
  readonly frame: string;
  readonly ms: number;
}

// Each tag's frames, in play order.
export function sheetTags(sheet: AsepriteSheet): ReadonlyMap<string, readonly TagFrame[]> {
  const frames = Object.entries(sheet.frames).map(([frame, { duration }]) => ({
    frame,
    ms: duration,
  }));
  return new Map(
    sheet.meta.frameTags.map((tag) => {
      if (tag.direction !== "forward") {
        throw new Error(`Tag ${tag.name} plays ${tag.direction}: only forward is supported`);
      }
      return [tag.name, frames.slice(tag.from, tag.to + 1)];
    }),
  );
}

// How long one play of a tag lasts.
export function tagMs(tags: ReadonlyMap<string, readonly TagFrame[]>, tag: string): number {
  const frames = tags.get(tag);
  if (!frames) {
    throw new Error(`No tag ${tag}`);
  }
  return frames.reduce((sum, frame) => sum + frame.ms, 0);
}

// The animation key of a sprite's tag: tag names repeat across sprites.
export function animKey(sprite: string, tag: string): string {
  return `${sprite}:${tag}`;
}
