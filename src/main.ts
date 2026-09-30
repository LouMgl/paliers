import "@fontsource/figtree/400.css";
import "@fontsource/figtree/600.css";
import "@fontsource/figtree/700.css";
import "@fontsource/pixelify-sans/500.css";
import "@fontsource/pixelify-sans/700.css";
import "./styles.css";
import { getSetting, setSetting } from "./db";

type Tab = "home" | "train" | "food" | "move";

const SCREENS: Record<Tab, { title: string; text: string }> = {
  home: { title: "Aventure", text: "Ton niveau, tes quêtes et tes records apparaîtront ici (étape 3)." },
  train: { title: "Séances", text: "Tes séances Hevy importées apparaîtront ici (étape 2)." },
  food: { title: "Cuisine", text: "Les recettes avec photos arriveront à l'étape 4." },
  move: { title: "Mobilité", text: "Routines d'étirements et tests de souplesse : étape 5." },
};

const view = document.getElementById("view")!;
const buttons = document.querySelectorAll<HTMLButtonElement>(".nav button");

function show(tab: Tab): void {
  const s = SCREENS[tab];
  view.className = `view t-${tab}`;
  view.innerHTML = `
    <div class="section-head"><h2>${s.title}</h2></div>
    <p class="lede">${s.text}</p>
    <div class="empty" id="status">Chargement…</div>`;
  buttons.forEach((b) => {
    if (b.dataset.tab === tab) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  void setSetting("lastTab", tab);
  void checkStorage();
}

// Vérifie que la base locale (IndexedDB) fonctionne.
async function checkStorage(): Promise<void> {
  const el = document.getElementById("status");
  if (!el) return;
  try {
    const n = ((await getSetting<number>("launches")) ?? 0);
    el.textContent = `Stockage local OK · ouvertures de l'app : ${n}`;
  } catch {
    el.textContent = "Stockage local indisponible sur ce navigateur.";
  }
}

buttons.forEach((b) => b.addEventListener("click", () => show(b.dataset.tab as Tab)));

(async () => {
  try {
    const n = ((await getSetting<number>("launches")) ?? 0) + 1;
    await setSetting("launches", n);
    show(((await getSetting<Tab>("lastTab")) ?? "home"));
  } catch {
    show("home");
  }
})();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
