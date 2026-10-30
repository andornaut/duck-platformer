import type { MapEdge, MapNode, ZoneMap } from "../data/types";

export function nodeOf(map: ZoneMap, id: string): MapNode {
  const node = map.nodes.find((each) => each.id === id);
  if (!node) {
    throw new Error(`No map node ${id}`);
  }
  return node;
}

// The paths on from a node, built or not, each with the node it leads to.
export function pathsFrom(map: ZoneMap, at: string): { edge: MapEdge; node: MapNode }[] {
  return map.edges
    .filter((edge) => edge.from === at)
    .map((edge) => ({ edge, node: nodeOf(map, edge.to) }));
}

// The map as far as she has opened it: the nodes she has reached (zones and forks), the zone
// nodes among them she may stand on and play, in the map's node order, and the paths between
// reached nodes that she has opened.
export interface OpenMap {
  readonly edges: readonly MapEdge[];
  readonly reached: ReadonlySet<string>;
  readonly zones: readonly string[];
}

// What the zones she has completed open: from the map's start along built paths, through forks,
// to each zone node with a zone to play; on past a zone node only once she has completed it.
// Unbuilt paths, and zone nodes with no zone yet, stay closed. The finish leads nowhere.
export function openMap(map: ZoneMap, completed: ReadonlySet<string>): OpenMap {
  const reached = new Set([map.start]);
  const edges: MapEdge[] = [];
  const queue = [map.start];
  for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
    const node = nodeOf(map, id);
    if (node.kind === "zone" && !completed.has(id)) {
      continue;
    }
    for (const { edge, node: next } of pathsFrom(map, id)) {
      if (!edge.built || (next.kind === "zone" && next.zone === undefined)) {
        continue;
      }
      edges.push(edge);
      if (!reached.has(next.id)) {
        reached.add(next.id);
        queue.push(next.id);
      }
    }
  }
  const zones = map.nodes
    .filter((node) => node.kind === "zone" && node.zone !== undefined && reached.has(node.id))
    .map((node) => node.id);
  return { edges, reached, zones };
}

// Whether the zone node id is a last zone: a built path from it leads on to the map's finish,
// through forks but no other zone.
export function isLastZone(map: ZoneMap, id: string): boolean {
  const seen = new Set<string>();
  const queue = [id];
  for (let at = queue.shift(); at !== undefined; at = queue.shift()) {
    for (const { edge, node } of pathsFrom(map, at)) {
      if (!edge.built || seen.has(node.id)) {
        continue;
      }
      if (node.id === map.finish) {
        return true;
      }
      seen.add(node.id);
      if (node.kind === "fork") {
        queue.push(node.id);
      }
    }
  }
  return false;
}
