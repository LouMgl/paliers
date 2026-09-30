// Graphiques SVG faits maison (aucune bibliothèque). Couleurs héritées des variables CSS.
import { esc } from "./ui.ts";

const W = 640, H = 220, L = 66, R = 12, T = 12, B = 30;

const niceMax = (v: number) => {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
};

const short = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

function frame(inner: string, label: string): string {
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${inner}</svg>`;
}

function grid(maxV: number, minV: number, unit: string): string {
  let g = "";
  for (let i = 0; i <= 4; i++) {
    const v = minV + ((maxV - minV) * i) / 4;
    const y = T + (H - T - B) * (1 - i / 4);
    g += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" class="gl"/><text x="${L - 6}" y="${y + 4}" class="ax" text-anchor="end">${Math.round(v * 10) / 10}${unit}</text>`;
  }
  return g;
}

/** Histogramme : une barre par semaine. */
export function barChart(data: { label: string; value: number }[], unit: string, label: string): string {
  if (!data.length) return "";
  const maxV = niceMax(Math.max(...data.map((d) => d.value)));
  const bw = (W - L - R) / data.length;
  let bars = "";
  data.forEach((d, i) => {
    const h = ((H - T - B) * d.value) / maxV;
    bars += `<rect x="${L + i * bw + bw * 0.15}" y="${H - B - h}" width="${bw * 0.7}" height="${Math.max(h, d.value > 0 ? 1 : 0)}" rx="2" class="bar"><title>${esc(d.label)} : ${Math.round(d.value)}${unit}</title></rect>`;
  });
  const step = Math.max(1, Math.ceil(data.length / 8));
  let xs = "";
  data.forEach((d, i) => {
    if (i % step === 0) xs += `<text x="${L + i * bw + bw / 2}" y="${H - 10}" class="ax" text-anchor="middle">${esc(d.label)}</text>`;
  });
  return frame(grid(maxV, 0, unit) + bars + xs, label);
}

/** Courbe : points datés (jour "YYYY-MM-DD"), axe horizontal proportionnel au temps. */
export function lineChart(points: { day: string; value: number }[], unit: string, label: string, target?: number): string {
  if (!points.length) return "";
  const vals = points.map((p) => p.value).concat(target !== undefined ? [target] : []);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.15;
  lo = Math.floor((lo - pad) * 2) / 2; hi = Math.ceil((hi + pad) * 2) / 2;
  const t0 = Date.parse(`${points[0].day}T00:00:00Z`), t1 = Date.parse(`${points[points.length - 1].day}T00:00:00Z`);
  const span = Math.max(1, t1 - t0);
  const x = (d: string) => L + ((Date.parse(`${d}T00:00:00Z`) - t0) / span) * (W - L - R - 8) + 4;
  const y = (v: number) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(p.day).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const dots = points.map((p) => `<circle cx="${x(p.day).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="4" class="pt"><title>${short(p.day)} : ${Math.round(p.value * 10) / 10}${unit}</title></circle>`).join("");
  const tl = target !== undefined ? `<line x1="${L}" x2="${W - R}" y1="${y(target)}" y2="${y(target)}" class="tl"/><text x="${W - R}" y="${y(target) - 4}" class="ax" text-anchor="end">cible ${target}${unit}</text>` : "";
  const xs = `<text x="${L}" y="${H - 10}" class="ax">${short(points[0].day)}</text><text x="${W - R}" y="${H - 10}" class="ax" text-anchor="end">${short(points[points.length - 1].day)}</text>`;
  return frame(grid(hi, lo, unit) + tl + `<path d="${path}" class="ln"/>` + dots + xs, label);
}

