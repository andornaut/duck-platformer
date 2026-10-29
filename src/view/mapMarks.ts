import type { BitmapFont } from "@andornaut/game-kit/text/bitmapFont";

import type { MapEdge, MapNode, Point, ZoneMap } from "../data/types";
import type { PathLook } from "../layout/mapScreen";
import type { MapRoute, MapStand } from "../rules/map";

export type MarkerState = "current" | "normal" | "unbuilt" | "visited";

// A node's centre on the map, on its grid of tile px tiles.
export function nodeCentre(tile: number, node: MapNode): Point {
  return { x: node.at.col * tile + tile / 2, y: node.at.row * tile + tile / 2 };
}

// A node's marker: unbuilt where no built path touches it; else current where she stands,
// visited where she has walked this lap, and normal elsewhere.
export function markerState(map: ZoneMap, stand: MapStand, node: MapNode): MarkerState {
  if (!map.edges.some((edge) => edge.built && (edge.from === node.id || edge.to === node.id))) {
    return "unbuilt";
  }
  if (node.id === stand.at) {
    return "current";
  }
  return stand.walked.includes(node.id) ? "visited" : "normal";
}

// The node a route on goes to first from where she stands.
export function firstStep(route: MapRoute): string {
  return route.via[0] ?? route.zone.id;
}

// Whether she chooses among the routes on where she stands: where more than one leads on.
export function choosing(stand: MapStand): boolean {
  return stand.routes.length > 1;
}

// A path's look: unbuilt, or travelled where she walked it this lap; where she chooses, the path
// from her to each route's first step selectable, the chosen route's selected; else built.
export function pathLook(stand: MapStand, chosen: number, edge: MapEdge): PathLook {
  if (!edge.built) {
    return "unbuilt";
  }
  const walked = stand.walked.some((id, i) => id === edge.from && stand.walked[i + 1] === edge.to);
  if (walked) {
    return "travelled";
  }
  if (choosing(stand) && edge.from === stand.at) {
    const route = stand.routes[chosen];
    if (route && firstStep(route) === edge.to) {
      return "selected";
    }
    if (stand.routes.some((each) => firstStep(each) === edge.to)) {
      return "selectable";
    }
  }
  return "built";
}

// The fork-choice arrow for a path leaving one node for the next: up when the next is on a row
// above, down when below, else level.
export function forkArrow(from: MapNode, to: MapNode): "down" | "level" | "up" {
  if (to.at.row < from.at.row) {
    return "up";
  }
  return to.at.row > from.at.row ? "down" : "level";
}

// How far line moves the pen in font at scale: each glyph's advance and the kerning between
// pairs, in screen pixels.
export function advanceWidth(font: BitmapFont, scale: number, line: string): number {
  let width = 0;
  let previous: string | null = null;
  for (const char of line) {
    const glyph = font.glyphs.get(char);
    if (glyph === undefined) {
      continue;
    }
    width += glyph.advance + (previous === null ? 0 : (font.kernings.get(previous + char) ?? 0));
    previous = char;
  }
  return width * scale;
}
