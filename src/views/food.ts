import { db, type Recipe } from "../db.ts";
import { RECIPES, TYPES } from "../data/recipes.ts";
import { addLog, dayKey, savePrefs, snapshot, state } from "../store.ts";
import { RPG } from "../rpg.config.ts";
import { app, celebrate, closeDlg, esc, openDlg, toast, videoBlock, $ } from "../ui.ts";
import { embedUrl, isHttpUrl, loadPhotoUrls, savePhoto } from "../files.ts";
import type { View } from "./types.ts";

let cat = "all";
let q = "";
let onlyFav = false;
let photos = new Map<string, string>();
let formPhoto: File | null = null;

const all = (): Recipe[] => [...RECIPES, ...state.recipes.map((r) => ({ ...r, custom: true }))];
const videoOf = (r: Recipe) => r.custom ? r.videoUrl : state.prefs.videos[r.id];
const cookedCount = (id: string) => state.logs.filter((l) => l.type === "cook" && l.ref === id).length;

function thumb(r: Recipe): string {
  const u = photos.get(r.id);
  return u
    ? `<img class="rc-img" src="${u}" alt="" loading="lazy">`
    : `<div class="rc-img ph" aria-hidden="true">${esc(TYPES[r.type].charAt(0))}</div>`;
}

function grid(): string {
  const term = q.trim().toLowerCase();
  const list = all().filter((r) =>
    (cat === "all" || r.type === cat) &&
    (!onlyFav || state.prefs.favorites.includes(r.id)) &&
    (!term || `${r.nom} ${r.tags.join(" ")} ${r.ingredients.join(" ")}`.toLowerCase().includes(term)));
  if (!list.length) return `<div class="empty">Aucune recette ne correspond. Essaie un autre filtre ou ajoute la tienne.</div>`;
  return list.map((r) => {
    const n = cookedCount(r.id);
    const fav = state.prefs.favorites.includes(r.id);
    return `<button class="card rc" data-act="open-recipe" data-id="${esc(r.id)}">${thumb(r)}<span class="cat">${TYPES[r.type]}${r.custom ? " (la tienne)" : ""}${fav ? " · ★" : ""}</span><h3>${esc(r.nom)}</h3>
      <div class="rm"><span><b>${esc(r.kcal)}</b> kcal</span><span><b>${esc(r.proteines)}</b> g prot.</span><span><b>${esc(r.temps)}</b> min</span></div>
      <div class="tags">${r.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>${n ? `<span class="cooked">Cuisinée ${n} fois</span>` : ""}</button>`;
  }).join("");
}

