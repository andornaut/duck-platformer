import type { DuckTuning, ZoneDeath, ZoneLayout } from "../data/types";
import { duckBox } from "../rules/duck";
import { STEP_SECONDS } from "../rules/step";
import { activateBehaviour, areaOf, retryZone, startZone, stepZone } from "../rules/zone";
import { proximityDialogue } from "../view/zoneDialogue";
import {
  botInput,
  type BotPolicy,
  type BotSkill,
  newBot,
  prepareSensors,
  type SensorIndex,
} from "./bot";

export interface SimulationConfig {
  readonly maxRetries: number;
  readonly maxSteps: number;
  readonly policy: BotPolicy;
  readonly seed: number;
  readonly skill: BotSkill;
}
export type RunStatus = "cleared" | "retry-budget" | "step-budget" | "turned-back";
export interface RunResult {
  readonly activeSeconds: number;
  readonly deaths: number;
  readonly deathsByReason: Readonly<Record<ZoneDeath["reason"], number>>;
  readonly dialogues: number;
  readonly peakProgress: number;
  readonly progress: number;
  readonly retries: number;
  readonly runtimeMs: number;
  readonly seed: number;
  readonly status: RunStatus;
  readonly steps: number;
}
export interface PreparedStage {
  readonly introductions: Readonly<Record<string, boolean>>;
  readonly layout: ZoneLayout;
  readonly sensors: SensorIndex;
}
export function prepareStage(layout: ZoneLayout): PreparedStage {
  return {
    introductions: Object.fromEntries(
      Object.entries(layout.areas).map(([key, area]) => [
        key,
        area.objects.some((object) => object.behaviour !== undefined && object.scene !== undefined),
      ]),
    ),
    layout,
    sensors: prepareSensors(layout),
  };
}

export function validateSimulation(config: SimulationConfig): void {
  for (const [name, value, min] of [
    ["maxSteps", config.maxSteps, 1],
    ["maxRetries", config.maxRetries, 0],
    ["seed", config.seed, 0],
    ["reactionTicks", config.skill.reactionTicks, 0],
    ["jumpHoldTicks", config.skill.jumpHoldTicks, 1],
  ] as const) {
    if (!Number.isSafeInteger(value) || value < min) {
      throw new Error(`Invalid ${name}`);
    }
  }
  if (
    config.seed > 0xffffffff ||
    !Number.isFinite(config.skill.lookAheadPx) ||
    config.skill.lookAheadPx <= 0 ||
    !Number.isFinite(config.skill.errorRate) ||
    config.skill.errorRate < 0 ||
    config.skill.errorRate > 1
  ) {
    throw new Error("Invalid bot skill or seed");
  }
  if (
    !["continuous", "never", "reactive"].includes(config.policy.jump) ||
    ![-1, 0, 1].includes(config.policy.move)
  ) {
    throw new Error("Invalid bot policy");
  }
}

// Runs the actual fixed-step rules. UI-only conversations are acknowledged at their real
// proximity; presentation and retry-card waits consume no active time or physics steps.
export function simulateStage(
  tuning: DuckTuning,
  stage: PreparedStage,
  config: SimulationConfig,
): RunResult {
  validateSimulation(config);
  const started = performance.now();
  const { layout, sensors } = stage;
  let zone = startZone(tuning, layout, config.seed);
  let bot = newBot(config.seed);
  const heard = new Set<number>();
  let previousArea = zone.area;
  let steps = 0;
  let retries = 0;
  let dialogues = 0;
  let progress = 0;
  let peakProgress = 0;
  const deathsByReason = { crush: 0, fall: 0, hazard: 0 };
  let status: RunStatus = "step-budget";
  while (steps < config.maxSteps) {
    if (zone.area !== previousArea) {
      heard.clear();
      previousArea = zone.area;
    }
    const area = areaOf(layout, zone.area);
    const introduction = stage.introductions[zone.area]
      ? proximityDialogue(area.objects, zone.objects, heard, duckBox(tuning, zone.duck))
      : undefined;
    if (introduction !== undefined) {
      heard.add(introduction);
      dialogues++;
      zone = activateBehaviour(introduction, zone);
      bot.holding = 0;
    }
    // Closing a conversation clears held controls before the bot acts again.
    const input =
      introduction === undefined
        ? botInput(tuning, sensors, layout, config.skill, config.policy, zone, bot)
        : { jumpHeld: false, move: 0 as const, useHeld: false };
    zone = stepZone(tuning, layout, STEP_SECONDS, input, zone);
    steps++;
    progress = Math.max(
      0,
      Math.min(1, (zone.duck.x + tuning.width - area.backX) / (area.exitX - area.backX)),
    );
    peakProgress = Math.max(peakProgress, progress);
    if (zone.cleared) {
      status = "cleared";
      break;
    }
    if (zone.turnedBack) {
      status = "turned-back";
      break;
    }
    if (zone.death !== undefined) {
      deathsByReason[zone.death.reason]++;
      if (retries >= config.maxRetries) {
        status = "retry-budget";
        break;
      }
      // A retry consumes no tick. If no tick remains, retain the final failed-attempt progress.
      if (steps === config.maxSteps) {
        break;
      }
      zone = retryZone(tuning, layout, zone);
      retries++;
      heard.clear();
      bot = newBot(config.seed + retries);
    }
  }
  return {
    activeSeconds: steps * STEP_SECONDS,
    deaths: deathsByReason.crush + deathsByReason.fall + deathsByReason.hazard,
    deathsByReason,
    dialogues,
    peakProgress,
    progress,
    retries,
    runtimeMs: performance.now() - started,
    seed: config.seed,
    status,
    steps,
  };
}
