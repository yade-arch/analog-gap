// Gösterim dokusu: palet (pencere içi göreli yükseklik) × GERÇEK DEM gölgesi (hillshade) × tane gürültüsü (+ Ay/Mars'ta görsel krater izleri).
// Krater izleri yalnızca renk/gölgedir; arazi ağının köşe yükseklikleri DEĞİŞMEZ (scripts/invariance.mjs). Ölçüm değildir.
import { elev } from "./demLoader.js";
import { SURFACE, surfaceKey } from "./surfaceMaterials.js";

const S = 4;                                                         // hücre başına piksel (tane ayrıntısı için)
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const L = [-0.7071, -0.7071];                                        // ışık kuzeybatıdan (görüntü düzleminde)

function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const hashStr = (t) => [...t].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Hücre başına gölge (0–1) ve göreli yükseklik (0–1); veri yoksa NaN. */
function cellFields(dem) {
  const G = dem.G, cell = dem.idx.cell_m || 90, shade = new Float32Array(G * G), rel = new Float32Array(G * G);
  let lo = Infinity, hi = -Infinity;
  for (let k = 0; k < G * G; k++) { const z = elev(dem, k); if (!Number.isNaN(z)) { lo = Math.min(lo, z); hi = Math.max(hi, z); } }
  const z = (i, j) => elev(dem, Math.max(0, Math.min(G - 1, i)) * G + Math.max(0, Math.min(G - 1, j)));
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    const k = i * G + j, h = z(i, j);
    if (Number.isNaN(h)) { shade[k] = NaN; rel[k] = NaN; continue; }
    const a = z(i, j + 1), b = z(i, j - 1), c = z(i + 1, j), d = z(i - 1, j);
    const dx = Number.isNaN(a) || Number.isNaN(b) ? 0 : (a - b) / (2 * cell), dy = Number.isNaN(c) || Number.isNaN(d) ? 0 : (c - d) / (2 * cell);
    const nx = -2 * dx, ny = -2 * dy, nl = Math.hypot(nx, ny, 1);                  // 2× görsel gölge yoğunluğu (yalnızca renk)
    shade[k] = Math.max(0, (0.7071 * 1 + (nx * L[0] + ny * L[1]) * 0.7071) / nl);
    rel[k] = (h - lo) / (hi - lo || 1);
  }
  return { shade, rel };
}

/** Görsel krater izleri: [cx, cy, R] (piksel), tohum = DEM kimliği (her açılışta aynı). */
function craterField(n, W, seed) {
  const r = rng(seed), out = [];
  for (let i = 0; i < n; i++) out.push([r() * W, r() * W, 3 + Math.pow(r(), 2.2) * W * 0.09]);
  return out;
}

/** dem + yüzey anahtarı -> HTMLCanvasElement (G*S kare). */
export function buildSurfaceCanvas(dem, key, nodataHex = "#8a94a3") {
  const m = SURFACE[surfaceKey(key)], G = dem.G, W = G * S, cv = document.createElement("canvas"); cv.width = cv.height = W;
  const ctx = cv.getContext("2d"), img = ctx.createImageData(W, W), px = img.data;
  const pal = m.colors.map(rgb), green = m.green ? rgb(m.green) : null, nod = rgb(nodataHex), { shade, rel } = cellFields(dem), r = rng(hashStr(dem.id));
  const mult = new Float32Array(W * W).fill(1);
  for (const [cx, cy, R] of craterField(m.craters, W, hashStr(dem.id) ^ 0x9e37)) {
    for (let y = Math.max(0, cy - R * 1.3 | 0); y < Math.min(W, cy + R * 1.3); y++) for (let x = Math.max(0, cx - R * 1.3 | 0); x < Math.min(W, cx + R * 1.3); x++) {
      const dx = (x - cx) / R, dy = (y - cy) / R, d = Math.hypot(dx, dy);
      if (d < 1) mult[y * W + x] *= 0.86 + 0.22 * (dx * -L[0] + dy * -L[1]) * d;   // iç yamaç: ışığa bakan taraf açık, öteki ince gölge
      else if (d < 1.3) mult[y * W + x] *= 1 + 0.12 * (1.3 - d) / 0.3;            // açık kenar
    }
  }
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const k = ((y / S) | 0) * G + ((x / S) | 0), p = (y * W + x) * 4;
    let c = nod;
    if (!Number.isNaN(shade[k])) {
      const t = rel[k] * (pal.length - 1), i = Math.min(pal.length - 2, t | 0), u = t - i;
      c = pal[i].map((v, n) => v + (pal[i + 1][n] - v) * u);
      if (green && rel[k] < 0.35 && r() < 0.18) c = green;                          // seyrek yeşil (yalnızca HAW, alçak kesim)
      const f = (0.5 + 0.7 * shade[k]) * (1 + (r() - 0.5) * 2 * m.grain) * mult[y * W + x];
      c = c.map((v) => Math.max(0, Math.min(255, v * f)));
    }
    px[p] = c[0]; px[p + 1] = c[1]; px[p + 2] = c[2]; px[p + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return cv;
}
