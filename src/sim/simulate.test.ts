import { describe, expect, it } from "vitest";

import { DUCK } from "../data/duck";
import type { AreaLayout, ZoneLayout } from "../data/types";
import { STEP_SECONDS } from "../rules/step";
import { startZone, stepZone } from "../rules/zone";
import { DUCK_FRAME } from "../view/duck";
import { DIAGNOSTIC_SKILL, FORWARD_POLICY } from "./bot";
import { simulateBatch } from "./report";
import { prepareStage, simulateStage, type SimulationConfig } from "./simulate";

function fixture(solids: AreaLayout["solids"], exitX = 1000): ZoneLayout {
  return {
    areas: {
      main: {
        backX: 0,
        chunks: [],
        entries: { start: { x: 60, y: 120 } },
        exitX,
        height: 140,
        objects: [],
        solids,
        terrain: [],
        tileset: undefined,
        width: 1100,
      },
    },
    duckFrame: DUCK_FRAME,
    start: { area: "main", entry: "start" },
  };
}
const config: SimulationConfig = {
  maxRetries: 0,
  maxSteps: 120,
  policy: { jump: "never", move: 1 },
  seed: 7,
  skill: DIAGNOSTIC_SKILL,
};
const ground = [{ height: 20, width: 1100, x: 0, y: 120 }];

function deterministic(result: ReturnType<typeof simulateStage>) {
  return { ...result, runtimeMs: 0 };
}

describe("bounded stage simulation", () => {
  it("matches direct real-rule stepping and stops on completion", () => {
    const layout = fixture(ground, 200);
    let actual = startZone(DUCK, layout, config.seed);
    let steps = 0;
    while (!actual.cleared && steps < config.maxSteps) {
      actual = stepZone(
        DUCK,
        layout,
        STEP_SECONDS,
        { jumpHeld: false, move: 1, useHeld: false },
        actual,
      );
      steps++;
    }
    const run = simulateStage(DUCK, prepareStage(layout), config);
    expect(run.status).toBe("cleared");
    expect(run.steps).toBe(steps);
    expect(run.activeSeconds).toBe(steps * STEP_SECONDS);
    expect(run.progress).toBe(1);
    expect(run.deaths).toBe(0);
  });
  it("counts real failed attempts and retries without stepping a frozen death", () => {
    const run = simulateStage(DUCK, prepareStage(fixture([])), {
      ...config,
      maxRetries: 2,
      maxSteps: 500,
    });
    expect(run.status).toBe("retry-budget");
    expect(run.retries).toBe(2);
    expect(run.deathsByReason.fall).toBe(3);
    expect(run.steps).toBeLessThan(500);
    expect(run.activeSeconds).toBe(run.steps * STEP_SECONDS);
  });
  it("replays seeded decisions and reports the tick budget without retrying", () => {
    const stage = prepareStage(fixture(ground));
    const options = {
      ...config,
      maxSteps: 30,
      policy: { ...FORWARD_POLICY, jump: "continuous" as const },
      skill: { ...DIAGNOSTIC_SKILL, errorRate: 0.5 },
    };
    const first = simulateStage(DUCK, stage, options);
    expect(deterministic(first)).toEqual(deterministic(simulateStage(DUCK, stage, options)));
    expect(first.status).toBe("step-budget");
    expect(first.steps).toBe(30);
    expect(first.retries).toBe(0);
  });
  it("aggregates explicit bounded runs without losing failures", () => {
    const stage = prepareStage(fixture(ground));
    const report = simulateBatch(DUCK, () => stage, { ...config, maxSteps: 3 }, [1, 2]);
    expect(report.aggregate).toMatchObject({
      budgetExhausted: 2,
      cleared: 0,
      deaths: 0,
      runs: 2,
      steps: 6,
    });
    expect(report.aggregate.activeSeconds).toBe(6 * STEP_SECONDS);
    expect(report.runs.map(({ seed }) => seed)).toEqual([1, 2]);
  });
  it.each([{ maxSteps: Infinity }, { maxSteps: 0 }, { maxRetries: -1 }, { seed: NaN }])(
    "rejects unbounded or invalid budgets: %j",
    (invalid) => {
      expect(() =>
        simulateStage(DUCK, prepareStage(fixture(ground)), { ...config, ...invalid }),
      ).toThrow();
    },
  );
});
