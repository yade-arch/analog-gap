// İstasyon konumları ve yüzeye yapışık rota. Yükseklik yalnızca DEM'den (çift doğrusal örnekleme); veri boşluğu NaN kalır, uydurulmaz.
// İstasyon yerleşimi bir GÖSTERİM düzenidir (ölçüm yeri değil): pencere merkezi etrafında eşit aralıklı halka, iki tarafta aynı göreli konum.
import { SETTINGS } from "../../config.js";
import { elev } from "./demLoader.js";
import { medianElev } from "./terrainMesh.js";

const zmedCache = new WeakMap();
const zmedOf = (dem) => { if (!zmedCache.has(dem)) zmedCache.set(dem, medianElev(dem)); return zmedCache.get(dem); };

/** (x, z) km, pencere merkezi (0,0) -> yükseklik km (terrainMesh ile aynı sıfır), veri boşluğunda NaN. */
export function sampleH(dem, x, z) {
  const G = dem.G, W = SETTINGS.windowKm;
  const fj = (x / W + 0.5) * (G - 1), fi = (z / W + 0.5) * (G - 1);
  if (fj < 0 || fi < 0 || fj > G - 1 || fi > G - 1) return NaN;
  const j0 = Math.min(Math.floor(fj), G - 2), i0 = Math.min(Math.floor(fi), G - 2), a = fj - j0, b = fi - i0;
  const e = [elev(dem, i0 * G + j0), elev(dem, i0 * G + j0 + 1), elev(dem, (i0 + 1) * G + j0), elev(dem, (i0 + 1) * G + j0 + 1)];
  if (e.some(Number.isNaN)) return NaN;
  return ((e[0] * (1 - a) + e[1] * a) * (1 - b) + (e[2] * (1 - a) + e[3] * a) * b - zmedOf(dem)) / 1000;
}

const pt = (dem, x, z) => ({ x, z, h: sampleH(dem, x, z) });

/** Geçerli yükseklikli en yakın nokta (halka arama); yoksa null. */
function nearestValid(dem, x, z) {
  const step = SETTINGS.windowKm / (dem.G - 1);
  for (let r = 0; r <= 12; r++) for (let k = 0; k < Math.max(1, r * 8); k++) {
    const an = (k / Math.max(1, r * 8)) * 2 * Math.PI, p = pt(dem, x + Math.cos(an) * r * step, z + Math.sin(an) * r * step);
    if (!Number.isNaN(p.h)) return p;
  }
  return null;
}

/** Başlangıç (merkez) ve istasyon konumları: { start, spots[] }. Bir nokta yoksa o taraf null. */
export function layout(dem, count) {
  const R = SETTINGS.stationRing * SETTINGS.windowKm;
  const spots = Array.from({ length: count }, (_, i) => {
    const an = (i / count) * 2 * Math.PI - Math.PI / 2;
    return nearestValid(dem, Math.cos(an) * R, Math.sin(an) * R);
  });
  return { start: nearestValid(dem, 0, 0), spots };
}

/** Düz çizgi rota (n+1 nokta); her noktanın yüksekliği DEM'den. gaps = veri boşluğuna düşen nokta sayısı. */
export function buildRoute(dem, a, b, n = SETTINGS.routeSamples) {
  const pts = Array.from({ length: n + 1 }, (_, i) => pt(dem, a.x + (b.x - a.x) * (i / n), a.z + (b.z - a.z) * (i / n)));
  return { pts, gaps: pts.filter((p) => Number.isNaN(p.h)).length, length: Math.hypot(b.x - a.x, b.z - a.z) };
}

/** İlerleme p (0–1) -> { x, z, h, heading }. h NaN ise son geçerli yükseklik çağıran tarafından korunur. */
export function pointAt(pts, p) {
  const f = Math.min(Math.max(p, 0), 1) * (pts.length - 1), i = Math.min(Math.floor(f), pts.length - 2), a = f - i;
  const A = pts[i], B = pts[i + 1];
  return { x: A.x + (B.x - A.x) * a, z: A.z + (B.z - A.z) * a, h: A.h + (B.h - A.h) * a, heading: Math.atan2(-(B.z - A.z), B.x - A.x) };
}
