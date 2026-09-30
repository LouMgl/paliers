import { db } from "../db.ts";
import { detectKind, parseMeasuresCsv, parseWorkoutCsv, type MeasureRow, type SetRow } from "../hevy.ts";
import { barChart, lineChart } from "../charts.ts";
import { loadAll, snapshot, state } from "../store.ts";
import { celebrate, esc, fmtDate, fmtInt, toast } from "../ui.ts";
import { app } from "../ui.ts";
import { readText } from "../files.ts";
import type { View } from "./types.ts";

type Pending =
  | { kind: "workouts"; sets: SetRow[]; sessions: number; from: string; to: string; fresh: number; unit: string; name: string }
  | { kind: "measures"; measures: MeasureRow[]; fresh: number; from: string; to: string; unit: string; name: string };

let pending: Pending[] = [];
let errors: string[] = [];
let selected = "";

async function prepare(files: File[]): Promise<void> {
  pending = [];
  errors = [];
  for (const f of files) {
    try {
      const text = await readText(f);
      const kind = detectKind(text);
      if (kind === "workouts") {
        const p = parseWorkoutCsv(text);
        const have = new Set((await db.sets.bulkGet(p.sets.map((s) => s.key))).map((s) => s?.key));
        pending.push({ kind, sets: p.sets, sessions: p.summary.sessions, from: p.summary.from, to: p.summary.to, fresh: p.sets.filter((s) => !have.has(s.key)).length, unit: p.unit, name: f.name });
      } else if (kind === "measures") {
        const p = parseMeasuresCsv(text);
        const have = new Set((await db.measures.bulkGet(p.measures.map((m) => m.date))).map((m) => m?.date));
        const days = p.measures.map((m) => m.date).sort();
        pending.push({ kind, measures: p.measures, fresh: p.measures.filter((m) => !have.has(m.date)).length, from: days[0], to: days[days.length - 1], unit: p.unit, name: f.name });
      } else {
        errors.push(`${f.name} : format non reconnu. Choisis l'export des séances ou celui des mesures de Hevy.`);
      }
    } catch (e) {
      errors.push(`${f.name} : ${(e as Error).message}`);
    }
  }
  app.rerender();
}

async function confirmImport(): Promise<void> {
  const before = snapshot();
  let nSets = 0, nMeas = 0;
  for (const p of pending) {
    if (p.kind === "workouts") { await db.sets.bulkPut(p.sets); nSets += p.fresh; }
    else { await db.measures.bulkPut(p.measures); nMeas += p.fresh; }
  }
  pending = [];
  await loadAll();
  const parts = [];
  if (nSets) parts.push(`${fmtInt(nSets)} nouvelles séries`);
  if (nMeas) parts.push(`${nMeas} mesures`);
  toast(parts.length ? `Import terminé : ${parts.join(", ")}.` : "Import terminé : rien de nouveau (aucun doublon créé).", "xp");
  app.rerender();
  celebrate(before, snapshot(), "Calculé à partir de tes données importées.");
}

function importCard(): string {
  const prev = pending.map((p) => p.kind === "workouts"
    ? `<li><b>Séances</b> (${esc(p.name)}) : ${p.sessions} séances, ${fmtInt(p.sets.length)} séries, du ${fmtDate(p.from)} au ${fmtDate(p.to)}. <span class="ok-txt">${p.fresh === 0 ? "Déjà tout importé" : `${fmtInt(p.fresh)} séries nouvelles`}</span>${p.unit === "lbs" ? " · converti depuis les livres" : ""}</li>`
    : `<li><b>Mesures</b> (${esc(p.name)}) : ${p.measures.length} pesées, du ${fmtDate(p.from)} au ${fmtDate(p.to)}. <span class="ok-txt">${p.fresh} nouvelles</span></li>`).join("");
  const err = errors.map((e) => `<li class="err">${esc(e)}</li>`).join("");
  return `<section class="card imp" aria-labelledby="imp-t"><h3 id="imp-t">Importer depuis Hevy</h3>
    <p class="hint">Dans Hevy : Profil → Réglages → Export &amp; Import Data. Tu peux envoyer les deux fichiers d'un coup ; ré-importer un nouvel export ne crée aucun doublon.</p>
    <label class="drop" id="drop"><input type="file" id="csvfile" class="drop-input" multiple aria-label="Choisir les fichiers CSV Hevy"><span><b>Touche pour choisir</b> tes fichiers CSV (ou glisse-les ici)</span></label><p class="hint" id="imp-status" role="status"></p>
    ${prev || err ? `<ul class="plain">${prev}${err}</ul>` : ""}
    ${pending.length ? `<div class="row"><button class="btn primary" data-act="do-import" style="--c:var(--train)">Valider l'import</button><button class="btn ghost" data-act="cancel-import">Annuler</button></div>` : ""}</section>`;
}

