import { RPG } from "../rpg.config.ts";
import { state } from "../store.ts";
import { avatarSvg } from "../avatar.ts";
import { CHECK, esc, fmtInt, xpBar } from "../ui.ts";
import type { View } from "./types.ts";

const STATS: { k: "force" | "endurance" | "mobilite" | "vitalite"; label: string; color: string; hint: string }[] = [
  { k: "force", label: "Force", color: "var(--train)", hint: "Niveau de tes exercices principaux" },
  { k: "endurance", label: "Endurance", color: "var(--xp)", hint: "Régularité et volume des dernières semaines" },
  { k: "mobilite", label: "Mobilité", color: "var(--move)", hint: "Routines faites et tests de souplesse" },
  { k: "vitalite", label: "Vitalité", color: "var(--food)", hint: "Repas cuisinés et cap vers ta cible" },
];

export const home: View = {
  render() {
    const r = state.result;
    const li = r.level;
    const ri = r.rankIndex;
    const next = RPG.ranks[ri + 1];
    const sub = next ? `Prochain rang : ${next.name} au niveau ${next.min}` : "Rang maximum atteint";
    const empty = r.totalSessions === 0;

    const stats = STATS.map((s) => {
      const v = r.stats[s.k];
      return `<div class="stbar" style="--c:${s.color}" title="${esc(s.hint)}"><div class="stbar-h"><span>${s.label}</span><b>${v}<small>/${RPG.stats.scaleMax}</small></b></div><div class="stbar-t" role="progressbar" aria-label="${s.label}" aria-valuemin="0" aria-valuemax="${RPG.stats.scaleMax}" aria-valuenow="${v}"><i style="width:${(v / RPG.stats.scaleMax) * 100}%"></i></div></div>`;
    }).join("");

    const quest = (q: (typeof r.dailyQuests)[number]) =>
      `<button class="quest ${q.done ? "done" : ""}" data-go="${q.tab}" style="--c:${q.tab === "train" ? "var(--train)" : q.tab === "move" ? "var(--move)" : "var(--food)"}"><span class="ck">${q.done ? CHECK : ""}</span><span class="qt">${esc(q.label)}${q.progress ? `<small class="qp">${esc(q.progress)}</small>` : ""}</span>${q.xp ? `<span class="qx">+${q.xp} XP</span>` : ""}</button>`;

    const bosses = r.lifts.map((l) => {
      const pct = Math.min(1, l.ratio / l.bossRatio);
      const done = l.ratio >= l.bossRatio;
      return `<div class="boss ${done ? "beaten" : ""}"><div class="boss-h"><b>${esc(l.label)}</b><span>${done ? "Boss vaincu !" : `${(l.ratio).toFixed(2)} × ton poids de corps`}</span></div><div class="stbar-t" role="progressbar" aria-label="Boss ${esc(l.label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct * 100)}"><i style="width:${pct * 100}%"></i></div><p class="hint">Objectif : ${l.bossRatio.toString().replace(".", ",")} × ton poids de corps · niveau ${l.level}/${l.maxLevel}</p></div>`;
    }).join("");

    const road = RPG.ranks.map((rk, i) => {
      const cls = i < ri ? "done" : i === ri ? "cur" : "lock";
      const to = RPG.ranks[i + 1];
      const range = to ? `Niveau ${rk.min}${to.min - 1 > rk.min ? ` à ${to.min - 1}` : ""}` : `Niveau ${rk.min} et plus`;
      return `<li class="${cls}"><b>${rk.name}</b><span>${range}, dès ${fmtInt(RPG.xpForLevel(rk.min))} XP</span></li>`;
    }).join("");

    const badges = r.badges.map((b) => `<div class="bd ${b.ok ? "ok" : "lock"}"><b>${esc(b.name)}</b><span>${esc(b.desc)}</span><div class="st">${b.ok ? "Débloqué" : "À débloquer"}</div></div>`).join("");

    const cta = empty
      ? `<div class="empty" style="margin-top:16px"><b>Commence l'aventure.</b> Importe ton export Hevy dans l'onglet Séances : tes niveaux, records et quêtes se calculent tout seuls. <button class="btn small primary" data-go="train" style="--c:var(--train);margin-top:8px">Importer mes séances</button></div>`
      : "";

    return `<section class="hero" aria-label="Ton personnage">
      <div class="hero-av">${avatarSvg(ri, `Avatar, rang ${r.rank}`)}<span class="lvlchip">niv. ${li.level}</span></div>
      <div><h1>${esc(state.prefs.name)}</h1><p class="rk">${esc(r.rank)} · ${sub}</p>
      <div class="xpbar" role="progressbar" aria-valuemin="0" aria-valuemax="${li.need}" aria-valuenow="${li.into}" aria-label="Progression vers le niveau ${li.level + 1}">${xpBar(li.pct)}</div>
      <p class="xpnum">${fmtInt(li.into)} sur ${fmtInt(li.need)} XP pour le niveau ${li.level + 1} · ${fmtInt(r.totalXp)} XP au total</p></div>
      <div class="stats"><div class="stat"><b>${r.totalSessions}</b><span>séances</span></div><div class="stat"><b>${r.streakWeeks}</b><span>semaines de suite</span></div><div class="stat"><b>${r.records.length}</b><span>records battus</span></div></div>
    </section>${cta}
    <h2 class="sub">Caractéristiques</h2><div class="stbars">${stats}</div>
    <div class="grid2"><div><h2 class="sub">Quêtes du jour</h2>${r.dailyQuests.map(quest).join("")}</div>
    <div><h2 class="sub">Quêtes de la semaine</h2>${r.weeklyQuests.map(quest).join("")}</div></div>
    ${bosses ? `<h2 class="sub">Boss</h2><div class="grid2">${bosses}</div>` : ""}
    <div class="grid2"><div><h2 class="sub">Les paliers</h2><ul class="road">${road}</ul></div><div><h2 class="sub">Badges</h2><div class="badges">${badges}</div></div></div>
    <p class="tiny">Ta progression est calculée sur cet appareil à partir de tes données. Les seuils de niveau sont des repères de jeu, pas des normes médicales.</p>`;
  },
};

