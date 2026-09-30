import { db } from "../db.ts";
import { MOMENTS, MOVES, MOVE_BY_ID, ROUTINES, TESTS, ZONES, buildSteps, routineMinutes, type Moment, type Routine, type StepPlan, type Zone } from "../data/mobility.ts";
import { testsImproved, type MobilityTest } from "../engine.ts";
import { lineChart } from "../charts.ts";
import { RPG } from "../rpg.config.ts";
import { addLog, dayKey, snapshot, state, videoFor } from "../store.ts";
import { app, cue, unlockAudio, celebrate, closeDlg, esc, fmtDate, openDlg, toast, vibrate, videoBlock, $ } from "../ui.ts";
import { embedUrl } from "../files.ts";
import type { View } from "./types.ts";

interface Player {
  r: Routine;
  steps: StepPlan[];
  i: number;
  /** Échéance de la phase en cours (décompte d'annonce, puis exercice) */
  endAt: number;
  total: number;
  paused: boolean;
  remain: number;
  phase: "intro" | "run";
  lastSec: number;
}

const INTRO_SECONDS = 3;

let P: Player | null = null;
let timer: number | undefined;
let moment: Moment | "all" = "all";
let done: { name: string; xp: number } | null = null;
let wakeLock: { release(): Promise<void> } | null = null;

const CIRC = 2 * Math.PI * 52;
const fmt = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : String(s));

async function lockScreen(on: boolean): Promise<void> {
  try {
    if (on) wakeLock = await (navigator as unknown as { wakeLock: { request(t: string): Promise<{ release(): Promise<void> }> } }).wakeLock.request("screen");
    else { await wakeLock?.release(); wakeLock = null; }
  } catch { /* facultatif */ }
}

function stopPlayer(): void {
  if (timer) clearInterval(timer);
  timer = undefined;
  P = null;
  document.body.classList.remove("playing");
  void lockScreen(false);
  try { if (document.fullscreenElement) void document.exitFullscreen(); } catch { /* ignoré */ }
}

/** Nouvel exercice : annonce sonore (3, 2, 1, départ), puis la vidéo démarre et le minuteur de l'exercice aussi. */
function goStep(i: number): void {
  if (!P) return;
  const st = P.steps[i];
  P.i = i;
  P.total = st.duree;
  P.paused = false;
  if (st.prep) {
    P.phase = "run";
    P.endAt = Date.now() + st.duree * 1000;
  } else {
    P.phase = "intro";
    P.lastSec = -1;
    P.endAt = Date.now() + INTRO_SECONDS * 1000;
    cue([523, 659]); // petit jingle : « ça va commencer »
  }
  app.rerender();
  vibrate(40);
}

function tick(): void {
  if (!P || P.paused) return;
  const now = Date.now();
  if (P.phase === "intro") {
    const sec = Math.max(0, Math.ceil((P.endAt - now) / 1000));
    if (sec !== P.lastSec) {
      P.lastSec = sec;
      const n = document.getElementById("intronum");
      if (n) n.textContent = String(sec);
      if (sec > 0) cue([660], 0.1);
    }
    if (now >= P.endAt) {
      P.phase = "run";
      P.endAt = now + P.total * 1000;
      cue([880, 1175]); // top départ
      vibrate(60);
      app.rerender(); // la vidéo se charge ici
    }
    return;
  }
  const rem = Math.max(0, Math.ceil((P.endAt - now) / 1000));
  const n = $("#tnum"), pg = document.getElementById("pg");
  if (n) n.textContent = fmt(rem);
  if (pg) pg.setAttribute("stroke-dashoffset", String(CIRC * (1 - rem / P.total)));
  if (rem <= 0) next();
}

function next(): void {
  if (!P) return;
  if (P.i + 1 < P.steps.length) goStep(P.i + 1);
  else void finish();
}