export const train: View = {
  render() {
    const r = state.result;
    let html = `<div class="section-head"><h2>Séances</h2></div><p class="lede">Tes séances Hevy, tes records et ta progression. Rien n'est envoyé nulle part : tout reste sur cet appareil.</p>${importCard()}`;
    if (!r.totalSessions) {
      return html + `<div class="empty" style="margin-top:16px">Aucune séance importée pour l'instant.</div>`;
    }
    if (!selected || !r.exercises.some((e) => e.name === selected)) selected = r.lifts[0]?.exercise ?? r.exercises[0].name;
    const ex = r.exercises.find((e) => e.name === selected)!;
    const unit = ex.kind === "load" ? " kg" : ex.kind === "time" ? " s" : " reps";
    const totalTon = r.sessions.reduce((a, s) => a + s.tonnage, 0);
    const wk = r.weekly.slice(-26);
    const recent = [...r.sessions].reverse().slice(0, 12).map((s) => `<li><span><b>${esc(s.title || "Séance")}</b> <span class="d">${esc(fmtDate(s.day, { weekday: "short", day: "numeric", month: "short" }))} · ${s.sets} séries · ${fmtInt(s.tonnage)} kg${s.records.length ? ` · ${s.records.length} record${s.records.length > 1 ? "s" : ""}` : ""}</span></span><span class="x">+${s.xp} XP</span></li>`).join("");
    const recs = [...r.records].reverse().slice(0, 10).map((x) => `<li><span><b>${esc(x.exercise)}</b> <span class="d">${esc(fmtDate(x.date))}</span></span><span class="x">${Math.round(x.score * 10) / 10}${x.kind === "load" ? " kg e1RM" : x.kind === "time" ? " s" : " reps"}</span></li>`).join("");
    const opts = r.exercises.map((e) => `<option value="${esc(e.name)}" ${e.name === selected ? "selected" : ""}>${esc(e.name)} (niv. ${e.level})</option>`).join("");
    const bwPts = r.bodyweight.map((b) => ({ day: b.date, value: b.kg }));

    html += `<div class="stats kpis"><div class="stat"><b>${r.totalSessions}</b><span>séances</span></div><div class="stat"><b>${fmtInt(r.sessions.reduce((a, s) => a + s.sets, 0))}</b><span>séries</span></div><div class="stat"><b>${fmtInt(totalTon / 1000)} t</b><span>soulevées au total</span></div></div>
    <h2 class="sub">Volume par semaine</h2><div class="card">${barChart(wk.map((w) => ({ label: fmtDate(w.week, { day: "numeric", month: "short" }), value: w.tonnage })), " kg", "Tonnage par semaine")}<p class="hint">Tonnage = charge × répétitions, hors séries d'échauffement.</p></div>
    <h2 class="sub">Poids de corps</h2><div class="card">${bwPts.length ? lineChart(bwPts, " kg", "Poids de corps", state.prefs.targetWeightKg) : `<p class="empty">Pas de mesures importées. Importe l'export des mesures de Hevy ci-dessus pour voir ta courbe.</p>`}</div>
    <h2 class="sub">Progression par exercice</h2><div class="card"><label class="field"><span>Exercice</span><select id="exsel">${opts}</select></label>
    <p><b>Niveau ${ex.level}</b> · record ${Math.round(ex.best * 10) / 10}${unit}${ex.kind === "load" ? " (e1RM)" : ""} · le ${esc(fmtDate(ex.bestDay))}</p>
    ${lineChart(ex.history.map((h) => ({ day: h.day, value: h.best })), unit.trim() === "kg" ? " kg" : ` ${unit.trim()}`, `Record de ${ex.name}`)}
    <p class="hint">${ex.kind === "load" ? "e1RM = charge maximale estimée (formule d'Epley)." : ex.kind === "time" ? "Durée maximale tenue." : "Répétitions sans charge (ou avec assistance)."}</p></div>
    <div class="grid2"><div><h2 class="sub">Dernières séances</h2><ul class="hist">${recent}</ul></div><div><h2 class="sub">Derniers records</h2>${recs ? `<ul class="hist">${recs}</ul>` : `<div class="empty">Pas encore de record battu.</div>`}</div></div>`;
    return html;
  },
  after() {
    const drop = document.getElementById("drop");
    const input = document.getElementById("csvfile") as HTMLInputElement | null;
    if (!drop || !input) return;
    input.addEventListener("change", () => {
      if (!input.files?.length) return;
      const st = document.getElementById("imp-status");
      if (st) st.textContent = "Lecture du fichier…";
      const files = [...input.files];
      prepare(files).catch((e) => { if (st) st.textContent = `Erreur : ${(e as Error).message}`; });
    });
    drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
    drop.addEventListener("dragleave", () => drop.classList.remove("over"));
    drop.addEventListener("drop", (e) => {
      e.preventDefault();
      drop.classList.remove("over");
      const fl = e.dataTransfer?.files;
      if (fl?.length) void prepare([...fl]);
    });
  },
  async click(act) {
    if (act === "do-import") await confirmImport();
    else if (act === "cancel-import") { pending = []; errors = []; app.rerender(); }
  },
  change(el) {
    if (el.id === "exsel") { selected = el.value; app.rerender(); }
  },
};



