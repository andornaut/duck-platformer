import type { Rect } from "../data/types";

interface OutlineStyle {
  readonly redWidth: number;
  readonly width: number;
}

interface OutlinePart {
  readonly band: "backing" | "colour";
  readonly rect: Rect;
}

// An inward rectangle border: the red band touches the collider edge, then its ink backing.
export function hazardOutline(style: OutlineStyle, box: Rect): readonly OutlinePart[] {
  const parts: OutlinePart[] = [];
  const border = (band: OutlinePart["band"], inset: number, requested: number) => {
    const x = box.x + inset;
    const y = box.y + inset;
    const width = Math.max(0, box.width - 2 * inset);
    const height = Math.max(0, box.height - 2 * inset);
    const thickness = Math.max(0, Math.min(requested, width / 2, height / 2));
    if (thickness === 0) {
      return;
    }
    parts.push(
      { band, rect: { height: thickness, width, x, y } },
      { band, rect: { height: thickness, width, x, y: y + height - thickness } },
      { band, rect: { height: height - 2 * thickness, width: thickness, x, y: y + thickness } },
      {
        band,
        rect: {
          height: height - 2 * thickness,
          width: thickness,
          x: x + width - thickness,
          y: y + thickness,
        },
      },
    );
  };
  border("colour", 0, style.redWidth);
  border("backing", style.redWidth, style.width - style.redWidth);
  return parts;
}
