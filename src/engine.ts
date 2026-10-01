// Moteur RPG : tout est calculé à partir des séries importées et du journal. Aucune dépendance au navigateur.
import { RPG, type MainLift } from "./rpg.config.ts";
import type { MeasureRow, SetRow } from "./hevy.ts";

export interface LogRow {
  type: "stretch" | "cook" | "test";
  day: string;
  xp: number;
  label: string;
  ref?: string;
}

export interface MobilityTest {
  date: string;
  /** id du test → valeur (cm ou note de 1 à 5) */
  values: Record<string, number>;
}

export interface EngineInput {
  sets: SetRow[];
  measures: MeasureRow[];
  logs: LogRow[];
  tests: MobilityTest[];
  bodyweightKg?: number;
  targetWeightKg?: number;
  today: string;
}

type Kind = "load" | "reps" | "time";

export interface SessionResult {
  start: string;
  day: string;
  title: string;
  sets: number;
  tonnage: number;
  records: { exercise: string; score: number; kind: Kind }[];
  xp: number;
  bonusPct: number;
}

export interface ExerciseResult {
  name: string;
  kind: Kind;
  first: number;
  best: number;
  bestDay: string;
  level: number;
  history: { day: string; best: number }[];
  main?: string;
}

export interface LiftSummary {
  id: string;
  label: string;
  exercise: string;
  level: number;
  maxLevel: number;
  e1rm: number;
  ratio: number;
  bossRatio: number;
}

export interface Quest {
  id: string;
  label: string;
  xp?: number;
  done: boolean;
  progress?: string;
  tab: "train" | "food" | "move";
}

export interface EngineResult {
  sessions: SessionResult[];
  exercises: ExerciseResult[];
  lifts: LiftSummary[];
  totalXp: number;
  level: LevelInfo;
  rank: string;
  rankIndex: number;
  stats: { force: number; endurance: number; mobilite: number; vitalite: number };
  records: { exercise: string; score: number; kind: Kind; date: string }[];
  weekly: { week: string; tonnage: number; sessions: number; sets: number }[];
  bodyweight: { date: string; kg: number }[];
  currentBodyweight: number;
  dailyQuests: Quest[];
  weeklyQuests: Quest[];
  badges: { id: string; name: string; desc: string; ok: boolean }[];
  streakWeeks: number;
  totalSessions: number;
}

export interface LevelInfo {
  level: number;
  into: number;
  need: number;
  pct: number;
}

/* ---------- dates ---------- */
const DAY = 86400000;
const toUtc = (day: string) => Date.parse(`${day}T00:00:00Z`);
const fromUtc = (t: number) => new Date(t).toISOString().slice(0, 10);
export const weekStart = (day: string): string => {
  const dow = (new Date(toUtc(day)).getUTCDay() + 6) % 7; // lundi = 0
  return fromUtc(toUtc(day) - dow * DAY);
};
const addDays = (day: string, n: number) => fromUtc(toUtc(day) + n * DAY);

/* ---------- formules de base ---------- */
export const epley = (kg: number, reps: number): number => kg * (1 + reps / 30);

export function levelInfo(xp: number): LevelInfo {
  let L = 1;
  while (xp >= RPG.xpForLevel(L + 1)) L++;
  const base = RPG.xpForLevel(L), next = RPG.xpForLevel(L + 1);
  return { level: L, into: xp - base, need: next - base, pct: (xp - base) / (next - base) };
}

export function rankOf(level: number): { name: string; index: number } {
  let idx = 0;
  RPG.ranks.forEach((r, i) => { if (level >= r.min) idx = i; });
  return { name: RPG.ranks[idx].name, index: idx };
}

const mainLiftOf = (exercise: string): MainLift | undefined => RPG.mainLifts.find((m) => m.match.test(exercise));

function kindAndScore(exercise: string, s: SetRow): { kind: Kind; score: number } | null {
  const reps = s.reps ?? 0;
  const dur = s.durationS ?? 0;
  if (dur > 0 && reps === 0) return { kind: "time", score: dur };
  if (reps <= 0) return null;
  if ((s.kg ?? 0) > 0 && !RPG.assistedMatch.test(exercise)) return { kind: "load", score: epley(s.kg!, reps) };
  return { kind: "reps", score: reps };
}

const isWarmup = (s: SetRow) => s.setType === "warmup";

function bodyweightAt(day: string, measures: MeasureRow[], fallback: number): number {
  let bw = fallback;
  for (const m of measures) {
    if (m.date <= day) bw = m.weightKg;
    else break;
  }
  // avant la première mesure : on prend la première connue
  if (measures.length && day < measures[0].date) bw = measures[0].weightKg;
  return bw;
}

