// Lecture des exports CSV de Hevy (séances et mesures). Aucune dépendance au navigateur.

export interface SetRow {
  /** Clé de déduplication : début de séance | exercice | numéro de série */
  key: string;
  /** Début de séance, "YYYY-MM-DDTHH:mm" (heure locale) */
  start: string;
  day: string;
  title: string;
  exercise: string;
  setIndex: number;
  setType: string;
  kg: number | null;
  reps: number | null;
  distanceKm: number | null;
  durationS: number | null;
}

export interface MeasureRow {
  date: string;
  weightKg: number;
}

export interface ImportSummary {
  sessions: number;
  sets: number;
  from: string;
  to: string;
}

const LB = 0.45359237;
const MILE = 1.609344;

export function parseCsv(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const first = text.split(/\r?\n/, 1)[0] ?? "";
  const delim = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v !== "")) rows.push(row);
  return rows;
}

const MONTHS: Record<string, number> = {
  jan: 1, fev: 2, feb: 2, mar: 3, avr: 4, apr: 4, mai: 5, may: 5, jun: 6, jul: 7, aou: 8, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const p2 = (n: number) => String(n).padStart(2, "0");

/** Comprend "28 sept. 2026, 12:34", "28 Sep 2026, 12:34", "2026-09-28 12:34:00" et "2026-09-28". */
export function parseHevyDate(raw: string): { iso: string; day: string } | null {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2}))?/);
  if (m) {
    const day = `${m[1]}-${m[2]}-${m[3]}`;
    return { day, iso: `${day}T${p2(+(m[4] ?? 0))}:${m[5] ?? "00"}` };
  }
  m = s.match(/^(\d{1,2})\s+([A-Za-zÀ-ÿ.]+)\s+(\d{4})(?:[,\s]+(\d{1,2}):(\d{2}))?/);
  if (!m) return null;
  const name = m[2].toLowerCase().normalize("NFD").replace(/[̀-ͯ.]/g, "");
  let key = name.slice(0, 3);
  if (key === "jui") key = name[3] === "l" ? "jul" : "jun";
  const month = MONTHS[key];
  if (!month) return null;
  const day = `${m[3]}-${p2(month)}-${p2(+m[1])}`;
  return { day, iso: `${day}T${p2(+(m[4] ?? 0))}:${m[5] ?? "00"}` };
}

const num = (v: string | undefined): number | null => {
  if (v === undefined || v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

function headerIndex(header: string[]): (name: string) => number {
  const norm = header.map((h) => h.trim().toLowerCase());
  return (name) => norm.indexOf(name);
}

export function parseWorkoutCsv(text: string): { sets: SetRow[]; summary: ImportSummary; unit: "kg" | "lbs"; skipped: number } {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error("Le fichier est vide.");
  const col = headerIndex(rows[0]);
  const iStart = col("start_time"), iEx = col("exercise_title");
  if (iStart < 0 || iEx < 0) {
    throw new Error("Ce fichier ne ressemble pas à l'export des séances Hevy (colonnes start_time et exercise_title introuvables).");
  }
  const iKg = col("weight_kg"), iLbs = col("weight_lbs");
  const unit = iKg >= 0 ? "kg" : "lbs";
  const iW = iKg >= 0 ? iKg : iLbs;
  const iTitle = col("title"), iSet = col("set_index"), iType = col("set_type"), iReps = col("reps");
  const iKm = col("distance_km"), iMi = col("distance_miles"), iDur = col("duration_seconds");

  const sets: SetRow[] = [];
  let skipped = 0;
  for (const r of rows.slice(1)) {
    const d = parseHevyDate(r[iStart] ?? "");
    const exercise = (r[iEx] ?? "").trim();
    if (!d || !exercise) { skipped++; continue; }
    const w = iW >= 0 ? num(r[iW]) : null;
    const km = iKm >= 0 ? num(r[iKm]) : iMi >= 0 ? (num(r[iMi]) ?? 0) * MILE || null : null;
    const setIndex = iSet >= 0 ? (num(r[iSet]) ?? 0) : 0;
    sets.push({
      key: `${d.iso}|${exercise}|${setIndex}`,
      start: d.iso,
      day: d.day,
      title: iTitle >= 0 ? (r[iTitle] ?? "").trim() : "",
      exercise,
      setIndex,
      setType: iType >= 0 ? (r[iType] ?? "normal").trim().toLowerCase() || "normal" : "normal",
      kg: w === null ? null : unit === "lbs" ? Math.round(w * LB * 100) / 100 : w,
      reps: iReps >= 0 ? num(r[iReps]) : null,
      distanceKm: km,
      durationS: iDur >= 0 ? num(r[iDur]) : null,
    });
  }
  if (!sets.length) throw new Error("Aucune série exploitable dans ce fichier.");
  const starts = [...new Set(sets.map((s) => s.start))].sort();
  return {
    sets,
    unit,
    skipped,
    summary: { sessions: starts.length, sets: sets.length, from: starts[0].slice(0, 10), to: starts[starts.length - 1].slice(0, 10) },
  };
}

export function parseMeasuresCsv(text: string): { measures: MeasureRow[]; unit: "kg" | "lbs" } {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error("Le fichier est vide.");
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const iDate = header.findIndex((h) => h === "date" || h === "date_time" || h.includes("date") || h === "start_time");
  let iW = header.indexOf("weight_kg");
  let unit: "kg" | "lbs" = "kg";
  if (iW < 0) { iW = header.indexOf("weight_lbs"); unit = "lbs"; }
  if (iW < 0) { iW = header.findIndex((h) => h === "weight" || h === "poids"); unit = "kg"; }
  if (iDate < 0 || iW < 0) {
    throw new Error(`Colonnes de date ou de poids introuvables. Colonnes lues : ${rows[0].join(", ")}`);
  }
  const measures: MeasureRow[] = [];
  for (const r of rows.slice(1)) {
    const d = parseHevyDate(r[iDate] ?? "");
    const w = num(r[iW]);
    if (!d || w === null || w <= 0) continue;
    measures.push({ date: d.day, weightKg: unit === "lbs" ? Math.round(w * LB * 100) / 100 : w });
  }
  if (!measures.length) throw new Error("Aucune mesure de poids trouvée dans ce fichier.");
  return { measures, unit };
}

/** Détecte de quel export il s'agit. */
export function detectKind(text: string): "workouts" | "measures" | "unknown" {
  const head = (text.replace(/^﻿/, "").split(/\r?\n/, 1)[0] ?? "").toLowerCase();
  if (head.includes("exercise_title") && head.includes("start_time")) return "workouts";
  if (/weight|poids/.test(head) && /date/.test(head)) return "measures";
  return "unknown";
}
