// Eğim sınıf dokusu: hücre başına düz renk (tek yönlü sıralı palet); limiti aşan hücre gruplarının dış sınırında ince kontur.
import { SETTINGS } from "../../config.js";
import { slopeDeg } from "./demLoader.js";

const S = 8;                                   // hücre başına piksel (tarama periyodu da 8)
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

export function slopeClass(deg) {
  const e = SETTINGS.slopeEdges;
  let c = 0;
  while (c < e.length && deg >= e[c]) c++;
  return c;
}

/** limit: derece veya null (kaynaklı limit yoksa tarama yapılmaz). -> HTMLCanvasElement */
export function buildSlopeCanvas(dem, limit) {
  const G = dem.G, W = G * S;
  const cv = document.createElement("canvas"); cv.width = W; cv.height = W;
  const ctx = cv.getContext("2d"), img = ctx.createImageData(W, W);
  const cols = SETTINGS.slopeColors.map(rgb), nod = rgb(SETTINGS.noDataColor);
  const over = (i, j) => { if (limit == null || i < 0 || j < 0 || i >= G || j >= G) return false; const d = slopeDeg(dem, i * G + j); return !Number.isNaN(d) && d > limit; };
  const line = rgb(SETTINGS.limitLineColor), LW = 2;     // sınırı aşan bölgelerin ince konturu (tarama yok)
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    const d = slopeDeg(dem, i * G + j), bad = Number.isNaN(d);
    const base = bad ? nod : cols[slopeClass(d)];
    const o = over(i, j);
    const eN = o && !over(i - 1, j), eS = o && !over(i + 1, j), eW = o && !over(i, j - 1), eE = o && !over(i, j + 1);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const p = ((i * S + y) * W + j * S + x) * 4;
      const edge = (eN && y < LW) || (eS && y >= S - LW) || (eW && x < LW) || (eE && x >= S - LW);
      const c3 = edge ? line : base;
      for (let c = 0; c < 3; c++) img.data[p + c] = c3[c];
      img.data[p + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}
