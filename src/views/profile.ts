import { db, type Recipe } from "../db.ts";
import { characterExport, type LogRow, type MobilityTest } from "../engine.ts";
import type { MeasureRow, SetRow } from "../hevy.ts";
import { blobToDataUrl, dataUrlToBlob, readText, saveJson } from "../files.ts";
import { DEFAULT_PREFS, loadAll, savePrefs, state, type Prefs } from "../store.ts";
import { app, esc, fmtInt, toast, $ } from "../ui.ts";
import { avatarSvg } from "../avatar.ts";
import type { View } from "./types.ts";

const stamp = () => new Date().toISOString();
const dayStamp = () => stamp().slice(0, 10);

async function exportBackup(): Promise<void> {
  const photos = await Promise.all((await db.photos.toArray()).map(async (p) => ({ id: p.id, dataUrl: await blobToDataUrl(p.blob) })));
  await saveJson(`paliers-sauvegarde-${dayStamp()}.json`, {
    schema: "paliers.backup/1",
    exportedAt: stamp(),
    prefs: state.prefs,
    sets: await db.sets.toArray(),
    measures: await db.measures.toArray(),
    logs: (await db.logs.toArray()).map(({ id: _id, ...l }) => l),
    tests: await db.tests.toArray(),
    recipes: await db.recipes.toArray(),
    photos,
  });
  toast("Sauvegarde créée");
}

async function importBackup(file: File): Promise<void> {
  let data: Record<string, unknown>;
  try { data = JSON.parse(await readText(file)); } catch { toast("Ce fichier n'est pas une sauvegarde valide."); return; }
  if (data.schema !== "paliers.backup/1") { toast("Ce fichier n'est pas une sauvegarde Paliers."); return; }
  if (!confirm("Remplacer toutes les données actuelles de l'app par cette sauvegarde ?")) return;
  const arr = <T>(k: string): T[] => (Array.isArray(data[k]) ? (data[k] as T[]) : []);
  await db.transaction("rw", [db.sets, db.measures, db.logs, db.tests, db.recipes, db.photos, db.settings], async () => {
    await Promise.all([db.sets.clear(), db.measures.clear(), db.logs.clear(), db.tests.clear(), db.recipes.clear(), db.photos.clear()]);
    await db.sets.bulkPut(arr("sets"));
    await db.measures.bulkPut(arr("measures"));
    await db.logs.bulkAdd(arr("logs"));
    await db.tests.bulkPut(arr("tests"));
    await db.recipes.bulkPut(arr("recipes"));
    await db.settings.put({ key: "prefs", value: { ...DEFAULT_PREFS, ...((data.prefs as Partial<Prefs>) ?? {}) } });
  });
  for (const p of arr<{ id: string; dataUrl: string }>("photos")) await db.photos.put({ id: p.id, blob: await dataUrl2(p.dataUrl) });
  await loadAll();
  applyTheme();
  toast("Sauvegarde restaurée", "xp");
  app.rerender();
}
const dataUrl2 = dataUrlToBlob;

