// État en mémoire, rechargé depuis IndexedDB. Tout est recalculé après chaque changement.
import { db, getSetting, setSetting, type Recipe } from "./db.ts";
import { compute, type EngineResult } from "./engine.ts";
import type { MeasureRow, SetRow } from "./hevy.ts";
import type { LogRow, MobilityTest } from "./engine.ts";

export interface Prefs {
  name: string;
  bodyweightKg?: number;
  targetWeightKg?: number;
  sound: boolean;
  animations: boolean;
  theme: "auto" | "light" | "dark";
  favorites: string[];
  /** URL de vidéo choisie par l'utilisateur, par id d'exercice ou de recette */
  videos: Record<string, string>;
}

export const DEFAULT_PREFS: Prefs = { name: "Héros", sound: false, animations: true, theme: "auto", favorites: [], videos: {} };

export const state = {
  sets: [] as SetRow[],
  measures: [] as MeasureRow[],
  logs: [] as LogRow[],
  tests: [] as MobilityTest[],
  recipes: [] as Recipe[],
  prefs: { ...DEFAULT_PREFS } as Prefs,
  result: null as unknown as EngineResult,
};

export const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function recompute(): void {
  state.result = compute({
    sets: state.sets,
    measures: state.measures,
    logs: state.logs,
    tests: state.tests,
    bodyweightKg: state.prefs.bodyweightKg,
    targetWeightKg: state.prefs.targetWeightKg,
    today: dayKey(),
  });
}

export async function loadAll(): Promise<void> {
  const [sets, measures, logs, tests, recipes, prefs] = await Promise.all([
    db.sets.toArray(), db.measures.toArray(), db.logs.toArray(), db.tests.toArray(), db.recipes.toArray(),
    getSetting<Prefs>("prefs"),
  ]);
  state.sets = sets;
  state.measures = measures;
  state.logs = logs;
  state.tests = tests;
  state.recipes = recipes;
  state.prefs = { ...DEFAULT_PREFS, ...(prefs ?? {}) };
  recompute();
}

export async function savePrefs(patch: Partial<Prefs>): Promise<void> {
  state.prefs = { ...state.prefs, ...patch };
  await setSetting("prefs", state.prefs);
  recompute();
}

export async function addLog(log: LogRow): Promise<void> {
  await db.logs.add(log);
  state.logs.push(log);
  recompute();
}

export interface Snapshot {
  level: number;
  rank: string;
  xp: number;
  recordKeys: Set<string>;
}
export function snapshot(): Snapshot {
  const r = state.result;
  return {
    level: r.level.level, rank: r.rank, xp: r.totalXp,
    recordKeys: new Set(r.records.map((x) => `${x.exercise}|${x.date}|${x.score.toFixed(3)}`)),
  };
}

recompute();
