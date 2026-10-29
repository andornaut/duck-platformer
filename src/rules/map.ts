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

// The zones she may go on to from a node: along built paths, through forks, to each next zone
// node, and past the finish to the start. In path order, each once.
export function nextChoices(map: ZoneMap, at: string): MapNode[] {
  const choices: MapNode[] = [];
  const seen = new Set<string>();
  const follow = (id: string) => {
    for (const { edge, node } of pathsFrom(map, id)) {
      if (!edge.built || seen.has(node.id)) {
        continue;
      }
      seen.add(node.id);
      if (node.id === map.finish) {
        const start = nodeOf(map, map.start);
        if (!choices.includes(start)) {
          choices.push(start);
        }
      } else if (node.kind === "zone") {
        choices.push(node);
      } else {
        follow(node.id);
      }
    }
  };
  follow(at);
  return choices;
}

// Where she goes next from a node: the chosen zone among its next choices, else the first; or
// undefined when no built path leads on.
export function nextZoneNode(map: ZoneMap, at: string, chosen?: string): MapNode | undefined {
  const choices = nextChoices(map, at);
  return choices.find(({ id }) => id === chosen) ?? choices[0];
}
