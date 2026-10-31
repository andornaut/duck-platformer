import { saveStore } from "@andornaut/game-kit/save/saveStore";
import type { SaveStorage } from "@andornaut/game-kit/save/storage";
import type { Checked, SaveFormat, StoredObject } from "@andornaut/game-kit/save/versionedSave";

export interface LevelStats {
  readonly activeSeconds: number;
}

export interface Stats {
  readonly levels: Readonly<Record<string, LevelStats>>;
}

export const STATS_VERSION = 1;
const KEYS = { backup: "duck-platformer.stats-backup", save: "duck-platformer.stats" } as const;
const fresh = (): Stats => ({ levels: {} });

export function statsFormat(levels: ReadonlySet<string>): SaveFormat<Stats> {
  const checked = (value: unknown): Checked<Stats> => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return { ok: false, reason: "stats are not an object" };
    }
    const entries = value as Record<string, unknown>;
    const stored = entries.levels;
    if (stored === null || typeof stored !== "object" || Array.isArray(stored)) {
      return { ok: false, reason: "stats levels are not an object" };
    }
    for (const [key, level] of Object.entries(stored)) {
      if (!levels.has(key) || level === null || typeof level !== "object" || Array.isArray(level)) {
        return { ok: false, reason: "stats name an unknown level or invalid clock" };
      }
      const seconds = (level as Record<string, unknown>).activeSeconds;
      if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) {
        return { ok: false, reason: "stats contain an invalid active time" };
      }
    }
    return { ok: true, value: { levels: stored as Record<string, LevelStats> } };
  };
  return {
    decode: checked,
    encode: (stats): Checked<StoredObject> => {
      const result = checked(stats);
      return result.ok ? { ok: true, value: { ...result.value } } : result;
    },
    fresh,
    migrations: {},
    version: STATS_VERSION,
  };
}

export interface LevelStatsStore {
  addActiveTime(level: string, seconds: number): void;
  clearLevel(level: string): void;
  flush(): Promise<void>;
  load(): Promise<void>;
  seconds(level: string): number;
}

// A separate store keeps unfinished level clocks independent of progress restarts. Mutations
// update memory immediately and begin persistence immediately; flush awaits the latest write.
export function levelStatsStore(
  storage: SaveStorage,
  levels: ReadonlySet<string>,
): LevelStatsStore {
  const store = saveStore(storage, KEYS, statsFormat(levels));
  let stats = fresh();
  let pending: Promise<unknown> = Promise.resolve();
  const write = (level: string, seconds: number) => {
    if (!levels.has(level) || !Number.isFinite(seconds) || seconds < 0) {
      throw new Error("Invalid level clock update");
    }
    stats = { levels: { ...stats.levels, [level]: { activeSeconds: seconds } } };
    pending = store.save(stats);
  };
  return {
    addActiveTime(level, seconds) {
      if (!Number.isFinite(seconds) || seconds < 0) {
        throw new Error("Invalid active play duration");
      }
      if (seconds > 0) {
        write(level, (stats.levels[level]?.activeSeconds ?? 0) + seconds);
      }
    },
    clearLevel: (level) => write(level, 0),
    async flush() {
      await pending;
    },
    async load() {
      stats = (await store.load()).save;
    },
    seconds: (level) => stats.levels[level]?.activeSeconds ?? 0,
  };
}
