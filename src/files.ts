// Fichiers : enregistrer, lire, compresser une photo, intégrer une vidéo.
import { db } from "./db.ts";

export async function saveFile(name: string, blob: Blob): Promise<void> {
  const file = new File([blob], name, { type: blob.type });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: name });
      return;
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export const saveJson = (name: string, data: unknown) =>
  saveFile(name, new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));

export const readText = (f: File): Promise<string> => f.text();

/** Réduit une photo (côté max 900 px, JPEG) avant de la stocker. */
export async function compressImage(file: File, maxSide = 900, quality = 0.8): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close?.();
  return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Photo illisible"))), "image/jpeg", quality));
}

const urls = new Map<string, string>();

/** Charge toutes les photos et renvoie une table id → URL locale. */
export async function loadPhotoUrls(): Promise<Map<string, string>> {
  const all = await db.photos.toArray();
  const seen = new Set<string>();
  for (const p of all) {
    seen.add(p.id);
    if (!urls.has(p.id)) urls.set(p.id, URL.createObjectURL(p.blob));
  }
  for (const [id, u] of urls) if (!seen.has(id)) { URL.revokeObjectURL(u); urls.delete(id); }
  return urls;
}

export async function savePhoto(id: string, file: File): Promise<void> {
  const blob = await compressImage(file);
  await db.photos.put({ id, blob });
  const old = urls.get(id);
  if (old) { URL.revokeObjectURL(old); urls.delete(id); }
}

/** Transforme un lien YouTube en adresse intégrable ; null si le lien n'est pas reconnu. */
export function embedUrl(link: string | undefined, autoplay = false): string | null {
  if (!link) return null;
  try {
    const u = new URL(link.trim());
    let id: string | null = null;
    if (u.hostname.endsWith("youtu.be")) id = u.pathname.slice(1);
    else if (u.hostname.endsWith("youtube.com") || u.hostname.endsWith("youtube-nocookie.com")) {
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else if (/^\/(embed|shorts|live)\//.test(u.pathname)) id = u.pathname.split("/")[2];
    }
    if (!id || !/^[\w-]{6,20}$/.test(id)) return null;
    const base = `https://www.youtube-nocookie.com/embed/${id}`;
    // Lecture automatique : obligatoirement muette (sinon iOS et les navigateurs la bloquent), en boucle tant que l'étape dure
    return autoplay ? `${base}?autoplay=1&mute=1&playsinline=1&rel=0&loop=1&playlist=${id}` : `${base}?rel=0&playsinline=1`;
  } catch {
    return null;
  }
}

export const isHttpUrl = (s: string) => /^https?:\/\//i.test(s.trim());

export function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(b);
  });
}

export async function dataUrlToBlob(u: string): Promise<Blob> {
  return await (await fetch(u)).blob();
}


