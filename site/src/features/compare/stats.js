// Görüntülenen DEM penceresinden (90 m ızgara) basit istatistik. Yalnızca gerçek hücrelerden; nodata sayılmaz.
import { slopeDeg } from "./demLoader.js";

/** Limiti aşan hücre oranı (0–1) veya null (DEM ya da kaynaklı limit yok). */
export function exceedFraction(dem, limit) {
  if (!dem || limit == null) return null;
  let n = 0, k = 0;
  for (let i = 0; i < dem.slope.length; i++) { const d = slopeDeg(dem, i); if (Number.isNaN(d)) continue; n++; if (d > limit) k++; }
  return n ? k / n : null;
}