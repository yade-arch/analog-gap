// Yükselti görünümü (GÖRSEL renklendirme): gerçek DEM'den gölgelendirme (hillshade) × pencere içi yüksekliğe bağlı renk rampası.
// Arazi örtüsü ya da uydu görüntüsü DEĞİLDİR; kraterler/vadiler yalnızca gerçek yükseltiden görünür. Rampa renkleri theme.css --relief-*.
import { cssVar } from "../../cssVar.js";
import { elev } from "./demLoader.js";

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const AZ = (315 * Math.PI) / 180, ZEN = (45 * Math.PI) / 180, ZF = 2;   // ışık kuzeybatıdan, 45°; görsel gölge için 2× yükseklik (yalnızca gölge)

/** Rampa: "earth" (ova yeşil → kahverengi → açık), "moon" (gri), "mars" (kızıl-kahverengi). Okunduğu anda tema değişkenlerinden. */
export function reliefRamp(pal) {
  const n = { earth: 5, moon: 2, mars: 3 }[pal] || 2;
  return Array.from({ length: n }, (_, i) => cssVar(`--relief-${pal}-${i + 1}`, "#808080"));
}

/** Pencere içi en düşük/en yüksek geçerli yükselti (m); lejant bunları gösterir. */
export function elevRange(dem) {
  let lo = Infinity, hi = -Infinity;
  for (let k = 0; k < dem.G * dem.G; k++) { const z = elev(dem, k); if (!Number.isNaN(z)) { if (z < lo) lo = z; if (z > hi) hi = z; } }
  return lo <= hi ? [lo, hi] : null;
}

function lerpRamp(stops, x) {
  const f = Math.max(0, Math.min(1, x)) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(f)), u = f - i;
  return stops[i].map((v, c) => v + (stops[i + 1][c] - v) * u);
}

/** dem: demLoader çıktısı; pal: rampa adı. -> HTMLCanvasElement (hücre başına 1 piksel; doku doğrusal süzülür). */
export function buildReliefCanvas(dem, pal) {
  const G = dem.G, cell = dem.idx.cell_m || 90, cv = document.createElement("canvas"); cv.width = cv.height = G;
  const ctx = cv.getContext("2d"), img = ctx.createImageData(G, G), r = elevRange(dem);
  const stops = reliefRamp(pal).map(rgb), nod = rgb(cssVar("--slope-nodata", "#8a94a3"));
  const z = (i, j) => elev(dem, Math.max(0, Math.min(G - 1, i)) * G + Math.max(0, Math.min(G - 1, j)));
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    const p = (i * G + j) * 4, h = z(i, j);
    let c = nod;
    if (!Number.isNaN(h) && r) {
      const zx = z(i, j + 1), zw = z(i, j - 1), zs = z(i + 1, j), zn = z(i - 1, j);
      const dx = Number.isNaN(zx) || Number.isNaN(zw) ? 0 : (zx - zw) / (2 * cell), dy = Number.isNaN(zs) || Number.isNaN(zn) ? 0 : (zs - zn) / (2 * cell);
      const slope = Math.atan(ZF * Math.hypot(dx, dy)), aspect = Math.atan2(dy, -dx);
      const shade = Math.max(0, Math.cos(ZEN) * Math.cos(slope) + Math.sin(ZEN) * Math.sin(slope) * Math.cos(AZ - aspect));
      const base = lerpRamp(stops, (h - r[0]) / (r[1] - r[0] || 1)), k = 0.45 + 0.75 * shade;
      c = base.map((v) => Math.min(255, v * k));
    }
    img.data[p] = c[0]; img.data[p + 1] = c[1]; img.data[p + 2] = c[2]; img.data[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}