/** Fusionne une sauvegarde avec les données de cet appareil : ajoute ce qui manque, n'efface ni ne remplace rien. */
async function mergeBackup(file: File): Promise<void> {
  let data: Record<string, unknown>;
  try { data = JSON.parse(await readText(file)); } catch { toast("Ce fichier n'est pas une sauvegarde valide."); return; }
  if (data.schema !== "paliers.backup/1") { toast("Ce fichier n'est pas une sauvegarde Paliers."); return; }
  const arr = <T>(k: string): T[] => (Array.isArray(data[k]) ? (data[k] as T[]) : []);
  const added = { sets: 0, measures: 0, logs: 0, tests: 0, recipes: 0, photos: 0 };

  const inSets = arr<SetRow>("sets");
  const haveSets = new Set((await db.sets.bulkGet(inSets.map((s) => s.key))).map((s) => s?.key));
  const newSets = inSets.filter((s) => !haveSets.has(s.key));
  await db.sets.bulkPut(newSets);
  added.sets = newSets.length;

  const haveM = new Set((await db.measures.toArray()).map((m) => m.date));
  const newM = arr<MeasureRow>("measures").filter((m) => !haveM.has(m.date));
  await db.measures.bulkPut(newM);
  added.measures = newM.length;

  const logKey = (l: LogRow) => `${l.type}|${l.day}|${l.ref ?? ""}|${l.label}`;
  const haveL = new Set((await db.logs.toArray()).map(logKey));
  const newL: LogRow[] = [];
  for (const l of arr<LogRow>("logs")) { if (!haveL.has(logKey(l))) { haveL.add(logKey(l)); newL.push(l); } }
  await db.logs.bulkAdd(newL);
  added.logs = newL.length;

  const haveT = new Set((await db.tests.toArray()).map((t) => t.date));
  const newT = arr<MobilityTest>("tests").filter((t) => !haveT.has(t.date));
  await db.tests.bulkPut(newT);
  added.tests = newT.length;

  const haveR = new Set((await db.recipes.toArray()).map((r) => r.id));
  const newR = arr<Recipe>("recipes").filter((r) => !haveR.has(r.id));
  await db.recipes.bulkPut(newR);
  added.recipes = newR.length;

  const haveP = new Set((await db.photos.toArray()).map((p) => p.id));
  for (const p of arr<{ id: string; dataUrl: string }>("photos")) {
    if (haveP.has(p.id)) continue;
    await db.photos.put({ id: p.id, blob: await dataUrl2(p.dataUrl) });
    added.photos++;
  }

  // réglages : on garde les tiens, on ajoute seulement les favoris et les vidéos qui manquent
  const inPrefs = (data.prefs as Partial<Prefs>) ?? {};
  await savePrefs({
    favorites: [...new Set([...state.prefs.favorites, ...(inPrefs.favorites ?? [])])],
    videos: { ...(inPrefs.videos ?? {}), ...state.prefs.videos },
  });
  await loadAll();
  const total = Object.values(added).reduce((a, b) => a + b, 0);
  const parts = [
    added.sets && `${fmtInt(added.sets)} séries`, added.measures && `${added.measures} pesées`, added.logs && `${added.logs} activités`,
    added.tests && `${added.tests} tests`, added.recipes && `${added.recipes} recettes`, added.photos && `${added.photos} photos`,
  ].filter(Boolean);
  toast(total ? `Fusion terminée : ${parts.join(", ")} ajoutées.` : "Fusion terminée : rien de nouveau, tes données étaient déjà à jour.", "xp");
  app.rerender();
}

