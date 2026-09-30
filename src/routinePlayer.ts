// Lecteur de routine de mobilité en plein écran.
// Un seul lecteur YouTube reste en place pendant toute la routine : une fois le son débloqué par un geste,
// les exercices suivants démarrent avec le son, sans que tu aies à toucher l'écran.
import { buildSteps, type Routine, type StepPlan } from "./data/mobility.ts";
import { videoFor } from "./store.ts";
import { cue, unlockAudio, vibrate } from "./ui.ts";
import { youtubeId } from "./files.ts";

/* ---- API YouTube (charge le script officiel, une seule fois) ---- */
interface YTPlayer {
  cueVideoById(id: string): void;
  playVideo(): void;
  pauseVideo(): void;
  unMute(): void;
  setVolume(v: number): void;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
}
interface YTApi {
  Player: new (el: string | HTMLElement, opts: Record<string, unknown>) => YTPlayer;
}
declare global {
  interface Window { YT?: YTApi; onYouTubeIframeAPIReady?: () => void }
}

let apiPromise: Promise<YTApi> | null = null;
function loadYT(): Promise<YTApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  apiPromise ??= new Promise<YTApi>((resolve, reject) => {
    const t = window.setTimeout(() => { apiPromise = null; reject(new Error("YouTube indisponible")); }, 10000);
    window.onYouTubeIframeAPIReady = () => { clearTimeout(t); resolve(window.YT!); };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.onerror = () => { clearTimeout(t); apiPromise = null; reject(new Error("YouTube indisponible")); };
    document.head.appendChild(s);
  });
  return apiPromise;
}

const INTRO_SECONDS = 3;
/** Après la fin de la vidéo, on garde au moins ce délai avant l'exercice suivant */
const AFTER_VIDEO_SECONDS = 10;
const CIRC = 2 * Math.PI * 52;
const fmt = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : String(s));

interface Run {
  r: Routine;
  steps: StepPlan[];
  i: number;
  phase: "intro" | "run";
  endAt: number;
  total: number;
  paused: boolean;
  remain: number;
  lastSec: number;
  yt: YTPlayer | null;
  ytReady: boolean;
  loadedId: string | null;
  wantId: string | null;
  lenApplied: boolean;
  playTriedAt: number;
  onEnd: (completed: boolean) => void;
  root: HTMLElement;
  timer: number;
}

let run: Run | null = null;
let wakeLock: { release(): Promise<void> } | null = null;

export const isPlaying = () => run !== null;

const q = <T extends HTMLElement>(sel: string) => run!.root.querySelector<T>(sel)!;

async function lockScreen(on: boolean): Promise<void> {
  try {
    if (on) wakeLock = await (navigator as unknown as { wakeLock: { request(t: string): Promise<{ release(): Promise<void> }> } }).wakeLock.request("screen");
    else { await wakeLock?.release(); wakeLock = null; }
  } catch { /* facultatif */ }
}

