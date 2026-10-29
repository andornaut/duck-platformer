// Prints the duck's measured reaches beside gameplay's targets: npm run reaches.
import { DUCK } from "../data/duck";
import { REACH } from "../data/reach";
import { TILE } from "../data/screen";
import { measureReaches, type Reach } from "./reach";

const measured = measureReaches(DUCK, TILE);
for (const reach of Object.keys(REACH) as Reach[]) {
  const verdict = measured[reach] === REACH[reach] ? "ok" : "off";
  console.log(`${reach}: ${measured[reach]} tiles, target ${REACH[reach]} (${verdict})`);
}
