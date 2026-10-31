import { type Random, randomStream } from "@andornaut/game-kit/random";

import type { DuckTuning, Rect, ZoneLayout } from "../data/types";
import { contactBox } from "../rules/behaviour";
import type { ZoneInput, ZoneState } from "../rules/zone";

export interface BotSkill {
  readonly errorRate: number;
  readonly jumpHoldTicks: number;
  readonly lookAheadPx: number;
  readonly reactionTicks: number;
}
export type JumpPolicy = "continuous" | "never" | "reactive";
export interface BotPolicy {
  readonly jump: JumpPolicy;
  readonly move: -1 | 0 | 1;
}

// Mechanical diagnostic settings, not a calibrated model of human play.
export const DIAGNOSTIC_SKILL: BotSkill = {
  errorRate: 0,
  jumpHoldTicks: 24,
  lookAheadPx: 48,
  reactionTicks: 0,
};
export const FORWARD_POLICY: BotPolicy = { jump: "reactive", move: 1 };
const CELL = 128;
export interface SensorIndex {
  readonly areas: Readonly<Record<string, ReadonlyMap<number, readonly Rect[]>>>;
  readonly objects: Readonly<Record<string, readonly number[]>>;
}

export function prepareSensors(layout: ZoneLayout): SensorIndex {
  return {
    areas: Object.fromEntries(
      Object.entries(layout.areas).map(([key, area]) => {
        const cells = new Map<number, Rect[]>();
        for (const rect of area.solids) {
          for (
            let cell = Math.floor(rect.x / CELL);
            cell <= Math.floor((rect.x + rect.width) / CELL);
            cell++
          ) {
            const bucket = cells.get(cell);
            if (bucket) {
              bucket.push(rect);
            } else {
              cells.set(cell, [rect]);
            }
          }
        }
        return [key, cells];
      }),
    ),
    objects: Object.fromEntries(
      Object.entries(layout.areas).map(([key, area]) => [
        key,
        area.objects.flatMap((object, index) => (object.collision === "none" ? [] : [index])),
      ]),
    ),
  };
}

export interface Bot {
  readonly random: Random;
  holding: number;
  noticed: number;
}
export function newBot(seed: number): Bot {
  return { holding: 0, noticed: 0, random: randomStream(seed, "simulation-bot") };
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

// Local probes only. Static terrain is indexed once; moving objects use the real current poses.
function obstacleAhead(
  tuning: DuckTuning,
  sensors: SensorIndex,
  layout: ZoneLayout,
  skill: BotSkill,
  direction: -1 | 1,
  zone: ZoneState,
): boolean {
  const duck = zone.duck;
  const front = direction === 1 ? duck.x + tuning.width : duck.x;
  const target = front + direction * skill.lookAheadPx;
  const probe = {
    height: tuning.height - 1,
    width: skill.lookAheadPx,
    x: Math.min(front, target),
    y: duck.y,
  };
  const foot = {
    height: 2,
    width: tuning.width,
    x: target - tuning.width / 2,
    y: duck.y + tuning.height,
  };
  let supported = false;
  const cells = sensors.areas[zone.area];
  const first = Math.floor(Math.min(probe.x, foot.x) / CELL);
  const last = Math.floor(Math.max(probe.x + probe.width, foot.x + foot.width) / CELL);
  for (let cell = first; cell <= last; cell++) {
    for (const rect of cells?.get(cell) ?? []) {
      if (intersects(probe, rect)) {
        return true;
      }
      supported ||= intersects(foot, rect);
    }
  }
  const area = layout.areas[zone.area];
  if (!area) {
    throw new Error(`Missing area ${zone.area}`);
  }
  for (const index of sensors.objects[zone.area] ?? []) {
    const object = area.objects[index];
    if (!object || object.collision === "none") {
      continue;
    }
    const at = zone.objects[index] ?? object.origin;
    const rect =
      object.collision === "hazard"
        ? contactBox(object, at, zone.behaviours[index]?.facing ?? 1)
        : { ...at, height: object.height, width: object.width };
    if (
      (object.collision === "hazard" || object.collision === "solid") &&
      intersects(probe, rect)
    ) {
      return true;
    }
    if (object.collision === "solid" || object.collision === "ledge") {
      supported ||= intersects(foot, rect);
    }
  }
  return !supported;
}

export function botInput(
  tuning: DuckTuning,
  sensors: SensorIndex,
  layout: ZoneLayout,
  skill: BotSkill,
  policy: BotPolicy,
  zone: ZoneState,
  bot: Bot,
): ZoneInput {
  if (bot.holding > 0) {
    bot.holding--;
    return { jumpHeld: true, move: policy.move, useHeld: false };
  }
  const obstacle =
    policy.move !== 0 &&
    (policy.jump === "continuous" ||
      (policy.jump === "reactive" &&
        obstacleAhead(tuning, sensors, layout, skill, policy.move, zone)));
  bot.noticed = obstacle ? bot.noticed + 1 : 0;
  const jump =
    policy.jump !== "never" &&
    obstacle &&
    zone.duck.grounded &&
    !zone.duck.jumpHeld &&
    bot.noticed > skill.reactionTicks;
  if (jump && bot.random() >= skill.errorRate) {
    bot.holding = skill.jumpHoldTicks - 1;
    bot.noticed = 0;
    return { jumpHeld: true, move: policy.move, useHeld: false };
  }
  return { jumpHeld: false, move: policy.move, useHeld: false };
}