export function startRoutine(r: Routine, onEnd: (completed: boolean) => void): void {
  if (run) return;
  unlockAudio(); // le son doit être débloqué par un geste : ce tap sur « Démarrer »
  const root = document.createElement("div");
  root.className = "player fs";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", `Routine : ${r.nom}`);
  root.innerHTML = `
    <div class="fs-stage" id="fs-stage"><div id="yt"></div>
      <div class="fs-cover intro" id="fs-cover" role="status" aria-live="polite"><p id="cv-top"></p><b id="cv-num"></b><span id="cv-sub"></span></div>
      <div class="fs-tap" id="fs-tap" hidden>Touche la vidéo une fois pour activer le son : les suivantes suivront toutes seules.</div>
    </div>
    <div class="fs-info"><p class="prog" id="fs-prog"></p>
      <div class="fs-row"><div class="ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="tr" cx="60" cy="60" r="52"/><circle class="pg" id="pg" cx="60" cy="60" r="52" stroke-dasharray="${CIRC}" stroke-dashoffset="0"/></svg><div class="num" id="tnum" role="timer"></div></div>
      <div><h2 id="fs-name"></h2><p class="side" id="fs-side"></p></div></div>
      <p class="hint" id="fs-note"></p>
      <p class="cue" id="fs-cue"></p>
      <div class="pbtns"><button class="btn" id="b-pause">Pause</button><button class="btn" id="b-skip">Passer</button><button class="btn ghost" id="b-quit">Quitter</button></div>
      <p class="hint">Douleur vive, douleur qui descend dans la jambe ou fourmillements : arrête.</p></div>`;
  document.body.appendChild(root);
  document.body.classList.add("playing");
  try { void document.documentElement.requestFullscreen?.(); } catch { /* iPhone : l'app installée est déjà en plein écran */ }
  void lockScreen(true);

  run = {
    r, steps: buildSteps(r), i: 0, phase: "run", endAt: 0, total: 0, paused: false, remain: 0, lastSec: -1,
    yt: null, ytReady: false, loadedId: null, wantId: null, lenApplied: false, playTriedAt: 0, onEnd, root, timer: 0,
  };
  q("#b-pause").addEventListener("click", togglePause);
  q("#b-skip").addEventListener("click", next);
  q("#b-quit").addEventListener("click", () => end(false));

  // le lecteur YouTube se prépare pendant le premier écran « Installe-toi »
  loadYT().then((YT) => {
    if (!run || run.root !== root) return;
    run.yt = new YT.Player("yt", {
      host: "https://www.youtube-nocookie.com",
      width: "100%", height: "100%",
      playerVars: { playsinline: 1, rel: 0, modestbranding: 1, controls: 1, origin: location.origin },
      events: {
        onReady: () => {
          if (!run) return;
          run.ytReady = true;
          if (run.wantId) loadVideo(run.wantId);
        },
        onStateChange: (e: { data: number }) => { if (e.data === 1) q("#fs-tap").hidden = true; },
        onAutoplayBlocked: () => { if (run) q("#fs-tap").hidden = false; },
      },
    });
  }).catch(() => { /* hors ligne : on reste sur les consignes écrites */ });

  goStep(0);
  run.timer = window.setInterval(tick, 250);
}

function loadVideo(id: string): void {
  if (!run?.yt || !run.ytReady) return;
  if (run.loadedId !== id) {
    run.yt.cueVideoById(id);
    run.loadedId = id;
  }
}

function setCover(top: string, num: string, sub: string, visible: boolean): void {
  const cv = q("#fs-cover");
  cv.hidden = !visible;
  q("#cv-top").textContent = top;
  q("#cv-num").textContent = num;
  q("#cv-sub").textContent = sub;
}

function goStep(i: number): void {
  if (!run) return;
  const st = run.steps[i];
  run.i = i;
  run.paused = false;
  run.lenApplied = false;
  q("#b-pause").textContent = "Pause";
  q("#fs-prog").textContent = st.prep ? "Prépare-toi" : `Étape ${i} sur ${run.steps.length - 1}`;
  q("#fs-name").textContent = st.nom;
  q("#fs-side").textContent = st.side ? `Côté ${st.side}` : "";
  q("#fs-cue").textContent = st.consignes;
  q("#fs-note").textContent = "";
  q("#fs-tap").hidden = true;
  run.total = st.duree;

  if (st.prep) {
    run.phase = "run";
    run.endAt = Date.now() + st.duree * 1000;
    run.wantId = null;
    setCover("Installe-toi", String(st.duree), "La routine démarre juste après", true);
  } else {
    run.phase = "intro";
    run.lastSec = -1;
    run.endAt = Date.now() + INTRO_SECONDS * 1000;
    const id = youtubeId(videoFor(st.id));
    // deuxième côté du même exercice : on ne recharge pas la vidéo
    const samePrev = st.side === "droite" && run.steps[i - 1]?.id === st.id;
    run.wantId = id;
    if (id && !samePrev) { try { run.yt?.pauseVideo(); } catch { /* ignoré */ } loadVideo(id); }
    setCover("Ça va commencer…", String(INTRO_SECONDS), `${st.nom}${st.side ? ` · côté ${st.side}` : ""}`, true);
    cue([523, 659]); // petit jingle : « ça va commencer »
  }
  updateTimer(st.duree);
  vibrate(40);
}

