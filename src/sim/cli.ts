import { writeFileSync } from "node:fs";

import { DUCK } from "../data/duck";
import { ZONE_MAP } from "../data/map";
import { DIAGNOSTIC_SKILL, FORWARD_POLICY, type JumpPolicy } from "./bot";
import { stageLoader } from "./catalogue";
import { simulateBatch } from "./report";
import { validateSimulation } from "./simulate";

const HELP = `npm run simulate -- [--stage ID] [--seed N] [--runs N] [--max-steps N]
  [--max-retries N] [--reaction-ticks N] [--look-ahead PX] [--hold-ticks N]
  [--error-rate 0..1] [--jump reactive|continuous|never] [--move -1|0|1] [--out FILE]

Defaults: first map stage, seed 1, one run, 3600 total ticks/run, zero retries.
Bot defaults are mechanical diagnostic settings, not calibrated human skills.
Consecutive seeds select both assembled layouts and motion; bot randomness is separate.
Output is JSON with per-run and aggregate metrics. Runtime includes no rendering.
Only run bounded batches in the project container; coordinate larger batches with gameplay.`;

function main(args: readonly string[]): void {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(HELP);
    return;
  }
  let stage = ZONE_MAP.start;
  let seed = 1;
  let runs = 1;
  let maxSteps = 3600;
  let maxRetries = 0;
  let out: string | undefined;
  const skill = { ...DIAGNOSTIC_SKILL };
  const policy = { ...FORWARD_POLICY };
  for (let at = 0; at < args.length; at += 2) {
    const flag = args[at];
    const value = args[at + 1];
    if (value === undefined || value.trim() === "") {
      throw new Error(`${flag} needs a value`);
    }
    switch (flag) {
      case "--stage":
        stage = value;
        break;
      case "--seed":
        seed = Number(value);
        break;
      case "--runs":
        runs = Number(value);
        break;
      case "--max-steps":
        maxSteps = Number(value);
        break;
      case "--max-retries":
        maxRetries = Number(value);
        break;
      case "--reaction-ticks":
        skill.reactionTicks = Number(value);
        break;
      case "--look-ahead":
        skill.lookAheadPx = Number(value);
        break;
      case "--hold-ticks":
        skill.jumpHoldTicks = Number(value);
        break;
      case "--error-rate":
        skill.errorRate = Number(value);
        break;
      case "--jump":
        policy.jump = value as JumpPolicy;
        break;
      case "--move":
        policy.move = Number(value) as -1 | 0 | 1;
        break;
      case "--out":
        out = value;
        break;
      default:
        throw new Error(`Unknown option ${flag}`);
    }
  }
  if (!Number.isSafeInteger(runs) || runs < 1 || runs > 10000 || seed + runs - 1 > 0xffffffff) {
    throw new Error("Invalid runs or seed range");
  }
  validateSimulation({ maxRetries, maxSteps, policy, seed, skill });
  const started = performance.now();
  const prepare = stageLoader(stage);
  const result = simulateBatch(
    DUCK,
    prepare,
    { maxRetries, maxSteps, policy, skill },
    Array.from({ length: runs }, (_, index) => seed + index),
  );
  const report = {
    config: { maxRetries, maxSteps, policy, runs, seed, skill, stage },
    ...result,
    totalRuntimeMs: performance.now() - started,
  };
  const json = `${JSON.stringify(report, null, 2)}\n`;
  console.log(json.trimEnd());
  if (out !== undefined) {
    writeFileSync(out, json);
  }
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
