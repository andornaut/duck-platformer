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

// A way on from a node to a zone she may play next, along built paths: the forks it passes,
// then the finish where it leads past the finish to the start, and that zone.
export interface MapRoute {
  readonly via: readonly string[];
  readonly zone: MapNode;
}

// The ways on from a node: along built paths, through forks, to each next zone node, and past
// the finish to the start. In path order, one to each zone.
export function routesOn(map: ZoneMap, at: string): MapRoute[] {
  const routes: MapRoute[] = [];
  const seen = new Set<string>();
  const follow = (id: string, via: readonly string[]) => {
    for (const { edge, node } of pathsFrom(map, id)) {
      if (!edge.built || seen.has(node.id)) {
        continue;
      }
      seen.add(node.id);
      if (node.id === map.finish) {
        const start = nodeOf(map, map.start);
        if (!routes.some((route) => route.zone === start)) {
          routes.push({ via: [...via, node.id], zone: start });
        }
      } else if (node.kind === "zone") {
        routes.push({ via, zone: node });
      } else {
        follow(node.id, [...via, node.id]);
      }
    }
  };
  follow(at, []);
  return routes;
}

// Where she stands on the map: the node (at), the nodes she has walked this lap in order, ending
// there, and the routes on from there, each via only the forks past it.
export interface MapStand {
  readonly at: string;
  readonly routes: readonly MapRoute[];
  readonly walked: readonly string[];
}

// Where she stands, from the nodes she has walked this lap (route, ending at the node she is
// at) and whether she has played that node. Before she plays it, she stands on it with no route
// on. After, where routes on split further along, she walks the forks they share and stands on
// the last of them; where they split at once, or one or none leads on, she stays.
export function mapStand(map: ZoneMap, played: boolean, route: readonly string[]): MapStand {
  const at = route.at(-1) ?? map.start;
  const walked = route.length === 0 ? [at] : route;
  if (!played) {
    return { at, routes: [], walked };
  }
  const routes = routesOn(map, at);
  const [first, ...rest] = routes.map((each) => each.via);
  let shared = 0;
  while (
    rest.length > 0 &&
    first?.[shared] !== undefined &&
    rest.every((via) => via[shared] === first[shared])
  ) {
    shared++;
  }
  const forks = first?.slice(0, shared) ?? [];
  return {
    at: forks.at(-1) ?? at,
    routes: routes.map((each) => ({ ...each, via: each.via.slice(shared) })),
    walked: [...walked, ...forks],
  };
}

// Whether taking route on starts a new lap: it passes the finish.
export function startsLap(map: ZoneMap, route: MapRoute): boolean {
  return route.via.includes(map.finish);
}

// The nodes she has walked this lap once she takes a route on from where she stands, ending at
// its zone; past the finish, a new lap from the start.
export function walkOn(map: ZoneMap, stand: MapStand, route: MapRoute): string[] {
  if (startsLap(map, route)) {
    return [map.start];
  }
  return [...stand.walked, ...route.via, route.zone.id];
}
