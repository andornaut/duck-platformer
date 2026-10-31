import type { ZoneMap } from "../data/types";
import { destinationForLevel } from "../rules/mapDestinations";

export const ZONE_THEMES_KEY = "zone-themes";
export type ZoneThemes = Readonly<Record<string, { readonly primary: string }>>;

// Debug levels outside the catalogue inherit the starting destination's theme. Role names
// come from art's data and resolve through the ordinary palette at the rendering boundary.
export function zoneTheme(
  map: ZoneMap,
  themes: ZoneThemes,
  levelId: string,
): { readonly primary: string } {
  const known = map.nodes.some(({ id, kind }) => id === levelId && kind === "zone");
  const destination = destinationForLevel(map, known ? levelId : map.start);
  const theme = themes?.[destination.id];
  if (typeof theme?.primary !== "string" || theme.primary.length === 0) {
    throw new Error(`Missing primary theme for ${destination.id}`);
  }
  return theme;
}