function updateTimer(rem: number): void {
  if (!run) return;
  q("#tnum").textContent = fmt(rem);
  const frac = run.phase === "run" && run.total > 0 ? 1 - rem / run.total : 0;
  q("#pg").setAttribute("stroke-dashoffset", String(CIRC * frac));
}

function startPlayback(): void {
  if (!run) return;
  const st = run.steps[run.i];
  run.phase = "run";
  run.total = st.duree;
  run.endAt = Date.now() + run.total * 1000;
  run.playTriedAt = Date.now();
  cue([880, 1175]); // top départ
  vibrate(60);
  const hasVideo = !!(run.wantId && run.yt && run.ytReady && navigator.onLine);
  if (hasVideo) {
    setCover("", "", "", false);
    const samePrev = st.side === "droite" && run.steps[run.i - 1]?.id === st.id;
    try {
      run.yt!.unMute();
      run.yt!.setVolume(100);
      if (!samePrev) run.yt!.playVideo();
    } catch { /* ignoré */ }
    // si rien ne démarre (iOS peut exiger un premier tap), on invite à toucher la vidéo
    window.setTimeout(() => {
      if (run && run.yt && run.steps[run.i] === st && run.yt.getPlayerState() !== 1 && !samePrev) q("#fs-tap").hidden = false;
    }, 1800);
  } else {
    setCover(navigator.onLine ? "Pas de vidéo" : "Hors ligne", "", "Suis les consignes écrites ci-dessous", true);
  }
}

function tick(): void {
  if (!run || run.paused) return;
  const now = Date.now();
  if (run.phase === "intro") {
    const sec = Math.max(0, Math.ceil((run.endAt - now) / 1000));
    if (sec !== run.lastSec) {
      run.lastSec = sec;
      if (sec > 0) { q("#cv-num").textContent = String(sec); cue([660], 0.1); }
    }
    if (now >= run.endAt) startPlayback();
    return;
  }
  const st = run.steps[run.i];
  // durée de l'exercice = durée de la vidéo + 10 s, au moins (la durée n'est connue qu'un peu après le chargement)
  if (!run.lenApplied && run.yt && run.ytReady && run.wantId && !(st.side === "droite" && run.steps[run.i - 1]?.id === st.id)) {
    let len = 0;
    try { len = run.yt.getDuration(); } catch { /* ignoré */ }
    if (len > 1) {
      const need = Math.ceil(len) + AFTER_VIDEO_SECONDS;
      if (need > run.total) { run.endAt += (need - run.total) * 1000; run.total = need; }
      run.lenApplied = true;
      q("#fs-note").textContent = `Vidéo de ${fmt(Math.ceil(len))} + ${AFTER_VIDEO_SECONDS} s avant la suite`;
    }
  }
  const rem = Math.max(0, Math.ceil((run.endAt - now) / 1000));
  updateTimer(rem);
  if (rem <= 0) next();
}

function togglePause(): void {
  if (!run) return;
  const b = q("#b-pause");
  if (run.paused) {
    run.endAt = Date.now() + run.remain * 1000;
    run.paused = false;
    b.textContent = "Pause";
    if (run.phase === "run" && run.wantId) { try { run.yt?.playVideo(); } catch { /* ignoré */ } }
  } else {
    run.remain = Math.max(0, run.endAt - Date.now()) / 1000;
    run.paused = true;
    b.textContent = "Reprendre";
    try { run.yt?.pauseVideo(); } catch { /* ignoré */ }
  }
}

function next(): void {
  if (!run) return;
  if (run.i + 1 < run.steps.length) goStep(run.i + 1);
  else end(true);
}

function end(completed: boolean): void {
  if (!run) return;
  const r = run;
  run = null;
  clearInterval(r.timer);
  try { r.yt?.destroy(); } catch { /* ignoré */ }
  r.root.remove();
  document.body.classList.remove("playing");
  void lockScreen(false);
  try { if (document.fullscreenElement) void document.exitFullscreen(); } catch { /* ignoré */ }
  r.onEnd(completed);
}


