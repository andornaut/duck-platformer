import type { DuckTuning } from "../data/types";
import {
  type PreparedStage,
  type RunResult,
  simulateStage,
  type SimulationConfig,
} from "./simulate";

export interface BatchResult {
  readonly aggregate: {
    readonly activeSeconds: number;
    readonly budgetExhausted: number;
    readonly cleared: number;
    readonly completionRate: number;
    readonly deaths: number;
    readonly meanPeakProgress: number;
    readonly meanProgress: number;
    readonly retries: number;
    readonly runs: number;
    readonly runtimeMs: number;
    readonly steps: number;
    readonly stepsPerSecond: number;
  };
  readonly runs: readonly RunResult[];
}

// Preparation is supplied by the caller, allowing several policies to reuse a layout/index.
export function simulateBatch(
  tuning: DuckTuning,
  prepare: (seed: number) => PreparedStage,
  config: Omit<SimulationConfig, "seed">,
  seeds: readonly number[],
): BatchResult {
  if (seeds.length === 0) {
    throw new Error("A batch needs explicit seeds");
  }
  const started = performance.now();
  const runs = seeds.map((seed) => simulateStage(tuning, prepare(seed), { ...config, seed }));
  const sum = (read: (run: RunResult) => number) =>
    runs.reduce((total, run) => total + read(run), 0);
  const steps = sum((run) => run.steps);
  const runtimeMs = performance.now() - started;
  const cleared = runs.filter((run) => run.status === "cleared").length;
  return {
    aggregate: {
      activeSeconds: sum((run) => run.activeSeconds),
      budgetExhausted: runs.filter(
        (run) => run.status === "step-budget" || run.status === "retry-budget",
      ).length,
      cleared,
      completionRate: cleared / runs.length,
      deaths: sum((run) => run.deaths),
      meanPeakProgress: sum((run) => run.peakProgress) / runs.length,
      meanProgress: sum((run) => run.progress) / runs.length,
      retries: sum((run) => run.retries),
      runs: runs.length,
      runtimeMs,
      steps,
      stepsPerSecond: runtimeMs > 0 ? (steps * 1000) / runtimeMs : 0,
    },
    runs,
  };
}
