// The level a page starts on: ?level=<n> names it, counting from 1; anything else, or a level
// past the last, starts on the first. Returns its index.
export function startLevelIndex(search: string, count: number): number {
  const asked = Number(new URLSearchParams(search).get("level"));
  return Number.isInteger(asked) && asked >= 1 && asked <= count ? asked - 1 : 0;
}

// The level after the one at index: the next, or after the last, the first.
export function nextLevelIndex(index: number, count: number): number {
  return (index + 1) % count;
}
