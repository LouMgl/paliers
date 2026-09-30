import "@fontsource/figtree/400.css";
import "@fontsource/figtree/600.css";
import "@fontsource/figtree/700.css";
import "@fontsource/pixelify-sans/500.css";
import "@fontsource/pixelify-sans/700.css";
import "./styles.css";
import { db, getSetting, setSetting } from "./db.ts";
import { loadAll, savePrefs, state } from "./store.ts";
import { app, closeDlg, toast, $ } from "./ui.ts";
import { embedUrl, isHttpUrl } from "./files.ts";
import { home } from "./views/home.ts";
import { train } from "./views/train.ts";
import { food, setCat } from "./views/food.ts";
import { move, setMoment } from "./views/move.ts";
import { profile, applyTheme } from "./views/profile.ts";
import type { View } from "./views/types.ts";

type Tab = "home" | "train" | "food" | "move" | "profile";
const VIEWS: Record<Tab, View> = { home, train, food, move, profile };

const view = document.getElementById("view")!;
const buttons = document.querySelectorAll<HTMLButtonElement>(".nav button");
let tab: Tab = "home";

async function render(): Promise<void> {
  const v = VIEWS[tab];
  const html = await v.render();
  view.className = `view t-${tab}`;
  view.innerHTML = html;
  buttons.forEach((b) => (b.dataset.tab === tab ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current")));
  v.after?.();
}

async function go(t: string): Promise<void> {
  VIEWS[tab].leave?.();
  tab = t as Tab;
  window.scrollTo(0, 0);
  await render();
  try { await setSetting("lastTab", tab); } catch { /* ignoré */ }
}

app.rerender = () => { void render(); };
app.go = (t) => { void go(t); };

async function setVideo(id: string): Promise<void> {
  const cur = state.prefs.videos[id] ?? state.recipes.find((r) => r.id === id)?.videoUrl ?? "";
  const url = prompt("Colle ici le lien de la vidéo (YouTube). Laisse vide pour l'enlever.", cur);
  if (url === null) return;
  const clean = url.trim();
  if (clean && !isHttpUrl(clean)) { toast("Le lien doit commencer par https://"); return; }
  if (clean && !embedUrl(clean)) toast("Lien enregistré, mais seuls les liens YouTube s'affichent dans l'app.");
  const rec = state.recipes.find((r) => r.id === id);
  if (rec) { rec.videoUrl = clean || undefined; await db.recipes.put(rec); }
  else {
    const videos = { ...state.prefs.videos };
    if (clean) videos[id] = clean; else delete videos[id];
    await savePrefs({ videos });
  }
  closeDlg();
  await render();
}

document.addEventListener("click", (e) => {
  const t = (e.target as HTMLElement).closest("button") as HTMLButtonElement | null;
  if (!t) { if (e.target === $("#dlg")) closeDlg(); return; }
  if (t.dataset.tab) { void go(t.dataset.tab); return; }
  if (t.dataset.go) { void go(t.dataset.go); return; }
  if (t.dataset.cat !== undefined) { setCat(t.dataset.cat); void render(); return; }
  if (t.dataset.mom !== undefined) { setMoment(t.dataset.mom); void render(); return; }
  const act = t.dataset.act;
  if (!act) return;
  if (act === "close") { closeDlg(); return; }
  if (act === "set-video") { void setVideo(t.dataset.id!); return; }
  void VIEWS[tab].click?.(act, t, e);
});
document.addEventListener("input", (e) => VIEWS[tab].input?.(e.target as HTMLInputElement));
document.addEventListener("change", (e) => void VIEWS[tab].change?.(e.target as HTMLInputElement, e));

(async () => {
  try {
    await loadAll();
    applyTheme();
    const last = await getSetting<Tab>("lastTab");
    if (last && last in VIEWS) tab = last;
  } catch {
    toast("Le stockage local est indisponible sur ce navigateur.");
    await loadAll().catch(() => {});
  }
  await render();
})();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