function exerciseLevel(ex: { kind: Kind; first: number; best: number; name: string }, bw: number): number {
  const main = mainLiftOf(ex.name);
  if (main && ex.kind === "load") {
    const factor = /haltère/i.test(ex.name) ? main.dumbbellFactor : 1;
    const ratio = (ex.best * factor) / bw;
    return 1 + main.thresholds.filter((t) => ratio >= t).length;
  }
  return 1 + Math.max(0, Math.floor((ex.best / ex.first - 1) / RPG.otherLiftStep + 1e-9));
}

/* ---------- calcul principal ---------- */
export function compute(input: EngineInput): EngineResult {
  const measures = [...input.measures].sort((a, b) => a.date.localeCompare(b.date));
  const fallbackBw = input.bodyweightKg && input.bodyweightKg > 0 ? input.bodyweightKg : RPG.bodyweightFallbackKg;
  const currentBw = measures.length ? measures[measures.length - 1].weightKg : fallbackBw;

  // séances, dans l'ordre chronologique
  const byStart = new Map<string, SetRow[]>();
  for (const s of input.sets) {
    const arr = byStart.get(s.start) ?? [];
    arr.push(s);
    byStart.set(s.start, arr);
  }
  const starts = [...byStart.keys()].sort();

  const best = new Map<string, { kind: Kind; score: number; day: string }>();
  const first = new Map<string, number>();
  const history = new Map<string, { day: string; best: number }[]>();
  const recordsLog: EngineResult["records"] = [];
  const sessions: SessionResult[] = [];
  const weekSessions = new Map<string, number>();

  for (const st of starts) {
    const rows = byStart.get(st)!;
    const day = rows[0].day;
    const week = weekStart(day);
    // bonus de série : semaines consécutives précédentes avec au moins une séance
    let streak = 0;
    for (let w = addDays(week, -7); weekSessions.has(w); w = addDays(w, -7)) streak++;
    const bonusPct = Math.min(RPG.xp.streakBonusMax, streak * RPG.xp.streakBonusPerWeek);

    let tonnage = 0;
    let nSets = 0;
    const perEx = new Map<string, { kind: Kind; score: number }>();
    for (const s of rows) {
      if (isWarmup(s)) continue;
      nSets++;
      if ((s.kg ?? 0) > 0 && (s.reps ?? 0) > 0) tonnage += s.kg! * s.reps!;
      const ks = kindAndScore(s.exercise, s);
      if (!ks) continue;
      const cur = perEx.get(s.exercise);
      if (!cur || ks.score > cur.score) perEx.set(s.exercise, ks);
    }
    const records: SessionResult["records"] = [];
    for (const [name, ks] of perEx) {
      const prev = best.get(name);
      if (!prev) {
        best.set(name, { ...ks, day });
        first.set(name, ks.score);
      } else if (prev.kind === ks.kind && ks.score > prev.score + 1e-6) {
        records.push({ exercise: name, score: ks.score, kind: ks.kind });
        recordsLog.push({ exercise: name, score: ks.score, kind: ks.kind, date: day });
        best.set(name, { ...ks, day });
      }
      const h = history.get(name) ?? [];
      h.push({ day, best: best.get(name)!.score });
      history.set(name, h);
    }
    const raw =
      RPG.xp.sessionBase +
      Math.min(RPG.xp.tonnageCap, Math.floor(tonnage / RPG.xp.tonnageStep)) +
      RPG.xp.perRecord * records.length;
    sessions.push({
      start: st, day, title: rows[0].title, sets: nSets, tonnage: Math.round(tonnage), records,
      xp: Math.min(RPG.xp.sessionCap, Math.round(raw * (1 + bonusPct))), bonusPct,
    });
    weekSessions.set(week, (weekSessions.get(week) ?? 0) + 1);
  }

  const bwNow = currentBw;
  const exercises: ExerciseResult[] = [...best.entries()].map(([name, b]) => {
    const f = first.get(name)!;
    const r: ExerciseResult = {
      name, kind: b.kind, first: f, best: b.score, bestDay: b.day, level: 1,
      history: history.get(name) ?? [], main: mainLiftOf(name)?.id,
    };
    r.level = exerciseLevel(r, bwNow);
    return r;
  }).sort((a, b) => b.level - a.level || a.name.localeCompare(b.name, "fr"));

  // exercices principaux : on garde, pour chacun, la meilleure variante mesurée
  const lifts: LiftSummary[] = [];
  for (const m of RPG.mainLifts) {
    const cands = exercises.filter((e) => e.main === m.id && e.kind === "load");
    if (!cands.length) continue;
    const top = cands.map((e) => ({ e, v: e.best * (/haltère/i.test(e.name) ? m.dumbbellFactor : 1) })).sort((a, b) => b.v - a.v)[0];
    lifts.push({
      id: m.id, label: m.label, exercise: top.e.name, level: top.e.level, maxLevel: m.thresholds.length + 1,
      e1rm: Math.round(top.v * 10) / 10, ratio: top.v / bwNow, bossRatio: m.boss,
    });
  }

  const totalSessions = sessions.length;
  const totalXp = sessions.reduce((a, s) => a + s.xp, 0) + input.logs.reduce((a, l) => a + l.xp, 0);
  const lvl = levelInfo(totalXp);
  const rk = rankOf(lvl.level);

  // hebdomadaire
  const wk = new Map<string, { tonnage: number; sessions: number; sets: number }>();
  for (const s of sessions) {
    const w = weekStart(s.day);
    const c = wk.get(w) ?? { tonnage: 0, sessions: 0, sets: 0 };
    c.tonnage += s.tonnage; c.sessions++; c.sets += s.sets;
    wk.set(w, c);
  }
  const weekly = [...wk.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([week, v]) => ({ week, ...v }));

  // série de semaines en cours
  let streakWeeks = 0;
  const thisWeek = weekStart(input.today);
  let w = wk.has(thisWeek) ? thisWeek : addDays(thisWeek, -7);
  while (wk.has(w)) { streakWeeks++; w = addDays(w, -7); }

  /* stats 0..scaleMax */
  const S = RPG.stats;
  const avgMain = lifts.length ? lifts.reduce((a, l) => a + l.level / l.maxLevel, 0) / lifts.length : 0;
  const force = Math.round(avgMain * S.scaleMax);

  let activeWeeks = 0, setsSum = 0;
  for (let i = 0; i < S.enduranceWeeks; i++) {
    const c = wk.get(addDays(thisWeek, -7 * i));
    if (c) { if (c.sessions >= S.activeWeekSessions) activeWeeks++; setsSum += c.sets; }
  }
  const endurance = Math.round(S.scaleMax * Math.min(1, (activeWeeks / S.enduranceWeeks) * 0.6 + Math.min(1, setsSum / S.enduranceWeeks / S.fullWeeklySets) * 0.4));

  const since = addDays(input.today, -S.windowDays);
  const recent = (t: LogRow["type"]) => input.logs.filter((l) => l.type === t && l.day > since).length;
  const tests = [...input.tests].sort((a, b) => a.date.localeCompare(b.date));
  let testScore = 0;
  if (tests.length) {
    testScore = 0.5;
    if (tests.length > 1 && testsImproved(tests[tests.length - 2], tests[tests.length - 1]) > 0) testScore = 1;
  }
  const mobilite = Math.round(S.scaleMax * Math.min(1, Math.min(1, recent("stretch") / S.mobilityRoutinesTarget) * 0.7 + testScore * 0.3));

  let weightScore = 0.5;
  if (input.targetWeightKg && measures.length) {
    const start = measures[0].weightKg, target = input.targetWeightKg;
    weightScore = target === start ? 1 : Math.max(0, Math.min(1, (currentBw - start) / (target - start)));
  }
  const vitalite = Math.round(S.scaleMax * Math.min(1, Math.min(1, recent("cook") / S.cookedTarget) * 0.6 + weightScore * 0.4));

  // quêtes
  const doneToday = (t: LogRow["type"]) => input.logs.some((l) => l.type === t && l.day === input.today);
  const sessionToday = sessions.some((s) => s.day === input.today);
  const dailyQuests: Quest[] = [
    { id: "d-session", label: "Faire une séance", tab: "train", done: sessionToday, xp: RPG.xp.sessionBase },
    { id: "d-stretch", label: "Faire une routine de mobilité", tab: "move", done: doneToday("stretch"), xp: RPG.xp.mobilityRoutine },
    { id: "d-cook", label: "Cuisiner une recette", tab: "food", done: doneToday("cook"), xp: RPG.xp.recipeCooked },
  ];
  const weekLogs = (t: LogRow["type"]) => input.logs.filter((l) => l.type === t && l.day >= thisWeek).length;
  const sessThisWeek = wk.get(thisWeek)?.sessions ?? 0;
  const overload = overloadThisWeek(input.sets, thisWeek);
  const weeklyQuests: Quest[] = [
    { id: "w-sessions", label: `${RPG.quests.weeklySessions} séances cette semaine`, tab: "train", done: sessThisWeek >= RPG.quests.weeklySessions, progress: `${Math.min(sessThisWeek, RPG.quests.weeklySessions)} / ${RPG.quests.weeklySessions}` },
    { id: "w-overload", label: "Surcharge progressive : battre ta dernière séance sur un exercice", tab: "train", done: overload.length > 0, progress: overload[0] },
    { id: "w-stretch", label: `${RPG.quests.weeklyRoutines} routines de mobilité`, tab: "move", done: weekLogs("stretch") >= RPG.quests.weeklyRoutines, progress: `${Math.min(weekLogs("stretch"), RPG.quests.weeklyRoutines)} / ${RPG.quests.weeklyRoutines}` },
    { id: "w-cook", label: `${RPG.quests.weeklyRecipes} recettes cuisinées`, tab: "food", done: weekLogs("cook") >= RPG.quests.weeklyRecipes, progress: `${Math.min(weekLogs("cook"), RPG.quests.weeklyRecipes)} / ${RPG.quests.weeklyRecipes}` },
  ];

  const totalStretch = input.logs.filter((l) => l.type === "stretch").length;
  const totalCook = input.logs.filter((l) => l.type === "cook").length;
  const badges = [
    { id: "first", name: "Premier pas", desc: "Terminer une séance", ok: totalSessions >= 1 },
    { id: "ten", name: "Régulier", desc: "10 séances", ok: totalSessions >= 10 },
    { id: "tf", name: "Increvable", desc: "25 séances", ok: totalSessions >= 25 },
    { id: "fifty", name: "Habitué", desc: "50 séances", ok: totalSessions >= 50 },
    { id: "pr", name: "Nouveau record", desc: "Battre un record personnel", ok: recordsLog.length >= 1 },
    { id: "pr25", name: "Briseur de plafond", desc: "25 records battus", ok: recordsLog.length >= 25 },
    { id: "w4", name: "Un mois solide", desc: "4 semaines de suite avec une séance", ok: streakWeeks >= 4 },
    { id: "w8", name: "Deux mois solides", desc: "8 semaines de suite", ok: streakWeeks >= 8 },
    { id: "flex", name: "Souple", desc: "5 routines de mobilité", ok: totalStretch >= 5 },
    { id: "chef", name: "Aux fourneaux", desc: "Cuisiner 5 recettes", ok: totalCook >= 5 },
    { id: "boss", name: "Tueur de boss", desc: "Atteindre l'objectif d'un boss", ok: lifts.some((l) => l.ratio >= l.bossRatio) },
    { id: "l5", name: "Aventurier", desc: "Atteindre le niveau 5", ok: lvl.level >= 5 },
    { id: "l10", name: "Gardien", desc: "Atteindre le niveau 10", ok: lvl.level >= 10 },
  ];

  return {
    sessions, exercises, lifts, totalXp, level: lvl, rank: rk.name, rankIndex: rk.index,
    stats: { force, endurance, mobilite, vitalite },
    records: recordsLog, weekly,
    bodyweight: measures.map((m) => ({ date: m.date, kg: m.weightKg })),
    currentBodyweight: currentBw, dailyQuests, weeklyQuests, badges, streakWeeks, totalSessions,
  };
}