export function applyTheme(): void {
  const t = state.prefs.theme;
  if (t === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
}

export const profile: View = {
  render() {
    const r = state.result;
    const p = state.prefs;
    return `<div class="section-head"><h2>Profil</h2></div><p class="lede">Tes réglages, ta sauvegarde et ton personnage. Tes données restent sur cet appareil.</p>
    <section class="card"><h3>Personnage</h3><div class="pchar">${avatarSvg(r.rankIndex, `Avatar, rang ${r.rank}`)}<div><b>${esc(p.name)}</b><br>Niveau ${r.level.level} · ${esc(r.rank)}<br>${fmtInt(r.totalXp)} XP</div></div>
    <label class="field"><span>Nom du personnage</span><input type="text" id="pf-name" value="${esc(p.name)}" maxlength="30"></label>
    <button class="btn" data-act="export-char">Exporter mon personnage (JSON)</button></section>
    <section class="card"><h3>Poids</h3>
    <label class="field"><span>Poids de corps de référence (kg)</span><input type="number" inputmode="decimal" step="0.1" min="30" max="250" id="pf-bw" value="${p.bodyweightKg ?? ""}" placeholder="${state.measures.length ? "utilise tes mesures Hevy" : "70"}"><small class="hint">Sert aux niveaux (ratio charge / poids de corps) tant que tu n'as pas importé de mesures.</small></label>
    <label class="field"><span>Cible de poids (kg), facultative</span><input type="number" inputmode="decimal" step="0.1" min="30" max="250" id="pf-target" value="${p.targetWeightKg ?? ""}"><small class="hint">C'est toi qui la fixes. L'app ne juge aucun chiffre et n'encourage aucune restriction.</small></label></section>
    <section class="card"><h3>Confort</h3>
    <label class="check"><input type="checkbox" id="pf-anim" ${p.animations ? "checked" : ""}> Animations de récompense</label>
    <label class="check"><input type="checkbox" id="pf-sound" ${p.sound ? "checked" : ""}> Sons courts et vibrations</label>
    <label class="field" style="margin-top:8px"><span>Thème</span><select id="pf-theme"><option value="auto" ${p.theme === "auto" ? "selected" : ""}>Automatique</option><option value="light" ${p.theme === "light" ? "selected" : ""}>Clair</option><option value="dark" ${p.theme === "dark" ? "selected" : ""}>Sombre</option></select></label></section>
    <section class="card"><h3>Sauvegarde</h3><p class="hint">Le stockage d'un iPhone n'est pas garanti éternel : exporte ta sauvegarde de temps en temps (photos de recettes incluses).</p>
    <div class="row"><button class="btn primary" data-act="export-backup" style="--c:var(--xp)">Exporter mes données</button>
    <label class="btn filebtn">Fusionner une sauvegarde<input type="file" id="bk-merge" class="drop-input" aria-label="Choisir une sauvegarde à fusionner"></label>
    <label class="btn ghost filebtn">Remplacer par une sauvegarde<input type="file" id="bk-file" class="drop-input" aria-label="Choisir une sauvegarde qui remplacera tout"></label></div>
    <p class="hint" style="margin-top:10px"><b>Passer d'un appareil à l'autre :</b> exporte sur le premier, mets le fichier dans iCloud Drive (ou envoie-le-toi), puis « Fusionner » sur le second. Fais-le dans les deux sens : rien n'est jamais effacé. « Remplacer » efface tout ce qui est sur cet appareil.</p>
    <p class="tiny" style="margin-top:12px">${fmtInt(state.sets.length)} séries · ${state.measures.length} pesées · ${state.logs.length} activités · ${state.recipes.length} recettes perso · ${state.tests.length} tests</p></section>`;
  },
  async click(act) {
    if (act === "export-backup") await exportBackup();
    else if (act === "export-char") {
      const ok = state.result.badges.filter((b) => b.ok).map((b) => b.id);
      await saveJson(`paliers-personnage-${dayStamp()}.json`, characterExport(state.result, state.prefs.name, ok, stamp()));
      toast("Personnage exporté");
    }
  },
  async change(el) {
    const n = (id: string) => ($<HTMLInputElement>(id)!.value).trim();
    const num = (v: string) => (v === "" ? undefined : Number(v.replace(",", ".")));
    if (el.id === "bk-merge") { const f = (el as HTMLInputElement).files?.[0]; if (f) await mergeBackup(f); (el as HTMLInputElement).value = ""; return; }
    if (el.id === "bk-file") { const f = (el as HTMLInputElement).files?.[0]; if (f) await importBackup(f); return; }
    if (el.id === "pf-name") await savePrefs({ name: n("#pf-name") || DEFAULT_PREFS.name });
    else if (el.id === "pf-bw") await savePrefs({ bodyweightKg: num(n("#pf-bw")) });
    else if (el.id === "pf-target") await savePrefs({ targetWeightKg: num(n("#pf-target")) });
    else if (el.id === "pf-anim") await savePrefs({ animations: (el as HTMLInputElement).checked });
    else if (el.id === "pf-sound") await savePrefs({ sound: (el as HTMLInputElement).checked });
    else if (el.id === "pf-theme") { await savePrefs({ theme: el.value as Prefs["theme"] }); applyTheme(); }
    toast("Enregistré");
  },
};






