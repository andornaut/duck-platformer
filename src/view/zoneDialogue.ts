import type { ObjectLayout, Point, Rect } from "../data/types";

// The first object with a behaviour and introduction she is close enough to hear this attempt.
export function proximityDialogue(
  objects: readonly ObjectLayout[],
  positions: readonly Point[],
  heard: ReadonlySet<number>,
  duck: Rect,
): number | undefined {
  const centre = { x: duck.x + duck.width / 2, y: duck.y + duck.height / 2 };
  const index = objects.findIndex((object, index) => {
    const at = positions[index];
    return (
      object.behaviour !== undefined &&
      object.scene !== undefined &&
      !heard.has(index) &&
      at !== undefined &&
      Math.hypot(at.x + object.width / 2 - centre.x, at.y + object.height / 2 - centre.y) <=
        object.interaction.range
    );
  });
  return index < 0 ? undefined : index;
}