/** Exercices où, cette semaine, la meilleure série bat celle de la séance précédente sur le même exercice. */
function overloadThisWeek(sets: SetRow[], weekFrom: string): string[] {
  const perEx = new Map<string, Map<string, { kind: Kind; score: number }>>();
  for (const s of sets) {
    if (isWarmup(s)) continue;
    const ks = kindAndScore(s.exercise, s);
    if (!ks) continue;
    const m = perEx.get(s.exercise) ?? new Map();
    const cur = m.get(s.start);
    if (!cur || ks.score > cur.score) m.set(s.start, ks);
    perEx.set(s.exercise, m);
  }
  const out: string[] = [];
  for (const [name, m] of perEx) {
    const keys = [...m.keys()].sort();
    if (keys.length < 2) continue;
    const last = keys[keys.length - 1], prev = keys[keys.length - 2];
    if (last.slice(0, 10) >= weekFrom && m.get(last)!.kind === m.get(prev)!.kind && m.get(last)!.score > m.get(prev)!.score + 1e-6) out.push(name);
  }
  return out;
}

/** Nombre de tests améliorés entre deux passages (plus haut = mieux pour tous les tests). */
export function testsImproved(a: MobilityTest, b: MobilityTest): number {
  let n = 0;
  for (const k of Object.keys(b.values)) if (k in a.values && b.values[k] > a.values[k]) n++;
  return n;
}

/* ---------- personnage exportable ---------- */
export function characterExport(r: EngineResult, name: string, badgesOk: string[], nowIso: string) {
  return {
    schema: "paliers.character/1",
    exportedAt: nowIso,
    name,
    level: r.level.level,
    rank: r.rank,
    xp: r.totalXp,
    stats: r.stats,
    lifts: r.lifts.map((l) => ({ exercise: l.label, level: l.level, e1rmKg: l.e1rm, bodyweightRatio: Math.round(l.ratio * 100) / 100 })),
    records: r.exercises
      .filter((x) => x.kind === "load")
      .map((x) => ({ exercise: x.name, e1rmKg: Math.round(x.best * 10) / 10, date: x.bestDay })),
    badges: badgesOk,
  };
}

