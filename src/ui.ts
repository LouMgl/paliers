// Petits outils d'interface : échappement, notifications, boîtes de dialogue, célébrations.
import { RPG } from "./rpg.config.ts";
import { state, type Snapshot } from "./store.ts";

export const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);

export const esc = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const fmtInt = (n: number) => Math.round(n).toLocaleString("fr-FR");
export const fmtDate = (day: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) =>
  new Date(`${day}T12:00:00`).toLocaleDateString("fr-FR", opts);

export const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

/* ---------- notifications ---------- */
export function toast(msg: string, kind = ""): void {
  const el = document.createElement("div");
  el.className = `toast ${kind}`;
  el.textContent = msg;
  $("#toasts")!.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

/* ---------- boîte de dialogue ---------- */
export function openDlg(html: string): void {
  $("#dlgBody")!.innerHTML = html;
  const d = $<HTMLDialogElement>("#dlg")!;
  if (!d.open) d.showModal();
}
export function closeDlg(): void {
  const d = $<HTMLDialogElement>("#dlg")!;
  if (d.open) d.close();
}

/* ---------- son (facultatif) ---------- */
let audio: AudioContext | null = null;
export function beep(notes: number[] = [660, 880]): void {
  if (!state.prefs.sound) return;
  try {
    audio ??= new AudioContext();
    let t = audio.currentTime;
    for (const f of notes) {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = "square"; o.frequency.value = f;
      g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.connect(g).connect(audio.destination);
      o.start(t); o.stop(t + 0.15);
      t += 0.12;
    }
  } catch { /* le son est un bonus */ }
}

export function vibrate(ms = 40): void {
  try { navigator.vibrate?.(ms); } catch { /* ignoré */ }
}

/* ---------- célébrations : records et montées de niveau ---------- */
export function celebrate(before: Snapshot, after: Snapshot, context: string): boolean {
  const newRecords = [...after.recordKeys].filter((k) => !before.recordKeys.has(k)).map((k) => k.split("|")[0]);
  const names = [...new Set(newRecords)];
  const levelUp = after.level > before.level;
  if (!names.length && !levelUp) return false;
  const anim = state.prefs.animations ? "" : " calm";
  const parts: string[] = [];
  if (names.length) {
    const shown = names.slice(0, 6).map(esc).join(", ");
    const more = names.length > 6 ? ` et ${names.length - 6} autres` : "";
    parts.push(`<div class="cel-block crit"><p class="cel-kicker">Coup critique !</p><h2>${names.length} nouveau${names.length > 1 ? "x" : ""} record${names.length > 1 ? "s" : ""}</h2><p>${shown}${more}</p></div>`);
  }
  if (levelUp) {
    parts.push(`<div class="cel-block lvl-up"><p class="cel-kicker">Niveau supérieur</p><h2>Niveau ${after.level}</h2><p>Rang : ${esc(after.rank)}${after.rank !== before.rank ? " (nouveau rang !)" : ""}</p></div>`);
  }
  const ov = document.createElement("div");
  ov.className = `celebrate${anim}`;
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-modal", "true");
  ov.setAttribute("aria-label", "Récompense");
  ov.innerHTML = `<div class="cel-card">${parts.join("")}<p class="cel-ctx">${esc(context)}</p><button class="btn primary big" data-act="cel-close">Continuer</button></div>`;
  document.body.appendChild(ov);
  ov.querySelector<HTMLButtonElement>("button")!.focus();
  ov.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("[data-act=cel-close]")) ov.remove();
  });
  beep(levelUp ? [523, 659, 784, 1046] : [880, 1175]);
  vibrate(80);
  return true;
}

export const rankName = (level: number) => {
  let n = RPG.ranks[0].name;
  for (const r of RPG.ranks) if (level >= r.min) n = r.name;
  return n;
};

export function xpBar(pct: number, segments = 20): string {
  let on = Math.round(pct * segments);
  if (pct > 0 && on < 1) on = 1;
  let s = "";
  for (let i = 0; i < segments; i++) s += `<i class="${i < on ? "on" : ""}"></i>`;
  return s;
}

/** Permet aux vues de demander un nouvel affichage sans import circulaire. */
export const app = { rerender: (): void => {}, go: (_tab: string): void => {} };

export function videoBlock(id: string, url: string | undefined, embed: string | null): string {
  const online = navigator.onLine;
  let body: string;
  if (url && embed && online) {
    body = `<div class="video"><iframe src="${esc(embed)}" title="Vidéo de démonstration" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;
  } else if (url) {
    body = `<p class="hint">${online ? "Ce lien n'est pas une vidéo YouTube intégrable." : "Pas de connexion : la vidéo n'est pas disponible."} Les consignes écrites restent valables.</p>${/^https?:\/\//i.test(url) ? `<p><a href="${esc(url)}" target="_blank" rel="noopener">Ouvrir le lien</a></p>` : ""}`;
  } else {
    body = `<p class="hint">Pas encore de vidéo. Ajoute un lien YouTube que tu as choisi et validé.</p>`;
  }
  return `${body}<button class="btn ghost small" data-act="set-video" data-id="${esc(id)}">${url ? "Changer le lien vidéo" : "Ajouter un lien vidéo"}</button>`;
}
