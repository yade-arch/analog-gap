// Değişken kaydı. Yeni değişken = bu klasöre tek dosya + aşağıya bir import ve bir satır.
// Her dosya şu şekli dışa aktarır:
//   { id, titleKey, unit, requires: [veri ürünü/dosya], availability(profile) -> {status:'ok'|'limited'|'missing', note},
//     compute: null (F2: istasyon hesabı), card: null (F2: istasyon kartı), report: null (F2: rapor bölümü) }
import slope from "./slope.js";
import relief from "./relief.js";
import rough from "./rough.js";
import thermal from "./thermal.js";
import marsThermal from "./marsThermal.js";
import spectral from "./spectral.js";

export const VARIABLES = [slope, relief, rough, thermal, marsThermal, spectral];

/** İstasyon sonucu: { v, a (veri durumu), status, rows:[{label,ref,cand,tag}], note }. Eksik veri için satır üretilmez (kural 2). */
export function stationResult(v, profile, ctx) {
  const a = v.availability(profile);
  if (a.status === "missing" || !v.compute) return { v, a, status: "missing", rows: [], note: a.note };
  const r = v.compute(ctx);
  return { v, a, status: a.status, rows: r.rows, note: [a.note, r.note].filter(Boolean).join(" · ") };
}