function openRecipe(id: string): void {
  const r = all().find((x) => x.id === id);
  if (!r) return;
  const done = state.logs.some((l) => l.type === "cook" && l.ref === id && l.day === dayKey());
  const fav = state.prefs.favorites.includes(id);
  const url = videoOf(r);
  const big = photos.get(id);
  openDlg(`<h2 id="dlgTitle">${esc(r.nom)}</h2>
    ${big ? `<img class="rc-big" src="${big}" alt="Photo de ${esc(r.nom)}">` : ""}
    <div class="rm"><span><b>${esc(r.kcal)}</b> kcal</span><span><b>${esc(r.proteines)}</b> g protéines</span><span><b>${esc(r.temps)}</b> min</span></div>
    <p class="hint">Valeurs approximatives, pour une portion.</p>
    <h3 style="margin-top:12px">Ingrédients</h3><ul>${r.ingredients.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
    <h3>Préparation</h3><ol>${r.etapes.map((i) => `<li>${esc(i)}</li>`).join("")}</ol>
    <h3>Vidéo</h3>${videoBlock(r.id, url, embedUrl(url))}
    <div class="row"><button class="btn primary" data-act="cook" data-id="${esc(id)}" style="--c:var(--food)" ${done ? "disabled" : ""}>${done ? "Déjà cuisinée aujourd'hui" : `J'ai cuisiné cette recette (+${RPG.xp.recipeCooked} XP)`}</button>
    <button class="btn" data-act="fav" data-id="${esc(id)}" aria-pressed="${fav}">${fav ? "★ Favori" : "☆ Ajouter aux favoris"}</button>
    <label class="btn ghost">Photo<input type="file" accept="image/*" hidden data-photo-for="${esc(id)}"></label>
    ${r.custom ? `<button class="btn ghost" data-act="edit-recipe" data-id="${esc(id)}">Modifier</button><button class="btn ghost" data-act="del-recipe" data-id="${esc(id)}">Supprimer</button>` : ""}
    <button class="btn" data-act="close">Fermer</button></div>`);
}

function openForm(existing?: Recipe): void {
  formPhoto = null;
  const r = existing;
  openDlg(`<h2 id="dlgTitle">${r ? "Modifier la recette" : "Ajouter une recette"}</h2>
    <label class="field"><span>Nom</span><input type="text" id="rf-name" value="${esc(r?.nom)}"></label>
    <label class="field"><span>Type</span><select id="rf-type">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${r?.type === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
    <div class="frow"><label class="field"><span>Calories</span><input type="number" inputmode="numeric" id="rf-kcal" min="0" value="${r ? r.kcal : ""}"></label><label class="field"><span>Protéines (g)</span><input type="number" inputmode="numeric" id="rf-p" min="0" value="${r ? r.proteines : ""}"></label><label class="field"><span>Temps (min)</span><input type="number" inputmode="numeric" id="rf-min" min="0" value="${r ? r.temps : ""}"></label></div>
    <label class="field"><span>Ingrédients, un par ligne</span><textarea id="rf-ing">${esc(r?.ingredients.join("\n"))}</textarea></label>
    <label class="field"><span>Étapes, une par ligne</span><textarea id="rf-steps">${esc(r?.etapes.join("\n"))}</textarea></label>
    <label class="field"><span>Lien vidéo YouTube (facultatif)</span><input type="url" id="rf-video" value="${esc(r?.videoUrl)}" placeholder="https://www.youtube.com/watch?v=…"></label>
    <label class="field"><span>Photo (depuis ta pellicule, facultatif)</span><input type="file" id="rf-photo" accept="image/*"></label>
    <div class="row"><button class="btn primary" data-act="save-recipe" data-id="${esc(r?.id ?? "")}" style="--c:var(--food)">Enregistrer</button><button class="btn" data-act="close">Annuler</button></div>`);
}

async function saveRecipe(id: string): Promise<void> {
  const name = ($<HTMLInputElement>("#rf-name")!.value).trim();
  if (!name) { toast("Donne un nom à la recette."); return; }
  const lines = (sel: string) => ($<HTMLTextAreaElement>(sel)!.value).split("\n").map((s) => s.trim()).filter(Boolean);
  const video = $<HTMLInputElement>("#rf-video")!.value.trim();
  if (video && !isHttpUrl(video)) { toast("Le lien vidéo doit commencer par https://"); return; }
  const rid = id || `c${Date.now()}`;
  const rec: Recipe = {
    id: rid, nom: name, type: $<HTMLSelectElement>("#rf-type")!.value as Recipe["type"],
    kcal: +$<HTMLInputElement>("#rf-kcal")!.value || 0, proteines: +$<HTMLInputElement>("#rf-p")!.value || 0,
    temps: +$<HTMLInputElement>("#rf-min")!.value || 0, tags: ["Perso"],
    ingredients: lines("#rf-ing"), etapes: lines("#rf-steps"), videoUrl: video || undefined, custom: true,
  };
  await db.recipes.put(rec);
  state.recipes = await db.recipes.toArray();
  const file = $<HTMLInputElement>("#rf-photo")!.files?.[0] ?? formPhoto;
  if (file) { try { await savePhoto(rid, file); } catch { toast("Photo illisible, recette enregistrée sans photo."); } }
  closeDlg();
  toast("Recette enregistrée");
  app.rerender();
}

export const food: View = {
  async render() {
    photos = await loadPhotoUrls();
    const chips = [["all", "Tout"], ...Object.entries(TYPES)].map(([k, v]) => `<button class="chip" data-cat="${k}" aria-pressed="${cat === k}">${v}</button>`).join("")
      + `<button class="chip" data-act="only-fav" aria-pressed="${onlyFav}">★ Favoris</button>`;
    return `<div class="section-head"><h2>Cuisine</h2><button class="btn small" data-act="new-recipe">Ajouter une recette</button></div>
      <p class="lede">Des recettes simples pour manger plus sans te forcer. Les valeurs sont approximatives, pour une portion.</p>
      <div class="chips" role="group" aria-label="Filtrer par type">${chips}</div>
      <input class="search" type="search" id="q" placeholder="Chercher une recette" aria-label="Chercher une recette" value="${esc(q)}">
      <div class="rgrid" id="rgrid">${grid()}</div>`;
  },
  async click(act, el) {
    const id = el.dataset.id ?? "";
    if (act === "open-recipe") openRecipe(id);
    else if (act === "new-recipe") openForm();
    else if (act === "edit-recipe") openForm(all().find((r) => r.id === id));
    else if (act === "save-recipe") await saveRecipe(id);
    else if (act === "only-fav") { onlyFav = !onlyFav; app.rerender(); }
    else if (act === "del-recipe") {
      await db.recipes.delete(id);
      await db.photos.delete(id);
      state.recipes = await db.recipes.toArray();
      closeDlg(); toast("Recette supprimée"); app.rerender();
    } else if (act === "fav") {
      const f = state.prefs.favorites;
      await savePrefs({ favorites: f.includes(id) ? f.filter((x) => x !== id) : [...f, id] });
      openRecipe(id); app.rerender();
    } else if (act === "cook") {
      const before = snapshot();
      const r = all().find((x) => x.id === id)!;
      await addLog({ type: "cook", day: dayKey(), xp: RPG.xp.recipeCooked, label: `Recette : ${r.nom}`, ref: id });
      toast(`+${RPG.xp.recipeCooked} XP  Recette cuisinée`, "xp");
      closeDlg(); app.rerender();
      celebrate(before, snapshot(), "Bon appétit !");
    }
  },
  input(el) {
    if (el.id === "q") { q = (el as HTMLInputElement).value; $("#rgrid")!.innerHTML = grid(); }
  },
  async change(el) {
    const id = (el as HTMLInputElement).dataset.photoFor;
    const f = (el as HTMLInputElement).files?.[0];
    if (id && f) {
      try { await savePhoto(id, f); photos = await loadPhotoUrls(); toast("Photo enregistrée"); openRecipe(id); app.rerender(); }
      catch { toast("Photo illisible."); }
    }
  },
};

export function setCat(c: string): void { cat = c; }
