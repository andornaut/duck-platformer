// The zone a page starts on: ?zone=<n> names it, counting from 1; anything else, or a zone
// past the last, starts on the first. Returns its index.
export function startZoneIndex(search: string, count: number): number {
  const asked = Number(new URLSearchParams(search).get("zone"));
  return Number.isInteger(asked) && asked >= 1 && asked <= count ? asked - 1 : 0;
}

// The zone after the one at index: the next, or after the last, the first.
export function nextZoneIndex(index: number, count: number): number {
  return (index + 1) % count;
}