async function finish(): Promise<void> {
  if (!P) return;
  const r = P.r;
  stopPlayer();
  const before = snapshot();
  const today = dayKey();
  const n = state.logs.filter((l) => l.type === "stretch" && l.day === today).length;
  const xp = n < RPG.xp.mobilityRoutinesPerDay ? RPG.xp.mobilityRoutine : 0;
  await addLog({ type: "stretch", day: today, xp, label: `Mobilité : ${r.nom}`, ref: r.id });
  if (xp) toast(`+${xp} XP  Mobilité`, "xp");
  done = { name: r.nom, xp };
  app.rerender();
  celebrate(before, snapshot(), "Ton corps te remercie.");
}

function renderPlayer(): string {
  const p = P!;
  const st = p.steps[p.i];
  const total = p.steps.length - 1;
  const url = st.prep ? undefined : videoFor(st.id);
  const emb = embedUrl(url, true);
  let stage = "";
  if (p.phase === "intro") {
    const sec = Math.max(1, Math.ceil((p.endAt - Date.now()) / 1000));
    stage = `<div class="fs-stage intro" role="status" aria-live="polite"><p>Ça va commencer…</p><b id="intronum">${sec}</b><span>${esc(st.nom)}${st.side ? ` · côté ${st.side}` : ""}</span></div>`;
  } else if (emb && navigator.onLine) {
    stage = `<div class="fs-stage"><iframe src="${esc(emb)}" title="Démonstration : ${esc(st.nom)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;
  } else if (!st.prep) {
    stage = `<div class="fs-stage intro"><p>${navigator.onLine ? "Pas de vidéo pour cet exercice" : "Hors ligne : pas de vidéo"}</p><span>Suis les consignes écrites ci-dessous</span></div>`;
  }
  return `<div class="player fs ${stage ? "" : "novideo"}">${stage}
    <div class="fs-info"><p class="prog">${st.prep ? "Prépare-toi" : `Étape ${p.i} sur ${total}`}</p>
    <div class="fs-row"><div class="ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="tr" cx="60" cy="60" r="52"/><circle class="pg" id="pg" cx="60" cy="60" r="52" stroke-dasharray="${CIRC}" stroke-dashoffset="${p.phase === "intro" || st.prep ? 0 : CIRC * (1 - Math.max(0, Math.ceil((p.endAt - Date.now()) / 1000)) / p.total)}"/></svg><div class="num" id="tnum" role="timer">${fmt(p.phase === "intro" ? st.duree : Math.max(0, Math.ceil((p.endAt - Date.now()) / 1000)))}</div></div>
    <div><h2>${esc(st.nom)}</h2>${st.side ? `<p class="side">Côté ${st.side}</p>` : ""}</div></div>
    <p class="cue">${esc(st.consignes)}</p>
    <div class="pbtns"><button class="btn" data-act="pause" id="pbtn">Pause</button><button class="btn" data-act="skip">Passer</button><button class="btn ghost" data-act="quit">Quitter</button></div>
    <p class="hint">Douleur vive, douleur qui descend dans la jambe ou fourmillements : arrête.</p></div></div>`;
}

function testsSection(): string {
  const tests = [...state.tests].sort((a, b) => a.date.localeCompare(b.date));
  const last = tests[tests.length - 1];
  const today = dayKey();
  const days = last ? Math.floor((Date.parse(today) - Date.parse(last.date)) / 86400000) : null;
  const due = days === null || days >= RPG.mobilityTestEveryDays;
  const status = last
    ? `Dernier test : ${esc(fmtDate(last.date))} (il y a ${days} jour${days === 1 ? "" : "s"}). ${due ? "C'est le moment de le refaire !" : `Prochain test dans ${RPG.mobilityTestEveryDays - days!} jours.`}`
    : "Fais ton premier test pour avoir un point de départ, puis refais-le toutes les 4 semaines.";
  const charts = TESTS.map((t) => {
    const pts = tests.filter((x) => x.values[t.id] !== undefined).map((x) => ({ day: x.date, value: x.values[t.id] }));
    if (pts.length < 2) return `<div class="card"><h3>${esc(t.nom)}</h3><p class="hint">${pts.length ? `Point de départ : ${pts[0].value} ${t.unite}. La courbe apparaîtra au prochain test.` : "Pas encore de mesure."}</p></div>`;
    return `<div class="card"><h3>${esc(t.nom)}</h3>${lineChart(pts, ` ${t.unite}`, `Progression : ${t.nom}`)}</div>`;
  }).join("");
  return `<h2 class="sub">Tests de mobilité</h2><p class="lede">Quatre mesures simples, toutes les 4 semaines. Ce sont elles qui montrent que tu deviens plus souple.</p>
    <div class="card"><p>${status}</p><button class="btn ${due ? "primary" : ""} small" data-act="new-test" style="--c:var(--move);margin-top:8px">Faire le test</button></div>
    <div class="grid2" style="margin-top:12px">${charts}</div>`;
}

function openTest(): void {
  const last = [...state.tests].sort((a, b) => a.date.localeCompare(b.date)).pop();
  const fields = TESTS.map((t) => `<label class="field"><span>${esc(t.nom)} (${t.unite})</span><input type="number" inputmode="numeric" id="t-${t.id}" min="${t.min}" max="${t.max}" step="${t.step}" value="${last?.values[t.id] ?? ""}"><small class="hint">${esc(t.consigne)}</small></label>`).join("");
  openDlg(`<h2 id="dlgTitle">Test de mobilité</h2><p class="hint">Pas de douleur : reste dans une amplitude confortable. Laisse vide un test que tu ne fais pas.</p>${fields}
    <div class="row"><button class="btn primary" data-act="save-test" style="--c:var(--move)">Enregistrer</button><button class="btn" data-act="close">Annuler</button></div>`);
}

async function saveTest(): Promise<void> {
  const values: Record<string, number> = {};
  for (const t of TESTS) {
    const v = ($<HTMLInputElement>(`#t-${t.id}`)!.value).trim();
    if (v === "") continue;
    const n = Number(v);
    if (!Number.isFinite(n) || n < t.min || n > t.max) { toast(`${t.nom} : valeur entre ${t.min} et ${t.max}.`); return; }
    values[t.id] = n;
  }
  if (!Object.keys(values).length) { toast("Renseigne au moins un test."); return; }
  const before = snapshot();
  const prev = [...state.tests].sort((a, b) => a.date.localeCompare(b.date)).pop();
  const today = dayKey();
  const test: MobilityTest = { date: today, values };
  await db.tests.put(test);
  state.tests = await db.tests.toArray();
  const improved = prev && prev.date !== today ? testsImproved(prev, test) : 0;
  if (improved > 0) {
    await addLog({ type: "test", day: today, xp: RPG.xp.mobilityTestImproved, label: `Test de mobilité amélioré (${improved})`, ref: today });
    toast(`Progrès sur ${improved} test${improved > 1 ? "s" : ""} ! +${RPG.xp.mobilityTestImproved} XP`, "xp");
  } else toast("Test enregistré");
  closeDlg();
  app.rerender();
  celebrate(before, snapshot(), "Bravo pour ta régularité.");
}

function catalogue(): string {
  const byZone = (Object.keys(ZONES) as Zone[]).map((z) => {
    const items = MOVES.filter((m) => m.zone === z).map((m) => {
      const url = videoFor(m.id);
      return `<details class="mv"><summary><b>${esc(m.nom)}</b> <span class="d">${m.duree} s${m.cotes ? " par côté" : ""}${m.dynamique ? " · dynamique" : ""}</span></summary>
        <p>${esc(m.consignes)}</p><p><b>Erreurs fréquentes :</b> ${esc(m.erreurs)}</p><p><b>Pour progresser :</b> ${esc(m.progression)}</p>${videoBlock(m.id, url, embedUrl(url))}</details>`;
    }).join("");
    return `<div class="zone"><h3>${ZONES[z]}</h3>${items}</div>`;
  }).join("");
  return `<h2 class="sub">Tous les exercices</h2><div class="zones">${byZone}</div>`;
}

export const move: View = {
  render() {
    if (P) return renderPlayer();
    const banner = done ? `<div class="done-banner">Routine terminée : ${esc(done.name)}. ${done.xp ? `+${done.xp} XP.` : "Tu as déjà gagné l'XP de mobilité du jour, mais ton corps te remercie quand même."}</div>` : "";
    const chips = [["all", "Toutes"], ...Object.entries(MOMENTS)].map(([k, v]) => `<button class="chip" data-mom="${k}" aria-pressed="${moment === k}">${v}</button>`).join("");
    const cards = ROUTINES.filter((r) => moment === "all" || r.moment === moment).map((r) => {
      const names = [...new Set(buildSteps(r).slice(1).map((s) => s.nom))];
      return `<article class="card rt"><span class="cat">${MOMENTS[r.moment]}</span><h3>${esc(r.nom)}</h3><p>${esc(r.resume)}</p><p><b>${routineMinutes(r)} min</b> environ</p><ul>${names.map((n) => `<li>${esc(n)}</li>`).join("")}</ul><button class="btn primary" data-act="play" data-id="${r.id}">Démarrer</button></article>`;
    }).join("");
    return `<div class="section-head"><h2>Mobilité</h2></div>
      <p class="lede">Des routines guidées pour gagner en souplesse sur tout le corps. Lance-en une et suis le rythme.</p>${banner}
      <div class="safe"><b>À savoir.</b> Ces mouvements sont doux et progressifs, sans à-coups. Arrête en cas de douleur vive, de douleur qui descend dans la jambe ou de fourmillements, et consulte un médecin ou un kiné. Ce n'est pas un avis médical : ton suivi actuel prime.</div>
      <div class="chips" role="group" aria-label="Filtrer par moment">${chips}</div>
      <div class="routines">${cards}</div>${testsSection()}${catalogue()}`;
  },
  async click(act, el) {
    if (act === "play") {
      const r = ROUTINES.find((x) => x.id === el.dataset.id)!;
      done = null;
      P = { r, steps: buildSteps(r), i: 0, endAt: 0, total: 0, paused: false, remain: 0, phase: "run", lastSec: -1 };
      unlockAudio(); // le son doit être débloqué par un geste : ce tap sur « Démarrer »
      document.body.classList.add("playing");
      try { void document.documentElement.requestFullscreen?.(); } catch { /* iPhone : l'app installée est déjà en plein écran */ }
      void lockScreen(true);
      goStep(0);
      timer = window.setInterval(tick, 250);
    } else if (act === "pause" && P) {
      if (P.paused) { P.endAt = Date.now() + P.remain * 1000; P.paused = false; el.textContent = "Pause"; }
      else { P.remain = Math.max(0, Math.ceil((P.endAt - Date.now()) / 1000)); P.paused = true; el.textContent = "Reprendre"; }
    } else if (act === "skip") next();
    else if (act === "quit") { stopPlayer(); app.rerender(); }
    else if (act === "new-test") openTest();
    else if (act === "save-test") await saveTest();
    else if (act === "show-video") {
      if (P && !P.paused) { P.remain = Math.max(0, Math.ceil((P.endAt - Date.now()) / 1000)); P.paused = true; const b = document.getElementById("pbtn"); if (b) b.textContent = "Reprendre"; }
      const id = el.dataset.id!;
      const url = videoFor(id);
      openDlg(`<h2 id="dlgTitle">${esc(MOVE_BY_ID[id]?.nom ?? "Vidéo")}</h2>${videoBlock(id, url, embedUrl(url))}<p class="hint">Le minuteur est en pause. Reprends-le quand tu veux.</p><div class="row"><button class="btn" data-act="close">Fermer</button></div>`);
    }
  },
  leave() { if (P) stopPlayer(); },
  change() {},
};

export function setMoment(m: string): void { moment = m as Moment | "all"; }







